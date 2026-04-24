const TMDB_BASE = 'https://api.themoviedb.org/3';

export interface TmdbFetchOpts {
  timeoutMs?: number;
  revalidate?: number;
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
  const url = new URL(TMDB_BASE + (path.startsWith('/') ? path : '/' + path));
  const apiKey = process.env.TMDB_API_KEY;
  if (apiKey && !process.env.TMDB_BEARER_TOKEN) {
    url.searchParams.set('api_key', apiKey);
  }
  if (query) {
    Object.keys(query).forEach((k) => {
      const v = query[k];
      if (v === undefined || v === null || v === '') return;
      url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

export async function tmdbFetch<T = unknown>(
  path: string,
  query?: Record<string, string | number | boolean | undefined | null>,
  opts: TmdbFetchOpts = {}
): Promise<T> {
  const timeoutMs = opts.timeoutMs ?? 9000;
  const revalidate = opts.revalidate ?? 300;

  const url = buildUrl(path, query);
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.TMDB_BEARER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.TMDB_BEARER_TOKEN}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      next: { revalidate }
    });
    if (!res.ok) {
      throw new Error(`TMDB ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export function imgUrl(path?: string | null, size: string = 'w500'): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `https://image.tmdb.org/t/p/${size}${clean}`;
}
