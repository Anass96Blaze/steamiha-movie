const PLATFORM_LOGOS: Record<string, string> = {
  netflix: '/logos/netflix.svg',
  'amazon prime video': '/logos/amazon-prime-video.svg',
  'disney plus': '/logos/disney.svg',
  'apple tv plus': '/logos/apple-tv.svg',
  hulu: '/logos/hulu.svg',
  max: '/logos/hbo-max.svg',
  crunchyroll: '/logos/crunchyroll.svg'
};

const PRODUCER_LOGOS: Record<string, string> = {
  'warner bros': '/logos/warner-bros.svg',
  'universal pictures': '/logos/universal-studios.svg',
  'paramount pictures': '/logos/paramount.svg',
  'columbia pictures': '/logos/columbia-pictures.svg',
  'marvel studios': '/logos/marvel.svg',
  pixar: '/logos/pixar.svg',
  'dreamworks pictures': '/logos/dreamworks.svg',
  'legendary pictures': '/logos/legendary.svg',
  lionsgate: '/logos/lionsgate.svg',
  'metro goldwyn mayer': '/logos/mgm.svg',
  'new line cinema': '/logos/new-line-cinema.svg',
  '20th century fox': '/logos/20th-century-fox.svg',
  illumination: '/logos/illumination.svg'
};

const ALIASES: Record<string, string> = {
  'prime video': 'amazon prime video',
  'amazon video': 'amazon prime video',
  disney: 'disney plus',
  'disney+': 'disney plus',
  'apple tv': 'apple tv plus',
  'apple tv+': 'apple tv plus',
  'hbo max': 'max',
  'warner bros pictures': 'warner bros',
  'warner brothers': 'warner bros',
  'universal studios': 'universal pictures',
  paramount: 'paramount pictures',
  mgm: 'metro goldwyn mayer'
};

const ALL_LOGOS: Record<string, string> = { ...PLATFORM_LOGOS, ...PRODUCER_LOGOS };

export function normalizeName(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
}

export function resolveLocalBrandLogo(name: string): string {
  const key = normalizeName(name);
  const canonical = ALIASES[key] || key;
  return ALL_LOGOS[canonical] || '';
}

export function hasLocalBrandLogo(name: string): boolean {
  return !!resolveLocalBrandLogo(name);
}

export const LOCAL_PLATFORM_LOGOS = PLATFORM_LOGOS;
export const LOCAL_PRODUCER_LOGOS = PRODUCER_LOGOS;
