'use client';

import { useEffect } from 'react';

export default function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(document.querySelectorAll('.reveal-on-scroll')) as HTMLElement[];
    if (reduce || !('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  });
  return null;
}
