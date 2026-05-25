import { QuietHoursChecker } from './quiet-hours-checker';

describe('QuietHoursChecker', () => {
  const quietHours = {
    start_time: '22:00',
    end_time: '08:00',
    timezone: 'Europe/Moscow',
    enabled: true,
  };

  it('should return false outside quiet hours window', () => {
    expect(
      QuietHoursChecker.isInQuietHours(quietHours, '2026-05-21T12:00:00Z'),
    ).toBe(false);
  });

  it('should return true inside overnight window', () => {
    expect(
      QuietHoursChecker.isInQuietHours(quietHours, '2026-05-21T20:00:00Z'),
    ).toBe(true);
  });

  it('should return false when quiet hours disabled', () => {
    expect(
      QuietHoursChecker.isInQuietHours(
        { ...quietHours, enabled: false },
        '2026-05-21T20:00:00Z',
      ),
    ).toBe(false);
  });

  it('should validate IANA timezone', () => {
    expect(QuietHoursChecker.isValidTimezone('Europe/Moscow')).toBe(true);
    expect(QuietHoursChecker.isValidTimezone('Invalid/Zone')).toBe(false);
  });

  it('should handle America/New_York timezone', () => {
    expect(
      QuietHoursChecker.isInQuietHours(
        {
          start_time: '22:00',
          end_time: '08:00',
          timezone: 'America/New_York',
          enabled: true,
        },
        '2026-05-22T03:00:00Z',
      ),
    ).toBe(true);
  });

  it('user-10 Asia/Tokyo 14:00 UTC is inside quiet hours (23:00 local)', () => {
    expect(
      QuietHoursChecker.isInQuietHours(
        {
          start_time: '21:00',
          end_time: '09:00',
          timezone: 'Asia/Tokyo',
          enabled: true,
        },
        '2026-05-21T14:00:00Z',
      ),
    ).toBe(true);
  });

  it('user-10 Asia/Tokyo 10:00 UTC is outside quiet hours (19:00 local)', () => {
    expect(
      QuietHoursChecker.isInQuietHours(
        {
          start_time: '21:00',
          end_time: '09:00',
          timezone: 'Asia/Tokyo',
          enabled: true,
        },
        '2026-05-21T10:00:00Z',
      ),
    ).toBe(false);
  });
});
