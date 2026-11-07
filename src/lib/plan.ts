import { lessons, problems, lessonById, problemsForPattern } from './content';
import type { Lesson, Problem } from './types';
import type { State } from './progress';

export const week = (l: Lesson) => (l as Lesson & { week?: number }).week ?? 99;

export function isUnlocked(l: Lesson, s: State) {
  return (l.requires ?? []).every((r) => s.lessonsDone[r]);
}

export function nextLessons(s: State, n = 1): Lesson[] {
  return lessons
    .filter((l) => !s.lessonsDone[l.id] && isUnlocked(l, s))
    .sort((a, b) => week(a) - week(b))
    .slice(0, n);
}

export function dueReviews(s: State, now = Date.now()): Problem[] {
  return problems
    .filter((p) => s.problems[p.id]?.solved && (s.problems[p.id].due ?? Infinity) <= now)
    .sort((a, b) => (s.problems[a.id].due ?? 0) - (s.problems[b.id].due ?? 0));
}

const rank = { easy: 0, medium: 1, hard: 2 };

/** Unsolved problems whose pattern lesson is done (preferred) or unlocked. */
export function nextProblems(s: State, n = 2): Problem[] {
  const open = problems.filter((p) => !s.problems[p.id]?.solved);
  const done = open.filter((p) => s.lessonsDone[p.pattern]);
  const pool = done.length ? done : open.filter((p) => { const l = lessonById.get(p.pattern); return l && isUnlocked(l, s); });
  return pool
    .sort((a, b) => week(lessonById.get(a.pattern)!) - week(lessonById.get(b.pattern)!) || rank[a.difficulty] - rank[b.difficulty])
    .slice(0, n);
}

export function patternReadiness(s: State) {
  const patterns = lessons.filter((l) => l.track === 'algo' && problemsForPattern(l.id).length > 0);
  return patterns.map((l) => {
    const ps = problemsForPattern(l.id);
    const weights = { easy: 1, medium: 2, hard: 3 };
    const total = ps.reduce((a, p) => a + weights[p.difficulty], 0);
    const got = ps.reduce((a, p) => {
      const pr = s.problems[p.id];
      if (!pr?.solved) return a;
      const stale = (pr.due ?? Infinity) <= Date.now() ? 0.6 : 1; // overdue knowledge decays
      return a + weights[p.difficulty] * stale * (pr.usedSolution ? 0.5 : 1);
    }, 0);
    const solved = ps.filter((p) => s.problems[p.id]?.solved).length;
    return { lesson: l, pct: total ? Math.round((got / total) * 100) : 0, solved, count: ps.length };
  });
}
