import { useState } from 'react';
import { lessonById, problemsForPattern } from '../lib/content';
import { actions, useProgress } from '../lib/progress';
import { Markdown } from '../components/Markdown';
import { Runnable } from '../components/Runnable';
import { TRACKS, type QuizItem } from '../lib/types';
import { Editor } from '../components/Editor';

function Quiz({ id, items }: { id: string; items: QuizItem[] }) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const score = items.filter((q, i) => picked[i] === q.answer).length;
  const all = Object.keys(picked).length === items.length;
  return (
    <section>
      <h2>Quick check</h2>
      {items.map((q, i) => (
        <div key={i} className="card quiz">
          <b>{q.q}</b>
          {q.options.map((o, j) => {
            const chosen = picked[i] === j;
            const reveal = picked[i] !== undefined;
            const cls = reveal ? (j === q.answer ? 'right' : chosen ? 'wrong' : '') : '';
            return (
              <button key={j} className={`opt ${cls}`} disabled={reveal} onClick={() => {
                const next = { ...picked, [i]: j };
                setPicked(next);
                if (Object.keys(next).length === items.length) actions.saveQuiz(id, items.filter((qq, k) => next[k] === qq.answer).length);
              }}>{o}</button>
            );
          })}
          {picked[i] !== undefined && <div className="why">{q.why}</div>}
        </div>
      ))}
      {all && <div className="card">Score: <b>{score}/{items.length}</b></div>}
    </section>
  );
}

export function LessonPage({ id }: { id: string }) {
  const lesson = lessonById.get(id);
  const s = useProgress();
  if (!lesson) return <div className="page">Lesson not found. <a href="#/roadmap">Back to roadmap</a></div>;
  const ps = problemsForPattern(id);
  const done = !!s.lessonsDone[id];
  return (
    <div className="page lesson">
      <a href="#/roadmap" className="muted">← Roadmap</a>
      <div className="tag">{TRACKS[lesson.track].emoji} {TRACKS[lesson.track].label} · {lesson.minutes} min</div>
      <h1>{lesson.title}</h1>
      <p className="lead">{lesson.summary}</p>
      {lesson.sections.map((sec, i) => (
        <div key={i}>
          {sec.md && <Markdown text={sec.md} />}
          {sec.code && <Runnable code={sec.code} java={sec.java} caption={sec.caption} />}
        </div>
      ))}
      {lesson.template && (
        <section>
          <h2>📌 Template to memorise</h2>
          <Editor value={lesson.template.replace(/\n$/, '')} readOnly />
        </section>
      )}
      {lesson.quiz && <Quiz id={id} items={lesson.quiz} />}
      {ps.length > 0 && (
        <section>
          <h2>Practice problems</h2>
          {ps.map((p) => (
            <a key={p.id} className="card link row" href={`#/problem/${p.id}`}>
              <span className={`diff ${p.difficulty}`}>{p.difficulty}</span>
              <b>{p.title}</b>
              <span className="muted">{s.problems[p.id]?.solved ? '✓ solved' : ''}</span>
            </a>
          ))}
        </section>
      )}
      <div className="footer-actions">
        <button className="btn primary" disabled={done} onClick={() => actions.completeLesson(id, lesson.xp)}>
          {done ? '✓ Completed' : `Mark as done (+${lesson.xp ?? 20} XP)`}
        </button>
      </div>
    </div>
  );
}
