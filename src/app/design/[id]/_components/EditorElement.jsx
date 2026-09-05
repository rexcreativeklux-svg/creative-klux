"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { Rnd } from "react-rnd";
import { ImagePlus } from "lucide-react";
import ShapeSVG from "./ShapeSVG";
import { SHAPES, PRIMITIVE_SHAPES, isStraightLine, dashCssFor } from "@/(lib)/design/shapes";
import { frameGeo } from "@/(lib)/design/frames";
import { gridCellRects, normFractions } from "@/(lib)/design/grids";
import { chartSVGDataURL } from "@/(lib)/design/charts";
import { graphicSVGDataURL } from "@/(lib)/design/graphics";
import { pointsToPath } from "@/(lib)/design/drawUtils";
import { curvePath } from "@/(lib)/design/curveUtils";
import { proxiedSrc } from "@/(lib)/design/renderDesign";
import { radiusToCss } from "@/(lib)/design/radius";
import { hasPerspective } from "@/(lib)/design/perspective";
import PerspectiveImage from "./PerspectiveImage";
import { fitFontSize } from "./textFit";
import { textEffectCss } from "@/(lib)/design/textEffects";
import { animationStyle } from "@/(lib)/design/animations";
import { buildImageFilter } from "@/(lib)/design/imageAdjust";
import { isCropped } from "@/(lib)/design/imageCrop";
import { isColourValue, tintOverlayStyle } from "@/(lib)/design/imageTint";
import { gradientTextStyle, isGradient } from "@/(lib)/design/gradient";
import { shapeEffectCss } from "@/(lib)/design/shapeEffects";
import { isClipped, windowed } from "@/(lib)/design/clip";
import { childAsElement } from "@/(lib)/design/groups";
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
 * it draggable (via react-rnd) and, for text, inline-editable.
 *
 * It draws no chrome. The selection outline, the eight resize handles and the
 * action pill belong to SelectionChrome, which lives in a layer the artboard
 * does not clip — chrome drawn in here disappeared along with the element the
 * moment it was scaled out past the canvas edge, taking with it the handles
 * needed to scale it back.
 *
 * All geometry is in *canvas* coordinates; `zoom` (the stage scale) is passed to
 * Rnd so drag deltas map 1:1 to canvas units.
 */
