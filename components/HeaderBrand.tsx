'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { useSearchModal } from './SearchModalContext';

export default function HeaderBrand() {
  const [scrolled, setScrolled] = useState(false);
  const { openSearch, openStarred } = useSearchModal();

  useEffect(() => {
    const sync = () => setScrolled((window.scrollY || 0) > 12);
    sync();
    window.addEventListener('scroll', sync, { passive: true });
    return () => window.removeEventListener('scroll', sync);
  }, []);

  return (
    <>
      <Link className={'app-brand' + (scrolled ? ' is-scrolled' : '')} href="/" aria-label="Streamiha home">
        <Image className="app-brand-logo" src="/logo.png" alt="Streamiha logo" width={28} height={28} priority />
        <span className="app-brand-name">STREAMIHA</span>
      </Link>
      <button type="button" className="star-open-btn" aria-label="Open starred" onClick={() => openStarred()}>
        <Star size={20} fill="currentColor" strokeWidth={1.5} />
      </button>
      <button type="button" className="search-open-btn" aria-label="Open search" onClick={() => openSearch()}>
        <Search size={20} />
      </button>
    </>
  );
}
