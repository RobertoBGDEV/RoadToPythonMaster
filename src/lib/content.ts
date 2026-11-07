import * as yaml from 'js-yaml';
import type { Lesson, Problem, Track } from './types';

const lessonFiles = import.meta.glob('/content/lessons/**/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const problemFiles = import.meta.glob('/content/problems/**/*.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function parseAll<T>(files: Record<string, string>): T[] {
  const out: T[] = [];
  for (const [path, raw] of Object.entries(files)) {
    try {
      const doc = yaml.load(raw);
      if (Array.isArray(doc)) out.push(...(doc as T[]));
      else if (doc) out.push(doc as T);
    } catch (e) {
      console.error('Bad content file', path, e);
    }
  }
  return out;
}

const trackOrder: Track[] = ['python', 'algo', 'design', 'system', 'behavioral'];

export const lessons: Lesson[] = parseAll<Lesson>(lessonFiles);
export const problems: Problem[] = parseAll<Problem>(problemFiles);

export const lessonById = new Map(lessons.map((l) => [l.id, l]));
export const problemById = new Map(problems.map((p) => [p.id, p]));

export function lessonsByTrack(track: Track) {
  return lessons.filter((l) => l.track === track);
}
export function problemsForPattern(lessonId: string) {
  return problems.filter((p) => p.pattern === lessonId);
}
export { trackOrder };

const diffRank = { easy: 0, medium: 1, hard: 2 } as const;
export const sortedProblems = [...problems].sort(
  (a, b) => diffRank[a.difficulty] - diffRank[b.difficulty],
);

export function problemSpec(p: Problem) {
  return {
    kind: p.kind ?? 'function',
    fn: p.fn,
    className: p.className,
    compare: p.compare ?? 'exact',
    argTypes: p.argTypes,
    retType: p.retType,
    inplace: p.inplace,
    tests: p.tests,
  };
}
