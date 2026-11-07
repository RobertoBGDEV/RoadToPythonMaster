import { describe, expect, it } from 'vitest';
import { lessons, problems, lessonById } from '../content';
import { isUnlocked, nextLessons, nextProblems, patternReadiness } from '../plan';
import { levelFor } from '../progress';
import type { State } from '../progress';

const empty = (): State => ({ v: 1, xp: 0, lessonsDone: {}, quiz: {}, problems: {}, activeDays: [], stories: [], drill: { right: 0, total: 0, byPattern: {} }, mocks: [], notes: {}, startedAt: Date.now() });

describe('content integrity', () => {
  it('loads lessons and problems', () => {
    expect(lessons.length).toBeGreaterThan(40);
    expect(problems.length).toBeGreaterThan(100);
  });
  it('every problem points at a real lesson, and prerequisites exist', () => {
    for (const p of problems) expect(lessonById.has(p.pattern), p.id).toBe(true);
    for (const l of lessons) for (const r of l.requires ?? []) expect(lessonById.has(r), `${l.id}->${r}`).toBe(true);
  });
  it('prerequisite graph is acyclic', () => {
    const state = new Map<string, number>();
    const visit = (id: string) => {
      if (state.get(id) === 2) return;
      expect(state.get(id), `cycle at ${id}`).not.toBe(1);
      state.set(id, 1);
      for (const r of lessonById.get(id)?.requires ?? []) visit(r);
      state.set(id, 2);
    };
    lessons.forEach((l) => visit(l.id));
  });
  it('a prerequisite is never scheduled after the lesson that needs it', () => {
    for (const l of lessons) for (const r of l.requires ?? []) {
      expect((lessonById.get(r) as any).week, `${r} before ${l.id}`).toBeLessThanOrEqual((l as any).week);
    }
  });
});

describe('planning', () => {
  it('starts with lessons that have no prerequisites', () => {
    const s = empty();
    const first = nextLessons(s, 3);
    expect(first.length).toBeGreaterThan(0);
    for (const l of first) expect(isUnlocked(l, s)).toBe(true);
  });
  it('unlocks problems only after their pattern lesson is done', () => {
    const s = empty();
    s.lessonsDone['arrays-hashing'] = Date.now();
    const np = nextProblems(s, 3);
    expect(np.every((p) => p.pattern === 'arrays-hashing')).toBe(true);
    expect(np[0].difficulty).toBe('easy');
  });
  it('readiness is 0 for a new user and rises with solved problems', () => {
    const s = empty();
    expect(patternReadiness(s).every((r) => r.pct === 0)).toBe(true);
    s.problems['two-sum'] = { solved: true, attempts: 1, box: 0, due: Date.now() + 1e9 };
    const ah = patternReadiness(s).find((r) => r.lesson.id === 'arrays-hashing')!;
    expect(ah.pct).toBeGreaterThan(0);
  });
  it('levels increase with xp', () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(5000).level).toBeGreaterThan(levelFor(500).level);
  });
});
