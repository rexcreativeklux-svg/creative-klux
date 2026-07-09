"use client";

import React, { useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import ShapeSVG from "./ShapeSVG";
import { SHAPES, PRIMITIVE_SHAPES } from "./shapes";

/**
 * EditorElement — renders one design element inside the scaled stage and makes
 * it draggable/resizable (via react-rnd) and, for text, inline-editable.
 *
 * All geometry is in *canvas* coordinates; `zoom` (the stage scale) is passed to
 * Rnd so drag/resize deltas map 1:1 to canvas units.
 */
export default function EditorElement({
  element: el,
  zoom,
  selected,
  editing,
  onSelect,
  onChange, // (patch, {record}) => void
  onStartEdit,
  onEndEdit,
}) {
  const textRef = useRef(null);

  // Focus the text box when entering edit mode.
  useEffect(() => {
    if (editing && el.type === "text" && textRef.current) {
      const node = textRef.current;
      node.focus();
      // place caret at end
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing, el.type]);

  const commitText = () => {
    if (!textRef.current) return;
    const value = textRef.current.innerText;
    onChange({ content: value, text: value }, { record: true });
    onEndEdit?.();
  };

  const selectionStyle = selected
    ? { outline: "2px solid #6366f1", outlineOffset: 0 }
    : { outline: "1px dashed transparent" };

  const rotation = el.rotation || 0;

  return (
    <Rnd
      scale={zoom}
      bounds="parent"
      size={{ width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      disableDragging={editing}
      enableResizing={selected && !editing}
      onDragStart={() => onSelect(el.id)}
      onMouseDown={() => onSelect(el.id)}
      onDragStop={(e, d) => onChange({ x: d.x, y: d.y }, { record: true })}
      onResizeStop={(e, dir, ref, delta, pos) =>
        onChange(
          {
            width: parseFloat(ref.style.width),
            height: parseFloat(ref.style.height),
            x: pos.x,
            y: pos.y,
          },
          { record: true },
        )
      }
      style={{
        transform: `rotate(${rotation}deg)`,
        opacity: el.opacity ?? 1,
        // Stacking follows DOM/array order so bring-to-front / send-to-back work.
        // Only lift the element while it's actively selected+editing so its
        // resize handles stay reachable, without overriding the layer order.
        zIndex: editing ? 30 : undefined,
        ...selectionStyle,
      }}
      resizeHandleStyles={handleStyles(selected)}
    >
      <div
        style={{ width: "100%", height: "100%" }}
        onDoubleClick={() => el.type === "text" && onStartEdit?.(el.id)}
      >
        {renderInner(el, { editing, textRef, commitText })}
      </div>
    </Rnd>
  );
}

function renderInner(el, { editing, textRef, commitText }) {
  if (el.type === "text") {
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
      textAlign: el.textAlign || "left",
      lineHeight: 1.3,
      letterSpacing: el.letterSpacing || "normal",
      fontStyle: el.fontStyle || "normal",
      cursor: editing ? "text" : "move",
      outline: "none",
      overflow: "hidden",
      padding: 2,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      userSelect: editing ? "text" : "none",
    };
    const value =
      typeof el.content === "string"
        ? el.content
        : typeof el.text === "string"
          ? el.text
          : "";
    return (
      <div
        ref={textRef}
        style={style}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={commitText}
      >
        {value}
      </div>
    );
  }

  if (el.type === "shape") {
    // Library shapes (polygons, stars, arrows, lines, …) render via SVG.
    if (!PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
      return (
        <ShapeSVG
          shape={el.shape}
          fill={el.fill || "#6366f1"}
          stroke={el.stroke || "transparent"}
          strokeWidth={el.strokeWidth || 0}
        />
      );
    }
    // Primitives keep the lightweight div rendering (crisp, honors borderRadius).
    const common = {
      width: "100%",
      height: "100%",
      background: el.fill || "transparent",
      border:
        el.strokeWidth && el.stroke
          ? `${el.strokeWidth}px solid ${el.stroke}`
          : "none",
      boxSizing: "border-box",
    };
    if (el.shape === "circle") {
      return <div style={{ ...common, borderRadius: "50%" }} />;
    }
    if (el.shape === "triangle") {
      return (
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${el.width / 2}px solid transparent`,
            borderRight: `${el.width / 2}px solid transparent`,
            borderBottom: `${el.height}px solid ${el.fill || "#000"}`,
          }}
        />
      );
    }
    return <div style={{ ...common, borderRadius: el.borderRadius || 0 }} />;
  }

  if (el.type === "image" && el.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={el.src}
        alt=""
        draggable={false}
        crossOrigin="anonymous"
        style={{
          width: "100%",
          height: "100%",
          objectFit: el.objectFit || "cover",
          borderRadius: el.borderRadius || 0,
          pointerEvents: "none",
        }}
      />
    );
  }

  return null;
}

function handleStyles(selected) {
  if (!selected) return {};
  const dot = {
    width: 10,
    height: 10,
    background: "#fff",
    border: "2px solid #6366f1",
    borderRadius: "50%",
  };
  return {
    topLeft: dot,
    topRight: dot,
    bottomLeft: dot,
    bottomRight: dot,
  };
}
