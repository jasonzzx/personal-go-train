'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  scheduleData,
  getServiceType,
  timeToMinutes,
  SCHEDULE_EFFECTIVE_DATE,
  type Direction,
  type Trip,
} from '@/lib/schedule-data';
import type { ParsedAlert } from '@/app/api/alerts/route';
import type { TrackerTrip } from '@/app/api/tracker/route';

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function getDefaultDate(): string {
  return toLocalDateStr(new Date());
}

function getTomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalDateStr(d);
}

function getDefaultDirection(): Direction {
  return new Date().getHours() < 12 ? 'homeToOffice' : 'officeToHome';
}

function parseTime(time: string): number {
  return timeToMinutes(time);
}

// ──────────────────────────────────────────────────────────
// Alert matching helpers
// ──────────────────────────────────────────────────────────

function buildAlertMap(alerts: ParsedAlert[], direction: Direction): Map<string, ParsedAlert[]> {
  const map = new Map<string, ParsedAlert[]>();
  for (const alert of alerts) {
    if (!alert.scheduledDeparture) continue;
    if (alert.direction !== 'both') {
      const expected = direction === 'officeToHome' ? 'northbound' : 'southbound';
      if (alert.direction !== expected) continue;
    }
    const key = alert.scheduledDeparture;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(alert);
  }
  return map;
}

// ──────────────────────────────────────────────────────────
// Tracker lookup helpers
// ──────────────────────────────────────────────────────────

interface TrackerInfo {
  platform: string;
  expected: string;
  delay: number;
  cancelled: boolean;
  arriveIn: string;
}

/**
 * Build lookup maps from tracker trips:
 *  inbound  (Inbound/SB)  key = ScheduledTime = departure from Unionville → match trip.departure
 *  outbound (Outbound/NB) key = ScheduledTime = arrival  at  Unionville → match trip.arrival
 */
function buildTrackerMaps(trips: TrackerTrip[]): {
  inbound: Map<string, TrackerInfo>;
  outbound: Map<string, TrackerInfo>;
} {
  const inbound = new Map<string, TrackerInfo>();
  const outbound = new Map<string, TrackerInfo>();
  for (const t of trips) {
    const info: TrackerInfo = {
      platform: t.platform,
      expected: t.expected,
      delay: t.delay,
      cancelled: t.cancelled,
      arriveIn: t.arriveIn,
    };
    if (t.directionCd === 'Inbound') {
      inbound.set(t.scheduledTime, info);
    } else {
      outbound.set(t.scheduledTime, info);
    }
  }
  return { inbound, outbound };
}

function getTrackerInfo(
  trip: { departure: string; arrival: string },
  direction: Direction,
  inbound: Map<string, TrackerInfo>,
  outbound: Map<string, TrackerInfo>
): TrackerInfo | null {
  if (direction === 'homeToOffice') return inbound.get(trip.departure) ?? null;
  return outbound.get(trip.arrival) ?? null;
}

// ──────────────────────────────────────────────────────────
// Icons
// ──────────────────────────────────────────────────────────

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────
// Service Alerts Sheet
// ──────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: ParsedAlert }) {
  const isDelay = alert.title.toLowerCase().includes('delay');
  const isCancel = alert.title.toLowerCase().includes('cancel');
  const borderColor = isCancel ? 'border-red-500' : isDelay ? 'border-amber-500' : 'border-blue-400';
  const iconBg = isCancel ? 'bg-red-100 text-red-600' : isDelay ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600';

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${borderColor} p-4 mb-3`}>
      {/* Title */}
      <div className="flex items-start gap-2 mb-2">
        <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${iconBg}`}>
          {isCancel ? '✕' : '!'}
        </span>
        <span className="font-semibold text-gray-900 text-sm leading-snug">{alert.title}</span>
      </div>

      {/* Route */}
      {(alert.fromStation || alert.toStation) && (
        <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5 ml-7">
          <span className="font-medium text-gray-800">{alert.fromStation}</span>
          <ArrowRightIcon className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="font-medium text-gray-800">{alert.toStation}</span>
          {alert.direction !== 'both' && (
            <span className="ml-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 border border-gray-300 rounded px-1 py-0.5">
              {alert.direction === 'northbound' ? '↑ NB' : '↓ SB'}
            </span>
          )}
        </div>
      )}

      {/* Schedule */}
      {alert.scheduledDeparture && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1.5 ml-7">
          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Scheduled:{' '}
            <span className="font-mono font-semibold text-gray-800">{alert.scheduledDeparture}</span>
            {alert.scheduledArrival && (
              <>
                {' – '}
                <span className="font-mono font-semibold text-gray-800">{alert.scheduledArrival}</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Status */}
      {alert.status && (
        <div className="flex items-center gap-1.5 text-sm mb-1.5 ml-7">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              alert.status.toLowerCase() === 'stopped' ? 'bg-red-500' :
              alert.status.toLowerCase() === 'moving' ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          <span className="text-gray-600">
            Status: <span className="font-medium text-gray-800">{alert.status}</span>
          </span>
        </div>
      )}

      {/* Reason */}
      {alert.reason && (
        <div className="text-sm text-gray-500 ml-7 leading-relaxed">
          <span className="text-gray-400">Reason: </span>{alert.reason}
        </div>
      )}
    </div>
  );
}

