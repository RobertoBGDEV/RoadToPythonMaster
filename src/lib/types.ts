export type Track = 'python' | 'algo' | 'design' | 'system' | 'behavioral';

export const TRACKS: Record<Track, { label: string; emoji: string; blurb: string }> = {
  python: { label: 'Python Mastery', emoji: '🐍', blurb: 'From Java brain to Pythonic brain.' },
  algo: { label: 'Algorithm Patterns', emoji: '🧩', blurb: 'Recognise the pattern, then write the template.' },
  design: { label: 'Design Patterns & LLD', emoji: '🏗️', blurb: 'SOLID, patterns and low-level design.' },
  system: { label: 'System Design', emoji: '🌐', blurb: 'Scale, trade-offs and a repeatable framework.' },
  behavioral: { label: 'Behavioral', emoji: '🗣️', blurb: 'Stories that prove SWE II/III scope.' },
};

export interface Section {
  md?: string;
  code?: string;
  java?: string;
  caption?: string;
  static?: boolean; // show read-only (needs threads/processes, unavailable in the browser)
}

export interface QuizItem {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface Lesson {
  id: string;
  track: Track;
  title: string;
  summary: string;
  minutes: number;
  xp?: number;
  requires?: string[];
  sections: Section[];
  quiz?: QuizItem[];
  template?: string; // algo pattern: reusable skeleton
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface TestCase {
  args?: unknown[];
  expected?: unknown;
  ops?: string[];
  hidden?: boolean;
}

export interface Problem {
  id: string;
  title: string;
  pattern: string; // lesson id
  difficulty: Difficulty;
  leetcode?: string;
  statement: string;
  starter: string;
  kind?: 'function' | 'design';
  fn?: string;
  className?: string;
  compare?: 'exact' | 'unordered' | 'unordered_nested' | 'float' | 'set';
  argTypes?: (string | null)[];
  retType?: string;
  inplace?: number;
  tests: TestCase[];
  hints?: string[];
  solution: string;
  complexity: string;
  explain?: string;
}

export interface TestResult {
  ok: boolean;
  hidden: boolean;
  input: unknown;
  expected: unknown;
  actual: unknown;
  error: string | null;
  stdout: string;
  ms: number;
}

export interface RunReport {
  error: string | null;
  results: TestResult[];
}
