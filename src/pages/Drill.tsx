import { useMemo, useState } from 'react';
import { lessons, problems } from '../lib/content';
import { actions, useProgress } from '../lib/progress';
import { Markdown } from '../components/Markdown';

/** Read a statement, name the pattern in 30 seconds. The interview skill that separates pass from fail. */
export function DrillPage() {
  const s = useProgress();
  const patterns = useMemo(() => lessons.filter((l) => l.track === 'algo' && problems.some((p) => p.pattern === l.id)), []);
  const [seed, setSeed] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const q = useMemo(() => {
    const pool = problems.filter((x) => patterns.some((l) => l.id === x.pattern));
    const p = pool[Math.floor(Math.random() * pool.length)];
    const wrong = patterns.filter((l) => l.id !== p.pattern).sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...wrong, patterns.find((l) => l.id === p.pattern)!].filter(Boolean).sort(() => Math.random() - 0.5);
    return { p, options };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, patterns]);

  const answer = (id: string) => {
    if (picked) return;
    setPicked(id);
    actions.recordDrill(q.p.pattern, id === q.p.pattern);
  };
  return (
    <div className="page">
      <h1>⚡ Pattern drill</h1>
      <p className="muted">Don't code. Read the statement and name the technique. Score: <b>{s.drill.right}/{s.drill.total}</b></p>
      <div className="card">
        <Markdown text={q.p.statement.split('\n\n').slice(0, 2).join('\n\n')} />
      </div>
      <div className="options">
        {q.options.map((o) => (
          <button key={o.id} className={`opt ${picked ? (o.id === q.p.pattern ? 'right' : o.id === picked ? 'wrong' : '') : ''}`} onClick={() => answer(o.id)}>{o.title}</button>
        ))}
      </div>
      {picked && (
        <div className="card">
          <b>{q.p.title}</b> → <b>{lessons.find((l) => l.id === q.p.pattern)?.title}</b>
          <div className="footer-actions">
            <button className="btn primary" onClick={() => { setPicked(null); setSeed(seed + 1); }}>Next</button>
            <a className="btn ghost" href={`#/problem/${q.p.id}`}>Open problem</a>
          </div>
        </div>
      )}
    </div>
  );
}
