/* Classic Web Worker hosting Pyodide. The main thread terminates and recreates it to
   interrupt runaway code (infinite loops), so the UI never freezes. */
importScripts('pyodide/pyodide.js');

let pyodide = null;
let replGlobals = null;

async function init() {
  pyodide = await loadPyodide({ indexURL: 'pyodide/' });
  const harness = await (await fetch('harness.py')).text();
  pyodide.runPython(harness);
  replGlobals = pyodide.globals.get('dict')();
  postMessage({ type: 'ready' });
}
const ready = init().catch((e) => postMessage({ type: 'fatal', error: String(e) }));

onmessage = async (ev) => {
  await ready;
  const m = ev.data;
  if (m.type === 'reset-repl') {
    replGlobals = pyodide.globals.get('dict')();
    postMessage({ type: 'done', id: m.id });
    return;
  }
  const emit = (stream) => (text) => postMessage({ type: 'out', id: m.id, stream, text });
  pyodide.setStdout({ batched: emit('stdout') });
  pyodide.setStderr({ batched: emit('stderr') });
  try {
    if (m.type === 'run') {
      const g = m.persist ? replGlobals : pyodide.globals.get('dict')();
      const value = await pyodide.runPythonAsync(m.code, { globals: g });
      let shown = null;
      if (value !== undefined && value !== null) {
        shown = pyodide.runPython('repr', { globals: pyodide.globals })(value);
      }
      if (value && value.destroy) value.destroy();
      postMessage({ type: 'done', id: m.id, value: shown });
    } else if (m.type === 'test') {
      pyodide.globals.set('_rtpm_code', m.code);
      pyodide.globals.set('_rtpm_spec', JSON.stringify(m.spec));
      const json = pyodide.runPython('rtpm_run(_rtpm_code, _rtpm_spec)');
      postMessage({ type: 'done', id: m.id, result: JSON.parse(json) });
    }
  } catch (e) {
    let msg = String(e && e.message ? e.message : e);
    // Trim Pyodide's internal frames: keep the part from the user's <exec> frame onwards.
    const idx = msg.indexOf('File "<exec>"');
    if (idx > 0) msg = 'Traceback (most recent call last):\n  ' + msg.slice(idx);
    postMessage({ type: 'done', id: m.id, error: msg.trim() });
  }
};
