"use client";

import { SHAPES, PRIMITIVE_SHAPES, lineShaftPath } from "./shapes";
import { waitForFonts } from "./fonts";
import { pointsToPath } from "./drawUtils";
import { curvePath } from "./curveUtils";
import { radiusCorners } from "./radius";
import { frameGeo } from "./frames";
import { gridCellRects } from "./grids";
import { chartSVGDataURL } from "./charts";
import { graphicSVGDataURL } from "./graphics";
import {
  normalizeCells,
  getColFractions,
  getRowFractions,
} from "./tableUtils";

/**
 * renderDesignToBlob — paints a { canvas, elements } design to an offscreen
 * canvas and returns a PNG Blob. Mirrors the on-screen EditorElement rendering.
 *
 * Remote (http/https) image sources are routed through /api/proxy-image so the
 * canvas stays untainted (a tainted canvas can't be exported).
 */

// Route remote (http/https) image sources through the same-origin proxy so they
// load with CORS headers. Exported so the on-screen editor loads images the same
// way the export renderer does (a raw crossOrigin <img> to a no-CORS CDN fails).
export function proxiedSrc(src) {
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
    .filter((el) => (el.type === "text" || el.type === "table") && el.fontFamily)
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

    if (el.type === "draw") {
      const [vw, vh] = [el.vbW || el.width, el.vbH || el.height];
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.scale(el.width / vw, el.height / vh);
      if (el.blend) ctx.globalCompositeOperation = "multiply";
      ctx.strokeStyle = el.stroke || "#111111";
      ctx.lineWidth = el.strokeWidth || 4;
      ctx.lineCap = el.cap || "round";
      ctx.lineJoin = "round";
      const p = new Path2D(pointsToPath(el.points));
      ctx.stroke(p);
      ctx.restore();
    } else if (el.type === "curve") {
      const vw = el.vbW || el.width;
      const vh = el.vbH || el.height;
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.scale(el.width / vw, el.height / vh);
      ctx.strokeStyle = el.stroke || "#111111";
      ctx.lineWidth = el.strokeWidth || 4;
      ctx.lineCap = el.cap || "round";
      ctx.lineJoin = "round";
      if (el.dash) ctx.setLineDash(el.dash);
      ctx.stroke(new Path2D(curvePath(el.points, el.sharp)));
      ctx.restore();
    } else if (el.type === "shape" && !PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
      // Library shape: map its viewBox onto the element box and draw the path.
      const def = SHAPES[el.shape];
      const [vw, vh] = def.viewBox;
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.scale(el.width / vw, el.height / vh);
      if (def.kind === "stroke") {
        // Honor curvature for bendable lines (el.bend → viewBox control offset).
        const bendVB = el.bend ? (24 * el.bend) / (el.height || 1) : 0;
        const p = new Path2D(lineShaftPath(el.shape, bendVB));
        ctx.strokeStyle = el.fill || "#111111";
        ctx.lineWidth = def.strokeW || 3;
        ctx.lineCap = def.cap || "butt";
        ctx.lineJoin = "round";
        if (def.dash) ctx.setLineDash(def.dash);
        ctx.stroke(p);
      } else {
        const p = new Path2D(def.path);
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
      // Sticky-note background: a lifted paper panel (shadow, sheen, folded corner).
      if (el.background) {
        const br = el.borderRadius || 0;
        const roundRect = () => {
          ctx.beginPath();
          if (br && ctx.roundRect) ctx.roundRect(el.x, el.y, el.width, el.height, br);
          else ctx.rect(el.x, el.y, el.width, el.height);
        };
        // base fill + drop shadow
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.18)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = el.background;
        roundRect();
        ctx.fill();
        ctx.restore();
        // sheen + folded corner (clipped to the panel)
        ctx.save();
        roundRect();
        ctx.clip();
        const sheen = ctx.createLinearGradient(
          el.x,
          el.y,
          el.x + el.width,
          el.y + el.height,
        );
        sheen.addColorStop(0, "rgba(255,255,255,0.4)");
        sheen.addColorStop(0.4, "rgba(255,255,255,0)");
        sheen.addColorStop(1, "rgba(0,0,0,0.07)");
        ctx.fillStyle = sheen;
        ctx.fillRect(el.x, el.y, el.width, el.height);

        const fold = Math.max(14, Math.round(Math.min(el.width, el.height) * 0.13));
        const fx = el.x + el.width;
        const fy = el.y + el.height;
        ctx.beginPath();
        ctx.moveTo(fx - fold, fy);
        ctx.lineTo(fx, fy - fold);
        ctx.lineTo(fx, fy);
        ctx.closePath();
        const fg = ctx.createLinearGradient(fx - fold, fy - fold, fx, fy);
        fg.addColorStop(0, "rgba(0,0,0,0)");
        fg.addColorStop(0.52, "rgba(0,0,0,0.16)");
        fg.addColorStop(1, "rgba(0,0,0,0.28)");
        ctx.fillStyle = fg;
        ctx.fill();
        ctx.restore();
      }

      const size = el.fontSize || 16;
      const weight = el.fontWeight || "normal";
      const align = el.textAlign || "left";
      const family = el.fontFamily || "'DM Sans', sans-serif";
      const pad = el.padding ?? 2;
      ctx.font = `${el.fontStyle || "normal"} ${weight} ${size}px ${family}`;
      // Always assign (0px when unset) so a spaced element can't leak its
      // tracking into the next one. Set before measureText so wrapping accounts
      // for it. No-ops on browsers without ctx.letterSpacing.
      ctx.letterSpacing = el.letterSpacing ? `${el.letterSpacing}px` : "0px";
      ctx.fillStyle = el.fill || el.color || "#111111";
      ctx.textAlign = align;
      ctx.textBaseline = "alphabetic";

      const x =
        align === "center"
          ? el.x + (el.width || 0) / 2
          : align === "right"
            ? el.x + (el.width || 0) - pad
            : el.x + pad;

      const value =
        typeof el.content === "string"
          ? el.content
          : typeof el.text === "string"
            ? el.text
            : "";

      // Word-wrap within the padded width; honor explicit newlines.
      const lineMaxW = Math.max(1, (el.width || 9999) - pad * 2);
      const lineH = size * (el.lineHeight || 1.3);
      const lines = [];
      for (const para of value.split("\n")) {
        const words = para.split(/\s+/).filter(Boolean);
        let line = "";
        for (const word of words) {
          const test = line ? `${line} ${word}` : word;
          if (ctx.measureText(test).width > lineMaxW && line) {
            lines.push(line);
            line = word;
          } else {
            line = test;
          }
        }
        lines.push(line);
      }

      // Sticky notes are top-aligned; other text is vertically centered.
      const blockH = lines.length * lineH;
      let lineY = el.sticky
        ? el.y + pad + size * 0.85
        : el.y + Math.max(pad, ((el.height || 0) - blockH) / 2) + size * 0.85;
      for (const line of lines) {
        if (line) {
          ctx.fillText(line, x, lineY);
          // Underline: a rule under the line, matched to its measured width and
          // alignment (canvas has no text-decoration).
          if (el.underline) {
            const lw = ctx.measureText(line).width;
            const ux =
              align === "center" ? x - lw / 2 : align === "right" ? x - lw : x;
            const uy = lineY + size * 0.12;
            ctx.save();
            ctx.strokeStyle = ctx.fillStyle;
            ctx.lineWidth = Math.max(1, size * 0.06);
            ctx.beginPath();
            ctx.moveTo(ux, uy);
            ctx.lineTo(ux + lw, uy);
            ctx.stroke();
            ctx.restore();
          }
        }
        lineY += lineH;
      }
    }

    if (el.type === "table") {
      drawTable(ctx, el);
    }

    if (el.type === "chart") {
      try {
        const img = await loadImage(chartSVGDataURL(el));
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } catch {
        /* skip chart if the SVG can't rasterize */
      }
    }

    if (el.type === "graphic") {
      try {
        const img = await loadImage(graphicSVGDataURL(el));
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } catch {
        /* skip graphic if the SVG can't rasterize */
      }
    }

    if (el.type === "grid") {
      const rects = gridCellRects(el);
      const cr = el.cellRadius || 0;
      for (const cell of rects) {
        const cx0 = el.x + cell.x;
        const cy0 = el.y + cell.y;
        ctx.save();
        ctx.beginPath();
        if (cr && ctx.roundRect) {
          ctx.roundRect(cx0, cy0, cell.w, cell.h, cr);
        } else {
          ctx.rect(cx0, cy0, cell.w, cell.h);
        }
        ctx.clip();
        const src = el.cells?.[cell.index]?.src;
        if (src) {
          try {
            const img = await loadImage(src);
            drawCover(ctx, img, cx0, cy0, cell.w, cell.h);
          } catch {
            /* leave the cell empty on a broken image */
          }
        } else {
          ctx.fillStyle = "#e5e7eb";
          ctx.fillRect(cx0, cy0, cell.w, cell.h);
        }
        ctx.restore();
      }
    }

    if (el.type === "frame") {
      const { path, viewBox } = frameGeo(el.shape);
      const [vw, vh] = viewBox;
      ctx.save();
      // Clip to the frame shape, scaled from its viewBox to the element box.
      const clip = new Path2D();
      const m = new DOMMatrix()
        .translate(el.x, el.y)
        .scale(el.width / vw, el.height / vh);
      clip.addPath(new Path2D(path), m);
      ctx.clip(clip);
      if (el.flipH || el.flipV) {
        const fcx = el.x + el.width / 2;
        const fcy = el.y + el.height / 2;
        ctx.translate(fcx, fcy);
        ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
        ctx.translate(-fcx, -fcy);
      }
      if (el.src) {
        try {
          const img = await loadImage(el.src);
          drawCover(ctx, img, el.x, el.y, el.width, el.height);
        } catch {
          /* leave the clipped area empty on a broken image */
        }
      } else {
        // Empty frame → grey placeholder (matches the on-canvas look).
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
      ctx.restore();
    }

    if (el.type === "image" && el.src) {
      try {
        const img = await loadImage(el.src);
        ctx.save();
        // Corner rounding — clip to a rounded rectangle before drawing.
        // Radius may be uniform or per-corner; roundRect takes [tl,tr,br,bl].
        const corners = radiusCorners(el.borderRadius);
        if (corners.some((c) => c > 0) && ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(el.x, el.y, el.width, el.height, corners);
          ctx.clip();
        }
        // Flip horizontally / vertically about the element's center.
        if (el.flipH || el.flipV) {
          const cx = el.x + el.width / 2;
          const cy = el.y + el.height / 2;
          ctx.translate(cx, cy);
          ctx.scale(el.flipH ? -1 : 1, el.flipV ? -1 : 1);
          ctx.translate(-cx, -cy);
        }
        if (el.objectFit === "contain") {
          ctx.drawImage(img, el.x, el.y, el.width, el.height);
        } else {
          drawCover(ctx, img, el.x, el.y, el.width, el.height);
        }
        ctx.restore();
      } catch {
        /* skip broken image */
      }
    }

    ctx.restore();
  }

  return cnv;
}

