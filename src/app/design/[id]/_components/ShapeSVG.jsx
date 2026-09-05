"use client";

import React, { useId } from "react";
import { SHAPES, lineShaftPath, dashArrayFor } from "@/(lib)/design/shapes";
import { parseGradient, svgLinearEndpoints } from "@/(lib)/design/gradient";

/**
 * ShapeSVG — renders a library shape into a stretch-to-fill SVG.
 * Used for both the panel preview (fixed color) and the on-canvas element
 * (element's own fill/stroke). preserveAspectRatio="none" makes it fill the box.
 */
export default function ShapeSVG({
  shape,
  fill = "#6366f1",
  stroke = "transparent",
  strokeWidth = 0,
  strokeDash,
  rx,
  bend, // curve amount (viewBox units) for bendable lines; undefined = use preview default
  fit = false, // true = keep aspect (picker previews); false = stretch to box (canvas)
  className,
  style,
}) {
  // SVG has no notion of a CSS gradient string: `fill="linear-gradient(…)"` is
  // simply an invalid paint and the shape renders black. A gradient has to be
  // declared as a <defs> element and referenced by id — and the id has to be
  // unique across the document, or two shapes with different gradients would
  // both pick up whichever was defined first. useId gives one per instance.
  const gradientId = useId();
  const spec = parseGradient(fill);
  const paint = spec ? `url(#${gradientId})` : fill;
  const defs = spec ? (
    <defs>
      {spec.kind === "radial" ? (
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          {spec.stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </radialGradient>
      ) : (
        <linearGradient id={gradientId} {...svgLinearEndpoints(spec.angle)}>
          {spec.stops.map((s, i) => (
            <stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      )}
    </defs>
  ) : null;

  // Empty string, not undefined: React omits the attribute for undefined, and
  // an empty dasharray is how SVG spells "solid".
  const dashPattern = dashArrayFor(strokeDash, strokeWidth).join(" ") || undefined;

  const def = SHAPES[shape];
  if (!def) return null;

  const [vw, vh] = def.viewBox;
  const common = {
    className,
    width: "100%",
    height: "100%",
    viewBox: `0 0 ${vw} ${vh}`,
    preserveAspectRatio: fit ? "xMidYMid meet" : "none",
    style: { display: "block", ...style },
  };

  if (def.render === "rect") {
    return (
      <svg {...common}>
        {defs}
        <rect
          x={1}
          y={1}
          width={vw - 2}
          height={vh - 2}
          rx={rx ?? def.rx ?? 0}
          fill={paint}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashPattern}
        />
      </svg>
    );
  }

  if (def.render === "ellipse") {
    return (
      <svg {...common}>
        {defs}
        <ellipse
          cx={vw / 2}
          cy={vh / 2}
          rx={vw / 2 - 1}
          ry={vh / 2 - 1}
          fill={paint}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashPattern}
        />
      </svg>
    );
  }

  if (def.render === "triangle") {
    return (
      <svg {...common}>
        {defs}
        <polygon
          points={`${vw / 2},2 ${vw - 2},${vh - 2} 2,${vh - 2}`}
          fill={paint}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={dashPattern}
        />
      </svg>
    );
  }

  if (def.render === "line") {
    // On canvas EditorElement passes an explicit bend (0 = straight); previews
    // pass nothing, so fall back to the shape's preview curve.
    const bendVal = bend == null ? def.previewBendVB || 0 : bend;
    return (
      <svg {...common} style={{ display: "block", overflow: "visible", ...style }}>
        {defs}
        <path
          d={lineShaftPath(shape, bendVal)}
          fill="none"
          stroke={fill}
          strokeWidth={strokeWidth || def.strokeW || 3}
          strokeDasharray={def.dash ? def.dash.join(" ") : undefined}
          strokeLinecap={def.cap || "butt"}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  // default: filled path
  return (
    <svg {...common}>
        {defs}
      <path d={def.path} fill={paint} stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={dashPattern} />
    </svg>
  );
}
