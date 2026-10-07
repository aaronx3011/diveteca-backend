export interface CacheEntry {
  cache_key: string;
  data: string;
  cached_at: number;
  ttl_seconds: number;
  last_successful_refresh: number | null;
}

export interface SessionCacheEntry {
  id: string;
  user_id: string;
  token: string;
  created_at: number;
  expires_at: number;
  is_valid: number;
  sync_status: 'pending_create' | 'pending_revoke' | 'synced';
}
