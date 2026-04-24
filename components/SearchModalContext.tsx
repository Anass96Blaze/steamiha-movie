'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { TmdbMedia } from '@/lib/types';

type ModalMode = 'closed' | 'search' | 'starred';

interface SearchModalContextValue {
  mode: ModalMode;
  sectionLabel: string;
  openSearch: (sectionLabel?: string) => void;
  openStarred: () => void;
  close: () => void;
}

const Ctx = createContext<SearchModalContextValue | null>(null);

export function useSearchModal(): SearchModalContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useSearchModal must be used inside SearchModalProvider');
  return ctx;
}

export function SearchModalProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ModalMode>('closed');
  const [sectionLabel, setSectionLabel] = useState<string>('');
  const lastFocus = useRef<HTMLElement | null>(null);

  const openSearch = useCallback((label?: string) => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement as HTMLElement | null;
      if (active && active !== document.body) lastFocus.current = active;
    }
    setSectionLabel(label || '');
    setMode('search');
  }, []);

  const openStarred = useCallback(() => {
    setSectionLabel('');
    setMode('starred');
  }, []);

  const close = useCallback(() => {
    setMode('closed');
    setSectionLabel('');
    if (lastFocus.current && typeof lastFocus.current.focus === 'function') {
      const el = lastFocus.current;
      setTimeout(() => el.focus(), 0);
      lastFocus.current = null;
    }
  }, []);

  useEffect(() => {
    if (mode === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, close]);

  const value = useMemo(() => ({ mode, sectionLabel, openSearch, openStarred, close }), [mode, sectionLabel, openSearch, openStarred, close]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export interface SearchHistoryItem {
  id: number;
  media_type: 'movie' | 'tv';
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

export function readSearchHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem('streamiha_search_history');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function rememberSearchItem(item: TmdbMedia): void {
  if (!item || !item.id || (item.media_type !== 'movie' && item.media_type !== 'tv')) return;
  const entry: SearchHistoryItem = {
    id: item.id,
    media_type: item.media_type as 'movie' | 'tv',
    title: item.title || '',
    name: item.name || '',
    poster_path: item.poster_path || '',
    backdrop_path: item.backdrop_path || '',
    release_date: item.release_date || '',
    first_air_date: item.first_air_date || ''
  };
  try {
    const prev = readSearchHistory();
    const next = [entry]
      .concat(prev.filter((x) => !(x && Number(x.id) === Number(entry.id) && x.media_type === entry.media_type)))
      .slice(0, 3);
    localStorage.setItem('streamiha_search_history', JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function readStarredContent(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem('streamiha_starred_content');
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
