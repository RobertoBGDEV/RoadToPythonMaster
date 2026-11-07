# 🐍 Road to Python Master

A personal, interactive study app for a Java engineer moving to Python and preparing for **SWE II/III interviews** in ~3 months.

Python runs **in your browser** (Pyodide/CPython in a Web Worker), so every lesson snippet and every problem is editable and runnable instantly. Infinite loops are killed after a timeout without freezing the page.

## What's inside
- **Today**: a daily plan (1 concept, 2 new problems, spaced-repetition reviews), streak, XP, per-pattern readiness.
- **Roadmap**: a skill tree across five tracks (Python, algorithm patterns, design patterns/LLD, system design, behavioral). Each node has a week target for a ~12-week plan.
- **Lessons** with "Java ↔ Python" tabs, runnable examples, quick-check quizzes and memorisable pattern templates.
- **Problems** with visible + hidden tests, progressive hints, solution reveal (reduced XP), complexity explanation and notes. Each links to its LeetCode counterpart.
- **Pattern drill**: read a statement, name the technique.
- **Mock interview**: 45 min, 2 problems, no hints, state complexity before submitting.
- **Console**: persistent Python scratchpad.
- **Story bank**: STAR stories for the behavioral round.

## Content (all executed and verified)
- **46 lessons** across 5 tracks, each with runnable snippets, Java ↔ Python tabs and quick-check quizzes.
- **110 problems** across 17 algorithm patterns + low-level design, with hidden tests. Every reference solution is run against its tests in real CPython (`npm run validate`) **and** in the browser's Pyodide (`node scripts/e2e-all-solutions.cjs`).
- A 12-week plan: each lesson has a `week`, and Today shows whether you're on pace for interviews in ~3 months.

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # runs every reference solution & lesson snippet in real python3
npm run build      # validate structure, typecheck, bundle to dist/
npm test           # unit tests (SRS, planning, content graph integrity)
node scripts/e2e.cjs                 # browser smoke test: runner, timeouts, review queue, mock, stories…
node scripts/e2e-all-solutions.cjs   # every reference solution through the real UI + Pyodide
```

## Adding content
Content is data, not code: drop YAML files in `content/lessons/` or `content/problems/` (a file may hold a list). `npm run validate` checks structure, then executes **every reference solution against its tests** and every lesson snippet, so broken content can't ship. See `content/README.md` for the schema.

Progress is stored in your browser's localStorage. Use **Progress → Export backup** regularly.

Deploys to GitHub Pages from `main` (Settings → Pages → Source: GitHub Actions).