function ServiceAlertsSheet({
  alerts,
  loading,
  available,
  lastUpdated,
  onClose,
}: {
  alerts: ParsedAlert[];
  loading: boolean;
  available: boolean;
  lastUpdated: string | null;
  onClose: () => void;
}) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md flex flex-col bg-gray-50 rounded-t-2xl max-h-[90vh]"
        style={{ boxShadow: '0 -4px 30px rgba(0,0,0,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-10 h-1 bg-white/40 rounded-full" />

        {/* Sheet header — GO dark green, matching app header */}
        <div className="bg-go-dark text-white px-4 pt-6 pb-4 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            {/* ST line badge */}
            <div
              className="w-11 h-11 rounded-xl flex flex-col items-center justify-center font-extrabold text-white shrink-0"
              style={{ backgroundColor: '#794500' }}
            >
              <span className="text-xs leading-none">ST</span>
            </div>
            <div>
              <div className="font-bold text-base leading-tight">Stouffville Line</div>
              <div className="text-white/60 text-xs">Service Updates</div>
            </div>
            <button
              onClick={onClose}
              className="ml-auto w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pt-4 pb-2">
          {loading ? (
            /* Loading state */
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-go-green border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">Loading service updates…</span>
            </div>
          ) : !available ? (
            /* API unavailable */
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3 text-center">
              <div className="text-gray-400 text-2xl mb-2">📡</div>
              <div className="text-sm font-medium text-gray-700 mb-1">Live data unavailable</div>
              <div className="text-xs text-gray-500">Check the official GO Transit website for current alerts.</div>
            </div>
          ) : alerts.length === 0 ? (
            /* Good service */
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-8 h-8 text-go-green shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Good Service</div>
                  <div className="text-xs text-gray-500 mt-0.5">No active alerts on Stouffville line</div>
                </div>
              </div>
            </div>
          ) : (
            /* Alert cards */
            alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)
          )}

          {/* Static special notice (always relevant) */}
          {!loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-go-light flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-go-green text-xs font-bold">i</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800 mb-1">Special service Jun 10 – Jul 5</div>
                  <div className="text-xs text-gray-600 leading-relaxed">
                    Extra weekday trip added: Unionville GO{' '}
                    <span className="font-mono font-semibold">16:36</span> → Union Station{' '}
                    <span className="font-mono font-semibold">17:17</span> (FIFA World Cup 2026).
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-6 border-t border-gray-200 bg-white rounded-none shrink-0">
          <a
            href="https://www.gotransit.com/en/service-updates?mode=t&code=ST"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-go-green text-white font-semibold py-3 rounded-xl text-sm"
          >
            View on gotransit.com
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {formattedTime && (
            <div className="text-center text-xs text-gray-400 mt-2">
              Last updated {formattedTime}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Train card
// ──────────────────────────────────────────────────────────

function TrackerRow({
  tracker,
  isPast,
  isNext,
}: {
  tracker: TrackerInfo;
  isPast: boolean;
  isNext: boolean;
}) {
  // Platform badge — always yellow
  const platformBadge = tracker.platform ? (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
      isNext ? 'bg-yellow-400/25' : isPast ? 'bg-yellow-100/60' : 'bg-yellow-400'
    }`}>
      <div className="flex flex-col items-center leading-none">
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${
          isNext ? 'text-yellow-200' : isPast ? 'text-yellow-600/60' : 'text-yellow-900'
        }`}>
          Platform
        </span>
        <span className={`text-2xl font-extrabold leading-none mt-0.5 ${
          isNext ? 'text-yellow-300' : isPast ? 'text-yellow-700/50' : 'text-yellow-900'
        }`}>
          {tracker.platform}
        </span>
      </div>
    </div>
  ) : null;

  // Expected badge — same height/padding as platform badge
  const expectedBadge = !isPast && tracker.expected ? (() => {
    if (tracker.cancelled) {
      return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
          isNext ? 'bg-red-500/25' : 'bg-red-100'
        }`}>
          <span className="text-base leading-none">✕</span>
          <div className="flex flex-col leading-none">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              isNext ? 'text-red-200' : 'text-red-500'
            }`}>Status</span>
            <span className={`text-base font-extrabold leading-none mt-0.5 ${
              isNext ? 'text-red-200' : 'text-red-600'
            }`}>Cancelled</span>
          </div>
        </div>
      );
    }
    if (tracker.delay > 0) {
      return (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
          isNext ? 'bg-orange-400/25' : 'bg-orange-100'
        }`}>
          <span className="text-base leading-none">⚠</span>
          <div className="flex flex-col leading-none">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              isNext ? 'text-orange-200' : 'text-orange-600'
            }`}>Delayed</span>
            <span className={`text-base font-extrabold leading-none mt-0.5 ${
              isNext ? 'text-orange-200' : 'text-orange-700'
            }`}>+{tracker.delay} min</span>
          </div>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
        isNext ? 'bg-white/20' : 'bg-green-100'
      }`}>
        <span className="text-base leading-none">✓</span>
        <div className="flex flex-col leading-none">
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${
            isNext ? 'text-white/70' : 'text-green-600'
          }`}>Expected</span>
          <span className={`text-base font-extrabold leading-none mt-0.5 ${
            isNext ? 'text-white/90' : 'text-green-700'
          }`}>On Time</span>
        </div>
      </div>
    );
  })() : null;

  if (!platformBadge && !expectedBadge) return null;

  return (
    <div className={`flex items-center gap-2 mt-2 pt-2 ${
      isNext ? 'border-t border-white/20' : 'border-t border-gray-100'
    }`}>
      {platformBadge}
      {expectedBadge}
    </div>
  );
}

