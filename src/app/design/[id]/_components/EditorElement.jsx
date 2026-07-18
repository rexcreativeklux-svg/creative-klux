"use client";

import React, { useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import ShapeSVG from "./ShapeSVG";
import { SHAPES, PRIMITIVE_SHAPES, isStraightLine } from "@/(lib)/design/shapes";
import { pointsToPath } from "@/(lib)/design/drawUtils";
import { curvePath } from "@/(lib)/design/curveUtils";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { fitFontSize } from "./textFit";
import EditorElementMenu from "./EditorElementMenu";
import {
  normalizeCells,
  setCell,
  getColFractions,
  getRowFractions,
  resizeTrack,
  addRow,
  addCol,
} from "@/(lib)/design/tableUtils";

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
  onCurveAddPoint,
  activeCell,
  onCellFocus,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  onAskKlux,
}) {
  const locked = !!el.locked;
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

  // Auto-fit: pick the largest font that fits a sticky note's box. Re-runs when
  // its text or size changes; writes fontSize back (no undo entry).
  useEffect(() => {
    if (el.type !== "text" || !el.sticky || el.autoFit === false) return;
    const pad = el.padding ?? 2;
    const value =
      typeof el.content === "string"
        ? el.content
        : typeof el.text === "string"
          ? el.text
          : "";
    const size = fitFontSize({
      text: value,
      maxWidth: Math.max(1, el.width - pad * 2),
      maxHeight: Math.max(1, el.height - pad * 2),
      fontFamily: el.fontFamily || "'DM Sans', sans-serif",
      fontWeight: el.fontWeight || "normal",
      fontStyle: el.fontStyle || "normal",
    });
    if (Math.abs(size - (el.fontSize || 0)) > 0.5) {
      onChange({ fontSize: size }, { record: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    el.sticky,
    el.autoFit,
    el.content,
    el.text,
    el.width,
    el.height,
    el.padding,
    el.fontFamily,
    el.fontWeight,
    el.fontStyle,
  ]);

  // Straight lines & curves are edited via point handles (drawn by DesignEditor),
  // so suppress the box outline and corner resizers — they'd fight the handles.
  const straightLine = el.type === "shape" && isStraightLine(el.shape);
  const noBox = straightLine || el.type === "curve";

  const selectionStyle =
    selected && !noBox
      ? { outline: "2px solid #6366f1", outlineOffset: 0 }
      : { outline: "1px dashed transparent" };

  const rotation = el.rotation || 0;

  return (
    <Rnd
      scale={zoom}
      // No `bounds` — elements can be dragged/resized past the canvas edge and
      // the overflow is clipped by the stage (overflow:hidden), Canva-style,
      // instead of being trapped inside the artboard.
      size={{ width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      disableDragging={editing || locked}
      enableResizing={selected && !editing && !noBox && !locked}
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
        opacity: el.opacity ?? 1,
        // Stacking follows DOM/array order so bring-to-front / send-to-back work.
        // Only lift the element while it's actively selected+editing so its
        // resize handles stay reachable, without overriding the layer order.
        zIndex: editing ? 30 : undefined,
        ...selectionStyle,
      }}
      resizeHandleStyles={handleStyles(selected)}
    >
      {/* Rotation lives on the inner content: react-rnd drives the outer node's
          transform (translate) for positioning, so rotating it there is dropped. */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
        }}
        onDoubleClick={(e) => {
          if (locked) return;
          if (el.type === "text" || el.type === "table") onStartEdit?.(el.id);
          else if (el.type === "curve") onCurveAddPoint?.(el.id, e);
        }}
      >
        {renderInner(el, {
          editing,
          textRef,
          commitText,
          onChange,
          zoom,
          selected,
          activeCell,
          onCellFocus,
        })}
      </div>

      {/* Floating action pill below the element (lock / duplicate / delete /
          layer order). Kept out of the rotated content so it stays upright. */}
      {selected && !editing && (
        <EditorElementMenu
          zoom={zoom}
          locked={locked}
          onDuplicate={() => onDuplicate?.(el.id)}
          onRemove={() => onRemove?.(el.id)}
          onMoveLayer={(dir) => onMoveLayer?.(el.id, dir)}
          onToggleLock={() => onToggleLock?.(el.id)}
          onAskKlux={onAskKlux}
        />
      )}
    </Rnd>
  );
}

function renderInner(
  el,
  { editing, textRef, commitText, onChange, zoom, selected, activeCell, onCellFocus },
) {
  if (el.type === "table") {
    return (
      <TableInner
        el={el}
        editing={editing}
        selected={selected}
        zoom={zoom}
        onChange={onChange}
        activeCell={activeCell}
        onCellFocus={onCellFocus}
      />
    );
  }

  if (el.type === "text") {
    const style = {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: el.sticky ? "flex-start" : "center",
      fontSize: el.fontSize || 16,
      fontWeight: el.fontWeight || "normal",
      fontFamily: el.fontFamily || "'DM Sans', sans-serif",
      color: el.fill || el.color || "#111111",
      textAlign: el.textAlign || "left",
      lineHeight: el.lineHeight || 1.3,
      letterSpacing: el.letterSpacing || "normal",
      fontStyle: el.fontStyle || "normal",
      textDecoration: el.underline ? "underline" : "none",
      cursor: editing ? "text" : "move",
      outline: "none",
      overflow: "hidden",
      padding: el.padding ?? 2,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      userSelect: editing ? "text" : "none",
      boxSizing: "border-box",
    };
    const value =
      typeof el.content === "string"
        ? el.content
        : typeof el.text === "string"
          ? el.text
          : "";

    const textNode = (
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

    // Plain text — no paper backing.
    if (!el.background) return textNode;

    // Sticky note: a lifted sheet of paper with a soft shadow and a folded corner.
    const fold = Math.max(14, Math.round(Math.min(el.width, el.height) * 0.13));
    const radius = el.borderRadius || 8;
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: radius,
          backgroundColor: el.background,
          // paper depth: light from top-left, subtle shade toward the bottom
          backgroundImage:
            "linear-gradient(150deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 40%, rgba(0,0,0,0.07) 100%)",
          boxShadow: "0 8px 18px rgba(0,0,0,0.18), 0 2px 5px rgba(0,0,0,0.12)",
          boxSizing: "border-box",
        }}
      >
        {textNode}
        {/* curled bottom-right corner — a soft diagonal shadow reads as a fold */}
        <div
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: fold,
            height: fold,
            borderBottomRightRadius: radius,
            background:
              "linear-gradient(135deg, transparent 0%, transparent 52%, rgba(0,0,0,0.16) 52%, rgba(0,0,0,0.28) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  if (el.type === "shape") {
    // Library shapes (polygons, stars, arrows, lines, …) render via SVG.
    if (!PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
      // Curvature: el.bend (canvas units, apex offset) → viewBox control offset.
      const bend = el.bend ? (24 * el.bend) / (el.height || 1) : 0;
      return (
        <ShapeSVG
          shape={el.shape}
          fill={el.fill || "#6366f1"}
          stroke={el.stroke || "transparent"}
          strokeWidth={el.strokeWidth || 0}
          bend={bend}
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

  if (el.type === "draw") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${el.vbW || el.width} ${el.vbH || el.height}`}
        preserveAspectRatio="none"
        style={{ display: "block", mixBlendMode: el.blend || "normal", overflow: "visible" }}
      >
        <path
          d={pointsToPath(el.points)}
          fill="none"
          stroke={el.stroke || "#111111"}
          strokeWidth={el.strokeWidth || 4}
          strokeLinecap={el.cap || "round"}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (el.type === "curve") {
    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${el.vbW || el.width} ${el.vbH || el.height}`}
        preserveAspectRatio="none"
        style={{ display: "block", overflow: "visible" }}
      >
        <path
          d={curvePath(el.points, el.sharp)}
          fill="none"
          stroke={el.stroke || "#111111"}
          strokeWidth={el.strokeWidth || 4}
          strokeLinecap={el.cap || "round"}
          strokeLinejoin="round"
          strokeDasharray={el.dash ? el.dash.join(" ") : undefined}
        />
      </svg>
    );
  }

  if (el.type === "image" && el.src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proxiedSrc(el.src)}
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

/**
 * TableInner — renders the grid of a "table" element. Cell separators are the
 * container background showing through a `borderWidth` grid `gap`, which keeps
 * borders hairline-crisp at any zoom. Column/row sizes come from relative
 * weights (see tableUtils) so tracks can be dragged individually.
 *
 * When `editing`, each cell is contentEditable and commits on blur. When merely
 * `selected` (not editing), thin divider handles let the user drag a single
 * row/column wider or narrower, and "+" affordances add a row (bottom) or a
 * column (right).
 */
function TableInner({
  el,
  editing,
  selected,
  zoom = 1,
  onChange,
  activeCell,
  onCellFocus,
}) {
  const cells = normalizeCells(el.cells, el.rows, el.cols);
  const border = el.borderColor || "#d1d5db";
  const bw = el.borderWidth ?? 1;
  const colFr = getColFractions(el);
  const rowFr = getRowFractions(el);
  const showHandles = selected && !editing;

  const commitCell = (r, c, node) => {
    const value = node.innerText;
    if (value === (cells[r]?.[c] ?? "")) return; // no-op, keep history clean
    onChange?.(setCell(el, r, c, value), { record: true });
  };

  // Drag a divider: convert screen movement into a relative-weight delta and
  // trade it between the two tracks it sits between. The first move of a drag
  // records history (capturing the pre-drag size); the rest don't, so one drag
  // is a single undo step.
  const startTrackDrag = (axis, index) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startPos = axis === "col" ? e.clientX : e.clientY;
    const total = axis === "col" ? el.width : el.height;
    const sumFr = (axis === "col" ? colFr : rowFr).reduce((s, f) => s + f, 0);
    let recorded = false;

    const onMove = (ev) => {
      const pos = axis === "col" ? ev.clientX : ev.clientY;
      const deltaPx = (pos - startPos) / (zoom || 1); // screen → canvas units
      const deltaFr = (deltaPx / total) * sumFr;
      const patch = resizeTrack(el, axis, index, deltaFr);
      if (!Object.keys(patch).length) return;
      onChange?.(patch, { record: !recorded });
      recorded = true;
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const addBtn = (e, patchFn) => {
    e.preventDefault();
    e.stopPropagation();
    onChange?.(patchFn(el), { record: true });
  };

  // Cumulative track offsets as percentages, for positioning divider handles.
  const offsets = (fr) => {
    const sum = fr.reduce((s, f) => s + f, 0);
    const out = [];
    let acc = 0;
    for (let i = 0; i < fr.length - 1; i++) {
      acc += fr[i];
      out.push((acc / sum) * 100);
    }
    return out;
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          gridTemplateColumns: colFr.map((f) => `${f}fr`).join(" "),
          gridTemplateRows: rowFr.map((f) => `${f}fr`).join(" "),
          gap: bw,
          background: border,
          border: `${bw}px solid ${border}`,
          borderRadius: el.borderRadius || 6,
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {cells.map((row, r) =>
          row.map((value, c) => {
            const isHeader = el.headerRow && r === 0;
            // Highlight the whole row/column the active cell sits in, so it's
            // clear which track the delete buttons will remove.
            const inActive =
              activeCell && (activeCell.r === r || activeCell.c === c);
            return (
              <div
                key={`${r}-${c}`}
                contentEditable={editing}
                suppressContentEditableWarning
                onMouseDown={() => onCellFocus?.(r, c)}
                onFocus={() => onCellFocus?.(r, c)}
                onBlur={(e) => commitCell(r, c, e.currentTarget)}
                style={{
                  boxShadow: inActive
                    ? "inset 0 0 0 2px rgba(99,102,241,0.55)"
                    : undefined,
                  background: isHeader
                    ? el.headerFill || "#f3f4f6"
                    : el.cellFill || "#ffffff",
                  color: el.textColor || "#111827",
                  fontFamily: el.fontFamily || "'DM Sans', sans-serif",
                  fontSize: el.fontSize || 16,
                  fontWeight: isHeader ? 600 : "normal",
                  textAlign: el.align || "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    (el.align || "left") === "center"
                      ? "center"
                      : (el.align || "left") === "right"
                        ? "flex-end"
                        : "flex-start",
                  padding: "6px 10px",
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  outline: "none",
                  cursor: editing ? "text" : "move",
                  userSelect: editing ? "text" : "none",
                  boxSizing: "border-box",
                }}
              >
                {value}
              </div>
            );
          }),
        )}
      </div>

      {/* Column dividers — drag to resize the two columns they sit between */}
      {showHandles &&
        offsets(colFr).map((left, i) => (
          <div
            key={`cd-${i}`}
            onMouseDown={startTrackDrag("col", i)}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${left}%`,
              width: 10,
              transform: "translateX(-50%)",
              cursor: "col-resize",
              zIndex: 5,
            }}
          />
        ))}

      {/* Row dividers */}
      {showHandles &&
        offsets(rowFr).map((top, i) => (
          <div
            key={`rd-${i}`}
            onMouseDown={startTrackDrag("row", i)}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${top}%`,
              height: 10,
              transform: "translateY(-50%)",
              cursor: "row-resize",
              zIndex: 5,
            }}
          />
        ))}

      {/* Add-row (bottom) and add-column (right) affordances */}
      {showHandles && (
        <>
          <AddTrackButton
            orientation="row"
            onMouseDown={(e) => addBtn(e, addRow)}
          />
          <AddTrackButton
            orientation="col"
            onMouseDown={(e) => addBtn(e, addCol)}
          />
        </>
      )}
    </div>
  );
}

/**
 * AddTrackButton — the round "+" pinned just outside the table: below-center to
 * add a row, right-center to add a column. Sized in inverse zoom so it stays a
 * constant on-screen size regardless of how far the canvas is scaled.
 */
function AddTrackButton({ orientation, onMouseDown }) {
  const isRow = orientation === "row";
  const pos = isRow
    ? { bottom: -34, left: "50%", transform: "translateX(-50%)" }
    : { right: -34, top: "50%", transform: "translateY(-50%)" };
  return (
    <button
      title={isRow ? "Add row" : "Add column"}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        ...pos,
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: "#6366f1",
        color: "#fff",
        border: "2px solid #fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        lineHeight: 1,
        cursor: "pointer",
        zIndex: 6,
      }}
    >
      +
    </button>
  );
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
