import type { RunReport } from '../lib/types';

const fmt = (v: unknown) => (typeof v === 'string' ? JSON.stringify(v) : JSON.stringify(v));

export function TestResults({ report, timedOut }: { report: RunReport; timedOut?: boolean }) {
  if (report.error) return <pre className="output error">{report.error}</pre>;
  const passed = report.results.filter((r) => r.ok).length;
  const total = report.results.length;
  return (
    <div className="tests">
      <div className={`summary ${passed === total ? 'good' : 'bad'}`}>
        {passed === total ? '✅ All tests passed' : `❌ ${passed}/${total} passed`}
        {timedOut && ' (timed out)'}
      </div>
      {report.results.map((r, i) => (
        <details key={i} className={`case ${r.ok ? 'ok' : 'fail'}`} open={!r.ok && !r.hidden && report.results.findIndex((x) => !x.ok) === i}>
          <summary>
            {r.ok ? '✓' : '✗'} Test {i + 1}{r.hidden ? ' (hidden)' : ''} <span className="muted">{r.ms} ms</span>
          </summary>
          {r.hidden && !r.ok ? (
            <div className="muted">Hidden test failed. Think about edge cases: empty input, duplicates, negatives, large n.</div>
          ) : (
            <div className="detail">
              <div><b>Input</b> <code>{fmt(r.input)}</code></div>
              <div><b>Expected</b> <code>{fmt(r.expected)}</code></div>
              <div><b>Got</b> <code>{r.error ? '—' : fmt(r.actual)}</code></div>
              {r.error && <pre className="output error">{r.error}</pre>}
              {r.stdout && <pre className="output">{r.stdout}</pre>}
            </div>
          )}
        </details>
      ))}
    </div>
  );
}
