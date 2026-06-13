// Dedicated worker for background removal so the heavy WASM inference runs off the
// main thread (keeps the spinner/progress responsive). The main thread posts a File
// (or Blob); we run removeBackground here and post progress + the result blob back.
import { removeBackground } from '@imgly/background-removal';

self.onmessage = async (e) => {
  const { id, file } = e.data || {};
  if (id == null || !file) return;
  try {
    const blob = await removeBackground(file, {
      model: 'isnet_fp16', // half-precision: ~2x faster + smaller download, no visible quality loss
      progress: (key, current, total) => {
        self.postMessage({ id, type: 'progress', current, total });
      },
    });
    self.postMessage({ id, type: 'done', blob });
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err?.message || String(err) });
  }
};
