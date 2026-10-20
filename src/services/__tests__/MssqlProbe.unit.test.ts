process.env.DB_PROBE_TIMEOUT_MS = '50';
process.env.DB_PROBE_TTL_MS = '5000';

const noteMssqlProbeResult = jest.fn();

interface FakePool {
  connect: jest.Mock;
  request: jest.Mock;
  close: jest.Mock;
}

function makeFakePool(connectImpl?: () => Promise<void>): FakePool {
  const request = { query: jest.fn().mockResolvedValue({ recordset: [{ column0: 1 }] }) };
  return {
    connect: jest.fn(connectImpl ?? (() => Promise.resolve())),
    request: jest.fn().mockReturnValue(request),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as FakePool;
}

function loadProbe(pool: FakePool) {
  jest.resetModules();
  jest.doMock('../../config/database', () => ({
    createProbeConnection: () => pool,
    noteMssqlProbeResult: noteMssqlProbeResult,
  }));
  return require('../MssqlProbe');
}

describe('MssqlProbe', () => {
  beforeEach(() => {
    noteMssqlProbeResult.mockClear();
  });

  it('opens a throwaway connection, runs SELECT 1 and closes it', async () => {
    const pool = makeFakePool();
    const { MssqlProbe } = loadProbe(pool);

    const result = await MssqlProbe.check(true);

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(pool.connect).toHaveBeenCalledTimes(1);
    const probedRequest = (pool.request as unknown as { mock: { results: Array<{ value: { query: jest.Mock } }> } }).mock.results[0].value;
    expect(probedRequest.query).toHaveBeenCalledWith('SELECT 1');
    expect(pool.close).toHaveBeenCalled();
  });

  it('reports probe failure and notifies stale connectivity when the connection fails', async () => {
    const pool = makeFakePool(() => Promise.reject(new Error('Failed to connect to 10.8.0.9:1433 in 3000ms')));
    const { MssqlProbe } = loadProbe(pool);

    const result = await MssqlProbe.check(true);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('10.8.0.9');
    expect(noteMssqlProbeResult).toHaveBeenCalledWith(false);
  });

  it('notifies connectivity state tracking on probe success', async () => {
    const pool = makeFakePool();
    const { MssqlProbe } = loadProbe(pool);

    await MssqlProbe.check(true);

    expect(noteMssqlProbeResult).toHaveBeenCalledWith(true);
  });

  it('caches the result for the TTL window and dedupes in-flight probes', async () => {
    const pool = makeFakePool();
    const { MssqlProbe } = loadProbe(pool);

    const [first, second] = await Promise.all([MssqlProbe.check(), MssqlProbe.check(), MssqlProbe.check()]);

    expect(second).toEqual(first);
    expect(pool.connect).toHaveBeenCalledTimes(1);

    await MssqlProbe.check(true);
    expect(pool.connect).toHaveBeenCalledTimes(2);
  });

  it('fails instead of hanging when the connection never responds', async () => {
    const pool = makeFakePool(() => new Promise<void>(() => undefined));
    const { MssqlProbe } = loadProbe(pool);

    const result = await MssqlProbe.check(true);

    expect(result.ok).toBe(false);
    expect(result.error).toContain('timed out');
  });
});
