"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import useDesignEditor from "./useDesignEditor";
import EditorTopBar from "./EditorTopBar";
import KluxLogoIcon from "./panels/klux/KluxLogoIcon";
import EditorSidebar from "./EditorSidebar";
import EditorContextBar from "./EditorContextBar";
import EditorElement from "./EditorElement";
import ImageCropOverlay from "./ImageCropOverlay";
import ImageEraserOverlay from "./ImageEraserOverlay";
import PreviewOverlay from "./PreviewOverlay";
import { renderDesignToBlob, proxiedSrc, drawCover } from "@/(lib)/design/renderDesign";
import { isCropped } from "@/(lib)/design/imageCrop";
import { SHAPES, aspectOf, isStraightLine, isBendableLine } from "@/(lib)/design/shapes";
import { frameGeo } from "@/(lib)/design/frames";
import { makeGridCells } from "@/(lib)/design/grids";
import { DEFAULT_CHART_DATA } from "@/(lib)/design/charts";
import { graphicDef } from "@/(lib)/design/graphics";
import { ensureEditorFontsLoaded } from "@/(lib)/design/fonts";
import { strokeToElement, pointsToPath } from "@/(lib)/design/drawUtils";
import {
  defaultCurvePoints,
  elbowPoints,
  insertCurvePoint,
} from "@/(lib)/design/curveUtils";
import { measureText } from "./textFit";
import { TABLE_DEFAULTS, makeCells } from "@/(lib)/design/tableUtils";
import { KEYFRAMES_CSS } from "@/(lib)/design/animations";

const DRAW_TOOLS = ["pen", "marker", "highlighter", "eraser"];

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

/**
 * DesignEditor — reusable, prop-driven Canva-style editor.
 *
 * Props:
 *   design    { id, name, canvas, elements }  — the design to edit
 *   onSave    async ({ name, canvas, elements }) => void   (optional; defaults to updateDesignById)
 *   onBack    () => void
 *
 * Because it's fully driven by props, it can be mounted on the /design/[id]
 * route or dropped into a modal / any surface.
 */
