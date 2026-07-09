/**
 * textFit — measure-based font auto-sizing for sticky notes. Picks the largest
 * font (within [min,max]) whose wrapped text fits the note's inner box. Uses a
 * shared canvas 2D context so the wrapping matches the PNG export exactly.
 */

let _ctx;
function ctx() {
  if (!_ctx && typeof document !== "undefined") {
    _ctx = document.createElement("canvas").getContext("2d");
  }
  return _ctx;
}

/** Count wrapped lines for `text` at `font`, flagging any word wider than the box. */
export function measureText(text, maxWidth, font) {
  const c = ctx();
  if (!c) return { lines: 1, overflow: false };
  c.font = font;
  let lines = 0;
  let overflow = false;
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines += 1;
      continue;
    }
    let line = "";
    for (const w of words) {
      if (c.measureText(w).width > maxWidth) overflow = true;
      const test = line ? `${line} ${w}` : w;
      if (c.measureText(test).width > maxWidth && line) {
        lines += 1;
        line = w;
      } else {
        line = test;
      }
    }
    lines += 1;
  }
  return { lines: Math.max(1, lines), overflow };
}

export function fitFontSize({
  text,
  maxWidth,
  maxHeight,
  fontFamily = "'DM Sans', sans-serif",
  fontWeight = "normal",
  fontStyle = "normal",
  min = 10,
  max = 200,
}) {
  const value = (text ?? "").toString();
  // Empty note: a modest, stable size relative to the box.
  if (!value.trim()) {
    return Math.max(min, Math.min(max, Math.round(maxHeight * 0.16)));
  }
  let lo = min;
  let hi = max;
  let best = min;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const font = `${fontStyle} ${fontWeight} ${mid}px ${fontFamily}`;
    const { lines, overflow } = measureText(value, maxWidth, font);
    const h = lines * mid * 1.3;
    if (!overflow && h <= maxHeight) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}
