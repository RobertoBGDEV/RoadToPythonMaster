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

## Run it
```bash
npm install
npm run dev        # http://localhost:5173
npm run validate   # runs every reference solution & lesson snippet in real python3
npm run build      # validate structure, typecheck, bundle to dist/
node scripts/e2e.cjs   # browser smoke test (needs Playwright + a build)
```

## Adding content
Content is data, not code: drop YAML files in `content/lessons/` or `content/problems/` (a file may hold a list). `npm run validate` checks structure, then executes **every reference solution against its tests** and every lesson snippet, so broken content can't ship. See `content/README.md` for the schema.

Progress is stored in your browser's localStorage. Use **Progress → Export backup** regularly.

Deploys to GitHub Pages from `main` (Settings → Pages → Source: GitHub Actions).
