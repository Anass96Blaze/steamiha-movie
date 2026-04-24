import { NextRequest, NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get('path');
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 });
  }
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (key === 'path') return;
    query[key] = value;
  });

  try {
    const data = await tmdbFetch(path, query, { revalidate: 300 });
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TMDB error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