function EditorElement({
  element: el,
  zoom,
  selected,
  editing,
  onSelect, // (id, event) => void — the event carries the shift modifier
  onContextMenu, // (id, event) => void — right-click, opens the actions menu
  // Both of these take the element's id FIRST, and are bound to this element
  // just below. The parent renders one of these per element inside a .map(),
  // so a callback that closed over `el` there would be a new function on every
  // render of the stage — and a new function prop defeats the memo that stops
  // untouched elements re-rendering while something else is dragged. Taking the
  // id instead lets the parent pass one shared function for the whole page.
  onChange: onChangeById, // (id, patch, {record}) => void
  onCellFocus: onCellFocusById, // (id, r, c) => void
  // True when ANOTHER member of this selection is being dragged: this element
  // has to travel with it, and does so by transform rather than by re-rendering.
  coDragging = false,
  onDragBegin, // (id) => void         — a drag gesture started on this element
  onDragMove, // (id, {x, y}) => void  — live position, for dragging the others
  onDragEnd, // (id, {x, y}) => void   — commits; falls back to onChange
  onStartEdit,
  onEndEdit,
  onCurveAddPoint,
  activeCell,
  onFrameFill,
  onGridCellFill,
  animateToken = 0,
  suppressChrome = false,
  // Group entry. `entered` is set only once the group itself is selected, which
  // is what makes the second click reach a member rather than the first.
  entered = false,
  activeChildId = null,
  onChildSelect, // (childId, event) => void
  onChildChange, // (childId, patch, {record}) => void — ABSOLUTE geometry
  onChildGestureBegin, // () => void — one history entry per child drag
}) {
  const locked = !!el.locked;
  const textRef = useRef(null);

  // Re-bound to this element, so everything below — including the frame, grid
  // and table renderers this is threaded down to — keeps the plain
  // `onChange(patch, opts)` / `onCellFocus(r, c)` shape it already expects.
  const onChange = useCallback(
    (patch, opts) => onChangeById?.(el.id, patch, opts),
    [onChangeById, el.id],
  );
  const onCellFocus = useCallback(
    (r, c) => onCellFocusById?.(el.id, r, c),
    [onCellFocusById, el.id],
  );

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
    // Fit to the CONTENT box, not the visible one. A cropped note's box is a
    // window (clip.js): measuring that instead would refit the type every time
    // the window moved, which is the crop resizing its own contents — the one
    // thing cropping must never do.
    const boxW = el.clip?.contentW ?? el.width;
    const boxH = el.clip?.contentH ?? el.height;
    const size = fitFontSize({
      text: value,
      maxWidth: Math.max(1, boxW - pad * 2),
      maxHeight: Math.max(1, boxH - pad * 2),
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
    // The content box is what's measured, so a crop that changes only the
    // window must not re-run this — but one that grows the contents must.
    el.clip?.contentW,
    el.clip?.contentH,
    el.padding,
    el.fontFamily,
    el.fontWeight,
    el.fontStyle,
  ]);

  // Straight lines & curves are edited via point handles (drawn by DesignEditor),
  // so suppress the box outline and corner resizers — they'd fight the handles.
  const straightLine = el.type === "shape" && isStraightLine(el.shape);
  const noBox = straightLine || el.type === "curve";

  const rotation = el.rotation || 0;

  // Animation preview: when the play token is bumped, animated elements remount
  // (via `key`) so their CSS animation restarts. Suppressed while editing text.
  const animated =
    animateToken > 0 &&
    el.animation &&
    el.animation.type &&
    el.animation.type !== "none" &&
    !editing;
  const animStyle = animated ? animationStyle(el.animation) : null;

  return (
    <Rnd
      scale={zoom}
      // No `bounds` — elements can be dragged/resized past the canvas edge and
      // the overflow is clipped by the stage (overflow:hidden), Canva-style,
      // instead of being trapped inside the artboard.
      size={{ width: el.width, height: el.height }}
      position={{ x: el.x, y: el.y }}
      disableDragging={editing || locked || suppressChrome}
      // Resizing is not react-rnd's any more. All eight handles are drawn by
      // SelectionChrome, in a layer the artboard does not clip, so they stay
      // reachable when an element is scaled out past the canvas edge. Cropping
      // also has to own the box, which re-resizable will not allow mid-gesture.
      enableResizing={false}
      onDragStart={(e) => {
        // A drag starts on mousedown, so this and onMouseDown below both fire
        // for the same press and their order is react-rnd's business, not ours.
        // Hence both conditions: an element already in the selection must not be
        // re-selected (that would collapse a multi-selection the moment you
        // moved it), and a modifier press belongs to onMouseDown's toggle alone
        // — selecting here would undo it if this ran first. What's left is the
        // case this exists for: a plain drag on touch, where there is no
        // mousedown to have made the selection.
        const additive = e?.shiftKey || e?.metaKey || e?.ctrlKey;
        if (!selected && !additive) onSelect(el.id);
        onDragBegin?.(el.id);
      }}
      onMouseDown={(e) => onSelect(el.id, e)}
      onContextMenu={(e) => onContextMenu?.(el.id, e)}
      onDrag={(e, d) => onDragMove?.(el.id, d)}
      onDragStop={(e, d) => {
        if (onDragEnd) onDragEnd(el.id, d);
        else onChange({ x: d.x, y: d.y }, { record: true });
      }}
      style={{
        opacity: el.opacity ?? 1,
        // Stacking follows DOM/array order so bring-to-front / send-to-back work.
        // Only lift the element while it's actively selected+editing so its
        // resize handles stay reachable, without overriding the layer order.
        zIndex: editing ? 30 : undefined,
        // Load-bearing on touch. The stage viewport scrolls below `lg` (that is
        // how panning a zoomed-in canvas works), so without this the browser
        // claims a one-finger drag as a scroll gesture and the element never
        // moves. Suppressed while editing text, where the browser's own
        // selection and caret dragging must keep working.
        touchAction: editing ? undefined : "none",
      }}
    >
      {/* Rotation lives on the inner content: react-rnd drives the outer node's
          transform (translate) for positioning, so rotating it there is dropped.
          The drag offset rides here too, when this element is part of a
          selection being dragged by ANOTHER of its members. The two variables
          are written straight to the stage's style during the gesture, so every
          co-dragged element follows from one write per frame and none of them
          re-render — see paintDragShift in DesignEditor. Translate before
          rotate, so a turned element still travels along the page's axes. */}
      <div
        style={{
          width: "100%",
          height: "100%",
          transform:
            [
              coDragging
                ? "translate(var(--ck-drag-x, 0px), var(--ck-drag-y, 0px))"
                : null,
              rotation ? `rotate(${rotation}deg)` : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
        }}
        onDoubleClick={(e) => {
          if (locked) return;
          if (el.type === "text" || el.type === "table") onStartEdit?.(el.id);
          else if (el.type === "curve") onCurveAddPoint?.(el.id, e);
        }}
      >
        {/* Animation layer — remounts on each play so the CSS animation restarts.
            Kept inside the rotation wrapper so animate transforms don't clobber
            the element's rotation. */}
        <div
          key={animated ? `play-${animateToken}` : "static"}
          style={{ width: "100%", height: "100%", ...(animStyle || {}) }}
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
            onFrameFill,
            onGridCellFill,
            interactive: entered,
            activeChildId,
            onChildSelect,
            onChildChange,
            onChildGestureBegin,
          })}
        </div>
      </div>

    </Rnd>
  );
}

