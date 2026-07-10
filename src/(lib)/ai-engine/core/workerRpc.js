// Tiny promise-RPC wrapper around a Web Worker, shared by every AI engine
// task client. One lazily-spawned worker per client; each `call` gets an id,
// streams `progress` messages to its own callback, and resolves on `done`.
//
// Worker message contract (what the workers in ../workers/ implement):
//   in : { id, ...payload }
//   out: { id, type: "progress", ... } | { id, type: "done", ... } | { id, type: "error", message }

/**
 * @param {() => Worker} createWorker Factory so the Worker URL stays in the
 *   calling module (the bundler needs `new URL(...)` to be statically analyzable).
 * @param {string} name For log lines, e.g. "segmentation".
 */
export function createWorkerClient(createWorker, name) {
  let worker = null;
  let nextId = 1;
  /** In-flight requests by id → { resolve, reject, onProgress }. */
  const pending = new Map();

  function ensureWorker() {
    if (worker) return worker;
    console.log(`🧵 AI engine: starting ${name} worker`);
    worker = createWorker();
    worker.onmessage = (event) => {
      const { id, type, ...payload } = event.data;
      const request = pending.get(id);
      if (!request) return; // superseded / already cancelled
      if (type === "progress") {
        request.onProgress?.(payload);
      } else if (type === "done") {
        pending.delete(id);
        request.resolve(payload);
      } else if (type === "error") {
        pending.delete(id);
        request.reject(new Error(payload.message));
      }
    };
    worker.onerror = (event) => {
      // A crashed worker fails everything in flight; the next call starts fresh.
      console.error(`❌ AI engine: ${name} worker crashed:`, event.message);
      for (const request of pending.values()) {
        request.reject(new Error(event.message || "The AI engine crashed."));
      }
      pending.clear();
      dispose();
    };
    return worker;
  }

  /**
   * Post a task and await its result.
   * @param {object} payload Task fields (the worker reads `task` + params).
   * @param {Transferable[]} [transfer] e.g. an ImageBitmap (zero-copy).
   * @param {(p: object) => void} [onProgress]
   */
  function call(payload, transfer = [], onProgress) {
    const id = nextId;
    nextId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onProgress });
      ensureWorker().postMessage({ id, ...payload }, transfer);
    });
  }

  /** Terminate the worker (and any model session it holds). */
  function dispose() {
    if (!worker) return;
    console.log(`🧹 AI engine: ${name} worker disposed`);
    worker.terminate();
    worker = null;
  }

  return { call, dispose };
}
