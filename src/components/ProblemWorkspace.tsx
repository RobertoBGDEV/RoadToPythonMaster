import { useEffect, useMemo, useRef, useState } from 'react';
import { Editor } from './Editor';
import { Markdown } from './Markdown';
import { TestResults } from './TestResults';
import { usePyState } from './Runnable';
import { py } from '../lib/py';
import { problemSpec, lessonById } from '../lib/content';
import { actions, useProgress } from '../lib/progress';
import type { Problem, RunReport } from '../lib/types';

interface Props {
  problem: Problem;
  mock?: boolean; // interview mode: no hints/solution, must state complexity before submitting
  onSolved?: () => void;
}

export function ProblemWorkspace({ problem, mock, onSolved }: Props) {
  const s = useProgress();
  const prog = s.problems[problem.id];
  const [code, setCode] = useState(mock ? problem.starter : prog?.code ?? problem.starter);
  const [report, setReport] = useState<(RunReport & { timedOut?: boolean }) | null>(null);
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null);
  const [hints, setHints] = useState(0);
  const [showSol, setShowSol] = useState(false);
  const [complexity, setComplexity] = useState('');
  const [solvedNow, setSolvedNow] = useState(false);
  const started = useRef(Date.now());
  const pyState = usePyState();
  const spec = useMemo(() => problemSpec(problem), [problem]);
  const timer = useRef<number>();

  useEffect(() => { py.warmUp(); }, []);

  const onChange = (v: string) => {
    setCode(v);
    if (mock) return;
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => actions.saveDraft(problem.id, v), 600);
  };

  const run = async (all: boolean) => {
    if (busy) return;
    if (all && mock && !complexity.trim()) {
      alert('Interview rule: state your time & space complexity before you submit.');
      return;
    }
    setBusy(all ? 'submit' : 'run');
    const sp = all ? spec : { ...spec, tests: spec.tests.filter((t) => !t.hidden) };
    const rep = await py.test(code, sp);
    setReport(rep);
    setBusy(null);
    if (all) {
      const passed = !rep.error && rep.results.length > 0 && rep.results.every((r) => r.ok);
      const ms = Date.now() - started.current;
      actions.recordAttempt(problem.id, passed, problem.difficulty, passed ? ms : undefined, showSol);
      if (passed) { setSolvedNow(true); onSolved?.(); }
    }
  };

  const solved = prog?.solved || solvedNow;
  const lesson = lessonById.get(problem.pattern);

  return (
    <div className="workspace">
      <div className="pane statement">
        <div className="row">
          <span className={`diff ${problem.difficulty}`}>{problem.difficulty}</span>
          {lesson && <a className="tag" href={`#/lesson/${lesson.id}`}>{lesson.title}</a>}
          {problem.leetcode && <a className="muted small" href={problem.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a>}
          {solved && <span className="pill good">solved</span>}
        </div>
        <h1>{problem.title}</h1>
        <Markdown text={problem.statement} />
        {!mock && (
          <>
            <h3>Hints</h3>
            {problem.hints?.slice(0, hints).map((h, i) => <div key={i} className="hint">💡 {h}</div>)}
            {(problem.hints?.length ?? 0) > hints && (
              <button className="btn ghost" onClick={() => setHints(hints + 1)}>Show hint {hints + 1}/{problem.hints!.length}</button>
            )}
            <h3>Solution</h3>
            {!showSol ? (
              <button className="btn ghost" onClick={() => { if (confirm('Peek at the solution? You get reduced XP for it.')) setShowSol(true); }}>
                Reveal solution
              </button>
            ) : (
              <div>
                <Editor value={problem.solution.replace(/\n$/, '')} readOnly />
                <p><b>Complexity:</b> {problem.complexity}</p>
                {problem.explain && <Markdown text={problem.explain} />}
              </div>
            )}
            {solved && !showSol && (
              <div className="card good-card">
                <b>Complexity:</b> {problem.complexity}
                {problem.explain && <Markdown text={problem.explain} />}
              </div>
            )}
            <h3>Notes</h3>
            <textarea className="notes" placeholder="What was the trick? What did you get wrong?" defaultValue={s.notes[problem.id] ?? ''} onBlur={(e) => actions.saveNote(problem.id, e.target.value)} />
          </>
        )}
      </div>
      <div className="pane coding">
        <Editor value={code} onChange={onChange} onRun={() => run(false)} minHeight={320} />
        {mock && (
          <input className="complexity" placeholder="State complexity first, e.g. O(n) time, O(n) space" value={complexity} onChange={(e) => setComplexity(e.target.value)} />
        )}
        <div className="bar">
          <button className="btn" onClick={() => run(false)} disabled={!!busy}>
            {pyState === 'loading' ? 'Loading Python…' : busy === 'run' ? 'Running…' : '▶ Run examples'}
          </button>
          <button className="btn primary" onClick={() => run(true)} disabled={!!busy}>
            {busy === 'submit' ? 'Judging…' : '✔ Submit (all tests)'}
          </button>
          {!mock && <button className="btn ghost" onClick={() => { if (confirm('Reset to starter code?')) { setCode(problem.starter); actions.saveDraft(problem.id, problem.starter); } }}>Reset</button>}
          <span className="muted small">Ctrl/⌘+Enter runs examples</span>
        </div>
        {report && <TestResults report={report} timedOut={report.timedOut} />}
      </div>
    </div>
  );
}
