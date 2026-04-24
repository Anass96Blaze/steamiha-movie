import { tmdbFetch } from '@/lib/tmdb-server';
import type { TmdbImage, TmdbListResponse, TmdbMedia, TmdbVideo } from '@/lib/types';
import HeaderBrand from '@/components/HeaderBrand';
import Hero from '@/components/Hero';
import MediaRow from '@/components/MediaRow';
import TopTenRail from '@/components/TopTenRail';
import ContinueWatching from '@/components/ContinueWatching';
import GenreSection from '@/components/GenreSection';
import DiscoverSections from '@/components/DiscoverSections';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import { SearchModalProvider } from '@/components/SearchModalContext';
import RevealObserver from '@/components/RevealObserver';

export const revalidate = 300;

function monthRange(): { gte: string; lte: string } {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const first = new Date(Date.UTC(y, m, 1));
  const last = new Date(Date.UTC(y, m + 1, 0));
  const toStr = (d: Date) => d.toISOString().slice(0, 10);
  return { gte: toStr(first), lte: toStr(last) };
}

function pickLogo(logos: TmdbImage[] | undefined): string {
  if (!logos || !logos.length) return '';
  const en = logos.find((x) => x.iso_639_1 === 'en' && x.file_path);
  if (en?.file_path) return en.file_path;
  const any = logos.find((x) => x.file_path);
  return any?.file_path || '';
}

async function fetchImagesMap(type: 'movie' | 'tv', ids: number[]): Promise<Map<number, TmdbImage[]>> {
  const map = new Map<number, TmdbImage[]>();
  await Promise.all(ids.map(async (id) => {
    try {
      const d = await tmdbFetch<{ logos?: TmdbImage[] }>(`/${type}/${id}/images`);
      map.set(id, d.logos || []);
    } catch {
      map.set(id, []);
    }
  }));
  return map;
}

async function pickTrailer(items: TmdbMedia[]): Promise<{ item: TmdbMedia | null; key: string }> {
  for (const item of items) {
    if (item.media_type !== 'movie' && item.media_type !== 'tv') continue;
    try {
      const d = await tmdbFetch<{ results?: TmdbVideo[] }>(`/${item.media_type}/${item.id}/videos`, { language: 'en-US' });
      const videos = d.results || [];
      const key =
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official)?.key ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer')?.key ||
        videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser')?.key ||
        '';
      if (key) return { item, key };
    } catch {
      // continue
    }
  }
  return { item: items[0] || null, key: '' };
}

export default async function HomePage() {
  let today: TmdbListResponse<TmdbMedia> = { results: [] };
  let cinema: TmdbListResponse<TmdbMedia> = { results: [] };
  let month: TmdbListResponse<TmdbMedia> = { results: [] };
  let tvAll: TmdbListResponse<TmdbMedia> = { results: [] };
  let movieAll: TmdbListResponse<TmdbMedia> = { results: [] };

  const range = monthRange();
  try {
    [today, cinema, month, tvAll, movieAll] = await Promise.all([
      tmdbFetch<TmdbListResponse<TmdbMedia>>('/trending/all/day'),
      tmdbFetch<TmdbListResponse<TmdbMedia>>('/movie/now_playing', { language: 'en-US', page: 1, region: 'US' }),
      tmdbFetch<TmdbListResponse<TmdbMedia>>('/discover/movie', {
        language: 'en-US',
        sort_by: 'popularity.desc',
        include_adult: false,
        include_video: false,
        page: 1,
        'primary_release_date.gte': range.gte,
        'primary_release_date.lte': range.lte
      }),
      tmdbFetch<TmdbListResponse<TmdbMedia>>('/tv/top_rated', { language: 'en-US', page: 1 }),
      tmdbFetch<TmdbListResponse<TmdbMedia>>('/movie/top_rated', { language: 'en-US', page: 1 })
    ]);
  } catch {
    // fallback: render empty-ish page
  }

  const todayTop = (today.results || []).filter((x) => x.media_type === 'movie' || x.media_type === 'tv').slice(0, 10);
  const cinemaTop = (cinema.results || []).slice(0, 10).map((x) => ({ ...x, media_type: 'movie' as const }));
  const monthTop = (month.results || []).slice(0, 10).map((x) => ({ ...x, media_type: 'movie' as const }));
  const tvTop = (tvAll.results || []).slice(0, 10).map((x) => ({ ...x, media_type: 'tv' as const }));
  const movieTop = (movieAll.results || []).slice(0, 10).map((x) => ({ ...x, media_type: 'movie' as const }));

  const movieIds = Array.from(new Set(
    [...cinemaTop, ...monthTop, ...movieTop, ...todayTop.filter((x) => x.media_type === 'movie')]
      .map((x) => x.id)
      .filter(Boolean)
  ));
  const tvIds = Array.from(new Set(
    [...tvTop, ...todayTop.filter((x) => x.media_type === 'tv')]
      .map((x) => x.id)
      .filter(Boolean)
  ));

  const [movieLogos, tvLogos] = await Promise.all([
    fetchImagesMap('movie', movieIds),
    fetchImagesMap('tv', tvIds)
  ]);

  const todayLogoMap = new Map<number, TmdbImage[]>();
  todayTop.forEach((item) => {
    if (item.media_type === 'movie') todayLogoMap.set(item.id, movieLogos.get(item.id) || []);
    else if (item.media_type === 'tv') todayLogoMap.set(item.id, tvLogos.get(item.id) || []);
  });

  const heroPick = await pickTrailer(todayTop);
  const heroItem = heroPick.item;
  const heroLogoPath = heroItem
    ? pickLogo(heroItem.media_type === 'movie' ? movieLogos.get(heroItem.id) : tvLogos.get(heroItem.id))
    : '';

  return (
    <SearchModalProvider>
      <HeaderBrand />
      <SearchModal />
      <div id="app">
        <Hero item={heroItem} logoPath={heroLogoPath} trailerKey={heroPick.key} />

        <ContinueWatching />

        <TopTenRail rowId="section-today" title="Top 10" subtitle="Trending today" items={todayTop} logoMap={todayLogoMap} fallbackType="all" />

        <MediaRow rowId="section-cinema" title="Top 10 In Cinema Now" items={cinemaTop} ratio="3:2" logoMap={movieLogos} fallbackType="movie" />
        <MediaRow rowId="section-month" title="Top 10 Release This Month" items={monthTop} ratio="3:2" logoMap={movieLogos} fallbackType="movie" />
        <MediaRow rowId="section-tv" title="Top 10 TV Show of All Time" items={tvTop} ratio="3:2" logoMap={tvLogos} fallbackType="tv" />
        <MediaRow rowId="section-movies" title="Top 10 Movies of All Time" items={movieTop} ratio="3:2" logoMap={movieLogos} fallbackType="movie" />

        <GenreSection />

        <DiscoverSections />

        <Footer />
      </div>
      <RevealObserver />
    </SearchModalProvider>
  );
}
