export interface Trip {
  departure: string;              // "HH:MM"
  arrival: string;                // "HH:MM"
  tripTime: string;               // "N min"
  vehicleType: 'train' | 'bus';  // service mode
}

export type ServiceType = 'weekday' | 'saturday' | 'sunday';
export type Direction = 'homeToOffice' | 'officeToHome';

// Schedule data scraped from gotransit.com (Stouffville line, effective June 13, 2026)
// Unionville GO (UI) → Union Station (UN)
// Bus: late-night/early-morning departures + 55-min peak-hour bus trips
const homeToOfficeWeekday: Trip[] = [
  { departure: '05:15', arrival: '05:45', tripTime: '30 min', vehicleType: 'bus'   },
  { departure: '05:39', arrival: '06:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '06:39', arrival: '07:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '07:09', arrival: '07:50', tripTime: '41 min', vehicleType: 'train' },
  { departure: '07:39', arrival: '08:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '07:59', arrival: '08:40', tripTime: '41 min', vehicleType: 'train' },
  { departure: '08:09', arrival: '08:50', tripTime: '41 min', vehicleType: 'train' },
  { departure: '08:39', arrival: '09:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '09:39', arrival: '10:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '10:39', arrival: '11:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '11:39', arrival: '12:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '12:39', arrival: '13:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '13:39', arrival: '14:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '14:39', arrival: '15:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '15:39', arrival: '16:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '16:25', arrival: '17:20', tripTime: '55 min', vehicleType: 'bus'   },
  { departure: '16:30', arrival: '17:25', tripTime: '55 min', vehicleType: 'bus'   },
  { departure: '16:36', arrival: '17:17', tripTime: '41 min', vehicleType: 'train' },
  { departure: '17:39', arrival: '18:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '18:50', arrival: '19:35', tripTime: '45 min', vehicleType: 'train' },
  { departure: '19:39', arrival: '20:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '20:39', arrival: '21:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '21:39', arrival: '22:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '22:39', arrival: '23:20', tripTime: '41 min', vehicleType: 'train' },
  { departure: '23:40', arrival: '00:10', tripTime: '30 min', vehicleType: 'bus'   },
  { departure: '01:45', arrival: '02:15', tripTime: '30 min', vehicleType: 'bus'   },
];

// Union Station (UN) → Unionville GO (UI)
const officeToHomeWeekday: Trip[] = [
  { departure: '06:43', arrival: '07:13', tripTime: '30 min', vehicleType: 'bus'   },
  { departure: '07:48', arrival: '08:25', tripTime: '37 min', vehicleType: 'train' },
  { departure: '09:00', arrival: '09:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '10:00', arrival: '10:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '11:00', arrival: '11:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '12:00', arrival: '12:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '13:00', arrival: '13:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '14:00', arrival: '14:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '15:00', arrival: '15:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '15:32', arrival: '16:13', tripTime: '41 min', vehicleType: 'train' },
  { departure: '16:00', arrival: '16:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '16:30', arrival: '17:10', tripTime: '40 min', vehicleType: 'train' },
  { departure: '16:50', arrival: '17:31', tripTime: '41 min', vehicleType: 'train' },
  { departure: '17:00', arrival: '17:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '17:32', arrival: '18:12', tripTime: '40 min', vehicleType: 'train' },
  { departure: '18:15', arrival: '18:55', tripTime: '40 min', vehicleType: 'train' },
  { departure: '19:00', arrival: '19:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '20:00', arrival: '20:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '21:00', arrival: '21:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '22:00', arrival: '22:40', tripTime: '40 min', vehicleType: 'train' },
  { departure: '23:00', arrival: '23:39', tripTime: '39 min', vehicleType: 'train' },
  { departure: '00:01', arrival: '00:39', tripTime: '38 min', vehicleType: 'bus'   },
  { departure: '01:10', arrival: '01:35', tripTime: '25 min', vehicleType: 'bus'   },
  { departure: '02:45', arrival: '03:10', tripTime: '25 min', vehicleType: 'bus'   },
];

export const scheduleData: Record<Direction, Record<ServiceType, Trip[]>> = {
  homeToOffice: {
    weekday: homeToOfficeWeekday,
    saturday: [],
    sunday: [],
  },
  officeToHome: {
    weekday: officeToHomeWeekday,
    saturday: [],
    sunday: [],
  },
};

export const SCHEDULE_EFFECTIVE_DATE = 'June 13, 2026';

// ── Intermediate station stops ────────────────────────────
export interface StationStop {
  name: string;
  code: string;
  scheduledTime: string;    // "HH:MM" display
  scheduledMinutes: number; // absolute minutes from midnight (may exceed 1440 for overnight)
}

const SOUTHBOUND_STOPS = [
  { name: 'Unionville GO',  code: 'UI' },
  { name: 'Agincourt GO',   code: 'AO' },
  { name: 'Kennedy GO',     code: 'KE' },
  { name: 'Scarborough GO', code: 'SC' },
  { name: 'Danforth GO',    code: 'DN' },
  { name: 'Union Station',  code: 'UN' },
];

const NORTHBOUND_STOPS = [
  { name: 'Union Station',  code: 'UN' },
  { name: 'Danforth GO',    code: 'DN' },
  { name: 'Scarborough GO', code: 'SC' },
  { name: 'Kennedy GO',     code: 'KE' },
  { name: 'Agincourt GO',   code: 'AO' },
  { name: 'Unionville GO',  code: 'UI' },
];

// Fractional offsets of total trip time at each stop (calibrated from Stouffville line)
const SB_FRACTIONS = [0, 0.17, 0.29, 0.41, 0.56, 1.0];
const NB_FRACTIONS = [0, 0.20, 0.35, 0.475, 0.625, 1.0];

function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Returns the 6 intermediate stops for a trip with estimated times. */
export function getStops(trip: Trip, direction: Direction): StationStop[] {
  const depMins = timeToMinutes(trip.departure);
  const totalMins = parseInt(trip.tripTime, 10);
  const fracs = direction === 'homeToOffice' ? SB_FRACTIONS : NB_FRACTIONS;
  const bases = direction === 'homeToOffice' ? SOUTHBOUND_STOPS : NORTHBOUND_STOPS;
  return bases.map((s, i) => {
    const absMins = depMins + Math.round(fracs[i] * totalMins);
    return { ...s, scheduledMinutes: absMins, scheduledTime: minutesToTime(absMins) };
  });
}

export function getServiceType(date: Date): ServiceType {
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  if (day === 0) return 'sunday';
  if (day === 6) return 'saturday';
  return 'weekday';
}

/** Convert "HH:MM" to total minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
