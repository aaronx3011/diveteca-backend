jest.mock('../../services/MssqlProbe', () => ({
  MssqlProbe: { check: jest.fn() },
}));
jest.mock('../../services/HealthService', () => ({
  HealthService: {
    getMssqlAvailable: jest.fn(),
    getMssqlFailureCount: jest.fn(),
  },
}));
jest.mock('../../config/database', () => ({
  isMssqlConnected: jest.fn(),
  createProbeConnection: jest.fn(),
  noteMssqlProbeResult: jest.fn(),
}));
jest.mock('../../config/cache', () => ({
  getCacheHealth: jest.fn(),
}));

import { HealthController } from '../HealthController';
import { MssqlProbe } from '../../services/MssqlProbe';
import { HealthService } from '../../services/HealthService';
import { isMssqlConnected } from '../../config/database';
import { getCacheHealth } from '../../config/cache';

const probeOk = {
  ok: true,
  latencyMs: 12,
  checkedAt: '2026-10-20T19:30:00.000Z',
  error: null,
};

function newResponse() {
  const res: { status: jest.Mock; json: jest.Mock } = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return { res: res as unknown as Parameters<typeof HealthController.status>[1], resBody: () => res.json.mock.calls[0][0] };
}

beforeEach(() => {
  jest.clearAllMocks();
  (MssqlProbe.check as jest.Mock).mockResolvedValue(probeOk);
  (isMssqlConnected as jest.Mock).mockReturnValue(true);
  (HealthService.getMssqlAvailable as jest.Mock).mockReturnValue(true);
  (HealthService.getMssqlFailureCount as jest.Mock).mockReturnValue(0);
  (getCacheHealth as jest.Mock).mockReturnValue({
    available: true,
    cacheEntries: 3,
    sessions: 2,
    cachedUsers: 1,
  });
  process.env.DB_SERVER = '10.8.0.9';
});

describe('HealthController.status', () => {
  it('reports connected with probe, sqlite and traceability data when everything is healthy', async () => {
    const { res, resBody } = newResponse();
    await HealthController.status({} as never, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(resBody()).toEqual({
      status: 'connected',
      mssql: {
        available: true,
        connected: true,
        failureCount: 0,
        server: '10.8.0.9',
        lastVerifiedAt: probeOk.checkedAt,
        lastProbe: { ok: true, latencyMs: 12, error: null },
      },
      sqlite: { available: true, cacheEntries: 3, sessions: 2, cachedUsers: 1 },
    });
  });

  it('reports degraded when the live probe fails while the pool flag still claims connected', async () => {
    (MssqlProbe.check as jest.Mock).mockResolvedValue({
      ok: false,
      latencyMs: 3500,
      checkedAt: '2026-10-20T19:30:05.000Z',
      error: 'Failed to connect to 10.8.0.9:1433 in 3000ms',
    });
    const { res, resBody } = newResponse();
    await HealthController.status({} as never, res);

    const body = resBody();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body.status).toBe('degraded');
    expect(body.mssql.connected).toBe(true);
    expect(body.mssql.lastProbe.ok).toBe(false);
    expect(body.mssql.lastVerifiedAt).toBe('2026-10-20T19:30:05.000Z');
  });

  it('reports degraded when the pool flag is down even if the probe succeeded', async () => {
    (isMssqlConnected as jest.Mock).mockReturnValue(false);
    const { res, resBody } = newResponse();
    await HealthController.status({} as never, res);

    expect(resBody().status).toBe('degraded');
    expect(resBody().mssql.connected).toBe(false);
  });

  it('falls back to the error contract when health collection throws', async () => {
    (getCacheHealth as jest.Mock).mockImplementation(() => {
      throw new Error('sqlite destroyed');
    });
    const { res, resBody } = newResponse();
    await HealthController.status({} as never, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const body = resBody();
    expect(body.status).toBe('error');
    expect(body.mssql.failureCount).toBe(-1);
    expect(body.mssql.lastProbe).toBeNull();
    expect(body.sqlite).toEqual({ available: false, cacheEntries: 0, sessions: 0, cachedUsers: 0 });
  });
});
