import { describe, expect, it } from 'vitest';
import { computeStreak, dayKey, nextBox, nextDue, INTERVALS_DAYS } from '../srs';

const DAY = 86_400_000;

describe('spaced repetition', () => {
  it('schedules 1, 3, 7, 21, 60 days', () => {
    const now = Date.UTC(2026, 0, 1);
    expect(INTERVALS_DAYS).toEqual([1, 3, 7, 21, 60]);
    expect(nextDue(0, now)).toBe(now + DAY);
    expect(nextDue(2, now)).toBe(now + 7 * DAY);
    expect(nextDue(99, now)).toBe(now + 60 * DAY); // clamps
  });
  it('moves up on success and resets on failure', () => {
    expect(nextBox(0, true)).toBe(1);
    expect(nextBox(4, true)).toBe(5);
    expect(nextBox(5, true)).toBe(5);
    expect(nextBox(3, false)).toBe(0);
  });
});

describe('streak', () => {
  const now = new Date(2026, 5, 15, 12).getTime();
  it('counts consecutive days ending today', () => {
    const days = [0, 1, 2].map((i) => dayKey(now - i * DAY));
    expect(computeStreak(days, now)).toBe(3);
  });
  it('does not break if today is not done yet', () => {
    const days = [1, 2].map((i) => dayKey(now - i * DAY));
    expect(computeStreak(days, now)).toBe(2);
  });
  it('breaks after a missed day', () => {
    const days = [0, 2, 3].map((i) => dayKey(now - i * DAY));
    expect(computeStreak(days, now)).toBe(1);
  });
  it('is 0 when idle for two days', () => {
    expect(computeStreak([dayKey(now - 3 * DAY)], now)).toBe(0);
  });
});
