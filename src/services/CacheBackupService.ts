import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import Database from 'better-sqlite3';
import { getCacheDb, getCachePath } from '../config/cache';

const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
const BACKUP_RETENTION_DAYS = Number(process.env.CACHE_BACKUP_RETENTION_DAYS || 30);

function getKey(): Buffer | null {
  const value = process.env.CACHE_BACKUP_KEY;
  if (!value) return null;
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) throw new Error('CACHE_BACKUP_KEY must be a base64-encoded 32-byte key');
  return key;
}

export class CacheBackupService {
  static async createBackup(): Promise<string | null> {
    const key = getKey();
    if (!key) return null;
    const backupDir = process.env.CACHE_BACKUP_DIR || path.join(path.dirname(getCachePath()), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const snapshot = path.join(backupDir, `.cache-${Date.now()}.sqlite`);
    await getCacheDb().backup(snapshot);
    const plaintext = await fs.readFile(snapshot);
    await fs.rm(snapshot, { force: true });
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const destination = path.join(backupDir, `cache-${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite.enc`);
    await fs.writeFile(destination, Buffer.concat([Buffer.from('DVCB1'), iv, cipher.getAuthTag(), encrypted]), { mode: 0o600 });
    const retentionCutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    for (const entry of await fs.readdir(backupDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.sqlite.enc')) continue;
      const candidate = path.join(backupDir, entry.name);
      if ((await fs.stat(candidate)).mtimeMs < retentionCutoff) await fs.rm(candidate, { force: true });
    }
    return destination;
  }

  static async verifyBackup(backupPath: string): Promise<void> {
    const key = getKey();
    if (!key) throw new Error('CACHE_BACKUP_KEY is required to verify a cache backup');
    const encrypted = await fs.readFile(backupPath);
    if (encrypted.subarray(0, 5).toString() !== 'DVCB1') throw new Error('Invalid cache backup format');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, encrypted.subarray(5, 17));
    decipher.setAuthTag(encrypted.subarray(17, 33));
    const plaintext = Buffer.concat([decipher.update(encrypted.subarray(33)), decipher.final()]);
    const verificationPath = `${backupPath}.verify.sqlite`;
    await fs.writeFile(verificationPath, plaintext, { mode: 0o600 });
    try {
      const verificationDb = new Database(verificationPath, { readonly: true });
      const result = verificationDb.pragma('integrity_check', { simple: true });
      verificationDb.close();
      if (result !== 'ok') throw new Error(`Cache backup integrity check failed: ${result}`);
    } finally {
      await fs.rm(verificationPath, { force: true });
    }
  }

  static schedule(): void {
    if (!getKey()) {
      console.warn('CACHE_BACKUP_KEY is not configured; encrypted cache backups are disabled');
      return;
    }
    const run = async () => {
      try {
        const backup = await this.createBackup();
        if (backup) await this.verifyBackup(backup);
      } catch (error) {
        console.error('Cache backup failed:', error);
      }
    };
    void run();
    setInterval(() => void run(), BACKUP_INTERVAL_MS).unref();
  }
}
