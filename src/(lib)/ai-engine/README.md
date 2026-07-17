# Creative-Klux AI Engine

Self-hosted, on-device AI for the Product Studio image tools (Beautifier, Flat
Lay, background removal) **and** the Magic Studio audio tools (Text to Speech,
Audio to Text). Models run **in the user's browser** inside Web Workers — no
third-party AI services, nothing uploaded, no lag. Two runtimes:

- **ONNX Runtime Web** (`/ort/`) for the image models — WebGPU when available,
  WASM everywhere else. (Ported from the Design-Editor engine, same
  architecture, trimmed to the models these tools need.)
- **transformers.js's own bundled ONNX runtime** (`/ort-hf/`, WASM) for the
  audio models (Whisper STT + Kokoro TTS). The two runtimes' `.wasm` files are
  version-matched to their own bundles and must never be mixed.

## One-time setup (every dev, every deploy)

```bash
npm install
npm run models   # downloads model files + copies both ORT runtimes into public/
```

`public/models/`, `public/ort/` and `public/ort-hf/` are git-ignored (big
binaries). If a tool errors with "Couldn't download the AI model", this step was
skipped. (`npm run build` runs it automatically via `prebuild`.)

## How it works

```
core/device.js          WebGPU detection, low-RAM tier selection
core/modelLoader.js     fetch + CacheStorage: each model downloads ONCE, then
                        loads instantly (and offline) forever
core/workerRpc.js       promise-RPC wrapper every task client uses
core/imageSource.js     File/Blob/URL → ImageBitmap (+ /api/proxy-image fallback
                        for image hosts that don't send CORS headers)
models.js               model registry — files, sizes, licenses, normalization,
                        Kokoro voices, Whisper languages

workers/segmentation.worker.js  ONNX U²-Net / IS-Net background removal (WebGPU → WASM)
workers/upscale.worker.js       Real-ESRGAN 4× enhance — TILED (constant RAM,
                                per-tile progress); standard + HD (WebGPU) tiers
workers/enhance.worker.js       algorithmic auto-enhance (no model — canvas math)
workers/tts.worker.js           Kokoro-82M text-to-speech via kokoro-js (WASM)
workers/stt.worker.js           Whisper Base speech-to-text via transformers.js
                                (WASM): REAL language auto-detection, live
                                streamed transcript, timed segments

tasks/removeBackground.js       main-thread client for the segmentation worker
tasks/upscaleImage.js           main-thread client for the upscale worker
tasks/enhanceImage.js           main-thread client for the enhance worker
tasks/grabObjects.js            pure helper — object extraction from cutouts
tasks/synthesizeSpeech.js       main-thread client for the TTS worker
tasks/normalizeSpeechText.js    pure helper — rewrites text into speakable words
tasks/transcribeAudio.js        main-thread client for the STT worker (decodes +
                                resamples audio to 16 kHz mono, then transfers)
tasks/formatTranscript.js       pure helper — plain/punctuated/paragraphs/timestamped
tasks/transcriptExports.js      pure helper — SRT/VTT subtitle builders + filenames

hooks/useAiTool.js       THE shared image-engine hook: result/progress state,
                         dirty flag, local downloads, pluggable `onSave`
hooks/useProductBeautifier.js / useFlatLay.js   image tools on useAiTool
hooks/useTextToSpeech.js / useSpeechToText.js   audio tools (data, not images —
                         standalone hooks with progress + live STT preview)
hooks/toolParams.js      quality tier → model key ladder, size ratios
hooks/sourceCache.js     per-tool source image cache
compose/fitToSize.js     canvas compositing to the chosen aspect
compose/productPalette.js  dominant-color palette from a cutout
```

Low-RAM rules baked in: inference runs in a worker (UI never blocks), one live
model session (LRU of 1, released on model switch), the worker is terminated when
the tool unmounts (zero idle RAM), and giant photos are processed at a capped
~16 MP (upscale caps the input long edge at 1024 → 4096 out).

## Models & licensing (IMPORTANT)

Only commercially-safe licenses here (Apache-2.0 / MIT / BSD). **Never** add
`@imgly/background-removal` (AGPL), BRIA RMBG models (non-commercial), or
CodeFormer (non-commercial).

| Model                     | Task                                           | License      | Size    | Runtime                     |
| ------------------------- | ---------------------------------------------- | ------------ | ------- | --------------------------- |
| `u2netp`                  | background removal (fast tier, ≤2 GB devices)  | Apache-2.0   | 4.6 MB  | ORT Web (`/ort/`)           |
| `silueta`                 | background removal (default)                   | MIT          | 43 MB   | ORT Web (`/ort/`)           |
| `isnet-general-use`       | background removal Premium (WebGPU + >4 GB)    | Apache-2.0   | 179 MB  | ORT Web (`/ort/`)           |
| `realesr-general-x4v3`    | 4× enhance/upscale (standard)                  | BSD-3-Clause | 4.9 MB  | ORT Web (`/ort/`)           |
| `realesrgan-x4plus`       | 4× enhance HD tier (WebGPU only)               | BSD-3-Clause | 67 MB   | ORT Web (`/ort/`)           |
| `kokoro` (q8, +28 voices) | text to speech (English, 28 voices)            | Apache-2.0   | ~93 MB  | kokoro-js / transformers.js (`/ort-hf/`) |
| `whisper-base` (q8)       | speech to text (multilingual, detect + transcribe) | MIT      | ~77 MB  | transformers.js (`/ort-hf/`) |

Notes:

- **Whisper language auto-detect is implemented in our worker**, not the
  library: transformers.js silently forces English when no language is passed,
  so `stt.worker.js` runs a one-token detection pass first and then forces the
  detected language for the whole run.
- The Kokoro voice embeddings (28 × ~0.5 MB `.bin`) are copied out of the
  `kokoro-js` npm package by `npm run models`, and pre-seeded into the
  `kokoro-voices` CacheStorage bucket so nothing is fetched from huggingface.co.

To point models at a CDN instead of `public/models/`, change `MODEL_BASE_PATH`
in [models.js](models.js) — nothing else needs to change.
