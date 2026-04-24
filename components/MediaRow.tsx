import ScrollRow from './ScrollRow';
import MediaCard, { Ratio } from './MediaCard';
import type { TmdbImage, TmdbMedia } from '@/lib/types';

interface MediaRowProps {
  rowId: string;
  title: string;
  items: TmdbMedia[];
  ratio: Ratio;
  logoMap?: Map<number, TmdbImage[]>;
  fallbackType?: 'movie' | 'tv' | 'all';
  continueMode?: boolean;
  withRanks?: boolean;
  titleClassName?: string;
  headingOverride?: React.ReactNode;
}

export default function MediaRow({
  rowId,
  title,
  items,
  ratio,
  logoMap,
  fallbackType,
  continueMode,
  withRanks,
  titleClassName,
  headingOverride
}: MediaRowProps) {
  if (!items || !items.length) return null;

  return (
    <>
      {headingOverride ?? (
        <h2 className={['reveal-on-scroll', titleClassName].filter(Boolean).join(' ')}>{title}</h2>
      )}
      <ScrollRow rowId={rowId} sectionLabel={title}>
        {items.map((item, idx) => (
          <td key={`${item.media_type || fallbackType}-${item.id}-${idx}`} className="clickable">
            <MediaCard
              item={item}
              ratio={ratio}
              rank={withRanks ? idx + 1 : undefined}
              logoMap={logoMap}
              fallbackType={fallbackType}
              continueMode={continueMode}
            />
          </td>
        ))}
      </ScrollRow>
    </>
  );
}
