import { dueReviews, nextLessons, nextProblems, patternReadiness, week } from '../lib/plan';
import { useProgress, levelFor } from '../lib/progress';
import { computeStreak, dayKey } from '../lib/srs';
import { lessons, problems } from '../lib/content';
import { TRACKS } from '../lib/types';

const DAY = 86_400_000;

export function Today() {
  const s = useProgress();
  const lesson = nextLessons(s, 1)[0];
  const fresh = nextProblems(s, 2);
  const due = dueReviews(s);
  const readiness = patternReadiness(s);
  const solved = Object.values(s.problems).filter((p) => p.solved).length;
  const last14 = Array.from({ length: 14 }, (_, i) => dayKey(Date.now() - (13 - i) * DAY));
  const lv = levelFor(s.xp);
  const daysIn = Math.max(1, Math.ceil((Date.now() - s.startedAt) / DAY));
  const planWeek = Math.min(12, Math.floor((daysIn - 1) / 7) + 1);
  const planned = lessons.filter((l) => week(l) <= planWeek);
  const behind = planned.filter((l) => !s.lessonsDone[l.id]);

  return (
    <div className="page">
      <h1>Today's plan</h1>
      <p className="muted">Learn → try it → solve → review. {solved === 0 ? 'Start with the first concept below.' : `Day ${daysIn} · ${solved}/${problems.length} problems solved.`}</p>

      <div className="grid3">
        <div className="card big"><div className="num">🔥 {computeStreak(s.activeDays)}</div><div className="muted">day streak</div></div>
        <div className="card big"><div className="num">Lv {lv.level}</div><div className="muted">{s.xp} XP</div></div>
        <div className="card big">
          <div className="heat">{last14.map((d) => <i key={d} className={s.activeDays.includes(d) ? 'on' : ''} title={d} />)}</div>
          <div className="muted">last 14 days</div>
        </div>
      </div>

      <div className="card pace">
        <div className="row"><b>Week {planWeek} of 12</b>
          <span className="muted">{planned.length - behind.length}/{planned.length} planned lessons done</span>
          <span className={behind.length === 0 ? 'pill good' : 'pill'}>{behind.length === 0 ? 'on track' : `${behind.length} behind`}</span></div>
        <div className="bar-track"><div style={{ width: `${(planned.length - behind.length) / Math.max(1, planned.length) * 100}%` }} /></div>
        {behind.length > 0 && <div className="muted small">Next up: {behind.slice(0, 3).map((l) => l.title).join(' · ')}</div>}
      </div>

      <section>
        <h2>1 · New concept</h2>
        {lesson ? (
          <a className="card link" href={`#/lesson/${lesson.id}`}>
            <span className="tag">{TRACKS[lesson.track].emoji} {TRACKS[lesson.track].label}</span>
            <h3>{lesson.title}</h3>
            <p>{lesson.summary}</p>
            <span className="muted">{lesson.minutes} min · +{lesson.xp ?? 20} XP</span>
          </a>
        ) : <div className="card">All lessons complete. Switch to mocks and reviews. 🎉</div>}
      </section>

      <section>
        <h2>2 · Solve</h2>
        {fresh.length === 0 && <div className="card muted">Finish a pattern lesson to unlock its problems.</div>}
        {fresh.map((p) => (
          <a key={p.id} className="card link row" href={`#/problem/${p.id}`}>
            <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
            <b>{p.title}</b>
            <span className="muted">{lessons.find((l) => l.id === p.pattern)?.title}</span>
          </a>
        ))}
      </section>

      <section>
        <h2>3 · Review {due.length > 0 && <span className="pill">{due.length} due</span>}</h2>
        {due.length === 0 && <div className="card muted">Nothing due. Solved problems come back after 1, 3, 7, 21 and 60 days.</div>}
        {due.slice(0, 5).map((p) => (
          <a key={p.id} className="card link row" href={`#/problem/${p.id}`}>
            <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
            <b>{p.title}</b>
            <span className="muted">re-solve from scratch</span>
          </a>
        ))}
      </section>

      <section>
        <h2>Pattern readiness</h2>
        <div className="card">
          {readiness.map((r) => (
            <a key={r.lesson.id} className="ready" href={`#/lesson/${r.lesson.id}`}>
              <span>{r.lesson.title}</span>
              <div className="bar-track"><div style={{ width: `${r.pct}%` }} /></div>
              <span className="muted small">{r.solved}/{r.count}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
