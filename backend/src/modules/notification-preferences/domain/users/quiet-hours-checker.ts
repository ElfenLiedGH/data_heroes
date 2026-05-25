import { DateTime } from 'luxon';

export type QuietHoursConfig = {
  readonly start_time: string;
  readonly end_time: string;
  readonly timezone: string;
  readonly enabled: boolean;
};

export class QuietHoursChecker {
  public static isValidTimezone(timezone: string): boolean {
   return DateTime.now().setZone(timezone).isValid;
  }

  public static isInQuietHours(
    quietHours: QuietHoursConfig,
    evaluatedAtUtc: string,
  ): boolean {
   if (!quietHours.enabled) {
     return false;
   }

   const localTime = DateTime.fromISO(evaluatedAtUtc, { zone: 'utc' }).setZone(
     quietHours.timezone,
   );

   if (!localTime.isValid) {
     return false;
   }

   const [startHour, startMinute] = quietHours.start_time.split(':').map(Number);
   const [endHour, endMinute] = quietHours.end_time.split(':').map(Number);

   const startMinutes = startHour * 60 + startMinute;
   const endMinutes = endHour * 60 + endMinute;
   const currentMinutes = localTime.hour * 60 + localTime.minute;

   if (startMinutes > endMinutes) {
     return currentMinutes >= startMinutes || currentMinutes < endMinutes;
   }

   return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
}
