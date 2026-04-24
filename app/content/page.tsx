import Link from 'next/link';
import { tmdbFetch, imgUrl } from '@/lib/tmdb-server';
import type { TmdbListResponse, TmdbMedia } from '@/lib/types';
import HeaderBrand from '@/components/HeaderBrand';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import { SearchModalProvider } from '@/components/SearchModalContext';
import { detailsHref } from '@/lib/urls';

export const revalidate = 300;

interface SP {
  mode?: string;
  provider?: string;
  company?: string;
  artist?: string;
  name?: string;
  media_type?: string;
}

async function loadByPlatform(provider: string, mediaType: string): Promise<TmdbMedia[]> {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  try {
    const data = await tmdbFetch<TmdbListResponse<TmdbMedia>>(`/discover/${type}`, {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_watch_providers: provider,
      watch_region: 'US',
      include_adult: false,
      page: 1
    });
    return (data.results || []).map((x) => ({ ...x, media_type: type as 'movie' | 'tv' }));
  } catch {
    return [];
  }
}

async function loadByCompany(company: string, mediaType: string): Promise<TmdbMedia[]> {
  const type = mediaType === 'tv' ? 'tv' : 'movie';
  try {
    const data = await tmdbFetch<TmdbListResponse<TmdbMedia>>(`/discover/${type}`, {
      language: 'en-US',
      sort_by: 'popularity.desc',
      with_companies: company,
      include_adult: false,
      page: 1
    });
    return (data.results || []).map((x) => ({ ...x, media_type: type as 'movie' | 'tv' }));
  } catch {
    return [];
  }
}

async function loadByArtist(artist: string): Promise<TmdbMedia[]> {
  try {
    const [movies, tv] = await Promise.all([
      tmdbFetch<{ cast?: TmdbMedia[] }>(`/person/${artist}/movie_credits`, { language: 'en-US' }),
      tmdbFetch<{ cast?: TmdbMedia[] }>(`/person/${artist}/tv_credits`, { language: 'en-US' })
    ]);
    const movieItems: TmdbMedia[] = (movies.cast || []).map((x) => ({ ...x, media_type: 'movie' }));
    const tvItems: TmdbMedia[] = (tv.cast || []).map((x) => ({ ...x, media_type: 'tv' }));
    const all: TmdbMedia[] = movieItems.concat(tvItems);
    return all.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  } catch {
    return [];
  }
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const mode = sp.mode || '';
  const mediaType = sp.media_type || 'all';
  const label = sp.name || 'Browse';

  let items: TmdbMedia[] = [];
  if (mode === 'platform' && sp.provider) items = await loadByPlatform(sp.provider, mediaType);
  else if (mode === 'company' && sp.company) items = await loadByCompany(sp.company, mediaType);
  else if (mode === 'artist' && sp.artist) items = await loadByArtist(sp.artist);

  return (
    <SearchModalProvider>
      <HeaderBrand />
      <SearchModal />
      <div id="app">
        <h1 style={{ marginTop: 80 }}>{label}</h1>
        <p style={{ color: '#94a3b8' }}>
          {mode ? `Mode: ${mode} • ${items.length} results` : 'Select a company, platform, or artist from the home page.'}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 16,
            margin: '20px 0 40px 0'
          }}
        >
          {items.map((item) => {
            const title = item.title || item.name || 'Untitled';
            const type = (item.media_type === 'tv' ? 'tv' : 'movie') as 'movie' | 'tv';
            const src = imgUrl(item.poster_path || item.backdrop_path, 'w500');
            return (
              <Link
                key={`${type}-${item.id}`}
                href={detailsHref(type, item.id)}
                style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', display: 'block' }}
              >
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 10, display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10, background: '#1f2937' }} />
                )}
                <div style={{ fontSize: 13, padding: '6px 4px', color: '#e2e8f0' }}>{title}</div>
              </Link>
            );
          })}
        </div>

        <Footer />
      </div>
    </SearchModalProvider>
  );
}
