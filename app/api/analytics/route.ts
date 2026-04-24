import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnalyticsEvent {
  session_id: string;
  event_type: string;
  page: string;
  source?: string;
  timezone?: string;
  language?: string;
  ts: number;
}

const events: AnalyticsEvent[] = [];
const MAX_EVENTS = 5000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const event: AnalyticsEvent = {
      session_id: String(body.session_id || ''),
      event_type: String(body.event_type || ''),
      page: String(body.page || ''),
      source: String(body.source || ''),
      timezone: String(body.timezone || ''),
      language: String(body.language || ''),
      ts: Date.now()
    };
    events.push(event);
    if (events.length > MAX_EVENTS) events.splice(0, events.length - MAX_EVENTS);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get('action') !== 'stats') {
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean));
  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const sessionPings = events.filter((e) => e.event_type === 'session_ping').length;
  const sources: Record<string, number> = {};
  const pages: Record<string, number> = {};
  events.forEach((e) => {
    if (e.source) sources[e.source] = (sources[e.source] || 0) + 1;
    if (e.page) pages[e.page] = (pages[e.page] || 0) + 1;
  });
  return NextResponse.json({
    total_events: events.length,
    unique_sessions: sessions.size,
    page_views: pageViews,
    session_pings: sessionPings,
    sources,
    pages,
    last_events: events.slice(-20)
  });
}
