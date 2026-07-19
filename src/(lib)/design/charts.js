/**
 * Chart geometry — the "chart" element type (bar / line / pie / donut).
 *
 * The chart is drawn ONCE as a self-contained SVG string (chartSVG). Both the
 * on-canvas editor and the PNG export render that same SVG (the editor as an
 * <img>, the export by rasterizing it), so the two can't drift and the chart
 * math lives in a single place.
 *
 * Element shape: { type:'chart', chart, data:[{label,value}], colors?, width, height }
 */

export const CHART_TYPES = [
  { id: "bar", label: "Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
];

export const CHART_PALETTE = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#84cc16",
];

export const DEFAULT_CHART_DATA = [
  { label: "Jan", value: 40 },
  { label: "Feb", value: 70 },
  { label: "Mar", value: 55 },
  { label: "Apr", value: 90 },
];

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** The chart as a standalone SVG string sized to the element box. */
export function chartSVG(el) {
  const w = Math.max(1, Math.round(el.width || 1));
  const h = Math.max(1, Math.round(el.height || 1));
  const data = el.data && el.data.length ? el.data : DEFAULT_CHART_DATA;
  const colors = el.colors && el.colors.length ? el.colors : CHART_PALETTE;
  const type = el.chart || "bar";

  let body;
  if (type === "line") body = lineSVG(data, w, h, colors);
  else if (type === "pie" || type === "donut")
    body = pieSVG(data, w, h, colors, type === "donut");
  else body = barSVG(data, w, h, colors);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="'DM Sans', system-ui, sans-serif">${body}</svg>`;
}

/** The chart SVG as a data URL — used as the <img> src and for export. */
export const chartSVGDataURL = (el) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(chartSVG(el))}`;

// ── Renderers ────────────────────────────────────────────────────────────────
function barSVG(data, w, h, colors) {
  const padX = w * 0.08;
  const padTop = h * 0.1;
  const padBot = h * 0.16;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBot;
  const baseY = padTop + plotH;
  const max = Math.max(...data.map((d) => num(d.value)), 1);
  const n = data.length || 1;
  const step = plotW / n;
  const bw = step * 0.6;
  const fs = Math.max(9, Math.round(h * 0.05));

  let s = `<line x1="${padX}" y1="${baseY}" x2="${padX + plotW}" y2="${baseY}" stroke="#e5e7eb" stroke-width="1"/>`;
  data.forEach((d, i) => {
    const bh = plotH * (num(d.value) / max);
    const x = padX + step * i + (step - bw) / 2;
    const y = baseY - bh;
    s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0, bh).toFixed(1)}" rx="3" fill="${colors[i % colors.length]}"/>`;
    s += `<text x="${(x + bw / 2).toFixed(1)}" y="${(baseY + fs * 1.4).toFixed(1)}" font-size="${fs}" fill="#6b7280" text-anchor="middle">${esc(d.label)}</text>`;
  });
  return s;
}

function lineSVG(data, w, h, colors) {
  const padX = w * 0.08;
  const padTop = h * 0.1;
  const padBot = h * 0.16;
  const plotW = w - padX * 2;
  const plotH = h - padTop - padBot;
  const baseY = padTop + plotH;
  const max = Math.max(...data.map((d) => num(d.value)), 1);
  const n = data.length || 1;
  const step = n > 1 ? plotW / (n - 1) : 0;
  const fs = Math.max(9, Math.round(h * 0.05));
  const color = colors[0];

  const pts = data.map((d, i) => {
    const x = padX + (n > 1 ? step * i : plotW / 2);
    const y = baseY - plotH * (num(d.value) / max);
    return { x, y, label: d.label };
  });

  let s = `<line x1="${padX}" y1="${baseY}" x2="${padX + plotW}" y2="${baseY}" stroke="#e5e7eb" stroke-width="1"/>`;
  if (pts.length > 1) {
    s += `<polyline points="${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}" fill="none" stroke="${color}" stroke-width="${Math.max(2, h * 0.012)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  pts.forEach((p) => {
    s += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${Math.max(2.5, h * 0.014)}" fill="#fff" stroke="${color}" stroke-width="2"/>`;
    s += `<text x="${p.x.toFixed(1)}" y="${(baseY + fs * 1.4).toFixed(1)}" font-size="${fs}" fill="#6b7280" text-anchor="middle">${esc(p.label)}</text>`;
  });
  return s;
}

function arcPath(cx, cy, r, a0, a1) {
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  return `M${cx.toFixed(1)} ${cy.toFixed(1)} L${x0.toFixed(1)} ${y0.toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

function pieSVG(data, w, h, colors, donut) {
  const cx = w * 0.34;
  const cy = h * 0.5;
  const r = Math.min(w * 0.3, h * 0.42);
  const total = data.reduce((a, d) => a + num(d.value), 0) || 1;
  const fs = Math.max(9, Math.round(h * 0.055));

  let s = "";
  let a0 = -Math.PI / 2;
  data.forEach((d, i) => {
    const frac = num(d.value) / total;
    const color = colors[i % colors.length];
    if (frac >= 0.999) {
      s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${color}"/>`;
    } else if (frac > 0) {
      const a1 = a0 + frac * Math.PI * 2;
      s += `<path d="${arcPath(cx, cy, r, a0, a1)}" fill="${color}"/>`;
      a0 = a1;
    }
  });
  if (donut) {
    s += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.55).toFixed(1)}" fill="#ffffff"/>`;
  }

  // Legend on the right.
  const lx = w * 0.66;
  const lh = Math.min(h * 0.14, fs * 1.8);
  const sw = lh * 0.55;
  const startY = cy - (data.length * lh) / 2;
  data.forEach((d, i) => {
    const yy = startY + i * lh;
    s += `<rect x="${lx.toFixed(1)}" y="${yy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sw.toFixed(1)}" rx="2" fill="${colors[i % colors.length]}"/>`;
    s += `<text x="${(lx + sw * 1.5).toFixed(1)}" y="${(yy + sw * 0.85).toFixed(1)}" font-size="${fs}" fill="#374151">${esc(d.label)}</text>`;
  });
  return s;
}
