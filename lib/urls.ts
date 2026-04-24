export function movieStreamUrl(id: number | string): string {
  const params = new URLSearchParams({
    color: '3b82f6',
    autoPlay: 'true',
    autoplay: '1',
    muted: '1'
  });
  return `https://www.vidking.net/embed/movie/${encodeURIComponent(String(id))}?${params.toString()}`;
}

export function tvStreamUrl(id: number | string, season = 1, episode = 1): string {
  const params = new URLSearchParams({
    color: '3b82f6',
    autoPlay: 'true',
    autoplay: '1',
    muted: '1',
    nextEpisode: 'true',
    episodeSelector: 'true'
  });
  return `https://www.vidking.net/embed/tv/${encodeURIComponent(String(id))}/${encodeURIComponent(String(season))}/${encodeURIComponent(String(episode))}?${params.toString()}`;
}

export function streamUrlFor(type: 'movie' | 'tv', id: number | string, season?: number, episode?: number): string {
  if (type === 'tv') return tvStreamUrl(id, season || 1, episode || 1);
  return movieStreamUrl(id);
}

export function detailsHref(type: 'movie' | 'tv', id: number | string): string {
  return `/details/${type}/${id}`;
}

export function playerHref(url: string): string {
  return `/player?src=${encodeURIComponent(url)}`;
}

export function imdbSearchUrl(title: string): string {
  return `https://www.imdb.com/find/?q=${encodeURIComponent(title)}`;
}
