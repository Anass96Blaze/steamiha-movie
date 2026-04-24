'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { TmdbImage, TmdbMedia } from '@/lib/types';
import { imgUrl } from '@/lib/tmdb-server';
import { detailsHref, playerHref, streamUrlFor } from '@/lib/urls';

interface TopTenRailProps {
  rowId: string;
  title: string;
  subtitle?: string;
  items: TmdbMedia[];
  logoMap?: Map<number, TmdbImage[]>;
  fallbackType?: 'movie' | 'tv' | 'all';
}

export default function TopTenRail({ rowId, title, subtitle, items, fallbackType }: TopTenRailProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const update = () => {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const scrollByDir = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!items || !items.length) return null;

  return (
    <section className="top10-rail">
      <div className="top10-head reveal-on-scroll">
        <div className="top10-titles">
          <h2 className="top10-title"><span className="top10-title-main">{title.toUpperCase()}</span></h2>
          {subtitle ? <p className="top10-subtitle">{subtitle}</p> : null}
        </div>
        <div className="top10-arrows">
          <button
            type="button"
            className="top10-arrow"
            onClick={() => scrollByDir(-1)}
            aria-label="Scroll left"
            disabled={!canLeft}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="top10-arrow"
            onClick={() => scrollByDir(1)}
            aria-label="Scroll right"
            disabled={!canRight}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      <div className="top10-scroll reveal-on-scroll" id={rowId} ref={railRef}>
        {items.slice(0, 10).map((item, idx) => {
          const type = (item.media_type || fallbackType || 'movie') as string;
          const resolved: 'movie' | 'tv' = type === 'tv' ? 'tv' : 'movie';
          const mediaTitle = item.title || item.name || 'Untitled';
          const src = imgUrl(item.poster_path || item.backdrop_path, 'w342');
          const rating = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A';
          const rank = idx + 1;
          return (
            <article className="top10-card" key={`${item.media_type || fallbackType}-${item.id}-${idx}`}>
              <span className="top10-rank" aria-hidden="true">{rank}</span>
              <Link
                href={detailsHref(resolved, item.id)}
                className="top10-poster-wrap"
                aria-label={`${mediaTitle} details`}
              >
                <span className="top10-glow" aria-hidden="true" />
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="top10-poster" alt={mediaTitle} src={src} draggable={false} />
                ) : (
                  <div className="top10-poster" aria-label={mediaTitle} />
                )}
                <span className="top10-overlay-gradient" aria-hidden="true" />
                <div className="top10-overlay-meta">
                  <div className="top10-overlay-title">{mediaTitle}</div>
                  <div className="top10-overlay-rating">IMDb {rating}</div>
                </div>
              </Link>
              <div className="top10-actions">
                <Link
                  className="top10-action primary"
                  href={playerHref(streamUrlFor(resolved, item.id))}
                  aria-label={`Play ${mediaTitle}`}
                >
                  <Play size={16} fill="currentColor" />
                </Link>
                <Link
                  className="top10-action secondary"
                  href={detailsHref(resolved, item.id)}
                  aria-label={`More info about ${mediaTitle}`}
                >
                  <Info size={16} />
                </Link>
              </div>
            </article>
          );
        })}
        <Link
          href="/content?sort=trending"
          className="top10-cta"
          aria-label="View full Top 10 ranking"
        >
          <span className="top10-cta-glow" aria-hidden="true" />
          <div className="top10-cta-body">
            <div className="top10-cta-title">View full Top 10</div>
            <div className="top10-cta-sub">See today&rsquo;s complete ranking</div>
            <div className="top10-cta-btn">
              <span>Explore ranking</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
