"use client";

import React, { useEffect, useRef, useState } from "react";
import ShapeSVG from "../../ShapeSVG";
import { SHAPES, PRIMITIVE_SHAPES, dashCssFor } from "@/(lib)/design/shapes";
import { textEffectCss } from "@/(lib)/design/textEffects";
import { gradientTextStyle } from "@/(lib)/design/gradient";

/**
 * The text node's style, as EditorElement draws text — same fields, same
 * effect and gradient helpers — so a card can't show something the page won't.
 */
function textStyle(el) {
  const style = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    fontSize: el.fontSize || 16,
    fontWeight: el.fontWeight || "normal",
    fontFamily: el.fontFamily || "'DM Sans', sans-serif",
    color: el.fill || el.color || "#111111",
    ...(gradientTextStyle(el.fill || el.color) || {}),
    textAlign: el.textAlign || "left",
    lineHeight: el.lineHeight || 1.3,
    letterSpacing: el.letterSpacing || "normal",
    fontStyle: el.fontStyle || "normal",
    textDecoration: el.underline ? "underline" : "none",
    overflow: "hidden",
    padding: el.padding ?? 2,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    boxSizing: "border-box",
  };
  const fx = textEffectCss(el);
  if (fx?.css) Object.assign(style, fx.css);
  if (fx?.background) {
    const base = el.padding ?? 2;
    style.background = fx.background.color;
    style.borderRadius = fx.background.radius;
    style.padding = `${base + fx.background.padY}px ${base + fx.background.padX}px`;
  }
  return style;
}

/** A shape, as EditorElement draws one. */
function ShapeArt({ el }) {
  if (!PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
    return (
      <ShapeSVG
        shape={el.shape}
        fill={el.fill || "#6366f1"}
        stroke={el.stroke || "transparent"}
        strokeWidth={el.strokeWidth || 0}
        strokeDash={el.strokeDash}
        bend={0}
      />
    );
  }
  const common = {
    width: "100%",
    height: "100%",
    background: el.fill || "transparent",
    border:
      el.strokeWidth && el.stroke
        ? `${el.strokeWidth}px ${dashCssFor(el.strokeDash)} ${el.stroke}`
        : "none",
    boxSizing: "border-box",
  };
  if (el.shape === "circle") return <div style={{ ...common, borderRadius: "50%" }} />;
  if (el.shape === "triangle") {
    // The page draws a solid triangle with borders and a gradient one clipped;
    // clipped draws both the same.
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: el.fill || "#000",
          clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
        }}
      />
    );
  }
  return <div style={{ ...common, borderRadius: el.borderRadius || 0 }} />;
}

/**
 * ElementArt — a still picture of a few elements, fitted and centred in its
 * box with a margin kept clear round it. Drawn from the same fields the page
 * reads, at the elements' own size and scaled down, so text sizes and effects
 * keep their proportions.
 *
 * Props: { elements, bounds: {x, y, width, height}, inset?: 0..0.5 }
 */
export default function ElementArt({ elements, bounds, inset = 0.1 }) {
  const boxRef = useRef(null);
  const [box, setBox] = useState(null);

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return undefined;
    const sync = () => setBox({ w: node.clientWidth, h: node.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  let content = null;
  if (box && bounds.width > 0 && bounds.height > 0) {
    const scale = Math.min(
      (box.w * (1 - inset * 2)) / bounds.width,
      (box.h * (1 - inset * 2)) / bounds.height,
    );
    const dx = box.w / 2 - (bounds.x + bounds.width / 2) * scale;
    const dy = box.h / 2 - (bounds.y + bounds.height / 2) * scale;
    content = (
      <div
        className="absolute left-0 top-0"
        style={{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: "0 0" }}
      >
        {elements.map((el, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: el.x,
              top: el.y,
              width: el.width,
              height: el.height,
              opacity: el.opacity ?? 1,
              transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
            }}
          >
            {el.type === "text" ? <div style={textStyle(el)}>{el.content}</div> : <ShapeArt el={el} />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={boxRef} aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {content}
    </div>
  );
}
