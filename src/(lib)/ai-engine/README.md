# Creative-Klux AI Engine

Self-hosted, on-device AI for the Product Photos tools. Models run **in the
user's browser** (ONNX Runtime Web: WebGPU when available, WASM everywhere else)
inside Web Workers — no third-party AI services, nothing uploaded, no lag. Ported
from the Design-Editor engine (same architecture), trimmed to the models these
tools need.

## One-time setup (every dev, every deploy)

```bash
npm install
npm run models   # downloads model files + copies the ORT runtime into public/
```

`public/models/` and `public/ort/` are git-ignored (big binaries). If a tool
errors with "Couldn't download the AI model", this step was skipped. (`npm run
build` runs it automatically via `prebuild`.)

## How it works

```
core/device.js          WebGPU detection, low-RAM tier selection
core/modelLoader.js     fetch + CacheStorage: each model downloads ONCE, then
                        loads instantly (and offline) forever
core/workerRpc.js       promise-RPC wrapper every task client uses
core/imageSource.js     File/Blob/URL → ImageBitmap (+ /api/proxy-image fallback
                        for image hosts that don't send CORS headers)
models.js               model registry — files, sizes, licenses, normalization
workers/segmentation.worker.js  ONNX U²-Net background removal (WebGPU → WASM)
workers/upscale.worker.js       Real-ESRGAN 4× enhance — TILED (constant RAM,
                                per-tile progress); standard + HD (WebGPU) tiers
tasks/removeBackground.js       main-thread client for the segmentation worker
tasks/upscaleImage.js           main-thread client for the upscale worker
hooks/useAiTool.js      THE shared engine hook: result/progress state, dirty
                        flag, local downloads (background baked in), and a
                        pluggable `onSave` (the app owns persistence + the
                        logged-out redirect-and-return flow).
```

Low-RAM rules baked in: inference runs in a worker (UI never blocks), one live
model session (LRU of 1, released on model switch), the worker is terminated when
the tool unmounts (zero idle RAM), and giant photos are processed at a capped
~16 MP (upscale caps the input long edge at 1024 → 4096 out).

## Models & licensing (IMPORTANT)

Only commercially-safe licenses here (Apache-2.0 / MIT / BSD). **Never** add
`@imgly/background-removal` (AGPL), BRIA RMBG models (non-commercial), or
CodeFormer (non-commercial).

| Model | Task | License | Size |
|---|---|---|---|
| `u2netp` | background removal (fast tier, ≤2 GB devices) | Apache-2.0 | 4.6 MB |
| `silueta` | background removal (default) | MIT | 43 MB |
| `realesr-general-x4v3` | 4× enhance/upscale (standard) | BSD-3-Clause | 4.9 MB |
| `realesrgan-x4plus` | 4× enhance HD tier (WebGPU only) | BSD-3-Clause | 67 MB |

The **Ghost Mannequin depth model** (Depth Anything V2 Small, Apache-2.0) runs
through transformers.js and is added in that tool's phase — not wired here yet.

To point models at a CDN instead of `public/models/`, change `MODEL_BASE_PATH`
in [models.js](models.js) — nothing else needs to change.

Plan: `~/.claude/plans/creative-klux-ondevice-product-tools-plan.md`.
