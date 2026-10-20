import sql from 'mssql';
import { createProbeConnection, noteMssqlProbeResult } from '../config/database';

export interface MssqlProbeResult {
  ok: boolean;
  checkedAt: string;
  latencyMs: number;
  error: string | null;
}

const PROBE_TIMEOUT_MS = Number.parseInt(process.env.DB_PROBE_TIMEOUT_MS ?? '3000', 10);
const PROBE_TTL_MS = Number.parseInt(process.env.DB_PROBE_TTL_MS ?? '10000', 10);

let cachedResult: MssqlProbeResult | null = null;
let probeInFlight: Promise<MssqlProbeResult> | null = null;

export class MssqlProbe {
  static async check(force = false): Promise<MssqlProbeResult> {
    if (!force && cachedResult && Date.now() - Date.parse(cachedResult.checkedAt) < PROBE_TTL_MS) {
      return cachedResult;
    }

    if (!probeInFlight) {
      probeInFlight = this.runProbe()
        .then(result => {
          cachedResult = result;
          noteMssqlProbeResult(result.ok);
          return result;
        })
        .finally(() => {
          probeInFlight = null;
        });
    }

    return probeInFlight;
  }

  static getLastResult(): MssqlProbeResult | null {
    return cachedResult;
  }

  private static runProbe(): Promise<MssqlProbeResult> {
    const startedAt = Date.now();
    const rawProbe = (async (): Promise<MssqlProbeResult> => {
      const pool = createProbeConnection();
      try {
        await pool.connect();
        await pool.request().query('SELECT 1');
        return {
          ok: true,
          checkedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
          error: null,
        };
      } finally {
        void pool.close().catch(() => undefined);
      }
    })();

    return Promise.race([
      rawProbe,
      new Promise<MssqlProbeResult>((_, reject) => {
        setTimeout(() => {
          const err = new Error(`MSSQL probe timed out after ${PROBE_TIMEOUT_MS}ms`);
          reject(err);
        }, PROBE_TIMEOUT_MS + 1000);
      }),
    ]).catch((err: Error) => ({
      ok: false,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      error: err.message,
    }));
  }
}
