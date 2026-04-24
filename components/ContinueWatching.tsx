'use client';

import { useEffect, useState } from 'react';
import MediaRow from './MediaRow';
import { fetchTmdb } from '@/lib/cache';
import type { TmdbImage, TmdbMedia } from '@/lib/types';

interface ContinueItem extends TmdbMedia {
  logo_path?: string | null;
}

export default function ContinueWatching() {
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [logoMap, setLogoMap] = useState<Map<number, TmdbImage[]>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let raw: ContinueItem[] = [];
      try {
        const r = localStorage.getItem('streamiha_continue_playing');
        const arr = r ? JSON.parse(r) : [];
        if (Array.isArray(arr)) raw = arr;
      } catch {
        // ignore
      }
      if (!raw.length) return;
      const normalized: ContinueItem[] = raw.map((x: ContinueItem) => ({
        ...x,
        backdrop_path: x.backdrop_path || '',
        logo_path: x.logo_path || '',
        vote_average: x.vote_average || 0
      }));
      await Promise.all(
        normalized
          .filter((x) => !x.backdrop_path && (x.media_type === 'movie' || x.media_type === 'tv'))
          .map(async (x) => {
            try {
              const d = await fetchTmdb<TmdbMedia>(`/${x.media_type}/${x.id}`, { language: 'en-US' });
              x.backdrop_path = d.backdrop_path || '';
            } catch {
              // ignore
            }
          })
      );
      if (cancelled) return;
      try {
        localStorage.setItem('streamiha_continue_playing', JSON.stringify(normalized));
      } catch {
        // ignore
      }
      setItems(normalized);

      const map = new Map<number, TmdbImage[]>();
      normalized.forEach((x) => {
        if (x.logo_path) map.set(x.id, [{ file_path: x.logo_path, iso_639_1: 'en' }]);
      });
      const needed = normalized.filter((x) => !map.has(x.id) && (x.media_type === 'movie' || x.media_type === 'tv'));
      await Promise.all(needed.map(async (x) => {
        try {
          const d = await fetchTmdb<{ logos?: TmdbImage[] }>(`/${x.media_type}/${x.id}/images`);
          map.set(x.id, d.logos || []);
        } catch {
          map.set(x.id, []);
        }
      }));
      if (!cancelled) setLogoMap(map);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!items.length) return null;

  return (
    <MediaRow
      rowId="section-continue"
      title="Continue Watching"
      items={items}
      ratio="3:2"
      logoMap={logoMap}
      fallbackType="all"
      continueMode
    />
  );
}
