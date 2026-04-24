import Link from 'next/link';
import HeaderBrand from '@/components/HeaderBrand';
import Footer from '@/components/Footer';
import SearchModal from '@/components/SearchModal';
import { SearchModalProvider } from '@/components/SearchModalContext';
import { movieStreamUrl, tvStreamUrl } from '@/lib/urls';

interface SP {
  src?: string;
  type?: string;
  id?: string;
  season?: string;
  episode?: string;
}

export default async function PlayerPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let url = sp.src || '';
  if (!url && sp.id && sp.type) {
    if (sp.type === 'tv') {
      url = tvStreamUrl(sp.id, Number(sp.season) || 1, Number(sp.episode) || 1);
    } else {
      url = movieStreamUrl(sp.id);
    }
  }

  return (
    <SearchModalProvider>
      <HeaderBrand />
      <SearchModal />
      <div style={{ width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', position: 'relative' }}>
        {url ? (
          <iframe
            src={url}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 0 }}
          />
        ) : (
          <div style={{ color: '#f8fafc', padding: 80, textAlign: 'center' }}>
            <p>No stream selected.</p>
            <Link href="/" style={{ color: '#93c5fd' }}>Back to home</Link>
          </div>
        )}
      </div>
      <Footer />
    </SearchModalProvider>
  );
}
