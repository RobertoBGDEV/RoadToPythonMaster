import { lessonById, lessons, problemsForPattern, trackOrder } from '../lib/content';
import { isUnlocked, week } from '../lib/plan';
import { useProgress } from '../lib/progress';
import { TRACKS } from '../lib/types';

export function Roadmap() {
  const s = useProgress();
  return (
    <div className="page">
      <h1>Roadmap</h1>
      <p className="muted">A skill tree, not a syllabus: tracks run in parallel and nodes unlock when their prerequisites are done. Locked nodes are still open if you want to jump ahead.</p>
      {trackOrder.map((t) => {
        const ls = lessons.filter((l) => l.track === t).sort((a, b) => week(a) - week(b));
        if (!ls.length) return null;
        const done = ls.filter((l) => s.lessonsDone[l.id]).length;
        return (
          <section key={t}>
            <h2>{TRACKS[t].emoji} {TRACKS[t].label} <span className="muted small">{done}/{ls.length}</span></h2>
            <p className="muted">{TRACKS[t].blurb}</p>
            <div className="nodes">
              {ls.map((l) => {
                const status = s.lessonsDone[l.id] ? 'done' : isUnlocked(l, s) ? 'open' : 'locked';
                const ps = problemsForPattern(l.id);
                const solved = ps.filter((p) => s.problems[p.id]?.solved).length;
                return (
                  <a key={l.id} href={`#/lesson/${l.id}`} className={`node ${status}`}>
                    <span className="wk">W{week(l)}</span>
                    <b>{status === 'done' ? '✓ ' : status === 'locked' ? '🔒 ' : ''}{l.title}</b>
                    <span className="muted small">{l.minutes} min{ps.length ? ` · ${solved}/${ps.length} problems` : ''}</span>
                    {status === 'locked' && (
                      <span className="muted small">after: {(l.requires ?? []).filter((r) => !s.lessonsDone[r]).map((r) => lessonById.get(r)?.title ?? r).join(', ')}</span>
                    )}
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
