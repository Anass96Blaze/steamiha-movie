import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { tmdbFetch, imgUrl } from '@/lib/tmdb-server';
import type { TmdbMedia } from '@/lib/types';
import { playerHref, streamUrlFor, imdbSearchUrl } from '@/lib/urls';
import HeaderBrand from '@/components/HeaderBrand';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import { SearchModalProvider } from '@/components/SearchModalContext';

export const revalidate = 300;

interface Params {
  type: string;
  id: string;
}

export default async function DetailsPage({ params }: { params: Promise<Params> }) {
  const { type, id } = await params;
  if (type !== 'movie' && type !== 'tv') notFound();

  let data: TmdbMedia | null = null;
  try {
    data = await tmdbFetch<TmdbMedia>(`/${type}/${id}`, { language: 'en-US' });
  } catch {
    // ignore
  }
  if (!data) notFound();

  const title = data.title || data.name || 'Untitled';
  const backdrop = imgUrl(data.backdrop_path || data.poster_path, 'original');
  const poster = imgUrl(data.poster_path, 'w500');
  const rating = typeof data.vote_average === 'number' ? data.vote_average.toFixed(1) + '/10' : 'N/A';
  const stream = streamUrlFor(type as 'movie' | 'tv', id);

  return (
    <SearchModalProvider>
      <HeaderBrand />
      <SearchModal />
      <div id="app">
        <div className="home-hero" style={{ height: '60vh' }}>
          {backdrop ? (
            <Image className="hero-bg" src={backdrop} alt={title} fill sizes="100vw" priority style={{ objectFit: 'cover' }} />
          ) : null}
          <div className="home-hero-overlay">
            <div className="overlay-panel">
              <h1 className="overlay-title">{title}</h1>
              <div className="overlay-rating">Rating: {rating}</div>
              <p className="overlay-synopsis">{data.overview || ''}</p>
              <div className="overlay-actions">
                <Link className="overlay-play-btn" href={playerHref(stream)}>▶</Link>
                <a className="overlay-btn secondary" href={imdbSearchUrl(title)} target="_blank" rel="noopener noreferrer">i</a>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt={title} style={{ width: 220, height: 'auto', borderRadius: 12 }} />
          ) : null}
          <div style={{ flex: 1, minWidth: 300 }}>
            <h1 style={{ marginTop: 0 }}>{title}</h1>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{data.overview}</p>
            <p style={{ color: '#94a3b8', fontSize: 13 }}>
              {type === 'tv' ? `First air date: ${data.first_air_date || 'N/A'}` : `Release date: ${data.release_date || 'N/A'}`}
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </SearchModalProvider>
  );
}
