'use client';

import Link from 'next/link';
import ScrollRow from './ScrollRow';
import { imgUrl } from '@/lib/tmdb-server';
import { resolveLocalBrandLogo } from '@/lib/logos';

export interface LogoRowItem {
  id: number;
  name: string;
  logo_path?: string;
  profile_path?: string;
  provider_id?: number;
  provider_name?: string;
  href: string;
}

interface LogoRowProps {
  rowId: string;
  title: string;
  items: LogoRowItem[];
  artistMode?: boolean;
}

export default function LogoRow({ rowId, title, items, artistMode }: LogoRowProps) {
  if (!items.length) return null;
  return (
    <>
      <h2 className="reveal-on-scroll">{title}</h2>
      <ScrollRow rowId={rowId} sectionLabel={title}>
        {items.map((item) => {
          const displayName = item.provider_name || item.name || 'logo';
          const local = artistMode ? '' : resolveLocalBrandLogo(displayName);
          const fallbackSrc = imgUrl(item.logo_path || item.profile_path || '', 'w500');
          const src = local || fallbackSrc;
          return (
            <td key={item.id + ':' + displayName} className="clickable">
              <Link href={item.href} style={{ display: 'block' }}>
                <div className="logo-tile">
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      className="logo-tile-img"
                      alt={`${displayName} logo`}
                      src={src}
                      draggable={false}
                      style={local ? { filter: 'brightness(0) invert(1)' } : undefined}
                    />
                  ) : (
                    <div className="logo-tile-img" />
                  )}
                </div>
              </Link>
            </td>
          );
        })}
      </ScrollRow>
    </>
  );
}
