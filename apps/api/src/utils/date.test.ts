import { subtractDays, addDays, isMarketHours, formatDateIST } from './date';

describe('subtractDays', () => {
  it('subtracts days from a date string', () => {
    expect(subtractDays('2024-03-15', 5)).toBe('2024-03-10');
  });
});

describe('addDays', () => {
  it('adds days to a date string', () => {
    expect(addDays('2024-03-15', 5)).toBe('2024-03-20');
  });
});

describe('isMarketHours', () => {
  it('returns false on Saturday', () => {
    // 2024-03-16 is a Saturday, 12:00 UTC => 17:30 IST
    const saturday = new Date('2024-03-16T12:00:00Z');
    expect(isMarketHours(saturday)).toBe(false);
  });

  it('returns false on Sunday', () => {
    // 2024-03-17 is a Sunday, 12:00 UTC => 17:30 IST
    const sunday = new Date('2024-03-17T12:00:00Z');
    expect(isMarketHours(sunday)).toBe(false);
  });

  it('returns true at 10:00 IST on a weekday', () => {
    // 10:00 IST = 04:30 UTC. 2024-03-18 is Monday.
    const weekdayMorning = new Date('2024-03-18T04:30:00Z');
    expect(isMarketHours(weekdayMorning)).toBe(true);
  });

  it('returns false at 16:00 IST on a weekday (after market close)', () => {
    // 16:00 IST = 10:30 UTC. Market closes at 15:30 IST.
    const weekdayAfternoon = new Date('2024-03-18T10:30:00Z');
    expect(isMarketHours(weekdayAfternoon)).toBe(false);
  });
});

describe('formatDateIST', () => {
  it('returns a date in YYYY-MM-DD format', () => {
    // 2024-03-15T00:00:00Z + 5.5h = 2024-03-15 05:30 IST => date part is 2024-03-15
    const date = new Date('2024-03-15T00:00:00Z');
    const result = formatDateIST(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
