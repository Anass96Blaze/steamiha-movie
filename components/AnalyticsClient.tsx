'use client';

import { useEffect } from 'react';

const SESSION_KEY = 'streamiha_analytics_session_id';

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function getSessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing && /^[a-zA-Z0-9_-]{8,80}$/.test(existing)) return existing;
    const created = 's_' + Date.now().toString(36) + '_' + randomId();
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return 's_' + Date.now().toString(36) + '_' + randomId();
  }
}

function detectSource(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('source') || params.get('utm_source') || '';
    if (p) return p;
  } catch {
    // ignore
  }
  try {
    if (!document.referrer) return 'direct';
    const ref = new URL(document.referrer);
    return ref.hostname || 'direct';
  } catch {
    return 'direct';
  }
}

function locationHints() {
  let timezone = '';
  let language = '';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    // ignore
  }
  try {
    language = navigator.language || '';
  } catch {
    // ignore
  }
  return { timezone, language };
}

function send(eventType: string, extra?: Record<string, unknown>): void {
  const payload = {
    session_id: getSessionId(),
    event_type: eventType,
    page: window.location.pathname + window.location.search,
    source: detectSource(),
    ...locationHints(),
    ...(extra || {})
  };
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics', blob);
      return;
    }
  } catch {
    // fallthrough
  }
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body,
    keepalive: true
  }).catch(() => {});
}

export default function AnalyticsClient() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === '1') return;
    send('page_view');
    const interval = window.setInterval(() => send('session_ping'), 60000);
    return () => window.clearInterval(interval);
  }, []);
  return null;
}