/**
 * Draw a "table" element: equal-width columns / equal-height rows separated by
 * a `borderWidth` gap of `borderColor` (matching the on-screen grid rendering),
 * then each cell's text clipped to its box. Mirrors TableInner in EditorElement.
 */
function drawTable(ctx, el) {
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const bw = el.borderWidth ?? 1;
  const border = el.borderColor || "#d1d5db";
  const cols = el.cols;
  const rows = el.rows;

  // Border color fills the whole box; cell fills leave `bw`-wide lines showing.
  ctx.fillStyle = border;
  ctx.fillRect(el.x, el.y, el.width, el.height);

  // Per-track sizes from relative weights, mirroring the on-screen CSS grid.
  const colFr = getColFractions(el);
  const rowFr = getRowFractions(el);
  const colSum = colFr.reduce((s, f) => s + f, 0);
  const rowSum = rowFr.reduce((s, f) => s + f, 0);
  const contentW = el.width - bw * (cols + 1);
  const contentH = el.height - bw * (rows + 1);
  const colW = colFr.map((f) => (f / colSum) * contentW);
  const rowH = rowFr.map((f) => (f / rowSum) * contentH);
  // Cumulative top-left origin of each track (after the leading border/gap).
  const colX = [];
  const rowY = [];
  let ax = el.x + bw;
  for (let c = 0; c < cols; c++) {
    colX.push(ax);
    ax += colW[c] + bw;
  }
  let ay = el.y + bw;
  for (let r = 0; r < rows; r++) {
    rowY.push(ay);
    ay += rowH[r] + bw;
  }

  const size = el.fontSize || 16;
  const family = el.fontFamily || "'DM Sans', sans-serif";
  const align = el.align || "left";
  const pad = 10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx0 = colX[c];
      const cy0 = rowY[r];
      const cellW = colW[c];
      const cellH = rowH[r];
      const isHeader = el.headerRow && r === 0;

      ctx.fillStyle = isHeader
        ? el.headerFill || "#f3f4f6"
        : el.cellFill || "#ffffff";
      ctx.fillRect(cx0, cy0, cellW, cellH);

      const text = cells[r]?.[c] ?? "";
      if (!text) continue;

      ctx.save();
      ctx.beginPath();
      ctx.rect(cx0, cy0, cellW, cellH);
      ctx.clip();
      ctx.fillStyle = el.textColor || "#111827";
      ctx.font = `${isHeader ? "600" : "normal"} ${size}px ${family}`;
      ctx.textAlign = align;
      ctx.textBaseline = "middle";
      const tx =
        align === "center"
          ? cx0 + cellW / 2
          : align === "right"
            ? cx0 + cellW - pad
            : cx0 + pad;
      ctx.fillText(text, tx, cy0 + cellH / 2);
      ctx.restore();
    }
  }
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
