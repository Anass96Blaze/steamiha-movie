export type MediaType = 'movie' | 'tv' | 'person' | 'all';

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMedia {
  id: number;
  media_type?: MediaType;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  logo_path?: string | null;
  profile_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
  genre_ids?: number[];
  season_number?: number;
  episode_number?: number;
}

export interface TmdbListResponse<T = TmdbMedia> {
  page?: number;
  results?: T[];
  total_pages?: number;
  total_results?: number;
}

export interface TmdbImage {
  file_path?: string;
  iso_639_1?: string | null;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
}

export interface TmdbCompany {
  id: number;
  name: string;
  logo_path?: string | null;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path?: string | null;
  popularity?: number;
  known_for?: TmdbMedia[];
  known_for_department?: string;
}
