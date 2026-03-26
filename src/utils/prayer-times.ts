import { Coordinates, CalculationMethod, Madhab, PrayerTimes } from 'adhan';
import dayjs from 'dayjs';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type PrayerSchedule = Record<PrayerName, Date>;

export function computePrayerTimes(date: Date, lat: number, lon: number): PrayerSchedule {
  const coordinates = new Coordinates(lat, lon);

  // Kazakhstan is predominantly Hanafi; we only use this for time calculation, not rulings.
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = Madhab.Hanafi;

  const pt = new PrayerTimes(coordinates, date, params);

  return {
    fajr: pt.fajr,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

export function ymd(date: Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

