/** Spaced repetition: a solved problem returns after 1, 3, 7, 21, 60 days. */
export const INTERVALS_DAYS = [1, 3, 7, 21, 60];
const DAY = 86_400_000;

export function nextDue(box: number, now = Date.now()) {
  const days = INTERVALS_DAYS[Math.min(box, INTERVALS_DAYS.length - 1)];
  return now + days * DAY;
}

/** Success moves up a box; failure drops back to the start. */
export function nextBox(box: number, success: boolean) {
  return success ? Math.min(box + 1, INTERVALS_DAYS.length) : 0;
}

export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeStreak(activeDays: string[], now = Date.now()) {
  const set = new Set(activeDays);
  let streak = 0;
  let t = now;
  if (!set.has(dayKey(t))) t -= DAY; // today not done yet doesn't break the streak
  while (set.has(dayKey(t))) {
    streak++;
    t -= DAY;
  }
  return streak;
}
