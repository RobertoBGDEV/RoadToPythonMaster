import type { RunReport } from './types';

type Listener = (state: PyState) => void;
export type PyState = 'loading' | 'ready' | 'busy' | 'failed';

interface Pending {
  resolve: (v: any) => void;
  onOut?: (text: string, stream: 'stdout' | 'stderr') => void;
}

/** Thin client around the Pyodide Web Worker. Terminates + restarts the worker on timeout. */
class PyRunner {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  state: PyState = 'loading';
  private listeners = new Set<Listener>();

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private setState(s: PyState) {
    this.state = s;
    this.listeners.forEach((l) => l(s));
  }

  private start() {
    if (this.ready) return this.ready;
    this.setState('loading');
    const url = `${import.meta.env.BASE_URL}py-worker.js`;
    const w = new Worker(url);
    this.worker = w;
    this.ready = new Promise<void>((resolve, reject) => {
      w.onmessage = (ev) => {
        const m = ev.data;
        if (m.type === 'ready') {
          this.setState('ready');
          resolve();
        } else if (m.type === 'fatal') {
          this.setState('failed');
          reject(new Error(m.error));
        } else if (m.type === 'out') {
          this.pending.get(m.id)?.onOut?.(m.text, m.stream);
        } else if (m.type === 'done') {
          const p = this.pending.get(m.id);
          this.pending.delete(m.id);
          p?.resolve(m);
        }
      };
      w.onerror = (e) => {
        this.setState('failed');
        reject(new Error(e.message));
      };
    });
    return this.ready;
  }

  warmUp() {
    void this.start().catch(() => {});
  }

  private restart() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    for (const p of this.pending.values()) p.resolve({ type: 'done', error: 'Interrupted' });
    this.pending.clear();
    this.warmUp();
  }

  private async send(msg: Record<string, unknown>, timeoutMs: number, onOut?: Pending['onOut']) {
    await this.start();
    const id = this.nextId++;
    this.setState('busy');
    return new Promise<any>((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id); // so restart() doesn't resolve it with a generic message first
        this.restart();
        resolve({ type: 'done', id, timedOut: true, error: `Time limit exceeded (${timeoutMs / 1000}s). Infinite loop?` });
      }, timeoutMs);
      this.pending.set(id, {
        onOut,
        resolve: (v) => {
          clearTimeout(timer);
          if (this.state === 'busy') this.setState('ready');
          resolve(v);
        },
      });
      this.worker!.postMessage({ ...msg, id });
    });
  }

  run(code: string, opts: { persist?: boolean; timeoutMs?: number; onOut?: Pending['onOut'] } = {}) {
    return this.send({ type: 'run', code, persist: !!opts.persist }, opts.timeoutMs ?? 10000, opts.onOut) as Promise<{
      error?: string;
      value?: string | null;
      timedOut?: boolean;
    }>;
  }

  async test(code: string, spec: unknown, timeoutMs = 15000): Promise<RunReport & { timedOut?: boolean }> {
    const r = await this.send({ type: 'test', code, spec }, timeoutMs);
    if (r.result) return r.result;
    return { error: r.error ?? 'Unknown error', results: [], timedOut: r.timedOut };
  }

  resetRepl() {
    return this.send({ type: 'reset-repl' }, 5000);
  }
}

export const py = new PyRunner();
