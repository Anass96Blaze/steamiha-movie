import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-main">
        <Image className="site-footer-logo" src="/logo.png" alt="Streamiha logo" width={22} height={22} />
        <div className="site-footer-text">
          Streamiha is a site player only and does not host or store any video content on its servers. We comply with the{' '}
          <a href="https://www.dmca.com/" target="_blank" rel="noopener noreferrer">DMCA</a> and respect copyright holders' rights.
        </div>
      </div>
      <div className="site-footer-credit">
        <span>Credit </span>
        <Link className="site-footer-credit-heart" href="/analytics" aria-label="Open analytics">
          <Heart size={14} fill="currentColor" style={{ verticalAlign: 'middle' }} />
        </Link>
        <span> Anass.B</span>
      </div>
    </footer>
  );
}
