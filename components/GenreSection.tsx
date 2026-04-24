'use client';

import { useEffect, useState } from 'react';
import MediaRow from './MediaRow';
import { fetchTmdb } from '@/lib/cache';
import type { TmdbGenre, TmdbImage, TmdbListResponse, TmdbMedia } from '@/lib/types';

const PREFERRED = ['Action', 'Drama', 'Comedy', 'Thriller', 'Sci-Fi', 'Animation', 'Horror', 'Adventure'];

export default function GenreSection() {
  const [genres, setGenres] = useState<TmdbGenre[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [items, setItems] = useState<TmdbMedia[]>([]);
  const [logoMap, setLogoMap] = useState<Map<number, TmdbImage[]>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTmdb<{ genres?: TmdbGenre[] }>('/genre/movie/list', { language: 'en-US' });
        const all = data.genres || [];
        const picks = all.filter((g) => PREFERRED.includes(g.name));
        const finalList = (picks.length ? picks : all).slice(0, 8);
        if (cancelled) return;
        setGenres(finalList);
        if (finalList.length) setActiveId(finalList[0].id);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchTmdb<TmdbListResponse<TmdbMedia>>('/discover/movie', {
          language: 'en-US',
          sort_by: 'popularity.desc',
          include_adult: false,
          include_video: false,
          with_genres: activeId,
          'vote_count.gte': 500,
          page: 1
        });
        const picks = (data.results || []).slice(0, 10).map((x) => ({ ...x, media_type: 'movie' as const }));
        if (cancelled) return;
        setItems(picks);
        const map = new Map<number, TmdbImage[]>();
        await Promise.all(picks.map(async (it) => {
          try {
            const d = await fetchTmdb<{ logos?: TmdbImage[] }>(`/movie/${it.id}/images`);
            map.set(it.id, d.logos || []);
          } catch {
            map.set(it.id, []);
          }
        }));
        if (!cancelled) setLogoMap(map);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [activeId]);

  if (!genres.length) return null;

  return (
    <>
      <div className="section-head reveal-on-scroll">
        <h2 className="reveal-on-scroll">Top 10 Movies by Genre</h2>
        <div className="genre-tabs">
          {genres.map((g) => (
            <button
              key={g.id}
              type="button"
              className={'genre-tab' + (g.id === activeId ? ' active' : '')}
              onClick={() => setActiveId(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>
      <MediaRow
        rowId="section-genre-movies"
        title="Top 10 Movies by Genre"
        items={items}
        ratio="3:2"
        logoMap={logoMap}
        fallbackType="movie"
        headingOverride={<></>}
      />
    </>
  );
}
