import { useEffect, useState } from 'react';
import { problems } from '../lib/content';
import { actions, useProgress } from '../lib/progress';
import { ProblemWorkspace } from '../components/ProblemWorkspace';
import type { Problem } from '../lib/types';

function pickSet(): Problem[] {
  const by = (d: string) => problems.filter((p) => p.difficulty === d).sort(() => Math.random() - 0.5);
  const med = by('medium'), easy = by('easy'), hard = by('hard');
  return [(easy[0] ?? med[0]), (med[0] ?? easy[1]), ...(Math.random() < 0.3 && hard[0] ? [hard[0]] : [])].filter(Boolean).slice(0, 2);
}

export function MockPage() {
  const s = useProgress();
  const [set, setSet] = useState<Problem[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [solved, setSolved] = useState<Set<string>>(new Set());
  const [left, setLeft] = useState(45 * 60);
  const [over, setOver] = useState(false);

  useEffect(() => {
    if (!set || over) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [set, over]);
  useEffect(() => { if (set && left === 0) finish(); /* eslint-disable-next-line */ }, [left]);

  const finish = () => {
    if (over || !set) return;
    setOver(true);
    actions.recordMock({ at: Date.now(), problems: set.map((p) => p.id), solved: solved.size, minutes: Math.round((45 * 60 - left) / 60) });
  };

  if (!set) {
    return (
      <div className="page">
        <h1>⏱️ Mock interview</h1>
        <p>45 minutes · 2 problems · no hints · no solution · you must state complexity before submitting. Think aloud like the interviewer is watching.</p>
        <button className="btn primary" disabled={problems.length < 2} onClick={() => setSet(pickSet())}>Start mock</button>
        <h2>History</h2>
        {s.mocks.length === 0 && <p className="muted">No mocks yet.</p>}
        {[...s.mocks].reverse().map((m) => (
          <div key={m.at} className="card row"><b>{new Date(m.at).toLocaleString()}</b><span>{m.solved}/{m.problems.length} solved</span><span className="muted">{m.minutes} min</span></div>
        ))}
      </div>
    );
  }
  if (over) {
    return (
      <div className="page">
        <h1>Mock finished</h1>
        <div className="card big"><div className="num">{solved.size}/{set.length}</div><div className="muted">solved · +{solved.size * 40} XP</div></div>
        <button className="btn primary" onClick={() => { setSet(null); setSolved(new Set()); setLeft(45 * 60); setOver(false); setIdx(0); }}>Back</button>
      </div>
    );
  }
  const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
  return (
    <div className="page wide">
      <div className="row">
        <div className={`clock ${left < 300 ? 'danger' : ''}`}>{mm}:{ss}</div>
        {set.map((p, i) => <button key={p.id} className={`btn ${i === idx ? 'primary' : 'ghost'}`} onClick={() => setIdx(i)}>{solved.has(p.id) ? '✓ ' : ''}Problem {i + 1}</button>)}
        <button className="btn ghost" style={{ marginLeft: 'auto' }} onClick={finish}>Finish</button>
      </div>
      <ProblemWorkspace key={set[idx].id} problem={set[idx]} mock onSolved={() => setSolved((x) => new Set(x).add(set[idx].id))} />
    </div>
  );
}
