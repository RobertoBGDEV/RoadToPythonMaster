import { useMemo, useState } from 'react';
import { lessonById, sortedProblems } from '../lib/content';
import { useProgress } from '../lib/progress';
import { ProblemWorkspace } from '../components/ProblemWorkspace';
import { problemById, problemsForPattern } from '../lib/content';

export function ProblemList() {
  const s = useProgress();
  const [q, setQ] = useState('');
  const [diff, setDiff] = useState('all');
  const [status, setStatus] = useState('all');
  const [pattern, setPattern] = useState('all');
  const patterns = useMemo(() => [...new Set(sortedProblems.map((p) => p.pattern))], []);
  const list = sortedProblems.filter((p) => {
    const pr = s.problems[p.id];
    if (q && !p.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (diff !== 'all' && p.difficulty !== diff) return false;
    if (pattern !== 'all' && p.pattern !== pattern) return false;
    if (status === 'solved' && !pr?.solved) return false;
    if (status === 'todo' && pr?.solved) return false;
    if (status === 'due' && !(pr?.solved && (pr.due ?? Infinity) <= Date.now())) return false;
    return true;
  });
  return (
    <div className="page">
      <h1>Problems <span className="muted small">{list.length} shown</span></h1>
      <div className="filters">
        <input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
          <option value="all">All patterns</option>
          {patterns.map((p) => <option key={p} value={p}>{lessonById.get(p)?.title ?? p}</option>)}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value)}>
          {['all', 'easy', 'medium', 'hard'].map((d) => <option key={d}>{d}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['all', 'todo', 'solved', 'due'].map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>
      {list.map((p) => {
        const pr = s.problems[p.id];
        return (
          <a key={p.id} className="card link row" href={`#/problem/${p.id}`}>
            <span className="status">{pr?.solved ? '✅' : pr?.attempts ? '🟡' : '⬜'}</span>
            <b>{p.title}</b>
            <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
            <span className="muted">{lessonById.get(p.pattern)?.title}</span>
          </a>
        );
      })}
    </div>
  );
}

export function ProblemPage({ id }: { id: string }) {
  const p = problemById.get(id);
  if (!p) return <div className="page">Problem not found. <a href="#/problems">Back</a></div>;
  const siblings = problemsForPattern(p.pattern);
  const idx = siblings.findIndex((x) => x.id === id);
  const next = siblings[idx + 1];
  return (
    <div className="page wide">
      <div className="row"><a href="#/problems" className="muted">← Problems</a>{next && <a className="muted" href={`#/problem/${next.id}`} style={{ marginLeft: 'auto' }}>Next in pattern: {next.title} →</a>}</div>
      <ProblemWorkspace key={id} problem={p} />
    </div>
  );
}
