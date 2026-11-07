import { useState } from 'react';
import { actions, useProgress, type Story } from '../lib/progress';

const TAGS = ['ownership', 'conflict', 'failure', 'impact', 'leadership', 'ambiguity', 'mentoring', 'tight deadline', 'technical depth'];
const QUESTIONS = [
  'Tell me about a time you disagreed with a teammate or manager.',
  'Describe a project you owned end to end. What would you change?',
  'Tell me about a production incident you handled.',
  'When did you make a technical decision with incomplete information?',
  'Tell me about a time you mentored someone.',
  'Describe your biggest failure and what you learned.',
  'Tell me about a time you improved performance or reliability measurably.',
  'How have you influenced a decision outside your team?',
];

const blank = (): Story => ({ id: String(Date.now()), title: '', tags: [], situation: '', task: '', action: '', result: '' });

export function StoriesPage() {
  const s = useProgress();
  const [draft, setDraft] = useState<Story | null>(null);
  const [q, setQ] = useState(() => QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)]);
  const set = (k: keyof Story, v: string) => setDraft((d) => d && { ...d, [k]: v });
  return (
    <div className="page">
      <h1>🗣️ Story bank</h1>
      <p className="muted">At SWE II/III the behavioral round often decides your level. Write 6–8 real stories from your BlackRock work; each should cover several themes. Numbers in the Result make them credible.</p>
      <div className="card">
        <b>Random question</b>
        <p>{q}</p>
        <button className="btn ghost" onClick={() => setQ(QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)])}>Another</button>
      </div>
      {!draft && <button className="btn primary" onClick={() => setDraft(blank())}>+ New story</button>}
      {draft && (
        <div className="card form">
          <input placeholder="Title (e.g. Migrated the risk batch to async pipeline)" value={draft.title} onChange={(e) => set('title', e.target.value)} />
          <div className="chips">{TAGS.map((t) => (
            <button key={t} className={`chip ${draft.tags.includes(t) ? 'on' : ''}`} onClick={() => setDraft({ ...draft, tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] })}>{t}</button>
          ))}</div>
          {(['situation', 'task', 'action', 'result'] as const).map((k) => (
            <label key={k}>{k.toUpperCase()}<textarea rows={3} value={draft[k]} onChange={(e) => set(k, e.target.value)} /></label>
          ))}
          <div className="bar"><button className="btn primary" onClick={() => { if (draft.title.trim()) { actions.saveStory(draft); setDraft(null); } }}>Save</button><button className="btn ghost" onClick={() => setDraft(null)}>Cancel</button></div>
        </div>
      )}
      {s.stories.map((st) => (
        <div key={st.id} className="card">
          <div className="row"><h3 style={{ margin: 0 }}>{st.title}</h3><span className="muted small">{st.tags.join(' · ')}</span>
            <button className="btn ghost" style={{ marginLeft: 'auto' }} onClick={() => setDraft(st)}>Edit</button>
            <button className="btn ghost" onClick={() => confirm('Delete story?') && actions.deleteStory(st.id)}>Delete</button></div>
          <p><b>S</b> {st.situation}</p><p><b>T</b> {st.task}</p><p><b>A</b> {st.action}</p><p><b>R</b> {st.result}</p>
        </div>
      ))}
    </div>
  );
}
