import { NextResponse } from 'next/server';

// Station status API for Unionville GO on the Stouffville line (service 71, station UI)
const TRACKER_URL =
  'https://www.gotracker.ca/GoTracker/web/GODataAPIProxy.svc/StationStatusJSON/Service/StationCd/Lang/71/UI/en-us';

export interface TrackerTrip {
  /** "HH:MM" — departure from Unionville (Inbound/SB) OR arrival at Unionville (Outbound/NB) */
  scheduledTime: string;
  /** "Inbound" = Southbound (Unionville → Union = homeToOffice) */
  directionCd: 'Inbound' | 'Outbound';
  /** Platform number at Unionville GO, e.g. "2" or "3" */
  platform: string;
  /** "On Time", "Delayed", "Cancelled", or delay text */
  expected: string;
  /** Delay in minutes */
  delay: number;
  /** True if train is cancelled */
  cancelled: boolean;
  /** Trip number */
  tripNumber: string;
  /** Final destination station */
  destination: string;
  /** Human-readable time until arrival at Unionville, e.g. "39 minutes" */
  arriveIn: string;
}

export interface TrackerResponse {
  trips: TrackerTrip[];
  available: boolean;
  lastUpdated: string | null;
  error?: string;
}

export async function GET(): Promise<NextResponse<TrackerResponse>> {
  const cacheHeaders = {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
  };

  try {
    const res = await fetch(TRACKER_URL, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
        Accept: 'text/xml, application/xml, */*',
        Referer: 'https://www.gotracker.ca/gotracker/web/',
        'Accept-Language': 'en-CA,en;q=0.9',
      },
      // Next.js fetch cache — re-validate every 30 seconds
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { trips: [], available: false, lastUpdated: null, error: `HTTP ${res.status}` },
        { headers: cacheHeaders }
      );
    }

    const xml = await res.text();

    // Response is XML: <?xml ...><ReturnStringValue ...><Data>{json}</Data></ReturnStringValue>
    const dataMatch = xml.match(/<Data>([\s\S]*?)<\/Data>/);
    if (!dataMatch) {
      return NextResponse.json(
        { trips: [], available: false, lastUpdated: null, error: 'No <Data> in response' },
        { headers: cacheHeaders }
      );
    }

    const data = JSON.parse(dataMatch[1]) as { TripStatus?: RawTrip[] };
    const rawTrips: RawTrip[] = data.TripStatus ?? [];

    const trips: TrackerTrip[] = rawTrips.map((t) => ({
      scheduledTime: t.ScheduledTime ?? '',
      directionCd: (t.DirectionCd === 'Inbound' ? 'Inbound' : 'Outbound') as TrackerTrip['directionCd'],
      platform: t.Track ?? '',
      expected: t.Expected ?? '',
      delay: Number(t.Delay ?? 0),
      cancelled: Boolean(t.TripCancelled),
      tripNumber: t.TripNumber ?? '',
      destination: t.Destination ?? '',
      arriveIn: t.ArriveIn ?? '',
    }));

    return NextResponse.json(
      { trips, available: true, lastUpdated: new Date().toISOString() },
      { headers: cacheHeaders }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { trips: [], available: false, lastUpdated: null, error: message },
      { headers: cacheHeaders }
    );
  }
}

// Raw shape from gotracker.ca JSON (inside XML <Data>)
interface RawTrip {
  RowIndex?: number;
  TripNumber?: string;
  Expected?: string;
  Direction?: string;
  DirectionCd?: string;
  ScheduledTime?: string;
  Track?: string;
  Delay?: number;
  DelaySec?: number;
  DelayDesc?: string;
  TripCancelled?: boolean;
  Destination?: string;
  ArriveIn?: string;
  StoppingAt?: string;
}
