"use client";

import { SHAPES, PRIMITIVE_SHAPES } from "./shapes";
import { waitForFonts } from "./fonts";

/**
 * renderDesignToBlob — paints a { canvas, elements } design to an offscreen
 * canvas and returns a PNG Blob. Mirrors the on-screen EditorElement rendering.
 *
 * Remote (http/https) image sources are routed through /api/proxy-image so the
 * canvas stays untainted (a tainted canvas can't be exported).
 */

function proxiedSrc(src) {
  if (typeof src !== "string") return src;
  if (/^(data:|blob:)/.test(src)) return src;
  if (/^https?:/.test(src)) {
    return `/api/proxy-image?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = proxiedSrc(src);
  });
}

export async function renderDesignToCanvas({ canvas, elements }) {
  // Ensure any custom fonts used by text elements are loaded before painting —
  // canvas fillText silently falls back to a default if the font isn't ready.
  const families = (elements || [])
    .filter((el) => el.type === "text" && el.fontFamily)
    .map((el) => el.fontFamily);
  if (families.length) await waitForFonts(families);

  const cnv = document.createElement("canvas");
  cnv.width = canvas.width;
  cnv.height = canvas.height;
  const ctx = cnv.getContext("2d");

  const bg = canvas.background || "#ffffff";
  const bgIsImage = typeof bg === "string" && /^(https?:|data:|blob:)/.test(bg);
  if (bgIsImage) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    try {
      const img = await loadImage(bg);
      drawCover(ctx, img, 0, 0, canvas.width, canvas.height);
    } catch {
      /* leave white */
    }
  } else {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  for (const el of elements || []) {
    if (el.hidden) continue;
    ctx.save();
    ctx.globalAlpha = el.opacity ?? 1;

    if (el.rotation) {
      const rcx = el.x + (el.width || 0) / 2;
      const rcy = el.y + (el.height || 0) / 2;
      ctx.translate(rcx, rcy);
      ctx.rotate((el.rotation * Math.PI) / 180);
      ctx.translate(-rcx, -rcy);
    }

    if (el.type === "shape" && !PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
      // Library shape: map its viewBox onto the element box and draw the path.
      const def = SHAPES[el.shape];
      const [vw, vh] = def.viewBox;
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.scale(el.width / vw, el.height / vh);
      const p = new Path2D(def.path);
      if (def.kind === "stroke") {
        ctx.strokeStyle = el.fill || "#111111";
        ctx.lineWidth = def.strokeW || 3;
        ctx.lineCap = def.cap || "butt";
        if (def.dash) ctx.setLineDash(def.dash);
        ctx.stroke(p);
      } else {
        ctx.fillStyle = el.fill || "#6366f1";
        ctx.fill(p);
        if (el.strokeWidth && el.stroke) {
          ctx.strokeStyle = el.stroke;
          ctx.lineWidth = el.strokeWidth;
          ctx.stroke(p);
        }
      }
      ctx.restore();
    } else if (el.type === "shape") {
      ctx.fillStyle = el.fill || "transparent";
      ctx.strokeStyle = el.stroke || "transparent";
      ctx.lineWidth = el.strokeWidth || 0;

      if (el.shape === "circle") {
        const rx = (el.width || 0) / 2;
        const ry = (el.height || 0) / 2;
        ctx.beginPath();
        ctx.ellipse(el.x + rx, el.y + ry, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        if (el.strokeWidth) ctx.stroke();
      } else if (el.shape === "triangle") {
        const w = el.width || 0;
        const h = el.height || 0;
        ctx.beginPath();
        ctx.moveTo(el.x + w / 2, el.y);
        ctx.lineTo(el.x + w, el.y + h);
        ctx.lineTo(el.x, el.y + h);
        ctx.closePath();
        ctx.fill();
        if (el.strokeWidth) ctx.stroke();
      } else {
        const r = el.borderRadius || 0;
        ctx.beginPath();
        if (r && ctx.roundRect) ctx.roundRect(el.x, el.y, el.width, el.height, r);
        else ctx.rect(el.x, el.y, el.width, el.height);
        ctx.fill();
        if (el.strokeWidth) ctx.stroke();
      }
    }

    if (el.type === "text") {
      const size = el.fontSize || 16;
      const weight = el.fontWeight || "normal";
      const align = el.textAlign || "left";
      const family = el.fontFamily || "'DM Sans', sans-serif";
      ctx.font = `${el.fontStyle || "normal"} ${weight} ${size}px ${family}`;
      ctx.fillStyle = el.fill || el.color || "#111111";
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";

      const x =
        align === "center"
          ? el.x + (el.width || 0) / 2
          : align === "right"
            ? el.x + (el.width || 0)
            : el.x;

      const value =
        typeof el.content === "string"
          ? el.content
          : typeof el.text === "string"
            ? el.text
            : "";

      // Word-wrap within element width; honor explicit newlines.
      const lineMaxW = el.width || 9999;
      const paragraphs = value.split("\n");
      const lineH = size * 1.3;
      let lineY = el.y + size;
      for (const para of paragraphs) {
        const words = para.split(/\s+/).filter(Boolean);
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > lineMaxW && line) {
            ctx.fillText(line, x, lineY);
            line = word;
            lineY += lineH;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line, x, lineY);
        lineY += lineH;
      }
    }

    if (el.type === "image" && el.src) {
      try {
        const img = await loadImage(el.src);
        if (el.objectFit === "contain") {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } else {
          drawCover(ctx, img, el.x, el.y, el.width, el.height);
        }
      } catch {
        /* skip broken image */
      }
    }

    ctx.restore();
  }

  return cnv;
}

/** Draw an image with object-fit: cover into the target box. */
function drawCover(ctx, img, dx, dy, dw, dh) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (ir > tr) {
    sw = img.height * tr;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / tr;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

export async function renderDesignToBlob(design, type = "image/png") {
  const cnv = await renderDesignToCanvas(design);
  return new Promise((resolve, reject) => {
    cnv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type);
  });
}