/**
 * GroupInner — a group's members, laid out inside the group's box.
 *
 * Children carry coordinates RELATIVE to that box (see lib/design/groups.js),
 * and the stage is already scaled, so their canvas units are this box's pixels
 * 1:1 — no further conversion. Each child goes through the same renderInner as
 * a top-level element, so a grouped chart / table / image looks identical to an
 * ungrouped one.
 *
 * ── Reaching inside ───────────────────────────────────────────────────────
 *
 * `interactive` turns the members from a picture into targets, and DesignEditor
 * only sets it once the group ITSELF is selected. That is the Canva rule: the
 * first click takes the group, the next one takes the thing under the pointer.
 * Without it there is no way to restyle one member without breaking the group
 * apart and putting it back together — and with it on by default, a group would
 * never be selectable as one thing at all.
 *
 * A press on a member selects it and drags it here rather than through react-rnd:
 * a child is not in the elements array, so it has no Rnd of its own to be moved
 * by. The patches this emits are ABSOLUTE, like every other patch in the editor;
 * patchGroupChild converts them back on the way into the group.
 */
const stopEvent = (e) => e.stopPropagation();

function GroupInner({
  el,
  zoom,
  interactive,
  activeChildId,
  onChildSelect,
  onChildChange,
  onChildGestureBegin,
}) {
  const drag = useRef(null);

  const begin = (child) => (e) => {
    if (!interactive) return;
    // The group's own Rnd is an ancestor: without this, the same press would
    // start dragging the whole group as well as the member.
    e.stopPropagation();
    onChildSelect?.(child.id, e);
    if (child.locked || e.button === 2) return;

    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = {
      id: child.id,
      sx: e.clientX,
      sy: e.clientY,
      // Where the member really is on the page, group rotation and all — the
      // space its patches have to be written in.
      snap: childAsElement(el, child),
      committed: false,
    };
  };

  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    // Measured from where the gesture started against the snapshot taken then,
    // never accumulated per frame: accumulation drifts, and makes the result
    // depend on how many frames the browser happened to render.
    const dx = (e.clientX - d.sx) / zoom;
    const dy = (e.clientY - d.sy) / zoom;
    if (!dx && !dy) return;

    // History on the first MOVE, not on the press — otherwise every click on a
    // member would push an undo entry that changed nothing.
    if (!d.committed) {
      d.committed = true;
      onChildGestureBegin?.();
    }
    onChildChange?.(d.id, { x: d.snap.x + dx, y: d.snap.y + dy }, { record: false });
  };

  const end = (e) => {
    if (!drag.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    drag.current = null;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {(el.children || [])
        .filter((child) => !child.hidden)
        .map((child) => (
          <div
            key={child.id}
            onPointerDown={interactive ? begin(child) : undefined}
            // react-rnd drags from mouse/touch events, which are separate from
            // the pointer events above — stopping only those would select the
            // member and drag the whole group with it.
            onMouseDown={interactive ? stopEvent : undefined}
            onTouchStart={interactive ? stopEvent : undefined}
            onPointerMove={interactive ? move : undefined}
            onPointerUp={interactive ? end : undefined}
            onPointerCancel={interactive ? end : undefined}
            style={{
              position: "absolute",
              left: child.x,
              top: child.y,
              width: child.width,
              height: child.height,
              opacity: child.opacity ?? 1,
              transform: child.rotation ? `rotate(${child.rotation}deg)` : undefined,
              pointerEvents: interactive ? "auto" : "none",
              cursor: interactive && !child.locked ? "move" : undefined,
              touchAction: interactive ? "none" : undefined,
            }}
          >
            {renderInner(child, {
              zoom,
              selected: child.id === activeChildId,
              editing: false,
              // One level only. A group nested inside this one is a single
              // member here; entering IT would need its own first click, and
              // there is nothing to select it with until there is.
              interactive: false,
            })}
          </div>
        ))}
    </div>
  );
}

