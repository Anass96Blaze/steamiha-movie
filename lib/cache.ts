'use client';

const PREFIX = 'streamiha_tmdb_cache_v1';
const DEFAULT_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memory = new Map<string, CacheEntry<unknown>>();

function stableQuery(query?: Record<string, unknown>): string {
  if (!query) return '';
  const entries = Object.keys(query)
    .filter((k) => query[k] !== undefined && query[k] !== null && query[k] !== '')
    .sort()
    .map((k) => [k, String(query[k])] as [string, string]);
  return new URLSearchParams(entries).toString();
}

function cacheKey(path: string, query?: Record<string, unknown>): string {
  return `${PREFIX}:${path}?${stableQuery(query)}`;
}

function readCached<T>(key: string): T | null {
  const now = Date.now();
  const mem = memory.get(key) as CacheEntry<T> | undefined;
  if (mem && mem.expiresAt > now) return mem.data;
  if (mem) memory.delete(key);
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed: CacheEntry<T> = JSON.parse(raw);
    if (!parsed || parsed.expiresAt <= now) {
      localStorage.removeItem(key);
      return null;
    }
    memory.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCached<T>(key: string, data: T, ttlMs: number): void {
  const payload: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs };
  memory.set(key, payload);
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // storage full - ignore
  }
}

export interface FetchOptions {
  ttlMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function fetchTmdb<T = unknown>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
  options: FetchOptions = {}
): Promise<T> {
  const ttlMs = options.ttlMs ?? DEFAULT_TTL;
  const timeoutMs = options.timeoutMs ?? 9000;

  const key = cacheKey(path, query as Record<string, unknown>);
  const cached = readCached<T>(key);
  if (cached) return cached;

  const url = new URL('/api/tmdb', window.location.origin);
  url.searchParams.set('path', path);
  if (query) {
    Object.keys(query).forEach((k) => {
      const v = query[k];
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }
  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!res.ok) {
      throw new Error(`TMDB error ${res.status}`);
    }
    const data = (await res.json()) as T;
    writeCached(key, data, ttlMs);
    return data;
  } finally {
    clearTimeout(timer);
  }
}
