'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { imgUrl } from '@/lib/tmdb-server';
import { resolveLocalBrandLogo } from '@/lib/logos';

export interface LogoRailItem {
  id: number;
  name: string;
  logo_path?: string;
  profile_path?: string;
  provider_id?: number;
  provider_name?: string;
  href: string;
}

interface LogoRailProps {
  rowId: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  items: LogoRailItem[];
  hoverLabel?: string;
  ariaPrefix?: string;
  endCta?: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    href: string;
  };
}

export default function LogoRail({
  rowId,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  items,
  hoverLabel = 'Browse titles',
  ariaPrefix = 'Browse titles from',
  endCta
}: LogoRailProps) {
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
    <section className="logo-rail">
      <div className="logo-rail-head reveal-on-scroll">
        <div className="logo-rail-titles">
          <h2 className="logo-rail-title">{title}</h2>
          {subtitle ? <p className="logo-rail-subtitle">{subtitle}</p> : null}
        </div>
        <div className="logo-rail-head-right">
          {viewAllHref ? (
            <Link href={viewAllHref} className="logo-rail-view-all">
              <span>{viewAllLabel}</span>
              <ArrowRight size={14} />
            </Link>
          ) : null}
          <div className="logo-rail-arrows">
            <button
              type="button"
              className="logo-rail-arrow"
              onClick={() => scrollByDir(-1)}
              aria-label="Scroll left"
              disabled={!canLeft}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="logo-rail-arrow"
              onClick={() => scrollByDir(1)}
              aria-label="Scroll right"
              disabled={!canRight}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="logo-rail-scroll reveal-on-scroll" id={rowId} ref={railRef}>
        {items.map((item) => {
          const displayName = item.provider_name || item.name || 'logo';
          const local = resolveLocalBrandLogo(displayName);
          const fallbackSrc = imgUrl(item.logo_path || item.profile_path || '', 'w300');
          const src = local || fallbackSrc;
          return (
            <Link
              key={`${item.id}:${displayName}`}
              href={item.href}
              className="logo-card"
              aria-label={`${ariaPrefix} ${displayName}`}
            >
              <span className="logo-card-glow" aria-hidden="true" />
              <div className="logo-card-inner">
                <LogoCardImage src={src} name={displayName} isLocal={!!local} />
              </div>
              <span className="logo-card-overlay" aria-hidden="true">
                <span className="logo-card-overlay-label">
                  {hoverLabel}
                  <ArrowRight size={12} />
                </span>
              </span>
            </Link>
          );
        })}
        {endCta ? (
          <Link href={endCta.href} className="logo-cta" aria-label={endCta.title}>
            <span className="logo-cta-glow" aria-hidden="true" />
            <div className="logo-cta-body">
              <div className="logo-cta-title">{endCta.title}</div>
              <div className="logo-cta-sub">{endCta.subtitle}</div>
              <div className="logo-cta-btn">
                <span>{endCta.ctaLabel}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function LogoCardImage({ src, name, isLocal }: { src: string; name: string; isLocal: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <span className="logo-card-fallback">{name}</span>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="logo-card-img"
      alt={name}
      src={src}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      style={isLocal ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}
