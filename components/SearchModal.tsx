'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import { useSearchModal, readSearchHistory, readStarredContent, rememberSearchItem, SearchHistoryItem } from './SearchModalContext';
import { fetchTmdb } from '@/lib/cache';
import type { TmdbListResponse, TmdbMedia } from '@/lib/types';
import { imgUrl } from '@/lib/tmdb-server';

const DEFAULT_PLACEHOLDER = 'Search movies and TV shows';

function prettyType(t: string): string {
  return t === 'tv' ? 'TV Show' : t === 'movie' ? 'Movie' : 'Unknown';
}

function yearOf(item: { release_date?: string; first_air_date?: string }): string {
  const d = item.release_date || item.first_air_date || '';
  return d ? d.slice(0, 4) : '';
}

export default function SearchModal() {
  const { mode, sectionLabel, close } = useSearchModal();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbMedia[]>([]);
  const [emptyText, setEmptyText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<number | null>(null);

  const placeholder = useMemo(() => {
    if (sectionLabel) return 'Search in ' + sectionLabel;
    return DEFAULT_PLACEHOLDER;
  }, [sectionLabel]);

  useEffect(() => {
    if (mode === 'closed') {
      setQuery('');
      setResults([]);
      setEmptyText('');
      return;
    }
    if (mode === 'starred') {
      const starred = readStarredContent().filter((x) => x && x.id && (x.media_type === 'movie' || x.media_type === 'tv'));
      setResults(starred.slice(0, 30) as TmdbMedia[]);
      setEmptyText('No starred content');
      return;
    }
    const history = readSearchHistory().filter((x) => x && x.id && (x.media_type === 'movie' || x.media_type === 'tv'));
    setResults(history as TmdbMedia[]);
    setEmptyText('Search history is empty');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [mode]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      const history = readSearchHistory().filter((x) => x && x.id && (x.media_type === 'movie' || x.media_type === 'tv'));
      setResults(history as TmdbMedia[]);
      setEmptyText('Search history is empty');
      return;
    }
    try {
      const data = await fetchTmdb<TmdbListResponse<TmdbMedia>>('/search/multi', {
        language: 'en-US',
        query: trimmed,
        include_adult: false,
        page: 1
      });
      const filtered = (data.results || []).filter((x) => x.media_type === 'movie' || x.media_type === 'tv').slice(0, 20);
      setResults(filtered);
      setEmptyText('No results');
    } catch {
      setResults([]);
      setEmptyText('Search failed');
    }
  }, []);

  useEffect(() => {
    if (mode !== 'search') return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => runSearch(query), 220);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, mode, runSearch]);

  const onItemClick = (item: TmdbMedia | SearchHistoryItem) => {
    rememberSearchItem(item as TmdbMedia);
    const type = (item as TmdbMedia).media_type || 'movie';
    if (type !== 'movie' && type !== 'tv') return;
    close();
    router.push(`/details/${type}/${item.id}`);
  };

  if (mode === 'closed') return null;

  return (
    <div
      className="search-modal open"
      aria-hidden={false}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="search-glass" role="dialog" aria-modal="true" aria-label="Search content">
        <div className="search-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <SearchIcon size={18} style={{ opacity: 0.8, marginLeft: 4 }} />
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              value={query}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="button" className="search-close-btn" onClick={close} aria-label="Close search">
            <X size={16} />
          </button>
        </div>
        <ul className="search-results">
          {results.length === 0 ? (
            <li className="search-sub" style={{ padding: '10px 12px' }}>{emptyText}</li>
          ) : (
            results.map((item) => {
              const title = item.title || item.name || 'Untitled';
              const thumbSrc = imgUrl(item.poster_path || item.backdrop_path, 'w342');
              const typeLabel = prettyType(item.media_type || 'movie');
              const y = yearOf(item);
              return (
                <li key={`${item.media_type}-${item.id}`}>
                  <button type="button" className="search-item" onClick={() => onItemClick(item)}>
                    {thumbSrc ? (
                      // Using plain img for modal thumbs to avoid layout issues
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="search-thumb" src={thumbSrc} alt={title} />
                    ) : (
                      <div className="search-thumb" />
                    )}
                    <div className="search-meta">
                      <div className="search-title">{title}</div>
                      <div className="search-sub">{typeLabel}{y ? ` • ${y}` : ''}</div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
