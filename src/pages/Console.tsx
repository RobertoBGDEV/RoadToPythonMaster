import { useState } from 'react';
import { Editor } from '../components/Editor';
import { Output, runToLines, usePyState, type OutLine } from '../components/Runnable';
import { py } from '../lib/py';

const START = `# Persistent scratchpad: variables survive between runs.
# The last expression is echoed, like a REPL.
nums = [5, 3, 8, 1]
sorted(nums)
`;

export function ConsolePage() {
  const [code, setCode] = useState(() => { try { return localStorage.getItem('rtpm:scratch') ?? START; } catch { return START; } });
  const [lines, setLines] = useState<OutLine[]>([]);
  const [busy, setBusy] = useState(false);
  const state = usePyState();

  const run = async () => {
    setBusy(true);
    setLines(await runToLines(code, true));
    setBusy(false);
  };
  return (
    <div className="page">
      <h1>Python console</h1>
      <p className="muted">Real CPython (Pyodide) running in your browser. Standard library only. State persists between runs until you reset.</p>
      <Editor value={code} onChange={(v) => { setCode(v); try { localStorage.setItem('rtpm:scratch', v); } catch { /* ignore */ } }} onRun={run} minHeight={260} />
      <div className="bar">
        <button className="btn primary" onClick={run} disabled={busy}>{state === 'loading' ? 'Loading Python…' : busy ? 'Running…' : '▶ Run (Ctrl/⌘+Enter)'}</button>
        <button className="btn ghost" onClick={async () => { await py.resetRepl(); setLines([{ text: 'Session reset.', stream: 'stdout' }]); }}>Reset session</button>
      </div>
      <Output lines={lines} />
    </div>
  );
}
