// Copies the Pyodide runtime from node_modules into public/pyodide so the app is fully self-hosted.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
const src = 'node_modules/pyodide';
const dst = 'public/pyodide';
if (!existsSync(src)) { console.error('pyodide not installed'); process.exit(1); }
mkdirSync(dst, { recursive: true });
for (const f of ['pyodide.js', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json']) {
  cpSync(`${src}/${f}`, `${dst}/${f}`);
}
console.log('pyodide runtime copied to', dst);
