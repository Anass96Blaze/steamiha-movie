import type { Metadata, Viewport } from 'next';
import './globals.css';
import AnalyticsClient from '@/components/AnalyticsClient';

export const metadata: Metadata = {
  title: 'Streamiha',
  description: 'Streaming discovery for movies and TV shows.',
  icons: { icon: '/logo.png' }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var ATTRS=['data-abacus-ext'];function strip(root){if(!root)return;ATTRS.forEach(function(a){if(root.hasAttribute&&root.hasAttribute(a))root.removeAttribute(a);});}function stripAll(){strip(document.documentElement);strip(document.body);}try{stripAll();var mo=new MutationObserver(function(muts){for(var i=0;i<muts.length;i++){var m=muts[i];if(m.type==='attributes'&&ATTRS.indexOf(m.attributeName)!==-1){strip(m.target);}}});mo.observe(document.documentElement,{attributes:true,subtree:true,attributeFilter:ATTRS});document.addEventListener('DOMContentLoaded',stripAll,{once:true});setTimeout(function(){mo.disconnect();},8000);}catch(e){}})();`
          }}
        />
      </head>
      <body data-abacus-ext="true" suppressHydrationWarning>
        {children}
        <AnalyticsClient />
      </body>
    </html>
  );
}
