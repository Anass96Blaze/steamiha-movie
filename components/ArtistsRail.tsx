'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { imgUrl } from '@/lib/tmdb-server';

export interface ArtistCardData {
  id: number;
  name: string;
  profile_path?: string;
  href: string;
  titles?: number;
  department?: string;
}

interface ArtistsRailProps {
  rowId: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  items: ArtistCardData[];
}

export default function ArtistsRail({ rowId, title, subtitle, viewAllHref, items }: ArtistsRailProps) {
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
  }, [items.length]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!items || !items.length) return null;

  return (
    <section className="artists-rail">
      <div className="artists-head reveal-on-scroll">
        <div className="artists-titles">
          <h2 className="artists-title">{title}</h2>
          {subtitle ? <p className="artists-subtitle">{subtitle}</p> : null}
        </div>
        <div className="artists-head-right">
          {viewAllHref ? (
            <Link href={viewAllHref} className="artists-view-all">
              View all artists
              <ArrowRight size={14} />
            </Link>
          ) : null}
          <div className="artists-arrows">
            <button
              type="button"
              className="artists-arrow"
              onClick={() => scrollByDir(-1)}
              aria-label="Scroll artists left"
              disabled={!canLeft}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="artists-arrow"
              onClick={() => scrollByDir(1)}
              aria-label="Scroll artists right"
              disabled={!canRight}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="artists-scroll reveal-on-scroll" id={rowId} ref={railRef}>
        {items.map((a) => {
          const src = imgUrl(a.profile_path || '', 'w300');
          const meta = typeof a.titles === 'number' && a.titles > 0
            ? `${a.titles} titles`
            : (a.department || 'Popular now');
          return (
            <Link
              key={a.id}
              href={a.href}
              className="artist-card"
              aria-label={`View movies and shows featuring ${a.name}`}
            >
              <span className="artist-glow" aria-hidden="true" />
              <div className="artist-photo-wrap">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="artist-photo"
                    src={src}
                    alt={`${a.name} portrait`}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="artist-photo artist-photo-empty" aria-hidden="true" />
                )}
                <span className="artist-hover-overlay" aria-hidden="true">
                  <span className="artist-hover-label">
                    View profile
                    <ArrowRight size={12} />
                  </span>
                </span>
              </div>
              <div className="artist-body">
                <div className="artist-name">{a.name}</div>
                <div className="artist-meta">{meta}</div>
              </div>
            </Link>
          );
        })}
        <Link
          href={viewAllHref || '/content?mode=artist'}
          className="artist-cta"
          aria-label="Browse all artists"
        >
          <span className="artist-cta-glow" aria-hidden="true" />
          <div className="artist-cta-body">
            <div className="artist-cta-title">Explore more artists</div>
            <div className="artist-cta-sub">Find movies and shows by your favorite stars</div>
            <div className="artist-cta-btn">
              <span>Browse artists</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
