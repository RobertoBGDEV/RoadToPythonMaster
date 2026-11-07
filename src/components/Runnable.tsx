import { useEffect, useRef, useState } from 'react';
import { Editor } from './Editor';
import { py, type PyState } from '../lib/py';

export function usePyState() {
  const [s, setS] = useState<PyState>(py.state);
  useEffect(() => { const off = py.subscribe(setS); return () => { off(); }; }, []);
  return s;
}

export interface OutLine { text: string; stream: 'stdout' | 'stderr' | 'value' | 'error' }

export function Output({ lines, empty }: { lines: OutLine[]; empty?: string }) {
  if (!lines.length) return <div className="output muted">{empty ?? 'Output appears here (Ctrl/⌘ + Enter to run)'}</div>;
  return (
    <pre className="output">
      {lines.map((l, i) => (
        <div key={i} className={l.stream}>{l.text}</div>
      ))}
    </pre>
  );
}

export async function runToLines(code: string, persist = false): Promise<OutLine[]> {
  const lines: OutLine[] = [];
  const r = await py.run(code, { persist, onOut: (text, stream) => lines.push({ text, stream }) });
  if (r.error) lines.push({ text: r.error, stream: 'error' });
  else if (r.value) lines.push({ text: r.value, stream: 'value' });
  return lines;
}

/** Editable, runnable code block used in lessons. Optionally shows the Java equivalent. */
export function Runnable({ code, java, caption }: { code: string; java?: string; caption?: string }) {
  const [src, setSrc] = useState(code.replace(/\n$/, ''));
  const [lines, setLines] = useState<OutLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [showJava, setShowJava] = useState(false);
  const state = usePyState();
  const running = useRef(false);

  const run = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setLines(await runToLines(src));
    setBusy(false);
    running.current = false;
  };

  return (
    <div className="runnable">
      {caption && <div className="caption">{caption}</div>}
      {java && (
        <div className="tabs">
          <button className={!showJava ? 'on' : ''} onClick={() => setShowJava(false)}>Python</button>
          <button className={showJava ? 'on' : ''} onClick={() => setShowJava(true)}>Java ☕</button>
        </div>
      )}
      {showJava && java ? (
        <pre className="java">{java.replace(/\n$/, '')}</pre>
      ) : (
        <>
          <Editor value={src} onChange={setSrc} onRun={run} />
          <div className="bar">
            <button className="btn primary" onClick={run} disabled={busy}>
              {state === 'loading' ? 'Loading Python…' : busy ? 'Running…' : '▶ Run'}
            </button>
            <button className="btn ghost" onClick={() => { setSrc(code.replace(/\n$/, '')); setLines([]); }}>Reset</button>
          </div>
          <Output lines={lines} />
        </>
      )}
    </div>
  );
}
