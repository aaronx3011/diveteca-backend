# Backend Changes — Frontend Team Brief

## 1. Offline/Degraded Mode

MSSQL can become unreachable (timeout, connection refused, pool error). The backend automatically detects failures, marks MSSQL as unavailable in SQLite metadata, and enters **degraded mode**. An exponential backoff retry loop (max 60s) attempts reconnection in the background (`src/config/database.ts:64`). No manual intervention needed.

## 2. `GET /api/health` Endpoint

New unauthenticated endpoint: `GET /api/health`

```json
{
  "status": "connected" | "degraded" | "error",
  "mssql": {
    "available": false,
    "connected": false,
    "failureCount": 3,
    "server": "mssql.diveteca.com"
  },
  "sqlite": {
    "available": true,
    "cacheEntries": 42,
    "sessions": 5,
    "cachedUsers": 12
  }
}
```

- `status` is `"degraded"` when `mssql.connected === false` but SQLite is still available.
- `failureCount` tracks consecutive MSSQL failures (resets on reconnect).
- Use this endpoint as a heartbeat / readiness check on app load.

## 3. Login Flow Changes

- On **first successful login** (MSSQL reachable), the user's credentials (`username`, `password_hash`, `email`, `role`, etc.) are cached to SQLite (`src/services/AuthService.ts:116`).
- On **subsequent login attempts when MSSQL is down**, `loginFromCache()` (`src/services/AuthService.ts:195`) performs bcrypt comparison against the cached hash and returns a valid JWT + session.
- Login fails with `503` only if MSSQL is down **and** the user has never logged in before (no cached record).

## 4. Session Persistence

Sessions are always written to SQLite first (`src/services/SessionsService.ts:7`). MSSQL writes are best-effort. Token validation (`isSessionValid`) checks SQLite cache before falling back to MSSQL. This means **logged-in users stay authenticated** even if MSSQL drops mid-session.

## 5. API Data Caching

Most GET endpoints use `CacheService.cacheAside()` (`src/services/CacheService.ts:87`):

1. If a fresh (non-stale) cache entry exists → return immediately.
2. If stale or missing → call the MSSQL fetch function.
3. If MSSQL fails and stale data exists → **return stale data** and set `X-Cache-Stale: true` response header.
4. If MSSQL fails and no cache exists → return `503 { error: "service_unavailable", message: "MSSQL is unavailable and no cached data exists" }`.

Currently the **VentasController** and **InventarioController** read endpoints handle stale headers. Other read endpoints (SalesGoals, IssueReports, Clientes, PatchNotes, Users) also use `cacheAside()` but return generic 500 when cacheAside throws. Write endpoints (POST/PUT/DELETE) return `503` when MSSQL is unavailable.

## 6. What the Frontend Should Handle

| Scenario | Signal | Action |
|---|---|---|
| MSSQL connected, fresh data | `status: "connected"`, 200 OK | Normal operation |
| MSSQL down, stale data served | `status: "degraded"`, 200 OK, `X-Cache-Stale: true` | Show banner: "Showing cached data — updates may be delayed" |
| MSSQL down, no cache | `status: "degraded"`, 503 `{ error: "service_unavailable" }` | Show error state, disable write features |
| Write operation while degraded | 503 `{ error: "service_unavailable" }` | Disable save/submit buttons, show "Database unavailable — try again later" |

**Recommended**: On app startup, call `GET /api/health`. If `status === "degraded"`, display a persistent indicator (e.g. yellow banner "Running in offline mode"). Watch for `X-Cache-Stale` on GET responses to add inline staleness hints.

**Important**: Session auth works independently of MSSQL — the JWT + SQLite session store means users can stay logged in and browse cached data during outages. The `/api/health` `sqlite.sessions` and `sqlite.cachedUsers` counts can help you decide whether the offline experience is viable.
