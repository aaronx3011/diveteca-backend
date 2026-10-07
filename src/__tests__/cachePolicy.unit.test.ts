import fs from 'fs';
import os from 'os';
import path from 'path';

const cachePath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'diveteca-cache-')), 'cache.sqlite');
process.env.CACHE_PATH = cachePath;
process.env.CACHE_MAX_STALE_SECONDS = '60';

const { initCache, getCacheDb } = require('../config/cache');
const { CacheService } = require('../services/CacheService');

describe('CacheService cache policy', () => {
  beforeAll(() => initCache());

  afterAll(() => fs.rmSync(path.dirname(cachePath), { recursive: true, force: true }));

  it('rejects cache entries beyond the bounded stale window', async () => {
    CacheService.set('expired', { value: 1 }, 1);
    getCacheDb().prepare('UPDATE cache_entries SET cached_at = ? WHERE cache_key = ?').run(Math.floor(Date.now() / 1000) - 62, 'expired');
    await expect(CacheService.cacheAside('expired', async () => { throw new Error('offline'); })).rejects.toThrow('no cached data exists');
  });

  it('purges expired cached credentials and sessions', () => {
    CacheService.cacheUser({ user_id: 1, username: 'expired', email: 'e@example.com', password_hash: 'hash', full_name: 'Expired', role: 'user' });
    CacheService.updateSession('expired-token', { id: 'expired', user_id: '1', expires_at: 1, is_valid: 1 });
    getCacheDb().prepare('UPDATE cached_users SET cached_at = 0 WHERE username = ?').run('expired');
    CacheService.purgeExpired();
    expect(CacheService.getCachedUser('expired')).toBeNull();
    expect(CacheService.getSession('expired-token')).toBeNull();
  });
});
