import { useSyncExternalStore } from 'react';
import { dayKey, nextBox, nextDue } from './srs';

export interface ProblemProgress {
  solved: boolean;
  attempts: number;
  firstSolvedAt?: number;
  lastSolvedAt?: number;
  box: number; // SRS box
  due?: number; // when a review is due
  code?: string; // last draft
  usedSolution?: boolean;
  bestMs?: number;
}

export interface Story {
  id: string;
  title: string;
  tags: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface MockRecord {
  at: number;
  problems: string[];
  solved: number;
  minutes: number;
}

export interface State {
  v: 1;
  xp: number;
  lessonsDone: Record<string, number>;
  quiz: Record<string, number>; // best score per lesson
  problems: Record<string, ProblemProgress>;
  activeDays: string[];
  stories: Story[];
  drill: { right: number; total: number; byPattern: Record<string, { right: number; total: number }> };
  mocks: MockRecord[];
  notes: Record<string, string>;
  startedAt: number;
}

const KEY = 'rtpm:v1';

function fresh(): State {
  return { v: 1, xp: 0, lessonsDone: {}, quiz: {}, problems: {}, activeDays: [], stories: [], drill: { right: 0, total: 0, byPattern: {} }, mocks: [], notes: {}, startedAt: Date.now() };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* storage blocked */
  }
  return fresh();
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function touchDay(s: State): State {
  const k = dayKey();
  return s.activeDays.includes(k) ? s : { ...s, activeDays: [...s.activeDays, k] };
}

export function useProgress(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export const XP = { lesson: 20, easy: 15, medium: 30, hard: 60, review: 10, quiz: 5, drill: 2 };

export const actions = {
  completeLesson(id: string, xp = XP.lesson) {
    if (state.lessonsDone[id]) return;
    commit(touchDay({ ...state, xp: state.xp + xp, lessonsDone: { ...state.lessonsDone, [id]: Date.now() } }));
  },
  saveQuiz(id: string, score: number) {
    const prev = state.quiz[id] ?? -1;
    if (score <= prev) return;
    commit({ ...state, quiz: { ...state.quiz, [id]: score }, xp: state.xp + XP.quiz * Math.max(0, score - Math.max(prev, 0)) });
  },
  saveDraft(id: string, code: string) {
    const p = state.problems[id] ?? { solved: false, attempts: 0, box: 0 };
    commit({ ...state, problems: { ...state.problems, [id]: { ...p, code } } });
  },
  recordAttempt(id: string, passed: boolean, difficulty: 'easy' | 'medium' | 'hard', ms?: number, usedSolution = false) {
    const p = state.problems[id] ?? { solved: false, attempts: 0, box: 0 };
    const now = Date.now();
    const next: ProblemProgress = { ...p, attempts: p.attempts + 1 };
    let xp = state.xp;
    if (passed) {
      const isReview = p.solved && (p.due ?? Infinity) <= now;
      if (!p.solved) {
        xp += usedSolution ? Math.round(XP[difficulty] / 3) : XP[difficulty];
        next.firstSolvedAt = now;
        next.box = 0;
        next.due = nextDue(0, now);
      } else if (isReview) {
        xp += XP.review;
        next.box = nextBox(p.box, true);
        next.due = nextDue(next.box, now);
      }
      next.solved = true;
      next.lastSolvedAt = now;
      next.usedSolution = p.usedSolution || usedSolution;
      if (ms !== undefined) next.bestMs = Math.min(p.bestMs ?? Infinity, ms);
    } else if (p.solved && (p.due ?? Infinity) <= now) {
      next.box = 0; // forgot it: restart the ladder
      next.due = nextDue(0, now);
    }
    commit(touchDay({ ...state, xp, problems: { ...state.problems, [id]: next } }));
  },
  recordDrill(pattern: string, right: boolean) {
    const d = state.drill;
    const bp = d.byPattern[pattern] ?? { right: 0, total: 0 };
    commit(touchDay({
      ...state,
      xp: state.xp + (right ? XP.drill : 0),
      drill: { right: d.right + (right ? 1 : 0), total: d.total + 1, byPattern: { ...d.byPattern, [pattern]: { right: bp.right + (right ? 1 : 0), total: bp.total + 1 } } },
    }));
  },
  recordMock(rec: MockRecord) {
    commit(touchDay({ ...state, mocks: [...state.mocks, rec], xp: state.xp + rec.solved * 40 }));
  },
  saveStory(s: Story) {
    const rest = state.stories.filter((x) => x.id !== s.id);
    commit({ ...state, stories: [...rest, s] });
  },
  deleteStory(id: string) {
    commit({ ...state, stories: state.stories.filter((x) => x.id !== id) });
  },
  saveNote(id: string, text: string) {
    commit({ ...state, notes: { ...state.notes, [id]: text } });
  },
  exportJson() {
    return JSON.stringify(state, null, 2);
  },
  importJson(raw: string) {
    const parsed = JSON.parse(raw);
    if (parsed?.v !== 1) throw new Error('Not a Road to Python Master backup');
    commit({ ...fresh(), ...parsed });
  },
  reset() {
    commit(fresh());
  },
};

export function levelFor(xp: number) {
  // level n needs 100 * n^1.4 xp cumulative, roughly
  let lvl = 1;
  while (xp >= Math.round(100 * Math.pow(lvl, 1.4))) lvl++;
  const floor = lvl === 1 ? 0 : Math.round(100 * Math.pow(lvl - 1, 1.4));
  const ceil = Math.round(100 * Math.pow(lvl, 1.4));
  return { level: lvl, into: xp - floor, span: ceil - floor };
}
