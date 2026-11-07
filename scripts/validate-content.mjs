// Validates content structure; unless --schema-only, also executes every reference solution and
// every runnable lesson snippet in real CPython so broken content never ships.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import * as yaml from 'js-yaml';

const schemaOnly = process.argv.includes('--schema-only');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.yaml') ? [p] : [];
  });
}
function loadAll(dir) {
  return walk(dir).flatMap((f) => {
    try {
      const d = yaml.load(readFileSync(f, 'utf8'));
      return (Array.isArray(d) ? d : [d]).map((x) => ({ ...x, __file: f }));
    } catch (e) {
      console.error(`YAML error in ${f}: ${e.message}`);
      process.exitCode = 1;
      return [];
    }
  });
}

const lessons = loadAll('content/lessons');
const problems = loadAll('content/problems');
const errors = [];
const err = (m) => errors.push(m);

const lessonIds = new Set();
for (const l of lessons) {
  if (!l.id) { err(`${l.__file}: lesson without id`); continue; }
  if (lessonIds.has(l.id)) err(`duplicate lesson id ${l.id}`);
  lessonIds.add(l.id);
  if (!['python', 'algo', 'design', 'system', 'behavioral'].includes(l.track)) err(`${l.id}: bad track`);
  if (!l.title || !l.summary || !Array.isArray(l.sections) || !l.sections.length) err(`${l.id}: missing title/summary/sections`);
  if (typeof l.week !== 'number') err(`${l.id}: missing numeric week`);
  for (const q of l.quiz ?? []) {
    if (!q.options || q.answer == null || q.answer >= q.options.length) err(`${l.id}: bad quiz item "${q.q}"`);
  }
}
for (const l of lessons) for (const r of l.requires ?? []) if (!lessonIds.has(r)) err(`${l.id}: unknown requires ${r}`);

const problemIds = new Set();
for (const p of problems) {
  if (!p.id) { err(`${p.__file}: problem without id`); continue; }
  if (problemIds.has(p.id)) err(`duplicate problem id ${p.id}`);
  problemIds.add(p.id);
  if (!lessonIds.has(p.pattern)) err(`${p.id}: unknown pattern lesson ${p.pattern}`);
  if (!['easy', 'medium', 'hard'].includes(p.difficulty)) err(`${p.id}: bad difficulty`);
  for (const k of ['title', 'statement', 'starter', 'solution', 'complexity']) if (!p[k]) err(`${p.id}: missing ${k}`);
  if (!Array.isArray(p.tests) || p.tests.length < 4) err(`${p.id}: needs >= 4 tests`);
  if ((p.kind ?? 'function') === 'function' && !p.fn) err(`${p.id}: function problem needs fn`);
  if (p.kind === 'design' && !p.className) err(`${p.id}: design problem needs className`);
  if (p.fn && p.starter && !p.starter.includes(`def ${p.fn}`)) err(`${p.id}: starter lacks def ${p.fn}`);
  if (!p.tests?.some((t) => !t.hidden)) err(`${p.id}: needs at least one visible test`);
}

if (errors.length || process.exitCode) {
  console.error(errors.map((e) => '✗ ' + e).join('\n'));
  process.exit(1);
}
console.log(`structure ok: ${lessons.length} lessons, ${problems.length} problems`);
if (schemaOnly) process.exit(0);

function py(input, timeout = 30000) {
  const r = spawnSync('python3', ['-I', 'scripts/run_spec.py'], { input: JSON.stringify(input), encoding: 'utf8', timeout, cwd: process.cwd() });
  if (r.error) return { error: String(r.error) };
  try { return JSON.parse(r.stdout); } catch { return { error: r.stderr || r.stdout || 'no output' }; }
}

let bad = 0;
for (const p of problems) {
  if (only && p.id !== only) continue;
  const spec = { kind: p.kind ?? 'function', fn: p.fn, className: p.className, compare: p.compare ?? 'exact', argTypes: p.argTypes, retType: p.retType, inplace: p.inplace, tests: p.tests };
  const rep = py({ code: p.solution, spec });
  if (rep.error) { console.error(`✗ ${p.id}: solution errored\n${rep.error}`); bad++; continue; }
  const fails = rep.results.map((r, i) => ({ r, i })).filter((x) => !x.r.ok);
  if (fails.length) {
    bad++;
    console.error(`✗ ${p.id}: ${fails.length}/${rep.results.length} tests fail with the reference solution`);
    for (const { r, i } of fails.slice(0, 2)) console.error(`   test ${i + 1}: input=${JSON.stringify(r.input)} expected=${JSON.stringify(r.expected)} got=${JSON.stringify(r.actual)} ${r.error ?? ''}`);
    continue;
  }
  const slow = rep.results.reduce((a, r) => a + r.ms, 0);
  // the starter must NOT already pass everything
  const st = py({ code: p.starter, spec });
  if (!st.error && st.results.every((r) => r.ok)) { console.error(`✗ ${p.id}: starter code already passes all tests`); bad++; continue; }
  if (slow > 2000) console.warn(`! ${p.id}: reference solution slow (${Math.round(slow)} ms total)`);
}

// lesson snippets must run (unless marked expectError)
for (const l of lessons) {
  if (only && l.id !== only) continue;
  for (const [i, s] of (l.sections ?? []).entries()) {
    if (!s.code) continue;
    const r = spawnSync('python3', ['-I', '-c', s.code], { encoding: 'utf8', timeout: 15000 });
    const failed = r.status !== 0;
    if (failed && !s.expectError) { bad++; console.error(`✗ lesson ${l.id} section ${i}: snippet failed\n${(r.stderr || '').split('\n').slice(-4).join('\n')}`); }
    if (!failed && s.expectError) { bad++; console.error(`✗ lesson ${l.id} section ${i}: expected an error but ran fine`); }
  }
  if (l.template) {
    const r = spawnSync('python3', ['-I', '-c', 'import ast,sys; ast.parse(sys.stdin.read())'], { input: l.template, encoding: 'utf8' });
    if (r.status !== 0) { bad++; console.error(`✗ lesson ${l.id}: template has a syntax error`); }
  }
}
if (bad) { console.error(`\n${bad} content problem(s)`); process.exit(1); }
console.log('all reference solutions + lesson snippets pass');
