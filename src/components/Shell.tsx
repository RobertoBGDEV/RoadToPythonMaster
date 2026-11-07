import type { ReactNode } from 'react';
import { levelFor, useProgress } from '../lib/progress';
import { computeStreak } from '../lib/srs';
import { usePyState } from './Runnable';

const NAV: [string, string, string][] = [
  ['today', '🏠', 'Today'],
  ['roadmap', '🗺️', 'Roadmap'],
  ['problems', '🧩', 'Problems'],
  ['drill', '⚡', 'Pattern drill'],
  ['mock', '⏱️', 'Mock interview'],
  ['console', '💻', 'Console'],
  ['stories', '🗣️', 'Story bank'],
  ['settings', '⚙️', 'Progress'],
];

export function Shell({ route, children }: { route: string; children: ReactNode }) {
  const s = useProgress();
  const lv = levelFor(s.xp);
  const streak = computeStreak(s.activeDays);
  const py = usePyState();
  return (
    <div className="layout">
      <aside className="side">
        <a className="brand" href="#/today">🐍 Road to <b>Python Master</b></a>
        <nav>
          {NAV.map(([id, icon, label]) => (
            <a key={id} href={`#/${id}`} className={route === id ? 'active' : ''}>{icon} {label}</a>
          ))}
        </nav>
        <div className="stats">
          <div>🔥 <b>{streak}</b> day streak</div>
          <div>Lv <b>{lv.level}</b> · {s.xp} XP</div>
          <div className="bar-track"><div style={{ width: `${(lv.into / lv.span) * 100}%` }} /></div>
          <div className="muted small">Python: {py === 'loading' ? 'loading…' : py === 'failed' ? 'failed ✗' : 'ready ✓'}</div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
