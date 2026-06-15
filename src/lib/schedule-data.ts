export interface Trip {
  departure: string; // "HH:MM"
  arrival: string;   // "HH:MM"
  tripTime: string;  // "N min"
}

export type ServiceType = 'weekday' | 'saturday' | 'sunday';
export type Direction = 'homeToOffice' | 'officeToHome';

// Schedule data scraped from gotransit.com (Stouffville line, effective June 13, 2026)
// Unionville GO (UI) → Union Station (UN)
const homeToOfficeWeekday: Trip[] = [
  { departure: '05:15', arrival: '05:45', tripTime: '30 min' },
  { departure: '05:39', arrival: '06:20', tripTime: '41 min' },
  { departure: '06:39', arrival: '07:20', tripTime: '41 min' },
  { departure: '07:09', arrival: '07:50', tripTime: '41 min' },
  { departure: '07:39', arrival: '08:20', tripTime: '41 min' },
  { departure: '07:59', arrival: '08:40', tripTime: '41 min' },
  { departure: '08:09', arrival: '08:50', tripTime: '41 min' },
  { departure: '08:39', arrival: '09:20', tripTime: '41 min' },
  { departure: '09:39', arrival: '10:20', tripTime: '41 min' },
  { departure: '10:39', arrival: '11:20', tripTime: '41 min' },
  { departure: '11:39', arrival: '12:20', tripTime: '41 min' },
  { departure: '12:39', arrival: '13:20', tripTime: '41 min' },
  { departure: '13:39', arrival: '14:20', tripTime: '41 min' },
  { departure: '14:39', arrival: '15:20', tripTime: '41 min' },
  { departure: '15:39', arrival: '16:20', tripTime: '41 min' },
  { departure: '16:25', arrival: '17:20', tripTime: '55 min' },
  { departure: '16:30', arrival: '17:25', tripTime: '55 min' },
  { departure: '16:36', arrival: '17:17', tripTime: '41 min' },
  { departure: '17:39', arrival: '18:20', tripTime: '41 min' },
  { departure: '18:50', arrival: '19:35', tripTime: '45 min' },
  { departure: '19:39', arrival: '20:20', tripTime: '41 min' },
  { departure: '20:39', arrival: '21:20', tripTime: '41 min' },
  { departure: '21:39', arrival: '22:20', tripTime: '41 min' },
  { departure: '22:39', arrival: '23:20', tripTime: '41 min' },
  { departure: '23:40', arrival: '00:10', tripTime: '30 min' },
  { departure: '01:45', arrival: '02:15', tripTime: '30 min' },
];

// Union Station (UN) → Unionville GO (UI)
const officeToHomeWeekday: Trip[] = [
  { departure: '06:43', arrival: '07:13', tripTime: '30 min' },
  { departure: '07:48', arrival: '08:25', tripTime: '37 min' },
  { departure: '09:00', arrival: '09:40', tripTime: '40 min' },
  { departure: '10:00', arrival: '10:40', tripTime: '40 min' },
  { departure: '11:00', arrival: '11:40', tripTime: '40 min' },
  { departure: '12:00', arrival: '12:40', tripTime: '40 min' },
  { departure: '13:00', arrival: '13:40', tripTime: '40 min' },
  { departure: '14:00', arrival: '14:40', tripTime: '40 min' },
  { departure: '15:00', arrival: '15:40', tripTime: '40 min' },
  { departure: '15:32', arrival: '16:13', tripTime: '41 min' },
  { departure: '16:00', arrival: '16:40', tripTime: '40 min' },
  { departure: '16:30', arrival: '17:10', tripTime: '40 min' },
  { departure: '16:50', arrival: '17:31', tripTime: '41 min' },
  { departure: '17:00', arrival: '17:40', tripTime: '40 min' },
  { departure: '17:32', arrival: '18:12', tripTime: '40 min' },
  { departure: '18:15', arrival: '18:55', tripTime: '40 min' },
  { departure: '19:00', arrival: '19:40', tripTime: '40 min' },
  { departure: '20:00', arrival: '20:40', tripTime: '40 min' },
  { departure: '21:00', arrival: '21:40', tripTime: '40 min' },
  { departure: '22:00', arrival: '22:40', tripTime: '40 min' },
  { departure: '23:00', arrival: '23:39', tripTime: '39 min' },
  { departure: '00:01', arrival: '00:39', tripTime: '38 min' },
  { departure: '01:10', arrival: '01:35', tripTime: '25 min' },
  { departure: '02:45', arrival: '03:10', tripTime: '25 min' },
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
