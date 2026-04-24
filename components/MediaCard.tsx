import Link from 'next/link';
import { Info } from 'lucide-react';
import type { TmdbMedia, TmdbImage } from '@/lib/types';
import { imgUrl } from '@/lib/tmdb-server';
import { detailsHref, playerHref, streamUrlFor } from '@/lib/urls';

export type Ratio = '3:2' | '2:3';

interface MediaCardProps {
  item: TmdbMedia;
  ratio: Ratio;
  rank?: number;
  logoMap?: Map<number, TmdbImage[]>;
  fallbackType?: 'movie' | 'tv' | 'all';
  continueMode?: boolean;
}

function pickLogo(logos: TmdbImage[] | undefined): string {
  if (!logos || !logos.length) return '';
  const en = logos.find((x) => x.iso_639_1 === 'en' && x.file_path);
  if (en?.file_path) return en.file_path;
  const any = logos.find((x) => x.file_path);
  return any?.file_path || '';
}

export default function MediaCard({ item, ratio, rank, logoMap, fallbackType, continueMode }: MediaCardProps) {
  const title = item.title || item.name || 'Untitled';
  const type = (item.media_type || fallbackType || 'movie') as 'movie' | 'tv' | 'all';
  const resolvedType = type === 'tv' ? 'tv' : 'movie';

  const isPortrait = ratio === '2:3';
  const imageClass = isPortrait ? 'poster916 top10-poster' : 'poster32';
  const imagePath = isPortrait ? (item.poster_path || item.backdrop_path) : (item.backdrop_path || item.poster_path);
  const src = imgUrl(imagePath || '', isPortrait ? 'w342' : 'w500');

  const rating = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A';
  const logoPath = ratio === '3:2' && logoMap ? pickLogo(logoMap.get(item.id)) : '';
  const logoSrc = imgUrl(logoPath || '', 'w300');

  let href: string = detailsHref(resolvedType, item.id);
  if (continueMode && (type === 'movie' || type === 'tv')) {
    const s = Number(item.season_number) || 1;
    const e = Number(item.episode_number) || 1;
    href = playerHref(streamUrlFor(resolvedType, item.id, s, e));
  }

  return (
    <Link href={href} className="clickable" style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
      <div className="poster-wrap">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={imageClass} alt={title} src={src} draggable={false} />
        ) : (
          <div className={imageClass} aria-label={title} />
        )}
        <div className="poster-dim" />
        {typeof rank === 'number' ? null : (
          <div className="poster-badges">
            <span className="poster-badge type">{(type || '').toUpperCase()}</span>
            <span className="poster-badge imdb">IMDb {rating}</span>
          </div>
        )}
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card-logo" alt={`${title} logo`} src={logoSrc} draggable={false} />
        ) : null}
        {typeof rank === 'number' ? <div className="rank">{rank}</div> : null}
        {continueMode ? (
          <Link
            className="continue-info-btn"
            href={detailsHref(resolvedType, item.id)}
            aria-label="Open details"
            onClick={(e) => e.stopPropagation()}
          >
            <Info size={14} />
          </Link>
        ) : null}
      </div>
    </Link>
  );
}