function renderInner(el, opts) {
  const {
    editing,
    textRef,
    commitText,
    onChange,
    zoom,
    selected,
    activeCell,
    onCellFocus,
    onFrameFill,
    onGridCellFill,
    interactive,
    activeChildId,
    onChildSelect,
    onChildChange,
    onChildGestureBegin,
  } = opts;

  // A cropped element's box is a WINDOW onto contents laid out at their own
  // size (see clip.js). Draw the window here and recurse once to draw the
  // contents inside it, at their true size and offset — so every branch below
  // crops correctly without any of them knowing that cropping exists. It is the
  // exact counterpart of the substitution the PNG exporter makes.
  //
  // Suspended while editing: a caret belongs in text the user can see, and a
  // contentEditable inside an offset, clipped box scrolls hidden content into
  // view and fights the offset.
  const win = editing ? null : el.clip;
  if (isClipped(win)) {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -(win.offsetX || 0),
            top: -(win.offsetY || 0),
            width: win.contentW,
            height: win.contentH,
          }}
        >
          {/* windowed() drops `clip`, so this recurses exactly once. */}
          {renderInner(windowed(el), opts)}
        </div>
      </div>
    );
  }

  if (el.type === "group") {
    return (
      <GroupInner
        el={el}
        zoom={zoom}
        interactive={interactive}
        activeChildId={activeChildId}
        onChildSelect={onChildSelect}
        onChildChange={onChildChange}
        onChildGestureBegin={onChildGestureBegin}
      />
    );
  }

  if (el.type === "frame") {
    return <FrameInner el={el} onFrameFill={onFrameFill} onChange={onChange} />;
  }

  if (el.type === "grid") {
    return (
      <GridInner
        el={el}
        zoom={zoom}
        selected={selected}
        onGridCellFill={onGridCellFill}
        onChange={onChange}
      />
    );
  }

  if (el.type === "chart") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={chartSVGDataURL(el)}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }}
      />
    );
  }

  if (el.type === "graphic") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={graphicSVGDataURL(el)}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }}
      />
    );
  }

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
      // A gradient overrides `color` with a clipped background — see
      // gradientTextStyle. Spread after `color` so it wins, and a no-op object
      // when the fill is an ordinary colour.
      ...(gradientTextStyle(el.fill || el.color) || {}),
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

    // Text effects (shadow / hollow / outline / glow / background …). The
    // "background" effect fills a rounded, padded box behind the glyphs — only
    // applied to plain text (sticky notes carry their own paper backing).
    const fx = textEffectCss(el);
    if (fx?.css) Object.assign(style, fx.css);
    if (fx?.background && !el.background) {
      const base = el.padding ?? 2;
      style.background = fx.background.color;
      style.borderRadius = fx.background.radius;
      style.padding = `${base + fx.background.padY}px ${base + fx.background.padX}px`;
    }
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
    // Shadow / echo / glow, as a stack of drop-shadow filters. Wrapped around
    // whichever renderer runs below rather than applied inside each one: a
    // filter follows the alpha silhouette of everything it contains, so one
    // wrapper gets the star-shaped shadow a star should cast without any of the
    // renderers knowing about effects at all.
    const effect = shapeEffectCss(el);
    const withEffect = (node) =>
      effect ? (
        <div style={{ width: "100%", height: "100%", ...effect }}>{node}</div>
      ) : (
        node
      );

    // Library shapes (polygons, stars, arrows, lines, …) render via SVG.
    if (!PRIMITIVE_SHAPES.has(el.shape) && SHAPES[el.shape]) {
      // Curvature: el.bend (canvas units, apex offset) → viewBox control offset.
      const bend = el.bend ? (24 * el.bend) / (el.height || 1) : 0;
      return withEffect(
        <ShapeSVG
          shape={el.shape}
          fill={el.fill || "#6366f1"}
          stroke={el.stroke || "transparent"}
          strokeWidth={el.strokeWidth || 0}
          strokeDash={el.strokeDash}
          bend={bend}
        />,
      );
    }
    // Primitives keep the lightweight div rendering (crisp, honors borderRadius).
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
    if (el.shape === "circle") {
      return withEffect(<div style={{ ...common, borderRadius: "50%" }} />);
    }
    if (el.shape === "triangle") {
      // Drawn with borders, and a border cannot take a gradient — so a gradient
      // fill is clipped onto a plain box instead. Same result, and it keeps the
      // cheap border trick for the ordinary case.
      if (isGradient(el.fill)) {
        return withEffect(
          <div
            style={{
              width: "100%",
              height: "100%",
              background: el.fill,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            }}
          />,
        );
      }
      return withEffect(
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: `${el.width / 2}px solid transparent`,
            borderRight: `${el.width / 2}px solid transparent`,
            borderBottom: `${el.height}px solid ${el.fill || "#000"}`,
          }}
        />,
      );
    }
    return withEffect(<div style={{ ...common, borderRadius: el.borderRadius || 0 }} />);
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
    const flip = `scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`;
    const filter = buildImageFilter(el) || undefined;

    // Border — painted OVER the picture, inset into the same box, rather than
    // around it. Turning one on therefore never resizes the image or nudges
    // anything beside it, and the PNG exporter can stroke the same rectangle in
    // the same place (see the image branch of renderDesign). It sits outside the
    // filter too, so a heavy Adjust doesn't tint the frame.
    const borderWidth = Number(el.borderWidth) || 0;
    const withBorder = (node) =>
      borderWidth > 0 ? (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          {node}
          <div
            style={{
              position: "absolute",
              inset: 0,
              border: `${borderWidth}px solid ${el.borderColor || "#ffffff"}`,
              borderRadius: radiusToCss(el.borderRadius),
              boxSizing: "border-box",
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        node
      );

    // Colour. The box fill sits BEHIND the photo — that is what shows through a
    // `contain` fit's letterboxing and through a cutout's removed background —
    // and the overlay tints the photo itself. `isolation: isolate` confines the
    // blend to this element: without it, `mix-blend-mode` reaches through to
    // whatever is stacked underneath and tints that too.
    const tintOverlay = tintOverlayStyle(el);
    const boxFill = isColourValue(el.backgroundColor)
      ? el.backgroundColor
      : undefined;
    const withTint = (node) =>
      boxFill || tintOverlay ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            isolation: "isolate",
            background: boxFill,
            borderRadius: radiusToCss(el.borderRadius),
            overflow: "hidden",
          }}
        >
          {node}
          {tintOverlay && <div style={tintOverlay} />}
        </div>
      ) : (
        node
      );

    // Border outside the tint, so a heavy colour doesn't repaint the frame —
    // the same reason it sits outside the Adjust filter.
    const withChrome = (node) => withBorder(withTint(node));

    // Perspective warp — rendered through a <canvas> so the stage matches the
    // PNG export (CSS 3D can't be reproduced in the canvas export).
    if (hasPerspective(el)) {
      return withChrome(<PerspectiveImage el={el} filter={filter} flip={flip} />);
    }
    // Cache the image's natural size on the element so the crop tool has it
    // synchronously (no race with an async load → no distorted crops).
    const onImgLoad = (e) => {
      const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
      if (w && h && (el.natW !== w || el.natH !== h)) {
        onChange?.({ natW: w, natH: h }, { record: false });
      }
    };

    // Cropped: map the crop sub-rectangle onto the box (source-rect → box). Flip
    // lives on the clipping wrapper so it mirrors the visible region in place.
    if (isCropped(el.crop)) {
      const c = el.crop;
      return withChrome(
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            borderRadius: radiusToCss(el.borderRadius),
            transform: el.flipH || el.flipV ? flip : undefined,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedSrc(el.src)}
            alt=""
            draggable={false}
            crossOrigin="anonymous"
            onLoad={onImgLoad}
            style={{
              position: "absolute",
              width: `${100 / c.w}%`,
              height: `${100 / c.h}%`,
              left: `${(-c.x / c.w) * 100}%`,
              top: `${(-c.y / c.h) * 100}%`,
              objectFit: "fill",
              filter,
              pointerEvents: "none",
            }}
          />
        </div>,
      );
    }

    return withChrome(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={proxiedSrc(el.src)}
        alt=""
        draggable={false}
        crossOrigin="anonymous"
        onLoad={onImgLoad}
        style={{
          width: "100%",
          height: "100%",
          objectFit: el.objectFit || "cover",
          borderRadius: radiusToCss(el.borderRadius),
          transform: flip,
          filter,
          pointerEvents: "none",
        }}
      />,
    );
  }

  return null;
}

