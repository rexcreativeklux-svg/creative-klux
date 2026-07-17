/**
 * Shared drawing logic for the signature Draw tab — used by both the live canvas
 * and the export, so what you draw is exactly what gets added.
 *
 * A stroke is { points: [{x,y}], color, width }, with points in CSS pixels
 * relative to the drawing surface.
 */

/** Draw one stroke, smoothed through the midpoints of consecutive points. */
function renderStroke(ctx, stroke, dx = 0, dy = 0) {
  const { points, color, width } = stroke;
  if (!points.length) return;

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // A single point (a tap) has no segment to stroke, so render it as a dot.
  if (points.length === 1) {
    const p = points[0];
    ctx.beginPath();
    ctx.arc(p.x + dx, p.y + dy, width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0].x + dx, points[0].y + dy);
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const next = points[i + 1];
    const midX = (p.x + next.x) / 2;
    const midY = (p.y + next.y) / 2;
    ctx.quadraticCurveTo(p.x + dx, p.y + dy, midX + dx, midY + dy);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x + dx, last.y + dy);
  ctx.stroke();
}

/** Draw every stroke onto a context (offset by dx/dy). */
export function renderStrokes(ctx, strokes, dx = 0, dy = 0) {
  for (const stroke of strokes) renderStroke(ctx, stroke, dx, dy);
}

/** Tightest box enclosing all points, widened by half the fattest stroke. */
function strokesBounds(strokes) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, maxW = 0;
  for (const { points, width } of strokes) {
    maxW = Math.max(maxW, width);
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  if (minX === Infinity) return null;
  const pad = maxW; // room so round caps aren't clipped
  return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
}

/**
 * Rasterise strokes to a trimmed, transparent PNG data URL — cropped to the ink
 * so the signature drops onto the canvas as itself, not a big empty box.
 * Rendered at 2× for crispness. Returns null when there's nothing drawn.
 */
export function strokesToTrimmedDataURL(strokes, scale = 2) {
  const b = strokesBounds(strokes);
  if (!b) return null;

  const w = Math.max(1, b.maxX - b.minX);
  const h = Math.max(1, b.maxY - b.minY);

  const cnv = document.createElement("canvas");
  cnv.width = w * scale;
  cnv.height = h * scale;
  const ctx = cnv.getContext("2d");
  ctx.scale(scale, scale);
  // Shift so the bounding box's top-left sits at the origin.
  renderStrokes(ctx, strokes, -b.minX, -b.minY);

  return cnv.toDataURL("image/png");
}
