'use client';

import MediaRow from './MediaRow';
import type { TmdbImage, TmdbMedia } from '@/lib/types';

export default function TopTenRow({
  rowId,
  title,
  items,
  logoMap,
  fallbackType
}: {
  rowId: string;
  title: string;
  items: TmdbMedia[];
  logoMap?: Map<number, TmdbImage[]>;
  fallbackType?: 'movie' | 'tv' | 'all';
}) {
  return (
    <MediaRow
      rowId={rowId}
      title={title}
      items={items.slice(0, 10)}
      ratio="2:3"
      withRanks
      logoMap={logoMap}
      fallbackType={fallbackType}
      headingOverride={
        <h2 className="top10-title reveal-on-scroll">
          <span className="top10-title-main">{title.toUpperCase()}</span>
        </h2>
      }
    />
  );
}