/**
 * FrameInner — a "frame" element: an image clipped to a shape mask (Canva-style).
 *
 * The clip is an inline SVG <clipPath> built from the shared frame geometry
 * (frameGeo), scaled from its viewBox to the element box via an SVG transform —
 * so arcs/curves scale correctly (unlike rewriting path coordinates). The image
 * cover-fits the box and is clipped to that path; an empty frame shows the shape
 * as a grey placeholder with an "Add image" prompt.
 *
 * Fill / replace the image by double-clicking the frame (opens a file picker) or
 * dropping an image file onto it; both route through onFrameFill(id, file).
 */
function FrameInner({ el, onFrameFill, onChange }) {
  const fileRef = useRef(null);
  const { path, viewBox } = frameGeo(el.shape);
  const [vw, vh] = viewBox;
  const sx = (el.width || 1) / vw;
  const sy = (el.height || 1) / vh;
  const clipId = `frame-clip-${el.id}`;

  const openPicker = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onFrameFill?.(el.id, f);
    e.target.value = ""; // allow re-picking the same file
  };
  const onDrop = (e) => {
    e.preventDefault();
    // A file dropped from the OS uploads; a URL dragged from the Uploads panel
    // (a durable gallery image) can be used directly, no upload needed.
    const f = Array.from(e.dataTransfer?.files || []).find((x) =>
      x.type?.startsWith("image/"),
    );
    if (f) {
      onFrameFill?.(el.id, f);
      return;
    }
    const url = draggedImageUrl(e);
    if (url) onChange?.({ src: url }, { record: true });
  };

  return (
    <div
      style={{ position: "relative", width: "100%", height: "100%" }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        openPicker();
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {/* Clip definition — scaled from the frame's viewBox to the element box. */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path d={path} transform={`scale(${sx} ${sy})`} />
          </clipPath>
        </defs>
      </svg>

      {el.src ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            clipPath: `url(#${clipId})`,
            WebkitClipPath: `url(#${clipId})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={proxiedSrc(el.src)}
            alt=""
            draggable={false}
            crossOrigin="anonymous"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scaleX(${el.flipH ? -1 : 1}) scaleY(${el.flipV ? -1 : 1})`,
              pointerEvents: "none",
            }}
          />
        </div>
      ) : (
        <>
          {/* Grey placeholder in the shape of the frame (stretched to the box). */}
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${vw} ${vh}`}
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, display: "block" }}
          >
            <path d={path} fill="#e5e7eb" />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              color: "#9ca3af",
              pointerEvents: "none",
            }}
          >
            <ImagePlus className="w-6 h-6" />
            <span style={{ fontSize: 12, fontWeight: 500 }}>Add image</span>
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{ display: "none" }}
      />
    </div>
  );
}

// Extract a usable image URL from a drag (Uploads-panel tile sets these).
function draggedImageUrl(e) {
  const dt = e.dataTransfer;
  if (!dt) return null;
  const raw =
    dt.getData("application/x-ck-image") ||
    dt.getData("text/uri-list") ||
    dt.getData("text/plain") ||
    "";
  const url = raw.split("\n")[0].trim();
  return /^(https?:|data:|blob:)/.test(url) ? url : null;
}

/**
 * GridInner — a "grid" element: a rows × cols layout of independent image cells
 * (Canva-style photo grid). Each cell cover-fits its image (clipped by the cell's
 * overflow:hidden) or shows an "add" glyph when empty. Fill/replace a cell by
 * double-clicking it, dropping an OS image file, or dragging an image from the
 * Uploads panel onto it. When selected, thin dividers between tracks drag to
 * resize columns/rows (stored as colFr/rowFr weights).
 */
function GridInner({ el, zoom = 1, selected, onGridCellFill, onChange }) {
  const fileRef = useRef(null);
  const pendingCell = useRef(null);
  const dragRef = useRef(null);
  const rows = Math.max(1, el.rows || 1);
  const cols = Math.max(1, el.cols || 1);
  const gap = el.gap ?? 8;
  const cells = el.cells || [];

  const colFr = normFractions(el.colFr, cols);
  const rowFr = normFractions(el.rowFr, rows);

  const openPicker = (i) => {
    pendingCell.current = i;
    fileRef.current?.click();
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f && pendingCell.current != null) {
      onGridCellFill?.(el.id, pendingCell.current, f);
    }
    e.target.value = "";
    pendingCell.current = null;
  };
  const setCellSrc = (i, src) => {
    const next = Array.from({ length: rows * cols }, (_, k) =>
      k === i ? { ...(cells[k] || {}), src } : cells[k] || { src: null },
    );
    onChange?.({ cells: next }, { record: true });
  };
  const onDropCell = (i, e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = Array.from(e.dataTransfer?.files || []).find((x) =>
      x.type?.startsWith("image/"),
    );
    if (f) {
      onGridCellFill?.(el.id, i, f);
      return;
    }
    const url = draggedImageUrl(e);
    if (url) setCellSrc(i, url);
  };

  // ── Divider drag: transfer weight between two adjacent tracks ──────────────
  const onDividerDown = (axis, i, e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    dragRef.current = {
      axis,
      i,
      start: axis === "col" ? e.clientX : e.clientY,
      fr: axis === "col" ? [...colFr] : [...rowFr],
      committed: false,
    };
  };
  const onDividerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const n = d.axis === "col" ? cols : rows;
    const content =
      d.axis === "col" ? el.width - gap * (n - 1) : el.height - gap * (n - 1);
    if (content <= 0) return;
    const moved = d.axis === "col" ? e.clientX - d.start : e.clientY - d.start;
    const df = moved / zoom / content; // delta as a fraction of content size
    const fr = [...d.fr];
    const min = 0.06;
    const a = fr[d.i] + df;
    const b = fr[d.i + 1] - df;
    if (a < min || b < min) return;
    fr[d.i] = a;
    fr[d.i + 1] = b;
    const key = d.axis === "col" ? "colFr" : "rowFr";
    onChange?.({ [key]: fr }, { record: !d.committed });
    d.committed = true;
  };
  const onDividerUp = (e) => {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragRef.current = null;
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "grid",
        gap,
        gridTemplateColumns: colFr.map((f) => `${f}fr`).join(" "),
        gridTemplateRows: rowFr.map((f) => `${f}fr`).join(" "),
        background: "#ffffff",
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const src = cells[i]?.src;
        return (
          <div
            key={i}
            onDoubleClick={(e) => {
              e.stopPropagation();
              openPicker(i);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropCell(i, e)}
            style={{
              position: "relative",
              overflow: "hidden",
              background: "#e5e7eb",
              borderRadius: el.cellRadius || 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxiedSrc(src)}
                alt=""
                draggable={false}
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
              />
            ) : (
              <ImagePlus className="w-5 h-5 text-gray-400" />
            )}
          </div>
        );
      })}

      {/* Divider handles (only while selected) — reshape columns/rows. */}
      {selected && (
        <GridDividers
          rects={gridCellRects(el)}
          width={el.width}
          height={el.height}
          gap={gap}
          rows={rows}
          cols={cols}
          zoom={zoom}
          onDown={onDividerDown}
          onMove={onDividerMove}
          onUp={onDividerUp}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        style={{ display: "none" }}
      />
    </div>
  );
}

/**
 * GridDividers — thin draggable strips centered on each internal column/row gap.
 * A column divider `i` sits between columns i and i+1; dragging it transfers
 * width between them. Sizes are divided by `zoom` to stay a constant hit-area.
 */
function GridDividers({ rects, width, height, gap, rows, cols, zoom, onDown, onMove, onUp }) {
  const hit = 10 / zoom;
  const handles = [];

  // Column dividers — one per internal boundary, taken from the top row's cells.
  for (let c = 0; c < cols - 1; c++) {
    const cell = rects.find((r) => r.col === c && r.row === 0);
    if (!cell) continue;
    const cx = cell.x + cell.w + gap / 2;
    handles.push(
      <div
        key={`c${c}`}
        onPointerDown={(e) => onDown("col", c, e)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{
          position: "absolute",
          top: 0,
          left: cx - hit / 2,
          width: hit,
          height,
          cursor: "col-resize",
          touchAction: "none",
          zIndex: 6,
        }}
      />,
    );
  }
  // Row dividers.
  for (let r = 0; r < rows - 1; r++) {
    const cell = rects.find((x) => x.row === r && x.col === 0);
    if (!cell) continue;
    const cy = cell.y + cell.h + gap / 2;
    handles.push(
      <div
        key={`r${r}`}
        onPointerDown={(e) => onDown("row", r, e)}
        onPointerMove={onMove}
        onPointerUp={onUp}
        style={{
          position: "absolute",
          left: 0,
          top: cy - hit / 2,
          width,
          height: hit,
          cursor: "row-resize",
          touchAction: "none",
          zIndex: 6,
        }}
      />,
    );
  }
  return <>{handles}</>;
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

/**
 * Memoized on purpose, and the reason every callback above takes an id.
 *
 * The stage renders one of these per element. Dragging three elements replaces
 * three entries in the elements array and leaves the rest untouched, but the map
 * that builds them re-runs regardless — so without this, every element on the
 * page re-rendered on every frame of the gesture, re-running its image filters,
 * text fitting and SVG paths to produce exactly what was already on screen.
 *
 * React Compiler does not do this part: it memoizes values INSIDE a component,
 * not the decision to re-render one. The props are all either stable functions
 * or this element's own data, so the default shallow compare is enough.
 */
export default React.memo(EditorElement);
