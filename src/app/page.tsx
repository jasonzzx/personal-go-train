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
  // Parse as local date
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function getDefaultDate(): string {
  const now = new Date();
  if (now.getHours() >= 18) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateStr(tomorrow);
  }
  return toLocalDateStr(now);
}

function getDefaultDirection(): Direction {
  const hour = new Date().getHours();
  return hour < 12 ? 'homeToOffice' : 'officeToHome';
}

/** Minutes since midnight (handles "HH:MM" where HH can be 24/25 for next-day) */
function parseTime(time: string): number {
  return timeToMinutes(time);
}

// ──────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────

function TrainCard({
  trip,
  isNext,
  isPast,
}: {
  trip: Trip;
  isNext: boolean;
  isPast: boolean;
}) {
  return (
    <div
      className={`
        relative flex items-center rounded-xl px-4 py-3 mb-2 transition-all
        ${isNext
          ? 'bg-go-green shadow-md shadow-go-green/30 text-white'
          : isPast
          ? 'bg-white/60 text-gray-400'
          : 'bg-white text-gray-800 shadow-sm'}
      `}
    >
      {isNext && (
        <span className="absolute -top-2 left-4 text-[10px] font-bold uppercase tracking-widest bg-go-accent text-white px-2 py-0.5 rounded-full">
          Next
        </span>
      )}

      {/* Departure */}
      <div className="flex-1">
        <div className={`text-2xl font-bold leading-none ${isNext ? 'text-white' : 'text-go-dark'}`}>
          {trip.departure}
        </div>
        <div className={`text-xs mt-0.5 ${isNext ? 'text-white/75' : 'text-gray-500'}`}>
          depart
        </div>
      </div>

      {/* Arrow + trip time */}
      <div className="flex flex-col items-center px-3">
        <div className={`text-xs font-medium mb-1 ${isNext ? 'text-white/80' : 'text-gray-400'}`}>
          {trip.tripTime}
        </div>
        <div className="flex items-center gap-1">
          <div className={`h-px w-8 ${isNext ? 'bg-white/50' : 'bg-gray-200'}`} />
          <svg
            className={`w-3 h-3 ${isNext ? 'text-white/70' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>

      {/* Arrival */}
      <div className="flex-1 text-right">
        <div className={`text-2xl font-bold leading-none ${isNext ? 'text-white' : 'text-go-dark'}`}>
          {trip.arrival}
        </div>
        <div className={`text-xs mt-0.5 ${isNext ? 'text-white/75' : 'text-gray-500'}`}>
          arrive
        </div>
      </div>
    </div>
  );
}

function WeekendNotice({ direction }: { direction: Direction }) {
  const href =
    direction === 'homeToOffice'
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
        Weekend schedule data is not yet embedded.<br />
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

  // Tick every minute to keep "next train" accurate
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

  const serviceType = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    return getServiceType(new Date(y, m - 1, d));
  }, [selectedDate]);

  const trips: Trip[] = useMemo(
    () => scheduleData[direction][serviceType] ?? [],
    [direction, serviceType]
  );

  const isToday = selectedDate === todayStr;

  // Index of next train (only meaningful for today)
  const nextIndex = useMemo(() => {
    if (!isToday || nowMinutes === null) return -1;
    return trips.findIndex((t) => parseTime(t.departure) >= nowMinutes);
  }, [trips, isToday, nowMinutes]);

  const scrollToNext = useCallback(() => {
    const el = document.getElementById('next-train');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-go-dark text-white shadow-lg">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          {/* GO logo pill */}
          <div className="bg-go-green rounded-full w-9 h-9 flex items-center justify-center font-extrabold text-sm shrink-0">
            GO
          </div>
          <div>
            <div className="font-bold text-base leading-tight">GO Train</div>
            <div className="text-white/60 text-xs">Stouffville Line</div>
          </div>
          <div className="ml-auto">
            <a
              href={
                direction === 'homeToOffice'
                  ? 'https://www.gotransit.com/en/see-schedules?tripPoint=36888&departure=UI&destination=UN&transfers=true'
                  : 'https://www.gotransit.com/en/see-schedules?tripPoint=86388&departure=UN&destination=UI&transfers=true'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 text-xs underline"
            >
              Official site ↗
            </a>
          </div>
        </div>

        {/* Direction tabs */}
        <div className="flex mx-4 mb-3 bg-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setDirection('homeToOffice')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
              direction === 'homeToOffice'
                ? 'bg-go-green text-white shadow'
                : 'text-white/70'
            }`}
          >
            <div className="text-xs leading-tight">🏠 Unionville</div>
            <div className="text-[10px] text-white/60">→ Union</div>
          </button>
          <button
            onClick={() => setDirection('officeToHome')}
            className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-all ${
              direction === 'officeToHome'
                ? 'bg-go-green text-white shadow'
                : 'text-white/70'
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
          <span className="text-white/60 text-xs shrink-0">
            {formatDisplayDate(selectedDate)}
          </span>
          {isToday && nextIndex >= 0 && (
            <button
              onClick={scrollToNext}
              className="shrink-0 bg-go-green text-white text-xs font-semibold px-3 py-2 rounded-lg"
            >
              Next ↓
            </button>
          )}
        </div>
      </header>

      {/* Route summary bar */}
      <div className="bg-go-green text-white px-4 py-2 flex items-center gap-2 text-sm">
        <span className="font-semibold">
          {direction === 'homeToOffice' ? 'Unionville GO' : 'Union Station'}
        </span>
        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
        </svg>
        <span className="font-semibold">
          {direction === 'homeToOffice' ? 'Union Station' : 'Unionville GO'}
        </span>
        <span className="ml-auto text-white/70 capitalize text-xs">{serviceType}</span>
      </div>

      {/* Train list */}
      <main className="flex-1 px-3 py-3 overflow-y-auto">
        {trips.length === 0 ? (
          <WeekendNotice direction={direction} />
        ) : (
          <>
            {trips.map((trip, i) => {
              const isPast = isToday && nowMinutes !== null && parseTime(trip.departure) < nowMinutes;
              const isNext = i === nextIndex;
              return (
                <div key={i} id={isNext ? 'next-train' : undefined}>
                  <TrainCard trip={trip} isNext={isNext} isPast={isPast} />
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
    </div>
  );
}
