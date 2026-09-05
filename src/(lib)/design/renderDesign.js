"use client";

import { SHAPES, PRIMITIVE_SHAPES, lineShaftPath, dashArrayFor } from "./shapes";
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
import { resolveTextEffect } from "./textEffects";
import { buildImageFilter } from "./imageAdjust";
import { fillStyleFor } from "./gradient";
import { drawWithShapeEffect } from "./shapeEffects";

import { warpPerspective, hasPerspective } from "./perspective";
import { isCropped } from "./imageCrop";
import { isColourValue, tintedImageCanvas } from "./imageTint";
import { isClipped, windowed } from "./clip";
import { flattenGroups } from "./groups";

/**
 * The two coordinate spaces a fill can be asked for.
 *
 * A CanvasGradient's coordinates are interpreted through whatever transform is
 * live when it is USED, and this renderer is not consistent about that: library
 * shapes translate to the element and scale to the viewBox before drawing, while
 * primitives and text draw at absolute page coordinates. Handing absolute
 * coordinates to a translated context slides the gradient off its own shape by
 * exactly the element's position, so each caller says which space it is in.
 */
const boxOf = (el) => ({
  x: el.x,
  y: el.y,
  width: el.width,
  height: el.height,
});
const VB_BOX = (vw, vh) => ({ x: 0, y: 0, width: vw, height: vh });

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
  // Groups are an editor construct: expand them into their children, in absolute
  // coordinates, and the painter below never has to know they exist. Done first
  // so the font scan sees text nested inside a group too — otherwise grouped
  // text exported in the fallback face.
  const flat = flattenGroups(elements || []);

  // Ensure any custom fonts used by text elements are loaded before painting —
  // canvas fillText silently falls back to a default if the font isn't ready.
  const families = flat
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

  for (const source of flat) {
    if (source.hidden) continue;
    ctx.save();
    ctx.globalAlpha = source.opacity ?? 1;

    // A group that was cropped is gone by now: flattenGroups pushed its window
    // down onto each descendant, because the group element itself does not
    // survive to be painted. Nested groups leave more than one; successive
    // clips intersect, which is exactly the nesting rule.
    //
    // These come BEFORE the element's own rotation, and the polygons arrive
    // already rotated into canvas space, so there is no transform to undo
    // between them — the child's own angle already has the group's baked in and
    // must not be applied to the group's mask as well.
    for (const poly of source.__clip || []) {
      ctx.beginPath();
      poly.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.clip();
    }

    // Rotation is measured on the element's REAL box — the window is what the
    // viewer sees turning, not the layout behind it.
    if (source.rotation) {
      const rcx = source.x + (source.width || 0) / 2;
      const rcy = source.y + (source.height || 0) / 2;
      ctx.translate(rcx, rcy);
      ctx.rotate((source.rotation * Math.PI) / 180);
      ctx.translate(-rcx, -rcy);
    }

    // A cropped element's box is a WINDOW onto contents laid out at their own
    // size. Clip to the box, then draw everything below against the CONTENT
    // box: every branch reads x/y/width/height off `el`, so this one
    // substitution crops every element type without any of them knowing.
    //
    // Chrome that looks like it belongs to the box — a sticky note's paper, a
    // text effect's background panel — is content too, and correctly travels
    // with it: cropping a sticky note should slide the window over the note,
    // not repaint the paper at the window's size.
    if (isClipped(source.clip)) {
      ctx.beginPath();
      ctx.rect(source.x, source.y, source.width, source.height);
      ctx.clip();
    }
    const el = windowed(source);

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
        ctx.strokeStyle = fillStyleFor(ctx, el.fill || "#111111", VB_BOX(vw, vh));
        // The element's own weight wins; the shape def is only the default it
        // was created with, so without this the toolbar's slider did nothing.
        ctx.lineWidth = Number(el.strokeWidth) || def.strokeW || 3;
        ctx.lineCap = def.cap || "butt";
        ctx.lineJoin = "round";
        if (def.dash) ctx.setLineDash(def.dash);
        ctx.stroke(p);
      } else {
        const p = new Path2D(def.path);
        ctx.fillStyle = fillStyleFor(ctx, el.fill || "#6366f1", VB_BOX(vw, vh));
        drawWithShapeEffect(ctx, el, () => {
          ctx.fill(p);
          if (el.strokeWidth && el.stroke) {
            ctx.strokeStyle = el.stroke;
            ctx.lineWidth = el.strokeWidth;
            ctx.setLineDash(dashArrayFor(el.strokeDash, el.strokeWidth));
            ctx.stroke(p);
            ctx.setLineDash([]);
          }
        });
      }
      ctx.restore();
    } else if (el.type === "shape") {
      ctx.fillStyle = fillStyleFor(ctx, el.fill || "transparent", boxOf(el));
      ctx.strokeStyle = el.stroke || "transparent";
      ctx.lineWidth = el.strokeWidth || 0;
      // Set once for the whole shape and cleared after — every pass of
      // drawWithShapeEffect re-strokes the same path and must dash the same way.
      ctx.setLineDash(dashArrayFor(el.strokeDash, el.strokeWidth));

      // The path is built once and re-filled per shadow layer — see
      // drawWithShapeEffect for why canvas needs a pass each.
      const shapePath = new Path2D();
      if (el.shape === "circle") {
        const rx = (el.width || 0) / 2;
        const ry = (el.height || 0) / 2;
        shapePath.ellipse(el.x + rx, el.y + ry, rx, ry, 0, 0, Math.PI * 2);
      } else if (el.shape === "triangle") {
        const w = el.width || 0;
        const h = el.height || 0;
        shapePath.moveTo(el.x + w / 2, el.y);
        shapePath.lineTo(el.x + w, el.y + h);
        shapePath.lineTo(el.x, el.y + h);
        shapePath.closePath();
      } else {
        const r = el.borderRadius || 0;
        if (r && shapePath.roundRect)
          shapePath.roundRect(el.x, el.y, el.width, el.height, r);
        else shapePath.rect(el.x, el.y, el.width, el.height);
      }
      drawWithShapeEffect(ctx, el, () => {
        ctx.fill(shapePath);
        if (el.strokeWidth) ctx.stroke(shapePath);
      });
      ctx.setLineDash([]);
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
      const fillColor = fillStyleFor(
        ctx,
        el.fill || el.color || "#111111",
        boxOf(el),
      );
      const effect = resolveTextEffect(el);
      ctx.fillStyle = fillColor;
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
      const firstY = el.sticky
        ? el.y + pad + size * 0.85
        : el.y + Math.max(pad, ((el.height || 0) - blockH) / 2) + size * 0.85;

      // "Background" effect — a rounded, padded box behind the text block. The
      // box hugs the union of the (measured) line widths, matching the editor.
      if (effect?.background && !el.background) {
        const b = effect.background;
        let minL = Infinity;
        let maxR = -Infinity;
        for (const line of lines) {
          const lw = ctx.measureText(line).width;
          const left =
            align === "center" ? x - lw / 2 : align === "right" ? x - lw : x;
          minL = Math.min(minL, left);
          maxR = Math.max(maxR, left + lw);
        }
        if (Number.isFinite(minL)) {
          const bx = minL - b.padX;
          const by = firstY - size * 0.8 - b.padY;
          const bw = maxR - minL + b.padX * 2;
          const bh = blockH + size * 0.2 + b.padY * 2;
          ctx.save();
          ctx.fillStyle = b.color;
          ctx.beginPath();
          if (b.radius && ctx.roundRect) ctx.roundRect(bx, by, bw, bh, b.radius);
          else ctx.rect(bx, by, bw, bh);
          ctx.fill();
          ctx.restore();
        }
      }

      let lineY = firstY;
      for (const line of lines) {
        if (line) {
          drawEffectLine(ctx, line, x, lineY, effect, fillColor);
          // Underline: a rule under the line, matched to its measured width and
          // alignment (canvas has no text-decoration).
          if (el.underline) {
            const lw = ctx.measureText(line).width;
            const ux =
              align === "center" ? x - lw / 2 : align === "right" ? x - lw : x;
            const uy = lineY + size * 0.12;
            ctx.save();
            ctx.strokeStyle = fillColor;
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
      ctx.fillStyle = fillColor;
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
        // Adjust / filter / shadow — the same CSS filter string the editor
        // applies to the <img>, so the export matches the stage.
        ctx.filter = buildImageFilter(el) || "none";
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
        // The box fill, behind the picture — what shows through a `contain`
        // fit's letterboxing and a cutout's removed background. Inside the
        // rounded clip above, so it takes the same corners.
        if (isColourValue(el.backgroundColor)) {
          ctx.save();
          ctx.filter = "none";
          ctx.fillStyle = el.backgroundColor;
          ctx.fillRect(el.x, el.y, el.width, el.height);
          ctx.restore();
        }

        // Every branch below draws at ABSOLUTE page coordinates, which is what
        // lets the same code paint either straight onto the page or into an
        // offscreen canvas translated by -(x, y). That redirection is what makes
        // an isolated tint possible without restating the four fit modes.
        const paintImage = (target) => {
          if (hasPerspective(el)) {
            // Perspective: keystone-warp the image (box aspect) and stretch onto
            // the box — the same warp PerspectiveImage draws on screen.
            const W = Math.max(1, Math.round(el.width));
            const H = Math.max(1, Math.round(el.height));
            const warped = warpPerspective(img, W, H, el.perspective.h || 0, el.perspective.v || 0);
            target.drawImage(warped, el.x, el.y, el.width, el.height);
          } else if (isCropped(el.crop)) {
            // Crop: draw the natural sub-rectangle stretched onto the box.
            const c = el.crop;
            target.drawImage(
              img,
              c.x * img.width,
              c.y * img.height,
              c.w * img.width,
              c.h * img.height,
              el.x,
              el.y,
              el.width,
              el.height,
            );
          } else if (el.objectFit === "contain") {
            drawContain(target, img, el.x, el.y, el.width, el.height);
          } else {
            drawCover(target, img, el.x, el.y, el.width, el.height);
          }
        };

        const tinted = tintedImageCanvas(el, el.width, el.height, (octx) => {
          // The Adjust filter belongs to the picture, so it has to come along —
          // it is set on the page context, which the offscreen does not inherit.
          octx.save();
          octx.filter = buildImageFilter(el) || "none";
          octx.translate(-el.x, -el.y);
          paintImage(octx);
          octx.restore();
        });

        if (tinted) {
          // Already filtered on the way in; filtering again would double it.
          ctx.filter = "none";
          ctx.drawImage(tinted, el.x, el.y, el.width, el.height);
        } else {
          paintImage(ctx);
        }
        ctx.restore();

        // Border — stroked over the picture, inset into the same box, so it
        // matches the DOM overlay in EditorElement exactly: turning one on
        // never resizes the image. Outside the restore above so the Adjust
        // filter doesn't tint the frame.
        const bw = Number(el.borderWidth) || 0;
        if (bw > 0) {
          ctx.save();
          ctx.filter = "none";
          ctx.strokeStyle = el.borderColor || "#ffffff";
          ctx.lineWidth = bw;
          // Stroke down the middle of the border's width, so half lands inside
          // the box edge and half over the image — the same pixels CSS paints
          // for an inset `border` with `box-sizing: border-box`. The radius
          // shrinks with the inset to keep the corners concentric.
          const inset = bw / 2;
          const ring = radiusCorners(el.borderRadius).map((c) =>
            Math.max(0, c - inset),
          );
          ctx.beginPath();
          if (ring.some((c) => c > 0) && ctx.roundRect) {
            ctx.roundRect(
              el.x + inset,
              el.y + inset,
              Math.max(0, el.width - bw),
              Math.max(0, el.height - bw),
              ring,
            );
          } else {
            ctx.rect(
              el.x + inset,
              el.y + inset,
              Math.max(0, el.width - bw),
              Math.max(0, el.height - bw),
            );
          }
          ctx.stroke();
          ctx.restore();
        }
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

/**
 * Draw one text line at (x, y) with a resolved text effect applied — mirrors
 * the CSS `text-shadow` / `-webkit-text-stroke` the editor paints. `effect` is
 * from resolveTextEffect (or null for plain fill). Shadow layers are painted
 * back-to-front behind the glyphs; a stroke is drawn under the fill; hollow text
 * (fillOverride: "transparent") is stroke-only.
 */
function drawEffectLine(ctx, line, x, y, effect, fillColor) {
  if (!effect) {
    ctx.fillStyle = fillColor;
    ctx.fillText(line, x, y);
    return;
  }
  // Splice "back" — a solid, offset copy behind the glyphs.
  if (effect.back) {
    ctx.save();
    ctx.fillStyle = effect.back.color;
    ctx.fillText(line, x + effect.back.dx, y + effect.back.dy);
    ctx.restore();
  }
  // Shadow / glow / echo layers.
  for (const s of [...(effect.shadows || [])].reverse()) {
    ctx.save();
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.blur;
    ctx.shadowOffsetX = s.dx;
    ctx.shadowOffsetY = s.dy;
    ctx.fillStyle = fillColor;
    ctx.fillText(line, x, y);
    ctx.restore();
  }
  // Outline / hollow stroke. CSS text-stroke is centred (half inside), so use
  // double the width to keep a comparable outside weight.
  if (effect.stroke) {
    ctx.save();
    ctx.lineWidth = effect.stroke.width * 2;
    ctx.strokeStyle = effect.stroke.color;
    ctx.lineJoin = "round";
    ctx.strokeText(line, x, y);
    ctx.restore();
  }
  // Fill on top (skipped for hollow text).
  if (effect.fillOverride !== "transparent") {
    ctx.fillStyle = fillColor;
    ctx.fillText(line, x, y);
  }
}

/** Draw an image with object-fit: cover into the target box. */
export function drawCover(ctx, img, dx, dy, dw, dh) {
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

/**
 * Draw an image with object-fit: contain into the target box — the whole
 * picture, letterboxed and centred.
 *
 * The counterpart of drawCover, and the reason the Fit/Fill quick tool can be
 * trusted: `contain` used to stretch the image onto the box here, so an image
 * that letterboxed on the stage came out distorted in the PNG.
 */
export function drawContain(ctx, img, dx, dy, dw, dh) {
  const scale = Math.min(dw / img.width, dh / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, dx + (dw - w) / 2, dy + (dh - h) / 2, w, h);
}

export async function renderDesignToBlob(design, type = "image/png") {
  const cnv = await renderDesignToCanvas(design);
  return new Promise((resolve, reject) => {
    cnv.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), type);
  });
}

/**
 * renderDesignToThumbnail — paints a { canvas, elements } design and returns a
 * base64 data URL (e.g. "data:image/jpeg;base64,…") scaled to fit within
 * `maxDim` px. Handy for saving a lightweight preview alongside the design so
 * lists can show it without re-rendering the full canvas. Returns null on failure.
 */
export async function renderDesignToThumbnail(
  design,
  { maxDim = 400, type = "image/jpeg", quality = 0.8 } = {},
) {
  try {
    const off = await renderDesignToCanvas(design);
    const scale = Math.min(1, maxDim / Math.max(off.width, off.height));
    const w = Math.max(1, Math.round(off.width * scale));
    const h = Math.max(1, Math.round(off.height * scale));
    const small = document.createElement("canvas");
    small.width = w;
    small.height = h;
    const ctx = small.getContext("2d");
    ctx.drawImage(off, 0, 0, w, h);
    return small.toDataURL(type, quality);
  } catch {
    return null;
  }
}

/** Byte size of a data URL's payload (base64 encodes 3 bytes per 4 chars). */
function dataUrlBytes(url) {
  const comma = url.indexOf(",");
  return comma === -1 ? 0 : Math.floor((url.length - comma - 1) * 0.75);
}

/**
 * renderDesignToDataUrl — paints a { canvas, elements } design at its FULL
 * canvas size (no downscale) and returns a base64 data URL, for saving
 * alongside the design as its preview.
 *
 * JPEG by default, not PNG: renderDesignToCanvas always paints an opaque
 * background, so there's no transparency to lose, and a full-size PNG of a
 * photo-heavy design runs to several MB — which the save request has to carry
 * inline. `maxBytes` caps that: if the first encode is over budget the quality
 * steps down until it fits, so a 4000×4000 poster can't produce a request body
 * the backend rejects. Dimensions are never reduced — only compression.
 *
 * Returns null on failure (tainted canvas, unloadable image) so a broken
 * preview can never block the save that carries it.
 */
export async function renderDesignToDataUrl(
  design,
  { type = "image/jpeg", quality = 0.85, maxBytes = 2 * 1024 * 1024 } = {},
) {
  try {
    const cnv = await renderDesignToCanvas(design);
    let url = cnv.toDataURL(type, quality);
    if (maxBytes && type === "image/jpeg") {
      for (let q = quality - 0.15; dataUrlBytes(url) > maxBytes && q >= 0.4; q -= 0.15) {
        url = cnv.toDataURL(type, q);
      }
    }
    return url;
  } catch {
    return null;
  }
}
