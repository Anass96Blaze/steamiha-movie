'use client';

import { useEffect, useState } from 'react';
import LogoRail, { LogoRailItem } from './LogoRail';
import ArtistsRail, { ArtistCardData } from './ArtistsRail';
import { fetchTmdb } from '@/lib/cache';
import { hasLocalBrandLogo, LOCAL_PRODUCER_LOGOS, normalizeName } from '@/lib/logos';
import type { TmdbCompany, TmdbListResponse, TmdbMedia, TmdbProvider, TmdbPerson } from '@/lib/types';

function dedupeBy<T>(items: T[], keyFn: (x: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((x) => {
    const key = keyFn(x);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueByLocalLogo<T>(items: T[], getName: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  items.forEach((it) => {
    if (!hasLocalBrandLogo(getName(it))) return;
    const key = normalizeName(getName(it));
    if (seen.has(key)) return;
    seen.add(key);
    out.push(it);
  });
  return out;
}

export default function DiscoverSections() {
  const [companies, setCompanies] = useState<LogoRailItem[]>([]);
  const [platforms, setPlatforms] = useState<LogoRailItem[]>([]);
  const [artists, setArtists] = useState<ArtistCardData[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Platforms: movie + tv providers
      const names = Object.keys(LOCAL_PRODUCER_LOGOS);
      try {
        const [moviePv, tvPv] = await Promise.all([
          fetchTmdb<{ results?: TmdbProvider[] }>('/watch/providers/movie', { language: 'en-US', watch_region: 'US' }),
          fetchTmdb<{ results?: TmdbProvider[] }>('/watch/providers/tv', { language: 'en-US', watch_region: 'US' })
        ]);
        const merged = dedupeBy(
          uniqueByLocalLogo(
            (moviePv.results || []).concat(tvPv.results || []).filter(
              (x): x is TmdbProvider => !!x && !!x.provider_id && !!x.provider_name
            ),
            (x) => x.provider_name
          ),
          (x) => String(x.provider_id)
        ).slice(0, 20);
        if (!cancelled) {
          setPlatforms(merged.map((x) => ({
            id: x.provider_id,
            name: x.provider_name,
            provider_id: x.provider_id,
            provider_name: x.provider_name,
            logo_path: x.logo_path,
            href: `/content?mode=platform&provider=${encodeURIComponent(x.provider_id)}&name=${encodeURIComponent(x.provider_name)}&media_type=all`
          })));
        }
      } catch {
        // ignore
      }

      // Companies: resolve IDs via /search/company for each mapped producer name
      try {
        const results = await Promise.all(names.map(async (name) => {
          try {
            const res = await fetchTmdb<TmdbListResponse<TmdbCompany>>('/search/company', { query: name, page: 1 });
            const arr = res.results || [];
            const exact = arr.find((c) => normalizeName(c.name) === normalizeName(name));
            const pick = exact || arr[0];
            if (!pick) return null;
            return { id: pick.id, name, logo_path: pick.logo_path || undefined } as TmdbCompany & { name: string };
          } catch {
            return null;
          }
        }));
        const cleaned = results.filter((x): x is TmdbCompany & { name: string } => !!x && !!x.id);
        if (!cancelled) {
          setCompanies(cleaned.map((x) => ({
            id: x.id,
            name: x.name,
            logo_path: x.logo_path ?? undefined,
            href: `/content?mode=company&company=${encodeURIComponent(x.id)}&name=${encodeURIComponent(x.name)}&media_type=all`
          })));
        }
      } catch {
        // ignore
      }

      // Artists
      try {
        const data = await fetchTmdb<TmdbListResponse<TmdbPerson & TmdbMedia>>('/person/popular', { language: 'en-US', page: 1 });
        const candidates = (data.results || []).filter((x) => x && x.id).slice(0, 20);
        if (!cancelled) {
          setArtists(candidates.map((p) => ({
            id: p.id,
            name: p.name || 'Artist',
            profile_path: p.profile_path ?? undefined,
            titles: Array.isArray(p.known_for) ? p.known_for.length : undefined,
            department: p.known_for_department,
            href: `/content?mode=artist&artist=${encodeURIComponent(p.id)}&name=${encodeURIComponent(p.name || 'Artist')}&media_type=all`
          })));
        }
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <LogoRail
        rowId="section-companies"
        title="Discover by Studio"
        subtitle="Explore movies and shows from your favorite production companies."
        viewAllHref="/content?mode=company"
        viewAllLabel="View all studios"
        items={companies}
        hoverLabel="Browse titles"
        ariaPrefix="Browse movies and shows from"
        endCta={{
          title: 'More studios',
          subtitle: 'Explore all production companies',
          ctaLabel: 'View all',
          href: '/content?mode=company'
        }}
      />
      <LogoRail
        rowId="section-platforms"
        title="Discover by Platform"
        subtitle="Browse titles from popular streaming platforms."
        viewAllHref="/content?mode=platform"
        viewAllLabel="View all platforms"
        items={platforms}
        hoverLabel="Explore catalog"
        ariaPrefix="Browse titles from"
        endCta={{
          title: 'More platforms',
          subtitle: 'Browse all streaming sources',
          ctaLabel: 'View all',
          href: '/content?mode=platform'
        }}
      />
      <ArtistsRail
        rowId="section-artists"
        title="Top 20 Artists"
        subtitle="The most searched actors and creators today."
        viewAllHref="/content?mode=artist"
        items={artists}
      />
    </>
  );
}
