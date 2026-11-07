import { useRef } from 'react';
import { actions, useProgress } from '../lib/progress';
import { problems, lessons } from '../lib/content';

export function SettingsPage() {
  const s = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const download = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([actions.exportJson()], { type: 'application/json' }));
    a.download = `rtpm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };
  return (
    <div className="page">
      <h1>Progress & backup</h1>
      <div className="grid3">
        <div className="card big"><div className="num">{Object.keys(s.lessonsDone).length}/{lessons.length}</div><div className="muted">lessons</div></div>
        <div className="card big"><div className="num">{Object.values(s.problems).filter((p) => p.solved).length}/{problems.length}</div><div className="muted">problems</div></div>
        <div className="card big"><div className="num">{s.mocks.length}</div><div className="muted">mock interviews</div></div>
      </div>
      <p className="muted">Progress lives in this browser only. Export a backup regularly, especially before clearing site data.</p>
      <div className="bar">
        <button className="btn primary" onClick={download}>Export backup</button>
        <button className="btn" onClick={() => file.current?.click()}>Import backup</button>
        <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try { actions.importJson(await f.text()); alert('Imported.'); } catch (err) { alert(String(err)); }
        }} />
        <button className="btn ghost" onClick={() => confirm('Erase ALL progress?') && actions.reset()}>Reset everything</button>
      </div>
    </div>
  );
}
