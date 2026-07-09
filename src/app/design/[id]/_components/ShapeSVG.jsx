"use client";

import React from "react";
import { SHAPES, lineShaftPath } from "./shapes";

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
  rx,
  bend, // curve amount (viewBox units) for bendable lines; undefined = use preview default
  fit = false, // true = keep aspect (picker previews); false = stretch to box (canvas)
  className,
  style,
}) {
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
        <rect
          x={1}
          y={1}
          width={vw - 2}
          height={vh - 2}
          rx={rx ?? def.rx ?? 0}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (def.render === "ellipse") {
    return (
      <svg {...common}>
        <ellipse
          cx={vw / 2}
          cy={vh / 2}
          rx={vw / 2 - 1}
          ry={vh / 2 - 1}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </svg>
    );
  }

  if (def.render === "triangle") {
    return (
      <svg {...common}>
        <polygon
          points={`${vw / 2},2 ${vw - 2},${vh - 2} 2,${vh - 2}`}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
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
        <path
          d={lineShaftPath(shape, bendVal)}
          fill="none"
          stroke={fill}
          strokeWidth={def.strokeW || 3}
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
      <path d={def.path} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}
