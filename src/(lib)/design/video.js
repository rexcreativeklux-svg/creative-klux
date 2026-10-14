"use client";


/**
 * Video elements (Canva-style) for the design editor.
 *
 * A video is stored on the page as
 *
 *   { type: "video", src, poster, duration, natW, natH,
 *     trimStart, trimEnd, muted, volume, speed, objectFit, borderRadius, flipH, flipV,
 *     crop, borderWidth, borderColor, adjust, filter, loop, autoplay }
 *
 * `loop` is Canva's "Play on repeat"; `autoplay` ("Play automatically",
 * on unless set false) is for previews and presentations, not the editor.
 *
 * `crop`, `adjust`, `filter` and the border mean what they mean on an image —
 * the exporter paints the poster through the image branch, so it honours all
 * of them for free.
 *
 * `poster` is a still frame. It is what every surface that cannot play video
 * paints instead — the PNG/PDF export, the saved thumbnail, the layers list —
 * which is why it is captured once on insert rather than on demand: by export
 * time the video may live on a CDN that refuses to be read back off a canvas.
 *
 * `trimStart` / `trimEnd` are seconds into the source. A missing trimEnd means
 * "to the end", so a video inserted before its duration was known still plays.
 */

export const VIDEO_SPEEDS = [0.25, 0.5, 1, 1.5, 2];

/** Longest edge of a captured poster. Big enough to export cleanly, small
 *  enough that the data URL doesn't bloat the saved design. */
const POSTER_MAX = 960;

/** The playable window of a video element, in source seconds. */
export function clipRange(el) {
  const duration = Number(el?.duration) || 0;
  const start = Math.max(0, Number(el?.trimStart) || 0);
  const rawEnd = Number(el?.trimEnd);
  const end = rawEnd > start ? rawEnd : duration > start ? duration : start;
  return { start, end, length: Math.max(0, end - start) };
}

// ── Talking to a video on the stage ──────────────────────────────────────
//
// The trim bar has to drive the video ON THE CANVAS — show the frame under a
// handle, play the window — and follow its playhead, but that <video> lives
// deep inside one element's render with no ref anyone else can hold. A window
// event per message, addressed by element id, is the whole of the wiring:
//
//   seek   { id, time }           show this frame (pauses playback)
//   toggle { id, from?, to? }     play / pause, optionally within a window
//   time   { id, time, playing }  where the canvas video is (emitted by it)

export function emitVideo(type, detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(`ck-video:${type}`, { detail }));
}

/** Subscribe to one message type for one element; returns the unsubscribe. */
export function onVideo(type, id, fn) {
  const handler = (e) => {
    if (e.detail?.id === id) fn(e.detail);
  };
  window.addEventListener(`ck-video:${type}`, handler);
  return () => window.removeEventListener(`ck-video:${type}`, handler);
}

/**
 * `count` evenly spaced frames from a video, as small JPEG data URLs — the trim
 * bar's filmstrip. Same CORS story as captureVideoFrame: direct first, then the
 * same-origin proxy. Cached by source, since opening trim again shouldn't seek
 * through the whole clip again.
 *
 * @returns {Promise<string[]|null>}
 */
const stripCache = new Map();
export async function captureFilmstrip(src, count = 16) {
  const key = `${src}|${count}`;
  if (stripCache.has(key)) return stripCache.get(key);
  let frames = await grabStrip(src, count);
  if (!frames && /^https?:/.test(src || "")) {
    frames = await grabStrip(`/api/proxy-media?url=${encodeURIComponent(src)}`, count);
  }
  if (frames) stripCache.set(key, frames);
  return frames;
}

function grabStrip(src, count) {
  return withVideo(
    src,
    { crossOrigin: !/^(blob:|data:|\/)/.test(src), timeout: 30000 },
    (video, done) => {
      const frames = [];
      let d = 0;
      const canvas = document.createElement("canvas");
      const next = () => {
        // Middle of each slice, so the first frame isn't a fade from black.
        video.currentTime = Math.min(d - 0.05, ((frames.length + 0.5) / count) * d);
      };
      video.onloadedmetadata = () => {
        d = Number.isFinite(video.duration) ? video.duration : 0;
        if (!d || !video.videoWidth) return done(null);
        canvas.height = 64;
        canvas.width = Math.max(1, Math.round((64 * video.videoWidth) / video.videoHeight));
        next();
      };
      video.onseeked = () => {
        try {
          canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
          frames.push(canvas.toDataURL("image/jpeg", 0.6));
        } catch {
          return done(null); // tainted — no CORS on this source
        }
        if (frames.length >= count) done(frames);
        else next();
      };
    },
  );
}

/** "16.2s" — the length label Canva puts on video tiles and the trim button. */
export function formatSeconds(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return "0s";
  if (n < 60) return `${n.toFixed(1)}s`;
  const m = Math.floor(n / 60);
  const sec = Math.round(n % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * A fresh <video> pointed at `src`, resolved with whatever `onReady` returns.
 * Gives up after `timeout` with null — a slow CDN must never hold an insert
 * hostage, only cost it the extra detail.
 */
function withVideo(src, { crossOrigin = false, timeout = 15000 } = {}, onReady) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const video = document.createElement("video");
    if (crossOrigin) video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    let settled = false;
    const done = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeout);
    video.onerror = () => done(null);
    onReady(video, done);
    video.src = src;
  });
}

/**
 * Size and length of a video. Metadata is readable without CORS, so this works
 * for any URL the browser can play.
 *
 * @returns {Promise<{width: number, height: number, duration: number}|null>}
 */
export function videoMeta(src) {
  return withVideo(src, {}, (video, done) => {
    video.onloadedmetadata = () => {
      if (!video.videoWidth) return done(null);
      done({
        width: video.videoWidth,
        height: video.videoHeight,
        // Some WebM files report Infinity until fully read — treat as unknown.
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
    };
  });
}

/**
 * One still frame as a JPEG data URL, or null when the frame can't be read
 * back even through the media proxy. Blob URLs of a local file always work,
 * which is why uploads capture before they upload.
 *
 * @param {string} src
 * @param {{ time?: number }} [opts] Seconds in; defaults to a beat past any fade from black.
 */
export async function captureVideoFrame(src, opts = {}) {
  const direct = await grabFrame(src, opts);
  if (direct || !/^https?:/.test(src || "")) return direct;
  // The host sent no CORS header, so its frames can't be read back. Our own
  // relay serves the same bytes same-origin. It fetches the whole file, which
  // is why it's only the fallback.
  return grabFrame(`/api/proxy-media?url=${encodeURIComponent(src)}`, opts);
}

function grabFrame(src, { time } = {}) {
  return withVideo(src, { crossOrigin: !/^(blob:|data:|\/)/.test(src) }, (video, done) => {
    video.onloadedmetadata = () => {
      const d = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = Math.min(time ?? Math.min(1, d / 2), Math.max(0, d - 0.05));
    };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, POSTER_MAX / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        done(null);
      }
    };
  });
}