function TrainCard({
  trip,
  isNext,
  isPast,
  alerts,
  tracker,
  onAlertClick,
}: {
  trip: Trip;
  isNext: boolean;
  isPast: boolean;
  alerts: ParsedAlert[];
  tracker: TrackerInfo | null;
  onAlertClick: () => void;
}) {
  const hasAlert = alerts.length > 0;

  return (
    <div className={`
      relative rounded-xl px-4 pt-3 pb-3 mb-2 transition-all
      ${isNext
        ? 'bg-go-green shadow-md shadow-go-green/30 text-white'
        : isPast
        ? 'bg-white/60 text-gray-400'
        : 'bg-white text-gray-800 shadow-sm'}
    `}>
      {isNext && (
        <span className="absolute -top-2 left-4 text-[10px] font-bold uppercase tracking-widest bg-go-accent text-white px-2 py-0.5 rounded-full">
          Next
        </span>
      )}

      {/* Times row */}
      <div className="flex items-center">
        {/* Departure */}
        <div className="flex-1">
          <div className={`text-2xl font-bold leading-none ${isNext ? 'text-white' : 'text-go-dark'}`}>
            {trip.departure}
          </div>
          <div className={`text-xs mt-0.5 ${isNext ? 'text-white/75' : 'text-gray-500'}`}>depart</div>
        </div>

        {/* Center arrow */}
        <div className="flex flex-col items-center px-3 gap-1">
          <div className={`text-xs font-medium ${isNext ? 'text-white/80' : 'text-gray-400'}`}>
            {trip.tripTime}
          </div>
          <div className="flex items-center gap-1">
            <div className={`h-px w-8 ${isNext ? 'bg-white/50' : 'bg-gray-200'}`} />
            <ArrowRightIcon className={`w-3 h-3 ${isNext ? 'text-white/70' : 'text-gray-300'}`} />
          </div>
        </div>

        {/* Arrival */}
        <div className="flex-1 text-right">
          <div className={`text-2xl font-bold leading-none ${isNext ? 'text-white' : 'text-go-dark'}`}>
            {trip.arrival}
          </div>
          <div className={`text-xs mt-0.5 ${isNext ? 'text-white/75' : 'text-gray-500'}`}>arrive</div>
        </div>

        {/* Alert badge */}
        {hasAlert && (
          <button
            onClick={(e) => { e.stopPropagation(); onAlertClick(); }}
            className={`
              ml-2 shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
              transition-transform active:scale-95
              ${isNext ? 'bg-white/20 hover:bg-white/30' : 'bg-amber-100 hover:bg-amber-200'}
            `}
            title="Service alert – tap for details"
          >
            ⚠️
          </button>
        )}
      </div>

      {/* Tracker row: platform + expected */}
      {tracker && (
        <TrackerRow tracker={tracker} isPast={isPast} isNext={isNext} />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Weekend notice
// ──────────────────────────────────────────────────────────

function WeekendNotice({ direction }: { direction: Direction }) {
  const href = direction === 'homeToOffice'
    ? 'https://www.gotransit.com/en/see-schedules?tripPoint=36888&departure=UI&destination=UN&transfers=true'
    : 'https://www.gotransit.com/en/see-schedules?tripPoint=86388&departure=UN&destination=UI&transfers=true';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-go-light flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-go-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-go-dark font-semibold text-lg mb-2">Weekend Schedule</h3>
      <p className="text-gray-500 text-sm mb-4">
        Weekend data not yet embedded.<br />
        View it on the official GO Transit website.
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-go-green text-white font-semibold px-5 py-2.5 rounded-full text-sm"
      >
        See Weekend Schedule
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(getDefaultDate);
  const [direction, setDirection] = useState<Direction>(getDefaultDirection);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);
  const [todayStr, setTodayStr] = useState<string>('');

  // Tracker state (platform + expected)
  const [trackerTrips, setTrackerTrips] = useState<TrackerTrip[]>([]);

  // Alerts state
  const [alerts, setAlerts] = useState<ParsedAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertsAvailable, setAlertsAvailable] = useState(false);
  const [alertsLastUpdated, setAlertsLastUpdated] = useState<string | null>(null);
  const [showAlertsSheet, setShowAlertsSheet] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clock tick
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
      setTodayStr(toLocalDateStr(now));
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch tracker (platform + expected) every 30 seconds
  const fetchTracker = useCallback(async () => {
    try {
      const res = await fetch('/api/tracker');
      if (!res.ok) return;
      const data = await res.json();
      setTrackerTrips(data.trips ?? []);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchTracker();
    const id = setInterval(fetchTracker, 30_000);
    return () => clearInterval(id);
  }, [fetchTracker]);

  // Fetch alerts every 5 min
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlerts(data.alerts ?? []);
      setAlertsAvailable(data.available ?? false);
      if (data.lastUpdated) setAlertsLastUpdated(data.lastUpdated);
    } catch {
      setAlertsAvailable(false);
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Manual refresh — both tracker + alerts simultaneously
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTracker(), fetchAlerts()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, fetchTracker, fetchAlerts]);

  const serviceType = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return getServiceType(new Date(y, m - 1, d));
  }, [selectedDate]);

  const trips: Trip[] = useMemo(
    () => scheduleData[direction][serviceType] ?? [],
    [direction, serviceType]
  );

  const isToday = selectedDate === todayStr;

  const nextIndex = useMemo(() => {
    if (!isToday || nowMinutes === null) return -1;
    return trips.findIndex((t) => parseTime(t.departure) >= nowMinutes);
  }, [trips, isToday, nowMinutes]);

  const alertMap = useMemo(
    () => buildAlertMap(alerts, direction),
    [alerts, direction]
  );

  // Tracker lookup maps
  const { inbound: trackerInbound, outbound: trackerOutbound } = useMemo(
    () => buildTrackerMaps(trackerTrips),
    [trackerTrips]
  );

  const totalAlerts = alerts.length;

  const scrollToNext = useCallback(() => {
    const el = document.getElementById('next-train');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Auto-scroll to next train whenever the visible schedule changes (on load, date/direction switch)
  useEffect(() => {
    if (!isToday || nextIndex < 0) return;
    // Small delay lets the DOM paint the list before scrolling
    const t = setTimeout(() => {
      const el = document.getElementById('next-train');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    return () => clearTimeout(t);
  }, [isToday, nextIndex, selectedDate, direction]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-go-dark text-white shadow-lg">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="bg-go-green rounded-full w-9 h-9 flex items-center justify-center font-extrabold text-sm shrink-0">
            GO
          </div>
          <div>
            <div className="font-bold text-base leading-tight">GO Train</div>
            <div className="text-white/60 text-xs">Stouffville Line</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Service alerts icon — always visible */}
            <button
              onClick={() => setShowAlertsSheet(true)}
              className="relative p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              title="Stouffville service updates"
            >
              <BellIcon className="w-5 h-5 text-white/70" />
              {/* Badge dot — red when alerts, amber when loading done */}
              {!alertsLoading && totalAlerts > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-go-dark" />
              )}
            </button>

            <div className="w-px h-4 bg-white/20" />

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
              title="Refresh live data"
            >
              <svg
                className={`w-5 h-5 text-white/70 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            <div className="w-px h-4 bg-white/20" />

            <a
              href={
                direction === 'homeToOffice'
                  ? 'https://www.gotransit.com/en/see-schedules?tripPoint=36888&departure=UI&destination=UN&transfers=true'
                  : 'https://www.gotransit.com/en/see-schedules?tripPoint=86388&departure=UN&destination=UI&transfers=true'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 text-xs hover:text-white/90 transition-colors"
            >
              Official ↗
            </a>
          </div>
        </div>

        {/* Direction tabs */}
        <div className="flex mx-4 mb-3 bg-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setDirection('homeToOffice')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
              direction === 'homeToOffice' ? 'bg-go-green text-white shadow' : 'text-white/70'
            }`}
          >
            <div className="text-xs leading-tight">🏠 Unionville</div>
            <div className="text-[10px] text-white/60">→ Union</div>
          </button>
          <button
            onClick={() => setDirection('officeToHome')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
              direction === 'officeToHome' ? 'bg-go-green text-white shadow' : 'text-white/70'
            }`}
          >
            <div className="text-xs leading-tight">🏢 Union</div>
            <div className="text-[10px] text-white/60">→ Unionville</div>
          </button>
        </div>

        {/* Date picker row */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 border border-white/20 focus:outline-none focus:border-white/50"
          />
          <span className="text-white/60 text-xs shrink-0">{formatDisplayDate(selectedDate)}</span>
          {isToday ? (
            <button
              onClick={() => {
                setSelectedDate(getTomorrowStr());
                setDirection('homeToOffice');
              }}
              className="shrink-0 bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              Tomorrow →
            </button>
          ) : (
            <button
              onClick={() => {
                setSelectedDate(todayStr);
              }}
              className="shrink-0 bg-go-accent text-white text-xs font-semibold px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              ← Today
            </button>
          )}
        </div>
      </header>

      {/* Route bar */}
      <div className="bg-go-green text-white px-4 py-2 flex items-center gap-2 text-sm">
        <span className="font-semibold">
          {direction === 'homeToOffice' ? 'Unionville GO' : 'Union Station'}
        </span>
        <ArrowRightIcon className="w-4 h-4 shrink-0" />
        <span className="font-semibold">
          {direction === 'homeToOffice' ? 'Union Station' : 'Unionville GO'}
        </span>
        <span className="ml-auto text-white/70 capitalize text-xs">{serviceType}</span>
      </div>

      {/* Slim alert banner (only when active alerts exist) */}
      {!alertsLoading && totalAlerts > 0 && (
        <button
          onClick={() => setShowAlertsSheet(true)}
          className="w-full flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-left"
        >
          <span className="text-sm">⚠️</span>
          <span className="text-amber-800 text-xs font-medium flex-1">
            {totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''} on Stouffville line
          </span>
          <span className="text-amber-600 text-xs font-semibold">View →</span>
        </button>
      )}

      {/* Train list */}
      <main className="flex-1 px-3 py-3 overflow-y-auto">
        {trips.length === 0 ? (
          <WeekendNotice direction={direction} />
        ) : (
          <>
            {trips.map((trip, i) => {
              const isPast = isToday && nowMinutes !== null && parseTime(trip.departure) < nowMinutes;
              const isNext = i === nextIndex;
              const tripAlerts = alertMap.get(trip.departure) ?? [];
              const tracker = isToday ? getTrackerInfo(trip, direction, trackerInbound, trackerOutbound) : null;
              return (
                <div key={i} id={isNext ? 'next-train' : undefined}>
                  <TrainCard
                    trip={trip}
                    isNext={isNext}
                    isPast={isPast}
                    alerts={tripAlerts}
                    tracker={tracker}
                    onAlertClick={() => setShowAlertsSheet(true)}
                  />
                </div>
              );
            })}

            <div className="text-center text-xs text-gray-400 mt-4 mb-8 pb-safe">
              Schedule effective {SCHEDULE_EFFECTIVE_DATE} · Stouffville Line
              <br />
              <a
                href="https://www.gotransit.com/en/see-schedules"
                target="_blank"
                rel="noopener noreferrer"
                className="underline mt-1 inline-block"
              >
                Verify on gotransit.com
              </a>
            </div>
          </>
        )}
      </main>

      {/* Service Alerts Sheet */}
      {showAlertsSheet && (
        <ServiceAlertsSheet
          alerts={alerts}
          loading={alertsLoading}
          available={alertsAvailable}
          lastUpdated={alertsLastUpdated}
          onClose={() => setShowAlertsSheet(false)}
        />
      )}
    </div>
  );
}