export default function DesignEditor({ design, onSave, onBack, initialPanel }) {
  const { updateDesignById, uploadMedia } = useAuth();
  const editor = useDesignEditor(design);
  const {
    canvas,
    elements,
    selectedId,
    selectedElement,
    dirty,
    canUndo,
    canRedo,
    selectElement,
    updateElement,
    addElement,
    removeElement,
    duplicateElement,
    moveLayer,
    setBackground,
    undo,
    redo,
    commit,
    markSaved,
  } = editor;

  const [name, setName] = useState(design?.name || "Untitled design");
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState(null);
  // The cell the user last clicked inside a table: { id, r, c }. Drives which
  // row/column the context-bar delete buttons target. Transient (not saved).
  const [activeCell, setActiveCell] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [addNodeMode, setAddNodeMode] = useState(false);
  // Which sidebar panel is open. Lifted here so canvas actions (e.g. "Ask Klux"
  // on the element menu) can open a panel; the sidebar is otherwise self-driven.
  // Seeded from `initialPanel` so an entry point (e.g. "Edit with Ai") can deep-
  // link straight into a panel like Klux AI; falls back to the templates panel.
  const [activePanel, setActivePanel] = useState(initialPanel || "templates");
  // Descriptor for the contextual Color panel: which element props the picked
  // colour writes to. Set when a swatch in the context bar is clicked.
  const [colorTarget, setColorTarget] = useState(null);
  const openColorPanel = useCallback((target) => {
    setColorTarget(target);
    setActivePanel("color");
  }, []);
  // Bumped to (re)play element animations as an in-editor preview. Each bump
  // remounts animated elements so their CSS animation restarts (see EditorElement).
  const [animateToken, setAnimateToken] = useState(0);
  const playAnimations = useCallback(() => setAnimateToken((t) => t + 1), []);
  // Image crop / erase modes: the id of the image being cropped/erased (only one
  // at a time). The overlays register their Done/Reset handlers on these refs so
  // the shared top control bar can drive them.
  const [croppingId, setCroppingId] = useState(null);
  const [erasingId, setErasingId] = useState(null);
  const [brushSize, setBrushSize] = useState(40);
  const cropCommitRef = useRef(null);
  const cropResetRef = useRef(null);
  const eraseCommitRef = useRef(null);

  // ── Image crop / erase handlers ───────────────────────────────────────
  // Declared up here (above the keyboard effect that depends on them).
  const startCrop = useCallback(
    (id) => {
      selectElement(id);
      setEditingId(null);
      setErasingId(null);
      setCroppingId(id);
    },
    [selectElement],
  );

  const startErase = useCallback(
    (id) => {
      selectElement(id);
      setEditingId(null);
      setCroppingId(null);
      setErasingId(id);
    },
    [selectElement],
  );

  const cancelImageTool = useCallback(() => {
    setCroppingId(null);
    setErasingId(null);
  }, []);

  // Crop overlay → box-normalized selection. Bake exactly the retained pixels
  // (reproducing the current on-screen view, then slicing the selection) into a
  // new image and shrink the frame to it — no scaling/stretch. Undoable; then
  // uploaded for a durable URL, like erase/BG-removal.
  const applyCrop = useCallback(
    async (sel) => {
      const id = croppingId;
      const el = elementsRef.current.find((e) => e.id === id);
      setCroppingId(null);
      if (!id || !el || !el.src || !sel) return;
      // Full selection → nothing to crop.
      if (sel.x <= 0.001 && sel.y <= 0.001 && sel.w >= 0.999 && sel.h >= 0.999) {
        return;
      }
      try {
        const img = await new Promise((res, rej) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          im.onload = () => res(im);
          im.onerror = rej;
          im.src = proxiedSrc(el.src);
        });
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        // Bake the current view (cover, or an existing crop rect) at a resolution
        // that preserves detail, capped so the canvas can't balloon.
        const q = Math.min(2, Math.max(1, Math.max(nw / el.width, nh / el.height)));
        const cw = Math.max(1, Math.round(el.width * q));
        const ch = Math.max(1, Math.round(el.height * q));
        const base = document.createElement("canvas");
        base.width = cw;
        base.height = ch;
        const bctx = base.getContext("2d");
        if (isCropped(el.crop)) {
          const c = el.crop;
          bctx.drawImage(img, c.x * nw, c.y * nh, c.w * nw, c.h * nh, 0, 0, cw, ch);
        } else {
          drawCover(bctx, img, 0, 0, cw, ch);
        }
        // Slice the selection — these are the pixels the user chose to keep.
        const outW = Math.max(1, Math.round(sel.w * cw));
        const outH = Math.max(1, Math.round(sel.h * ch));
        const out = document.createElement("canvas");
        out.width = outW;
        out.height = outH;
        out
          .getContext("2d")
          .drawImage(base, sel.x * cw, sel.y * ch, sel.w * cw, sel.h * ch, 0, 0, outW, outH);
        const blob = await new Promise((res) => out.toBlob(res, "image/png"));
        if (!blob) return;
        const localUrl = URL.createObjectURL(blob);
        updateElement(
          id,
          {
            src: localUrl,
            crop: null,
            natW: outW,
            natH: outH,
            x: el.x + sel.x * el.width,
            y: el.y + sel.y * el.height,
            width: el.width * sel.w,
            height: el.height * sel.h,
          },
          { record: true },
        );
        try {
          const file = new File([blob], "cropped.png", { type: "image/png" });
          const res = await uploadMedia(file);
          const url =
            res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
          if (url) updateElement(id, { src: url }, { record: false });
        } catch {
          toast.error("Cropped image upload failed — it won't persist after save.");
        }
      } catch {
        toast.error("Couldn't crop the image");
      }
    },
    [croppingId, updateElement, uploadMedia],
  );

  // Eraser overlay → transparent PNG blob. Swap src (undoable), then upload for
  // a durable URL — same flow as background removal.
  const applyErase = useCallback(
    async (blob) => {
      const id = erasingId;
      setErasingId(null);
      if (!id || !blob) return;
      const localUrl = URL.createObjectURL(blob);
      updateElement(id, { src: localUrl, crop: null }, { record: true });
      try {
        const file = new File([blob], "erased.png", { type: "image/png" });
        const res = await uploadMedia(file);
        const url =
          res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
        if (url) updateElement(id, { src: url }, { record: false });
      } catch {
        toast.error("Erased image upload failed — it won't persist after save.");
      }
    },
    [erasingId, updateElement, uploadMedia],
  );

  const commitImageTool = useCallback(async () => {
    if (croppingId) cropCommitRef.current?.();
    else if (erasingId) await eraseCommitRef.current?.();
  }, [croppingId, erasingId]);
  const stageWrapRef = useRef(null);
  const stageInnerRef = useRef(null);

  // Drawing tool state (Tools panel). type 'select' = normal editing.
  const [tool, setTool] = useState({
    type: "select",
    color: "#ef4444",
    size: 6,
    opacity: 1,
  });
  const [liveStroke, setLiveStroke] = useState(null);
  const strokeRef = useRef([]);
  const drawingRef = useRef(false);
  const isDrawTool = DRAW_TOOLS.includes(tool.type);

  // Make the curated web fonts available for on-canvas text + PNG export.
  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

  // Always-fresh view of elements for async callbacks (e.g. a grid cell's
  // durable-URL swap after upload) that must merge into a nested array without
  // clobbering edits made while the upload was in flight.
  const elementsRef = useRef(elements);
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // The Color/Effects/Animate/Position panels are contextual to the selected
  // element (their triggers live in the context bar). If the selection clears,
  // drop back out of them.
  useEffect(() => {
    const contextual = [
      "color",
      "effects",
      "animate",
      "position",
      "img-edit",
    ];
    if (contextual.includes(activePanel) && !selectedElement) {
      setActivePanel(null);
      setColorTarget(null);
    }
  }, [activePanel, selectedElement]);

  // ── Freehand drawing ──────────────────────────────────────────────────
  const canvasPoint = (e) => {
    const rect = stageInnerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const eraseAt = (pt) => {
    const hit = [...elements]
      .reverse()
      .find(
        (el) =>
          el.type === "draw" &&
          pt.x >= el.x &&
          pt.x <= el.x + el.width &&
          pt.y >= el.y &&
          pt.y <= el.y + el.height,
      );
    if (hit) removeElement(hit.id);
  };

  const onDrawDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drawingRef.current = true;
    const pt = canvasPoint(e);
    if (tool.type === "eraser") return eraseAt(pt);
    strokeRef.current = [pt];
    setLiveStroke([pt]);
  };

  const onDrawMove = (e) => {
    if (!drawingRef.current) return;
    const pt = canvasPoint(e);
    if (tool.type === "eraser") return eraseAt(pt);
    strokeRef.current.push(pt);
    setLiveStroke([...strokeRef.current]);
  };

  const onDrawUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    if (tool.type === "eraser") return;
    const pts = strokeRef.current;
    if (pts.length) {
      addElement(
        strokeToElement(pts, {
          color: tool.color,
          size: tool.size,
          opacity: tool.opacity,
          cap: tool.type === "marker" ? "butt" : "round",
          blend: tool.type === "highlighter" ? "multiply" : undefined,
        }),
      );
    }
    strokeRef.current = [];
    setLiveStroke(null);
  };

  // ── Line endpoint handles ─────────────────────────────────────────────
  // A straight line is fully described by its two endpoints. We expose a draggable
  // dot at each end; dragging one keeps the other fixed and recomputes the line's
  // center, length (width) and angle (rotation) — so you can freely reshape it
  // (horizontal, vertical, any diagonal) by hand.
  const lineDragRef = useRef(null);
  const selLine =
    selectedElement &&
    selectedElement.type === "shape" &&
    isStraightLine(selectedElement.shape)
      ? selectedElement
      : null;

  const lineEndpoints = (el) => {
    const cx = el.x + el.width / 2;
    const cy = el.y + el.height / 2;
    const r = ((el.rotation || 0) * Math.PI) / 180;
    const hx = (Math.cos(r) * el.width) / 2;
    const hy = (Math.sin(r) * el.width) / 2;
    return { p1: { x: cx - hx, y: cy - hy }, p2: { x: cx + hx, y: cy + hy } };
  };

  const onHandleDown = (which, e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const { p1, p2 } = lineEndpoints(selLine);
    commit(); // one undo step for the whole drag
    lineDragRef.current = {
      id: selLine.id,
      fixed: which === "p1" ? p2 : p1,
      height: selLine.height,
    };
  };

  const onHandleMove = (e) => {
    const d = lineDragRef.current;
    if (!d) return;
    const P = canvasPoint(e);
    const f = d.fixed;
    const cx = (f.x + P.x) / 2;
    const cy = (f.y + P.y) / 2;
    const len = Math.hypot(P.x - f.x, P.y - f.y) || 1;
    const ang = (Math.atan2(P.y - f.y, P.x - f.x) * 180) / Math.PI;
    updateElement(
      d.id,
      { x: cx - len / 2, y: cy - d.height / 2, width: len, rotation: ang },
      { record: false },
    );
  };

  const onHandleUp = (e) => {
    if (!lineDragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    lineDragRef.current = null;
  };

  // Mid-point bend handle — curves a straight line into a quadratic. `bend` is the
  // apex's perpendicular distance from the straight chord (canvas units, signed).
  const bendDragRef = useRef(null);
  const canBend = !!selLine && isBendableLine(selLine.shape);

  const bendPoint = (el, eps) => {
    const mx = (eps.p1.x + eps.p2.x) / 2;
    const my = (eps.p1.y + eps.p2.y) / 2;
    let dx = eps.p2.x - eps.p1.x;
    let dy = eps.p2.y - eps.p1.y;
    const L = Math.hypot(dx, dy) || 1;
    dx /= L;
    dy /= L;
    const perp = { x: dy, y: -dx };
    const b = el.bend || 0;
    return { x: mx + perp.x * b, y: my + perp.y * b, mx, my, perp };
  };

  const onBendDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    commit();
    const bp = bendPoint(selLine, lineEndpoints(selLine));
    bendDragRef.current = {
      id: selLine.id,
      mx: bp.mx,
      my: bp.my,
      perp: bp.perp,
    };
  };

  const onBendMove = (e) => {
    const d = bendDragRef.current;
    if (!d) return;
    const P = canvasPoint(e);
    const b = (P.x - d.mx) * d.perp.x + (P.y - d.my) * d.perp.y;
    updateElement(d.id, { bend: b }, { record: false });
  };

  const onBendUp = (e) => {
    if (!bendDragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    bendDragRef.current = null;
  };

  // ── Curve node handles ────────────────────────────────────────────────
  // A curve is a spline through N nodes; each node drags freely in 2D. Node
  // positions live in the element's vb space, mapped to/from canvas coords.
  const curveDragRef = useRef(null);
  const selCurve =
    selectedElement && selectedElement.type === "curve"
      ? selectedElement
      : null;

  // Add-node mode only makes sense for a selected line/curve.
  useEffect(() => {
    if (!selLine && !selCurve) setAddNodeMode(false);
  }, [selLine, selCurve]);

  const curveNodePos = (el, p) => ({
    x: el.x + (p.x / (el.vbW || el.width)) * el.width,
    y: el.y + (p.y / (el.vbH || el.height)) * el.height,
  });

  const canvasToVb = (el, P) => ({
    x: ((P.x - el.x) / el.width) * (el.vbW || el.width),
    y: ((P.y - el.y) / el.height) * (el.vbH || el.height),
  });

  const onNodeDown = (i, e) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    commit();
    curveDragRef.current = { id: selCurve.id, i };
  };

  const onNodeMove = (e) => {
    const d = curveDragRef.current;
    if (!d) return;
    const vb = canvasToVb(selCurve, canvasPoint(e));
    const points = selCurve.points.map((p, idx) => (idx === d.i ? vb : p));
    updateElement(d.id, { points }, { record: false });
  };

  const onNodeUp = (e) => {
    if (!curveDragRef.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    curveDragRef.current = null;
  };

  // Double-click a node removes it (keep ≥2); double-click the curve adds one.
  const removeCurveNode = (i) => {
    if (!selCurve || selCurve.points.length <= 2) return;
    updateElement(selCurve.id, {
      points: selCurve.points.filter((_, idx) => idx !== i),
    });
  };

  const addCurveNodeAt = (id, e) => {
    const el = elements.find((x) => x.id === id);
    if (!el || el.type !== "curve") return;
    const vb = canvasToVb(el, canvasPoint(e));
    updateElement(id, { points: insertCurvePoint(el.points, vb.x, vb.y) });
  };

  // "Add node" mode: clicking a point on the selected line/curve makes it a node.
  // A straight/styled line is converted into an editable multi-node curve (its
  // color/dash carry over; wavy/zigzag patterns become a smooth curve).
  const lineToCurve = (line, canvasPts) => {
    const xs = canvasPts.map((p) => p.x);
    const ys = canvasPts.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const w = Math.max(1, Math.max(...xs) - minX);
    const h = Math.max(1, Math.max(...ys) - minY);
    const def = SHAPES[line.shape];
    return {
      type: "curve",
      x: minX,
      y: minY,
      width: w,
      height: h,
      vbW: w,
      vbH: h,
      rotation: 0,
      bend: undefined,
      points: canvasPts.map((p) => ({ x: p.x - minX, y: p.y - minY })),
      stroke: line.fill || "#111111",
      strokeWidth: 4,
      cap: def?.cap || "round",
      dash: def?.dash,
    };
  };

  const handleAddNodeClick = (e) => {
    const P = canvasPoint(e);
    if (selCurve) {
      commit();
      const vb = canvasToVb(selCurve, P);
      updateElement(
        selCurve.id,
        { points: insertCurvePoint(selCurve.points, vb.x, vb.y) },
        { record: false },
      );
    } else if (selLine) {
      commit();
      const { p1, p2 } = lineEndpoints(selLine);
      updateElement(selLine.id, lineToCurve(selLine, [p1, P, p2]), {
        record: false,
      });
    }
  };

  // ── Fit-to-screen zoom ────────────────────────────────────────────────
  const fitZoom = useCallback(() => {
    const wrap = stageWrapRef.current;
    if (!wrap || !canvas.width || !canvas.height) return;
    const pad = 64;
    const availW = wrap.clientWidth - pad;
    const availH = wrap.clientHeight - pad;
    const z = Math.min(availW / canvas.width, availH / canvas.height, 1);
    setZoom(Math.max(z, MIN_ZOOM));
  }, [canvas.width, canvas.height]);

  useLayoutEffect(() => {
    fitZoom();
    const onResize = () => fitZoom();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fitZoom]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Image crop / erase mode captures keys: Enter commits, Esc cancels.
      if (croppingId || erasingId) {
        if (e.key === "Enter") {
          e.preventDefault();
          commitImageTool();
        } else if (e.key === "Escape") {
          e.preventDefault();
          cancelImageTool();
        }
        return;
      }

      const typing =
        editingId ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) ||
        e.target.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (typing) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        removeElement(selectedId);
      }
      if (e.key === "Escape") {
        setEditingId(null);
        selectElement(null);
        setAddNodeMode(false);
        setTool((t) => (t.type === "select" ? t : { ...t, type: "select" }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    editingId,
    selectedId,
    undo,
    redo,
    removeElement,
    selectElement,
    croppingId,
    erasingId,
    commitImageTool,
    cancelImageTool,
  ]);

  // ── Insert actions ────────────────────────────────────────────────────
  // These are exposed to the sidebar panels as a small `insert` API so any
  // panel can drop styled elements onto the canvas without prop-drilling.
  const cx = () => Math.round(canvas.width / 2);
  const cy = () => Math.round(canvas.height / 2);

  const insertText = (preset = {}) => {
    const w = preset.width ?? Math.min(420, canvas.width * 0.7);
    const h = preset.height ?? Math.round((preset.fontSize ?? 40) * 1.5);
    const value = preset.content ?? "Your text";
    addElement({
      type: "text",
      content: value,
      text: value,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: w,
      height: h,
      fontSize: preset.fontSize ?? 40,
      fontWeight: preset.fontWeight ?? "normal",
      fill: preset.fill ?? "#111111",
      textAlign: preset.textAlign ?? "center",
      fontFamily: preset.fontFamily,
      fontStyle: preset.fontStyle,
      letterSpacing: preset.letterSpacing,
    });
  };

  const insertShape = (shape, opts = {}) => {
    // 'rounded' is a primitive rect with a corner radius.
    const isRounded = shape === "rounded";
    const key = isRounded ? "rect" : shape;

    // Size to the shape's aspect ratio, capped to a fraction of the canvas.
    const base = Math.min(canvas.width, canvas.height) * 0.32;
    const aspect = aspectOf(shape) || 1;
    let w = opts.width ?? (aspect >= 1 ? base : base * aspect);
    let h = opts.height ?? (aspect >= 1 ? base / aspect : base);

    const def = SHAPES[shape];
    const isStroke = def?.kind === "stroke";

    // Pre-curve lines that ship curved (e.g. line-curved), so they look like
    // their flyout preview and expose the bend handle immediately.
    const initialBend =
      opts.bend ??
      (def?.previewBendVB
        ? (def.previewBendVB * Math.round(h)) / 24
        : undefined);

    addElement({
      type: "shape",
      shape: key,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: Math.round(w),
      height: Math.round(h),
      fill: opts.fill ?? (isStroke ? "#111111" : "#6366f1"),
      borderRadius: isRounded
        ? Math.round(Math.min(w, h) * 0.14)
        : (opts.borderRadius ?? 0),
      ...(initialBend !== undefined ? { bend: initialBend } : {}),
    });
  };

  const insertCurve = () => {
    const w = Math.round(Math.min(canvas.width, canvas.height) * 0.32);
    const h = Math.round(w * 0.55);
    return addElement({
      type: "curve",
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: w,
      height: h,
      vbW: w,
      vbH: h,
      points: defaultCurvePoints(w, h),
      stroke: "#111111",
      strokeWidth: 4,
      cap: "round",
    });
  };

  const insertStickyNote = (color = "#FEF08A") => {
    const size = Math.round(Math.min(canvas.width, canvas.height) * 0.24);
    const id = addElement({
      type: "text",
      content: "",
      text: "",
      x: cx() - size / 2,
      y: cy() - size / 2,
      width: size,
      height: size,
      fontSize: Math.max(18, Math.round(size * 0.11)),
      fontWeight: "normal",
      fill: "#1f2937",
      textAlign: "left",
      background: color,
      padding: Math.round(size * 0.1),
      borderRadius: 10,
      sticky: true,
      autoFit: true,
    });
    return id;
  };

  const insertElbow = () => {
    const w = Math.round(Math.min(canvas.width, canvas.height) * 0.28);
    const h = w;
    return addElement({
      type: "curve",
      sharp: true,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: w,
      height: h,
      vbW: w,
      vbH: h,
      points: elbowPoints(w, h),
      stroke: "#111111",
      strokeWidth: 4,
      cap: "round",
    });
  };

  const insertTable = ({ rows = 3, cols = 3 } = {}) => {
    // Size the grid to a comfortable fraction of the canvas, with a sane
    // per-cell floor so a large table never collapses to unreadable slivers.
    const w = Math.min(
      canvas.width * 0.7,
      Math.max(cols * 120, Math.round(canvas.width * 0.4)),
    );
    const h = Math.min(
      canvas.height * 0.7,
      Math.max(rows * 52, Math.round(canvas.height * 0.28)),
    );
    return addElement({
      type: "table",
      rows,
      cols,
      cells: makeCells(rows, cols),
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: Math.round(w),
      height: Math.round(h),
      ...TABLE_DEFAULTS,
    });
  };

  const insertImageUrl = (src) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const place = (natW, natH) => {
      const maxW = canvas.width * 0.6;
      const ratio = natH && natW ? natH / natW : 1;
      const w = Math.min(maxW, natW || maxW);
      const h = w * ratio;
      addElement({
        type: "image",
        src,
        x: cx() - w / 2,
        y: cy() - h / 2,
        width: w,
        height: h,
      });
    };
    img.onload = () => place(img.naturalWidth, img.naturalHeight);
    img.onerror = () => place(canvas.width * 0.4, canvas.width * 0.4);
    img.src = src;
  };

  // Insert an empty frame (an image clipped to a shape). Sized to the frame's
  // aspect, capped to a fraction of the canvas — matching insertShape.
  const insertFrame = (frameKey) => {
    const { viewBox } = frameGeo(frameKey);
    const aspect = viewBox[0] / viewBox[1] || 1;
    const base = Math.min(canvas.width, canvas.height) * 0.42;
    const w = aspect >= 1 ? base : base * aspect;
    const h = aspect >= 1 ? base / aspect : base;
    return addElement({
      type: "frame",
      shape: frameKey,
      src: null,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: Math.round(w),
      height: Math.round(h),
    });
  };

  // Fill (or replace) a frame's image. Shows the local file instantly, then
  // swaps in the uploaded, durable URL — same two-step flow as handleAddImage.
  const fillFrame = async (id, file) => {
    const localUrl = URL.createObjectURL(file);
    updateElement(id, { src: localUrl }, { record: true });
    try {
      const res = await uploadMedia(file);
      const url =
        res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
      if (url) updateElement(id, { src: url }, { record: false });
    } catch {
      toast.error("Image upload failed — it won't persist after save.");
    }
  };

  // Insert a decorative graphic, sized to its aspect (like insertShape).
  const insertGraphic = (graphicKey) => {
    const [vw, vh] = graphicDef(graphicKey).viewBox || [100, 100];
    const aspect = vw / vh || 1;
    const base = Math.min(canvas.width, canvas.height) * 0.28;
    const w = aspect >= 1 ? base : base * aspect;
    const h = aspect >= 1 ? base / aspect : base;
    return addElement({
      type: "graphic",
      graphic: graphicKey,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: Math.round(w),
      height: Math.round(h),
    });
  };

  // Insert a chart (bar/line/pie/donut) seeded with sample data.
  const insertChart = (chartType = "bar") => {
    const w = Math.round(Math.min(canvas.width, canvas.height) * 0.6);
    const h = Math.round(w * 0.66);
    return addElement({
      type: "chart",
      chart: chartType,
      data: DEFAULT_CHART_DATA.map((d) => ({ ...d })),
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: w,
      height: h,
    });
  };

  // Insert an empty rows × cols photo grid, sized to a comfortable square.
  const insertGrid = ({ rows = 2, cols = 2 } = {}) => {
    const base = Math.round(Math.min(canvas.width, canvas.height) * 0.55);
    return addElement({
      type: "grid",
      rows,
      cols,
      gap: 8,
      cells: makeGridCells(rows, cols),
      x: cx() - base / 2,
      y: cy() - base / 2,
      width: base,
      height: base,
    });
  };

  // Write a src into one grid cell without disturbing the others. Reads the
  // freshest element from elementsRef so the post-upload swap can't clobber a
  // cell filled while the upload was in flight.
  const setGridCellSrc = (id, index, src, record) => {
    const target = elementsRef.current.find((e) => e.id === id);
    if (!target) return;
    const cells = (target.cells || []).map((c, i) =>
      i === index ? { ...c, src } : c,
    );
    updateElement(id, { cells }, { record });
  };

  // Fill (or replace) a single grid cell's image — local preview first, then the
  // durable uploaded URL, matching handleAddImage / fillFrame.
  const fillGridCell = async (id, index, file) => {
    const localUrl = URL.createObjectURL(file);
    setGridCellSrc(id, index, localUrl, true);
    try {
      const res = await uploadMedia(file);
      const url =
        res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
      if (url) setGridCellSrc(id, index, url, false);
    } catch {
      toast.error("Image upload failed — it won't persist after save.");
    }
  };

  const handleAddImage = async (file) => {
    const localUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      const maxW = canvas.width * 0.6;
      const ratio = img.height / img.width || 1;
      const w = Math.min(maxW, img.width);
      const h = w * ratio;
      const id = addElement({
        type: "image",
        src: localUrl,
        x: cx() - w / 2,
        y: cy() - h / 2,
        width: w,
        height: h,
      });
      // Upload for a durable URL (blob: dies on reload / can't be saved).
      try {
        const res = await uploadMedia(file);
        const url =
          res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
        if (url) updateElement(id, { src: url }, { record: false });
      } catch {
        toast.error("Image upload failed — it won't persist after save.");
      }
    };
    img.src = localUrl;
  };

  // ── Background removal ────────────────────────────────────────────────
  // One-click, on-device (ONNX U²-Net) cutout — no side panel. Swaps the image
  // src for a transparent PNG (undoable), then uploads it for a durable URL.
  // The engine is heavy, so it's imported lazily on first use.
  const bgBusyRef = useRef(new Set());
  const removeImageBackground = useCallback(
    async (id) => {
      const target = elementsRef.current.find((e) => e.id === id);
      if (!target || target.type !== "image" || !target.src) return;
      if (bgBusyRef.current.has(id)) return; // already processing this image
      bgBusyRef.current.add(id);
      const toastId = toast.loading("Removing background…");
      try {
        const { removeBackground } = await import(
          "@/(lib)/ai-engine/tasks/removeBackground"
        );
        const { blob } = await removeBackground(proxiedSrc(target.src), {
          onProgress: ({ pct }) =>
            toast.loading(`Removing background… ${Math.round(pct || 0)}%`, {
              id: toastId,
            }),
        });
        // Show the cutout instantly (undoable), then swap in the durable URL.
        const localUrl = URL.createObjectURL(blob);
        updateElement(id, { src: localUrl }, { record: true });
        toast.success("Background removed", { id: toastId });
        try {
          const file = new File([blob], "cutout.png", { type: "image/png" });
          const res = await uploadMedia(file);
          const url =
            res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
          if (url) updateElement(id, { src: url }, { record: false });
        } catch {
          toast.error("Cutout upload failed — it won't persist after save.");
        }
      } catch (err) {
        toast.error(err?.message || "Couldn't remove the background");
      } finally {
        bgBusyRef.current.delete(id);
      }
    },
    [updateElement, uploadMedia],
  );

  // ── Clipboard paste (Ctrl/⌘+V) ────────────────────────────────────────
  // Paste an image or text straight onto the canvas. When editing a text box we
  // bail so the paste flows into it natively. A ref keeps the handler current
  // without re-subscribing every render.
  const pasteRef = useRef(null);
  pasteRef.current = (e) => {
    const t = e.target;
    if (
      editingId ||
      /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) ||
      t.isContentEditable
    ) {
      return;
    }
    const cd = e.clipboardData;
    if (!cd) return;

    // Image (screenshots, copied pictures) — prefer this over any text.
    const fromItems = cd.items
      ? Array.from(cd.items)
          .filter((it) => it.type && it.type.startsWith("image/"))
          .map((it) => it.getAsFile())
      : [];
    const fromFiles = cd.files
      ? Array.from(cd.files).filter((f) => f.type.startsWith("image/"))
      : [];
    const imageFile = fromItems.find(Boolean) || fromFiles[0];
    if (imageFile) {
      e.preventDefault();
      handleAddImage(imageFile);
      return;
    }

    // Text
    const text = cd.getData("text/plain");
    if (text && text.trim()) {
      e.preventDefault();
      const fontSize = 24;
      const width = Math.min(600, Math.round(canvas.width * 0.7));
      const font = `normal normal ${fontSize}px 'DM Sans', sans-serif`;
      const { lines } = measureText(text, width - 8, font);
      const height = Math.max(
        Math.round(fontSize * 1.5),
        Math.ceil(lines * fontSize * 1.3) + 12,
      );
      insertText({ content: text, fontSize, width, height, textAlign: "left" });
    }
  };

  useEffect(() => {
    const handler = (e) => pasteRef.current?.(e);
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  // ── Save & download ───────────────────────────────────────────────────
  const doSave = async () => {
    setSaving(true);
    try {
      const payload = { name, canvas, elements };
      if (onSave) {
        await onSave(payload);
      } else {
        const res = await updateDesignById(design.id, {
          name,
          canvas: JSON.stringify({ canvas, elements }),
        });
        if (!res?.ok) throw new Error(res?.message || "Save failed");
      }
      markSaved();
      toast.success("Design saved");
    } catch (err) {
      toast.error(err.message || "Could not save design");
    } finally {
      setSaving(false);
    }
  };

  const doDownload = async () => {
    try {
      const blob = await renderDesignToBlob({ canvas, elements });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(name || "design").replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not render the design");
    }
  };

  const bg = canvas.background || "#ffffff";
  const isImageBg = typeof bg === "string" && /^(https?:|data:|blob:)/.test(bg);

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-100 dark:bg-canvas">
      {/* Keyframes for element animation previews (see animations.js). */}
      <style dangerouslySetInnerHTML={{ __html: KEYFRAMES_CSS }} />
      <EditorTopBar
        name={name}
        onNameChange={setName}
        onBack={onBack}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.1, MAX_ZOOM))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.1, MIN_ZOOM))}
        dirty={dirty || name !== (design?.name || "Untitled design")}
        saving={saving}
        onSave={doSave}
        onPreview={() => setShowPreview(true)}
        canvas={canvas}
        elements={elements}
      />

      <div className="flex-1 flex min-h-0">
        <EditorSidebar
          insert={{
            text: insertText,
            shape: insertShape,
            curve: insertCurve,
            elbow: insertElbow,
            sticky: insertStickyNote,
            table: insertTable,
            frame: insertFrame,
            grid: insertGrid,
            chart: insertChart,
            graphic: insertGraphic,
            imageUrl: insertImageUrl,
            imageFile: handleAddImage,
          }}
          setBackground={setBackground}
          background={
            typeof bg === "string" && bg.startsWith("#") ? bg : "#ffffff"
          }
          editor={editor}
          designId={design?.id}
          tool={tool}
          setTool={setTool}
          active={activePanel}
          onActiveChange={setActivePanel}
          kluxSeedRedesign={initialPanel === "klux"}
          colorTarget={colorTarget}
          onPlayAnimation={playAnimations}
          imageActions={{
            onRemoveBg: removeImageBackground,
            onStartErase: startErase,
            onStartCrop: startCrop,
            // Blur is a CSS adjust — the tile toggles a default the user can
            // then fine-tune in Adjust.
            onBlur: (id) => {
              const t = elements.find((e) => e.id === id) || editor.selectedElement;
              if (!t) return;
              const cur = t.adjust?.blur || 0;
              editor.updateElement(
                id,
                { adjust: { ...(t.adjust || {}), blur: cur > 0 ? 0 : 8 } },
                { record: true },
              );
              toast(cur > 0 ? "Blur removed" : "Blur applied — fine-tune in Adjust");
            },
            onPerspective: (id) => {
              const t = elements.find((e) => e.id === id) || editor.selectedElement;
              if (!t) return;
              const has = t.perspective && (t.perspective.h || t.perspective.v);
              editor.updateElement(
                id,
                { perspective: has ? null : { h: 25, v: 0 } },
                { record: true },
              );
              toast(has ? "Perspective removed" : "Perspective applied — fine-tune in Perspective");
            },
          }}
        />

        {/* Stage viewport */}
        <div
          ref={stageWrapRef}
          className="relative flex-1 overflow-hidden flex items-center justify-center"
          onMouseDown={(e) => {
            // click empty area → deselect
            if (e.target === e.currentTarget) {
              selectElement(null);
              setEditingId(null);
              setActiveCell(null);
            }
          }}
        >
          {/* Ask Klux — static launcher pinned to the stage's top-right. */}
          <button
            onClick={() => setActivePanel("klux")}
            title="Ask Klux AI"
            className="absolute top-3 right-3 z-[9999] flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-surface pl-2 pr-3 text-gray-700 shadow-lg transition hover:bg-blue-50 hover:text-[#155dfc] cursor-pointer"
          >
            <KluxLogoIcon className="h-4 w-4" />
            <span className="text-xs font-semibold">Ask Klux</span>
          </button>

          {!croppingId && !erasingId && (
            <EditorContextBar
              element={selectedElement}
              onChange={updateElement}
              addNodeMode={addNodeMode}
              onToggleAddNode={() => setAddNodeMode((v) => !v)}
              activeCell={
                activeCell && activeCell.id === selectedElement?.id
                  ? activeCell
                  : null
              }
              onClearActiveCell={() => setActiveCell(null)}
              onOpenFontPanel={() => setActivePanel("font")}
              onOpenColorPanel={openColorPanel}
              onOpenEffectsPanel={() => setActivePanel("effects")}
              onOpenAnimatePanel={() => setActivePanel("animate")}
              onOpenPositionPanel={() => setActivePanel("position")}
              onOpenImageTool={(key) => setActivePanel(key)}
              onRemoveBg={removeImageBackground}
              onStartCrop={startCrop}
              onStartErase={startErase}
              onFrameFill={fillFrame}
            />
          )}

          {/* Crop / Erase control bar — replaces the context bar while active. */}
          {(croppingId || erasingId) && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-surface border border-gray-200 shadow-lg rounded-xl px-3 py-2">
              <span className="text-xs font-semibold text-gray-700">
                {croppingId ? "Crop image" : "Erase"}
              </span>
              {erasingId && (
                <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
                  Brush
                  <input
                    type="range"
                    min={5}
                    max={150}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-24 cursor-pointer accent-blue-600"
                  />
                </label>
              )}
              {croppingId && (
                <button
                  onClick={() => cropResetRef.current?.()}
                  className="h-8 px-3 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition"
                >
                  Reset
                </button>
              )}
              <button
                onClick={cancelImageTool}
                className="h-8 px-3 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={commitImageTool}
                className="h-8 px-4 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition"
              >
                Done
              </button>
            </div>
          )}

          {/* Scaled stage */}
          <div
            style={{
              width: canvas.width * zoom,
              height: canvas.height * zoom,
              flexShrink: 0,
            }}
          >
            <div
              ref={stageInnerRef}
              className="relative shadow-xl overflow-hidden"
              style={{
                width: canvas.width,
                height: canvas.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                backgroundColor: isImageBg ? "#ffffff" : bg,
                backgroundImage: isImageBg ? `url(${proxiedSrc(bg)})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  selectElement(null);
                  setEditingId(null);
                }
              }}
            >
              {elements
                .filter((el) => !el.hidden)
                .map((el) => (
                  <EditorElement
                    key={el.id}
                    element={el}
                    zoom={zoom}
                    selected={el.id === selectedId}
                    editing={el.id === editingId}
                    onSelect={selectElement}
                    onChange={(patch, opts) =>
                      updateElement(el.id, patch, opts)
                    }
                    onStartEdit={setEditingId}
                    onEndEdit={() => setEditingId(null)}
                    onCurveAddPoint={addCurveNodeAt}
                    activeCell={
                      activeCell?.id === el.id ? activeCell : null
                    }
                    onCellFocus={(r, c) =>
                      setActiveCell({ id: el.id, r, c })
                    }
                    onFrameFill={fillFrame}
                    onGridCellFill={fillGridCell}
                    onDuplicate={duplicateElement}
                    onRemove={removeElement}
                    onMoveLayer={moveLayer}
                    onToggleLock={(id) =>
                      updateElement(id, { locked: !el.locked })
                    }
                    onAskKlux={() => setActivePanel("klux")}
                    animateToken={animateToken}
                    suppressChrome={el.id === croppingId || el.id === erasingId}
                  />
                ))}

              {/* Line endpoint handles — reshape a selected straight line */}
              {selLine && !isDrawTool && (
                <LineHandles
                  el={selLine}
                  zoom={zoom}
                  endpoints={lineEndpoints(selLine)}
                  onDown={onHandleDown}
                  onMove={onHandleMove}
                  onUp={onHandleUp}
                  bend={
                    canBend
                      ? {
                          point: bendPoint(selLine, lineEndpoints(selLine)),
                          onDown: onBendDown,
                          onMove: onBendMove,
                          onUp: onBendUp,
                        }
                      : null
                  }
                />
              )}

              {/* Curve node handles — drag each point to reshape the spline */}
              {selCurve && !isDrawTool && (
                <CurveHandles
                  el={selCurve}
                  zoom={zoom}
                  nodePos={(p) => curveNodePos(selCurve, p)}
                  onNodeDown={onNodeDown}
                  onNodeMove={onNodeMove}
                  onNodeUp={onNodeUp}
                  onNodeDoubleClick={removeCurveNode}
                />
              )}

              {/* Image crop / erase overlays */}
              {croppingId &&
                (() => {
                  const ce = elements.find((e) => e.id === croppingId);
                  return ce ? (
                    <ImageCropOverlay
                      el={ce}
                      zoom={zoom}
                      commitRef={cropCommitRef}
                      resetRef={cropResetRef}
                      onApply={applyCrop}
                    />
                  ) : null;
                })()}
              {erasingId &&
                (() => {
                  const ee = elements.find((e) => e.id === erasingId);
                  return ee ? (
                    <ImageEraserOverlay
                      el={ee}
                      brushSize={brushSize}
                      commitRef={eraseCommitRef}
                      onApply={applyErase}
                    />
                  ) : null;
                })()}

              {/* Add-node overlay — click on the selected line/curve to drop a node */}
              {addNodeMode && (selCurve || selLine) && !isDrawTool && (
                <div
                  className="absolute inset-0"
                  style={{ zIndex: 47, cursor: "copy", touchAction: "none" }}
                  onPointerDown={handleAddNodeClick}
                />
              )}

              {/* Drawing overlay — captures pointer while a draw tool is active */}
              {isDrawTool && (
                <div
                  className="absolute inset-0"
                  style={{
                    zIndex: 50,
                    cursor: tool.type === "eraser" ? "cell" : "crosshair",
                    touchAction: "none",
                  }}
                  onPointerDown={onDrawDown}
                  onPointerMove={onDrawMove}
                  onPointerUp={onDrawUp}
                  onPointerLeave={onDrawUp}
                >
                  <svg
                    width={canvas.width}
                    height={canvas.height}
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      overflow: "visible",
                    }}
                  >
                    {liveStroke?.length > 0 && tool.type !== "eraser" && (
                      <path
                        d={pointsToPath(liveStroke)}
                        fill="none"
                        stroke={tool.color}
                        strokeWidth={tool.size}
                        strokeLinecap={
                          tool.type === "marker" ? "butt" : "round"
                        }
                        strokeLinejoin="round"
                        opacity={tool.opacity}
                        style={{
                          mixBlendMode:
                            tool.type === "highlighter" ? "multiply" : "normal",
                        }}
                      />
                    )}
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen preview — clean render of the design, Esc to exit */}
      {showPreview && (
        <PreviewOverlay
          canvas={canvas}
          elements={elements}
          onClose={() => setShowPreview(false)}
          onDownload={doDownload}
        />
      )}
    </div>
  );
}

/**
 * LineHandles — two draggable dots at a straight line's endpoints. Rendered
 * inside the scaled stage, so sizes are divided by `zoom` to stay a constant
 * ~12px on screen regardless of zoom level.
 */
function LineHandles({ el, zoom, endpoints, onDown, onMove, onUp, bend }) {
  const size = 14 / zoom;
  const border = 2 / zoom;
  const line = 1.5 / zoom;
  const { p1, p2 } = endpoints;

  const dot = (p, opts) => (
    <div
      onPointerDown={opts.onDown}
      onPointerMove={opts.onMove}
      onPointerUp={opts.onUp}
      style={{
        position: "absolute",
        left: p.x - size / 2,
        top: p.y - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: opts.solid ? "#6366f1" : "#fff",
        border: `${border}px solid #6366f1`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        cursor: "move",
        touchAction: "none",
        pointerEvents: "auto",
      }}
    />
  );

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      {/* thin guide connecting the endpoints */}
      <svg
        width={el.x + el.width + 200}
        height={el.y + el.height + 200}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        <line
          x1={p1.x}
          y1={p1.y}
          x2={p2.x}
          y2={p2.y}
          stroke="#6366f1"
          strokeWidth={line}
          strokeDasharray={`${4 / zoom} ${4 / zoom}`}
        />
      </svg>
      {dot(p1, {
        onDown: (e) => onDown("p1", e),
        onMove,
        onUp,
      })}
      {dot(p2, {
        onDown: (e) => onDown("p2", e),
        onMove,
        onUp,
      })}
      {bend &&
        dot(bend.point, {
          onDown: bend.onDown,
          onMove: bend.onMove,
          onUp: bend.onUp,
          solid: true,
        })}
    </div>
  );
}

/**
 * CurveHandles — a draggable dot at every node of a curve element. Drag to
 * reshape, double-click a node to remove it, double-click the curve to add one.
 */
function CurveHandles({
  el,
  zoom,
  nodePos,
  onNodeDown,
  onNodeMove,
  onNodeUp,
  onNodeDoubleClick,
}) {
  const size = 14 / zoom;
  const border = 2 / zoom;
  const pts = el.points || [];
  const canvasPts = pts.map(nodePos);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
      }}
    >
      {canvasPts.map((p, i) => (
        <div
          key={i}
          onPointerDown={(e) => onNodeDown(i, e)}
          onPointerMove={onNodeMove}
          onPointerUp={onNodeUp}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onNodeDoubleClick(i);
          }}
          style={{
            position: "absolute",
            left: p.x - size / 2,
            top: p.y - size / 2,
            width: size,
            height: size,
            borderRadius: "50%",
            background: "#fff",
            border: `${border}px solid #6366f1`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            cursor: "move",
            touchAction: "none",
            pointerEvents: "auto",
          }}
        />
      ))}
    </div>
  );
}
