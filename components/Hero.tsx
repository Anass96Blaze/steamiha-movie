import Image from 'next/image';
import Link from 'next/link';
import { Play, Info } from 'lucide-react';
import type { TmdbMedia } from '@/lib/types';
import { imgUrl } from '@/lib/tmdb-server';
import { imdbSearchUrl, playerHref, streamUrlFor } from '@/lib/urls';

interface HeroProps {
  item: TmdbMedia | null;
  logoPath?: string;
  trailerKey?: string;
}

export default function Hero({ item, logoPath, trailerKey }: HeroProps) {
  if (!item) {
    return <div id="hero" className="home-hero" />;
  }

  const title = item.title || item.name || 'Untitled';
  const synopsis = item.overview || 'No synopsis available.';
  const rating = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) + '/10' : 'N/A';
  const type = (item.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
  const streamUrl = streamUrlFor(type, item.id);
  const backdrop = imgUrl(item.backdrop_path || item.poster_path, 'original');
  const logo = imgUrl(logoPath, 'w300');

  return (
    <div id="hero" className="home-hero">
      {trailerKey ? (
        <iframe
          title={`${title} trailer`}
          src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0&disablekb=1&loop=1&playlist=${trailerKey}`}
          allow="autoplay; encrypted-media"
          style={{ pointerEvents: 'none' }}
        />
      ) : backdrop ? (
        <Image
          className="hero-bg"
          src={backdrop}
          alt={title}
          fill
          sizes="100vw"
          priority
          style={{ objectFit: 'cover' }}
        />
      ) : null}

      <div className="home-hero-overlay">
        <div className="overlay-panel">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="overlay-logo" alt={`${title} logo`} src={logo} />
          ) : (
            <h1 className="overlay-title">{title}</h1>
          )}
          <div className="overlay-rating">Rating: {rating}</div>
          <p className="overlay-synopsis">{synopsis}</p>
          <div className="overlay-actions">
            <Link className="overlay-play-btn" href={playerHref(streamUrl)} aria-label="Open stream">
              <Play size={18} fill="currentColor" />
            </Link>
            <a
              className="overlay-btn secondary"
              href={imdbSearchUrl(title)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open IMDb"
            >
              <Info size={18} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
