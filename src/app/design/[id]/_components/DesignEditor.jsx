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
import SelectionChrome from "./SelectionChrome";
import useStageViewport from "./useStageViewport";
import { Timer as TimerIcon, NotebookPen } from "lucide-react";
import EditorTimer from "./timer/EditorTimer";
import EditorNotes from "./notes/EditorNotes";
import useUnsavedChangesGuard from "./useUnsavedChangesGuard";
import SelectionOverlay from "./SelectionOverlay";
import { EditorContextMenu } from "./EditorElementMenu";
import ImageCropOverlay from "./ImageCropOverlay";
import ImageEraserOverlay from "./ImageEraserOverlay";
import PreviewOverlay from "./PreviewOverlay";
import {
  renderDesignToBlob,
  renderDesignToDataUrl,
  proxiedSrc,
  drawCover,
} from "@/(lib)/design/renderDesign";
import { isCropped } from "@/(lib)/design/imageCrop";
import { boundsOf, isGroup } from "@/(lib)/design/groups";
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
import { alignToPagePatch } from "@/(lib)/design/alignToPage";
import {
  decodeElements,
  writeElementsToClipboard,
} from "@/(lib)/design/elementClipboard";
import { useBreakpoint, useIsTouch } from "@/utils/useMediaQuery";

const DRAW_TOOLS = ["pen", "marker", "highlighter", "eraser"];

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

// Arrow-key nudge: canvas units per press, and which way each key goes.
const NUDGE_FINE = 1;
const NUDGE_COARSE = 10;
const NUDGE_KEYS = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};
/**
 * How long after the last nudge the burst is considered over. Holding an arrow
 * key repeats at ~30/s, and one undo entry per repeat would flush the entire
 * history in two seconds — so a run of nudges collapses into one step, and this
 * is how long a pause has to be to start a new one.
 */
const NUDGE_BURST_MS = 600;

/**
 * DesignEditor — reusable, prop-driven Canva-style editor.
 *
 * Props:
 *   design    { id, name, canvas, elements }  — the design to edit
 *   onSave    async ({ name, canvas, elements, thumbnail }) => void   (optional; defaults to updateDesignById)
 *             `thumbnail` is a full-canvas-size JPEG data URL, or null if it
 *             couldn't be rendered — hosts must tolerate the null.
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
    selectedIds,
    selectedElement,
    selectedElements,
    dirty,
    replaceToken,
    canUndo,
    canRedo,
    selectElement,
    setSelection,
    toggleSelection,
    selectAll,
    updateElement,
    updateElements,
    addElement,
    addElements,
    removeElement,
    removeElements,
    duplicateElement,
    duplicateElements,
    groupElements,
    ungroupElement,
    moveLayer,
    setBackground,
    undo,
    redo,
    commit,
    markSaved,
  } = editor;

  // Always-fresh view of elements for async callbacks (e.g. a grid cell's
  // durable-URL swap after upload) that must merge into a nested array without
  // clobbering edits made while the upload was in flight.
  //
  // Declared HERE, above every callback that reads it. It used to sit ~130 lines
  // further down, which worked at runtime (closures don't care) but meant the
  // first thing to capture the ref was a useCallback — after which it counts as
  // a value handed to a hook, and writing to it is no longer allowed.
  //
  // Filled in from a layout effect, so nothing can be painted or clicked while
  // it still holds the empty seed.
  const elementsRef = useRef([]);
  useLayoutEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  // Same idea for the selection. Both of these exist so gesture handlers can see
  // the latest elements WITHOUT listing them as dependencies: `elements` changes
  // on every frame of a drag, so a handler that depends on it is a new function
  // every frame — and a new function prop re-renders every element on the page,
  // which is exactly what EditorElement's memo is there to prevent.
  const selectedElementsRef = useRef([]);
  const selectedIdsRef = useRef([]);
  useLayoutEffect(() => {
    selectedElementsRef.current = selectedElements;
    selectedIdsRef.current = selectedIds;
  }, [selectedElements, selectedIds]);

  const [name, setName] = useState(design?.name || "Untitled design");
  // Below `lg` the editor is a bottom-bar + sheet layout and the canvas is
  // fitted on mount rather than opening at a fixed 50% (see fitZoom below).
  const isCompactEditor = !useBreakpoint("lg");
  // Fingers need bigger grips than a mouse pointer does. Asked as "is the
  // primary input coarse?", not "is the window narrow?" — a half-width desktop
  // window is still a mouse, and a wide tablet is still a finger.
  const isTouch = useIsTouch();
  const [zoom, setZoom] = useState(0.5); // default zoom 50%
  const [editingId, setEditingId] = useState(null);
  // The cell the user last clicked inside a table: { id, r, c }. Drives which
  // row/column the context-bar delete buttons target. Transient (not saved).
  const [activeCell, setActiveCell] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(design?.notes || "");
  // The name and notes as of the last successful save — see isDirty below.
  const [savedMeta, setSavedMeta] = useState({
    name: design?.name || "Untitled design",
    notes: design?.notes || "",
  });
  const [addNodeMode, setAddNodeMode] = useState(false);
  // Brief "applied" flash on the stage when a whole design is swapped in
  // (template / Klux AI apply). Driven by the editor's replaceToken.
  // Armed during render off the token rather than in an effect: an effect would
  // paint one frame without the flash before starting it.
  const [applyFlash, setApplyFlash] = useState(false);
  const [flashedToken, setFlashedToken] = useState(replaceToken);
  if (flashedToken !== replaceToken) {
    setFlashedToken(replaceToken);
    if (replaceToken) setApplyFlash(true);
  }
  useEffect(() => {
    if (!applyFlash) return;
    const id = setTimeout(() => setApplyFlash(false), 1400);
    return () => clearTimeout(id);
  }, [applyFlash]);
  // Which sidebar panel is open. Lifted here so canvas actions (e.g. "Ask Klux"
  // on the element menu) can open a panel; the sidebar is otherwise self-driven.
  // Seeded from `initialPanel` so an entry point (e.g. "Edit with Ai") can deep-
  // link straight into a panel like Klux AI; falls back to the templates panel.
  const [activePanel, setActivePanel] = useState(initialPanel || "templates");
  // Which tab a multi-tab panel is showing. Lives here, not in the panel, so an
  // action on the canvas ("Show layers" on the element pill) can move a panel
  // that is ALREADY open — panel-local state would be seeded once, on mount, and
  // that click would change nothing.
  const [positionSection, setPositionSection] = useState("arrange");
  const showLayers = useCallback(() => {
    setPositionSection("layers");
    setActivePanel("position");
  }, []);
  // The "Edit with Ai" deep link auto-sends its redesign prompt the first time
  // the Klux panel mounts. The sidebar unmounts a panel when you switch rail
  // tabs, so "already sent" has to be remembered here — otherwise coming back
  // to the Klux tab would fire a second redesign request.
  const [kluxSeedUsed, setKluxSeedUsed] = useState(false);
  const markKluxSeedUsed = useCallback(() => setKluxSeedUsed(true), []);
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

  // Selecting anything else leaves the tool.
  //
  // Crop and erase are modes ON one element, and while either is open the
  // selection chrome and the context bar are both suppressed (see the
  // `!croppingId && !erasingId` guards below) because the Done/Cancel bar has
  // taken over. So without this, clicking a different element LOOKS like it
  // did nothing: the click lands and the element really is selected, but it
  // draws no outline and gets no toolbar, while the overlay stays armed over
  // the element you left — the tool is still running, on something you are no
  // longer looking at.
  //
  // Cancels rather than commits. The user clicked away instead of pressing
  // Done, and silently baking an edit they never confirmed is the worse of the
  // two mistakes; this matches Esc, which already discards.
  //
  // Derived here rather than in handleSelect, because losing the element is not
  // only a click: deleting it, undoing back past it, or a marquee that sweeps up
  // something else all have to end the tool too, and each is a separate call
  // site that would have to remember to.
  //
  // Checked during render rather than in an effect. The tool is not a reaction
  // to the selection changing, it is a fact ABOUT the current selection — and an
  // effect would render one frame with the overlay still armed over an element
  // that is no longer selected.
  const activeToolId = croppingId || erasingId;
  if (
    activeToolId &&
    !(selectedIds.length === 1 && selectedIds[0] === activeToolId)
  ) {
    cancelImageTool();
  }

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

  // The Color/Effects/Animate/Position panels are contextual to the selected
  // element (their triggers live in the context bar). If the selection clears,
  // drop back out of them — EXCEPT Position on its Layers tab, which is a view
  // of the whole page rather than of the selection, and is most useful for
  // finding something you have just lost track of.
  // During render, not in an effect: whether a contextual panel still has
  // anything to act on is a fact about this render's selection, and an effect
  // would show one frame of a panel pointing at nothing.
  const CONTEXTUAL_PANELS = ["color", "effects", "animate", "position", "img-edit"];
  const panelStays = activePanel === "position" && positionSection === "layers";
  if (
    CONTEXTUAL_PANELS.includes(activePanel) &&
    !selectedElement &&
    !panelStays
  ) {
    setActivePanel(null);
    setColorTarget(null);
  }

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

  // Add-node mode only makes sense for a selected line/curve. Guarded on the
  // mode already being on, so this is a no-op on every other render.
  if (addNodeMode && !selLine && !selCurve) setAddNodeMode(false);

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
    // From the ref, so this stays one function across a drag — it is passed to
    // every element, and a fresh one each frame would re-render all of them.
    const el = elementsRef.current.find((x) => x.id === id);
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

  // ── Selection ─────────────────────────────────────────────────────────
  // Shift (or Cmd/Ctrl) extends the selection; a plain click replaces it —
  // EXCEPT on an element that is already part of a multi-selection, which keeps
  // the selection so the whole group of elements can be dragged from any of its
  // members. That is the one rule that makes a marquee useful: without it, the
  // press that starts the drag would collapse the sweep you just made.
  const handleSelect = useCallback(
    (id, e) => {
      if (e && (e.shiftKey || e.metaKey || e.ctrlKey)) {
        toggleSelection(id);
        return;
      }
      if (selectedIds.length > 1 && selectedIds.includes(id)) return;
      selectElement(id);
    },
    [selectedIds, toggleSelection, selectElement],
  );

  const multiSelected = selectedIds.length > 1;
  const selectionBounds = multiSelected ? boundsOf(selectedElements) : null;
  const groupSelected = !multiSelected && isGroup(selectedElement);

  // ── Inside a group ────────────────────────────────────────────────────
  // A group is ENTERED when it is selected, or when one of its members is: the
  // first click takes the group, the next one reaches the member under the
  // pointer, and from then on clicks stay inside so working across two members
  // doesn't bounce back out to the whole group each time.
  //
  // `activeChild` is the member that is selected, and it is the reason the rest
  // of the editor needs no changes: useDesignEditor resolves it to an ordinary
  // element with absolute geometry (findAnyElement) and routes patches aimed at
  // it back into its group (patchGroupChild), so the panels, the context bar and
  // the selection chrome all work on it without knowing where it lives.
  const activeChildId =
    !multiSelected && selectedElement?.groupId ? selectedElement.id : null;
  const enteredGroupId = selectedElement?.groupId || (groupSelected ? selectedElement.id : null);

  // Escape steps OUT of a group before it clears the selection — the way back up
  // one level, matching the click that took you down one.
  const exitGroup = useCallback(() => {
    if (!activeChildId) return false;
    selectElement(enteredGroupId);
    return true;
  }, [activeChildId, enteredGroupId, selectElement]);

  // ── Element clipboard ─────────────────────────────────────────────────
  // The copy goes to the SYSTEM clipboard as JSON behind a magic key (see
  // elementClipboard.js for why that, rather than a variable in here). This
  // mirror is not a second clipboard: it is what lets the pill enable or grey
  // out its Paste button without an async, permission-gated read of the real
  // one, and what keeps Paste working if the write was refused.
  const [copied, setCopied] = useState(null);

  const copySelection = useCallback(() => {
    if (!selectedElements.length) return;
    // Snapshotted, not referenced: editing or deleting the original after a
    // copy must not change what a later paste produces.
    const snapshot = JSON.parse(JSON.stringify(selectedElements));
    setCopied(snapshot);
    writeElementsToClipboard(snapshot);
  }, [selectedElements]);

  const pasteCopied = useCallback(
    (list = copied) => {
      if (!list?.length) return;
      // Offset so a paste lands beside its source rather than exactly on top of
      // it, where it would look like nothing happened. Same step duplicate uses.
      addElements(
        list.map((el) => ({ ...el, x: (Number(el.x) || 0) + 24, y: (Number(el.y) || 0) + 24 })),
      );
    },
    [copied, addElements],
  );

  // ── Pill actions ──────────────────────────────────────────────────────
  const alignSelection = useCallback(
    (kind) => {
      const targets = selectedElements.filter((el) => !el.locked);
      if (!targets.length) return;
      // One undo step for the whole selection, and each element aligned on its
      // own box — aligning four things left means four left edges at 0, not the
      // union box moved.
      updateElements(
        targets.map((el) => ({
          id: el.id,
          ...alignToPagePatch(el, kind, canvas.width, canvas.height),
        })),
        { record: true },
      );
    },
    [selectedElements, updateElements, canvas.width, canvas.height],
  );

  // Promote an image to the page background. The element is removed because it
  // has BECOME the background — leaving it would stack a duplicate of the same
  // picture on top of itself, and dragging that copy would look like the
  // background had torn loose.
  const setImageAsBackground = useCallback(
    (id) => {
      const el = elementsRef.current.find((e) => e.id === id);
      if (!el || el.type !== "image" || !el.src) return;
      setBackground(el.src);
      removeElement(id);
      toast("Set as background");
    },
    [setBackground, removeElement],
  );

  // ── Dragging a multi-selection ────────────────────────────────────────
  // react-rnd moves the element under the pointer; the rest of the selection is
  // moved by hand, by the same delta, from the positions they held when the
  // gesture started. Measuring against that snapshot (rather than accumulating
  // per-frame deltas) is what keeps the selection rigid — accumulated rounding
  // would let members drift apart over a long drag.
  const dragRef = useRef(null);
  // Which element react-rnd is currently moving, so the rest of the selection
  // knows to follow it. Set once per gesture, not per frame.
  const [draggingId, setDraggingId] = useState(null);
  const chromeLayerRef = useRef(null);

  /**
   * Move the chrome and any co-dragged elements to match a drag in progress.
   *
   * react-rnd moves the dragged element's own DOM node and tells React nothing
   * until the drop. That is what makes dragging cheap — and it is why the
   * selection outline used to sit still and then snap into place when you let
   * go: chrome lives in a sibling layer positioned from state, and state does
   * not move during the gesture.
   *
   * So nothing here goes through state either. The chrome layer is translated
   * directly, and the other members of a multi-selection are moved by two CSS
   * variables on the stage — every co-dragged element reads the same pair, so
   * one write moves all of them however many there are. The whole gesture
   * therefore costs zero React renders, and the geometry lands in state once,
   * on drop.
   */
  const paintDragShift = useCallback(
    (dx, dy) => {
      const chrome = chromeLayerRef.current;
      // After the scale, so the offset is read in canvas units like everything
      // else in this layer rather than in screen pixels.
      if (chrome) {
        chrome.style.transform = `scale(${zoom}) translate(${dx}px, ${dy}px)`;
      }
      const stage = stageInnerRef.current;
      if (stage) {
        stage.style.setProperty("--ck-drag-x", `${dx}px`);
        stage.style.setProperty("--ck-drag-y", `${dy}px`);
      }
    },
    [zoom],
  );

  const clearDragShift = useCallback(() => {
    paintDragShift(0, 0);
  }, [paintDragShift]);

  const handleDragBegin = useCallback(
    (id) => {
      dragRef.current = null;
      // From the refs, not from `elements` / `selectedElements` — see the note
      // where those refs are declared. This only runs on mousedown, well after
      // the layout effect that fills them, so they are current.
      const origin = elementsRef.current.find((el) => el.id === id);
      if (!origin) return;

      // Every drag is tracked, not just one that starts inside a multi-
      // selection: a single element's chrome has to follow it too, and the most
      // common gesture of all is grabbing something that was not selected a
      // moment ago. That element is NOT in the selection yet at mousedown —
      // react-rnd starts the drag in the same tick as the click that selects it
      // — so it correctly brings nothing else along.
      const inSelection = selectedIdsRef.current.includes(id);
      dragRef.current = {
        id,
        ox: origin.x,
        oy: origin.y,
        moved: false,
        others: inSelection
          ? selectedElementsRef.current
              .filter((el) => el.id !== id && !el.locked)
              .map((el) => ({ id: el.id, x: el.x, y: el.y }))
          : [],
      };
      // Marks the co-dragged elements so they pick up the CSS variables. One
      // render at the start of the gesture, none during it.
      setDraggingId(id);
    },
    // Nothing: every value it reads comes from a ref, so this is one function
    // for the life of the editor and never re-renders the elements it is passed
    // to. That is what makes the memo on EditorElement worth having.
    [],
  );

  // ── Right-click menu ──────────────────────────────────────────────────
  // Viewport coordinates, straight off the event — see EditorContextMenu.
  const [contextMenu, setContextMenu] = useState(null);
  const openContextMenu = useCallback(
    (id, e) => {
      e.preventDefault();
      e.stopPropagation();
      // Right-clicking something outside the current selection moves the
      // selection to it first, the way a left click would. Right-clicking INSIDE
      // a multi-selection leaves it alone, so "delete these five" still works.
      if (id && !selectedIdsRef.current.includes(id)) selectElement(id);
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    [selectElement],
  );
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // ── Arrow-key nudge ───────────────────────────────────────────────────
  // Moves the selection by exact amounts, which a drag cannot do — and is the
  // only way to place something to the pixel without opening the Position panel
  // and typing coordinates.
  const nudgeRef = useRef({ timer: null });
  const nudge = useCallback(
    (dx, dy) => {
      const targets = selectedElementsRef.current.filter((el) => !el.locked);
      if (!targets.length) return;

      // One undo step per BURST. The snapshot is taken on the first press of a
      // run; every repeat after that records nothing, and the run ends once the
      // key has been still for NUDGE_BURST_MS. Undo then walks back the whole
      // movement, which is what the user thinks of as one action.
      if (!nudgeRef.current.timer) commit();
      clearTimeout(nudgeRef.current.timer);
      nudgeRef.current.timer = setTimeout(() => {
        nudgeRef.current.timer = null;
      }, NUDGE_BURST_MS);

      updateElements(
        targets.map((el) => ({
          id: el.id,
          x: (Number(el.x) || 0) + dx,
          y: (Number(el.y) || 0) + dy,
        })),
        { record: false },
      );
    },
    [commit, updateElements],
  );

  // Shared by every element on the stage rather than rebuilt per element in the
  // map below — see the memo note at the bottom of EditorElement. Each takes the
  // element's id, and EditorElement binds it to itself.
  const endEdit = useCallback(() => setEditingId(null), []);
  const focusCell = useCallback((id, r, c) => setActiveCell({ id, r, c }), []);

  const handleDragMove = useCallback(
    (id, d) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== id) return;
      drag.moved = true;
      paintDragShift(d.x - drag.ox, d.y - drag.oy);
    },
    [paintDragShift],
  );

  const handleDragEnd = useCallback(
    (id, d) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setDraggingId(null);
      // Cleared BEFORE the state write: the transform and the new coordinates
      // would otherwise both be applied for one frame and everything would jump
      // by twice the distance it was dragged before settling back.
      clearDragShift();

      // Not one of ours (an unselected element, or the selection changed
      // mid-gesture) — commit the one element react-rnd moved.
      if (!drag || drag.id !== id) {
        updateElement(id, { x: d.x, y: d.y }, { record: true });
        return;
      }

      const dx = d.x - drag.ox;
      const dy = d.y - drag.oy;
      // A click that never moved: nothing to record and nothing to write.
      // Recording it would push an undo entry that changes nothing.
      if (!drag.moved || (dx === 0 && dy === 0)) return;

      // ONE undo entry for the whole gesture, written here rather than on the
      // first frame — by now nothing has touched state, so the snapshot taken
      // is still the pre-drag one.
      updateElements(
        [
          { id, x: d.x, y: d.y },
          ...drag.others.map((o) => ({ id: o.id, x: o.x + dx, y: o.y + dy })),
        ],
        { record: true },
      );
    },
    [updateElement, updateElements, clearDragShift],
  );

  // ── Marquee (drag-to-select) ──────────────────────────────────────────
  // Live rect in the ref, mirrored into state only so it can be drawn: the
  // window listeners are then subscribed once per gesture instead of on every
  // pointer move.
  const marqueeRef = useRef(null);
  const [marquee, setMarquee] = useState(null);

  const startMarquee = (e) => {
    const p = canvasPoint(e);
    marqueeRef.current = {
      x0: p.x,
      y0: p.y,
      x1: p.x,
      y1: p.y,
      // Shift-sweeping ADDS to what was already selected.
      additive: e.shiftKey,
      base: e.shiftKey ? selectedIds : [],
    };
    setMarquee({ ...marqueeRef.current });
  };

  useEffect(() => {
    if (!marquee) return;

    const move = (e) => {
      const m = marqueeRef.current;
      if (!m) return;
      const rect = stageInnerRef.current?.getBoundingClientRect();
      if (!rect) return;
      m.x1 = (e.clientX - rect.left) / zoom;
      m.y1 = (e.clientY - rect.top) / zoom;
      setMarquee({ ...m });
    };

    const up = () => {
      const m = marqueeRef.current;
      marqueeRef.current = null;
      setMarquee(null);
      if (!m) return;

      // A click is a zero-size sweep, and a box test would still "catch" any
      // element whose bounds contain that point — the hollow middle of a ring,
      // the corner of a rotated shape — so a click on blank canvas could select
      // something it visibly missed. Below this threshold it was a click, and a
      // click on blank canvas means deselect (already done on mousedown).
      const w = Math.abs(m.x1 - m.x0);
      const h = Math.abs(m.y1 - m.y0);
      if (w < 3 && h < 3) return;

      const box = {
        x: Math.min(m.x0, m.x1),
        y: Math.min(m.y0, m.y1),
        w,
        h,
      };
      const hits = elementsRef.current.filter((el) => {
        if (el.hidden || el.locked) return false;
        const ex = Number(el.x) || 0;
        const ey = Number(el.y) || 0;
        const ew = Number(el.width) || 0;
        const eh = Number(el.height) || 0;
        // Touch, not containment: sweeping across a row of elements should pick
        // up the ones the box grazes, which is what the gesture looks like.
        return !(
          ex + ew < box.x ||
          ex > box.x + box.w ||
          ey + eh < box.y ||
          ey > box.y + box.h
        );
      });

      const ids = hits.map((el) => el.id);
      if (m.additive) setSelection([...m.base, ...ids]);
      else if (ids.length) setSelection(ids);
    };

    // On window, not the stage: a sweep normally runs off the artboard, and a
    // gesture that ended outside it would otherwise never be committed.
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    // `marquee` is in the deps only as an on/off switch — the effect reads the
    // live rect from the ref, so re-subscribing per frame isn't needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!marquee, zoom, setSelection]);

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

  // On desktop the editor opens at a fixed 50% (see the zoom useState) rather
  // than fitting, because half-size is a useful working zoom on a large screen.
  //
  // On a phone that default is unusable: a 1080px-wide design at 50% is 540px
  // on a 360px screen, so the artboard opens already overflowing and the user
  // has to zoom out before they can see what they are editing. Below `lg` we
  // fit on mount instead — once, so it never fights a zoom the user chose.
  const fittedOnceRef = useRef(false);
  useLayoutEffect(() => {
    if (isCompactEditor && !fittedOnceRef.current) {
      fittedOnceRef.current = true;
      fitZoom();
    }
  }, [isCompactEditor, fitZoom]);

  // Re-fit on resize only where fitting is the policy — below `lg`, where the
  // canvas has to stay legible on a small screen and rotating the device really
  // does need a new zoom.
  //
  // On desktop this used to refit too, which meant that dragging the window
  // edge threw away whatever zoom you had picked. That was always wrong; with a
  // wheel and shortcuts to set the zoom deliberately it would be worse.
  useLayoutEffect(() => {
    if (!isCompactEditor) return;
    const onResize = () => fitZoom();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isCompactEditor, fitZoom]);

  // Wheel-zoom toward the cursor, space / middle-mouse / alt drag to pan, and
  // the Ctrl+0/1/+/− shortcuts. Suppressed while a text box has the caret so
  // space types a space, and while a crop or erase overlay owns the stage.
  const { panning } = useStageViewport({
    wrapRef: stageWrapRef,
    zoom,
    setZoom,
    fitZoom,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
    disabled: !!editingId || !!croppingId || !!erasingId,
  });

  // ── Pinch to zoom ─────────────────────────────────────────────────────────
  // Two-finger pinch on the stage viewport. Written with pointer events on the
  // wrapper (the same API the editor already uses for its draw/handle
  // interactions) rather than a library, so it composes with react-rnd's own
  // pointer handling instead of competing with it.
  //
  // Only ever engages with EXACTLY two pointers down, which is what keeps it
  // out of the way of single-finger element dragging.
  const pinchRef = useRef(null);
  const activePointersRef = useRef(new Map());

  const onStagePointerDown = useCallback((e) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (activePointersRef.current.size === 2) {
      const [a, b] = [...activePointersRef.current.values()];
      pinchRef.current = {
        startDist: Math.hypot(b.x - a.x, b.y - a.y),
        startZoom: zoom,
      };
    }
  }, [zoom]);

  const onStagePointerMove = useCallback((e) => {
    const pointers = activePointersRef.current;
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const pinch = pinchRef.current;
    if (!pinch || pointers.size !== 2) return;

    const [a, b] = [...pointers.values()];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (!pinch.startDist) return;

    const next = pinch.startZoom * (dist / pinch.startDist);
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }, []);

  const onStagePointerUp = useCallback((e) => {
    activePointersRef.current.delete(e.pointerId);
    // Drop the gesture as soon as it stops being a two-finger one, so lifting
    // one finger does not leave a stale scale factor armed for the next touch.
    if (activePointersRef.current.size < 2) pinchRef.current = null;
  }, []);

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

      const mod = e.metaKey || e.ctrlKey;
      const key = typeof e.key === "string" ? e.key.toLowerCase() : "";

      if (mod && key === "a") {
        e.preventDefault(); // or the browser selects the whole page
        selectAll();
        return;
      }
      // Nudge. Checked before the modifier shortcuts below because it is the
      // only binding here that WANTS a bare Shift, and preventDefault matters:
      // an arrow key would otherwise scroll the stage out from under you.
      const step = NUDGE_KEYS[e.key];
      if (step && !mod && selectedIds.length) {
        e.preventDefault();
        const distance = e.shiftKey ? NUDGE_COARSE : NUDGE_FINE;
        nudge(step[0] * distance, step[1] * distance);
        return;
      }
      // Shift is the only thing separating group from ungroup, so read it off
      // the modifier — Ctrl+Shift+G arrives as "G", not "g".
      if (mod && key === "g") {
        e.preventDefault();
        if (e.shiftKey) {
          const group = selectedElements.find(isGroup);
          if (group) ungroupElement(group.id);
        } else if (selectedIds.length > 1) {
          groupElements(selectedIds);
        }
        return;
      }
      if (mod && key === "d") {
        e.preventDefault(); // or Chrome opens "bookmark this page"
        if (selectedIds.length) duplicateElements(selectedIds);
        return;
      }
      // Copy only. There is deliberately no Ctrl+V here: paste arrives as the
      // browser's own `paste` event (handled below), which is the only way to
      // see the system clipboard without an async permission-gated read — and
      // binding both would paste twice.
      if (mod && key === "c") {
        if (selectedIds.length) copySelection();
        return;
      }
      // Layer order. Bracket keys report as "[" / "]" whether or not Shift is
      // down, so the direction comes from the key and the distance from Shift.
      if (mod && (key === "[" || key === "]")) {
        e.preventDefault();
        if (!selectedIds.length) return;
        const dir =
          key === "]"
            ? e.shiftKey
              ? "front"
              : "forward"
            : e.shiftKey
              ? "back"
              : "backward";
        selectedIds.forEach((id) => moveLayer(id, dir));
        return;
      }
      // Lock. Alt+Shift+L rather than a bare modifier: Ctrl+L is the browser's
      // address bar and not ours to take.
      if (e.altKey && e.shiftKey && key === "l") {
        e.preventDefault();
        if (!selectedIds.length) return;
        const lock = !selectedElements.some((el) => el.locked);
        updateElements(
          selectedIds.map((id) => ({ id, locked: lock })),
          { record: true },
        );
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.length) {
        e.preventDefault();
        removeElements(selectedIds);
      }
      if (e.key === "Escape") {
        setEditingId(null);
        // One level at a time: inside a group, Escape hands the selection back
        // to the group rather than dropping it altogether, so a stray press
        // doesn't cost you the thing you were working on.
        if (!exitGroup()) selectElement(null);
        setAddNodeMode(false);
        setTool((t) => (t.type === "select" ? t : { ...t, type: "select" }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    nudge,
    editingId,
    selectedIds,
    selectedElements,
    undo,
    redo,
    removeElements,
    duplicateElements,
    groupElements,
    ungroupElement,
    exitGroup,
    selectAll,
    selectElement,
    copySelection,
    moveLayer,
    updateElements,
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

  /**
   * Drop a hosted image onto the canvas: centred, on top of the stack, sized to
   * a fraction of the artboard while keeping its own aspect.
   *
   * @param {string} src Image URL.
   * @param {{ offsetIndex?: number }} [opts] `offsetIndex` cascades the placement
   *   by a small step so a batch (e.g. four Magic Studio results inserted at
   *   once) lands as a readable stagger instead of one perfectly hidden pile.
   */
  const insertImageUrl = (src, { offsetIndex = 0 } = {}) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    // ~3% of the artboard's short side — visible on a 1080px canvas, still
    // proportional on a tiny one.
    const step = offsetIndex * Math.round(Math.min(canvas.width, canvas.height) * 0.03);
    const place = (natW, natH) => {
      const maxW = canvas.width * 0.6;
      const ratio = natH && natW ? natH / natW : 1;
      const w = Math.min(maxW, natW || maxW);
      const h = w * ratio;
      addElement({
        type: "image",
        src,
        x: cx() - w / 2 + step,
        y: cy() - h / 2 + step,
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
        // `originalSrc` is kept so the Restore quick tool has something to put
        // back — undo would also do it, but only until the next few edits push
        // it off the stack, and "put the background back" is a decision people
        // make much later than that.
        const localUrl = URL.createObjectURL(blob);
        updateElement(
          id,
          {
            src: localUrl,
            backgroundRemoved: true,
            originalSrc: target.originalSrc || target.src,
          },
          { record: true },
        );
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
  // without re-subscribing the window listener every render — but it is filled
  // in from an effect, not during render: a render can be thrown away or run
  // twice, and a ref written from one is not something React tracks.
  const pasteRef = useRef(null);
  const onPasteEvent = (e) => {
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

    // Elements copied from this editor (in this tab or another one). Checked
    // before the text branch because that is exactly what this arrives AS —
    // our JSON payload is `text/plain`, and without this it would paste as a
    // wall of JSON in a text box.
    const text = cd.getData("text/plain");
    const pastedElements = decodeElements(text);
    if (pastedElements) {
      e.preventDefault();
      pasteCopied(pastedElements);
      return;
    }

    // Text
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

  // No dep array: the handler closes over editingId, canvas and the insert
  // helpers, so it has to be refreshed after every render.
  useEffect(() => {
    pasteRef.current = onPasteEvent;
  });

  useEffect(() => {
    const handler = (e) => pasteRef.current?.(e);
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);

  // ── Save & download ───────────────────────────────────────────────────
  // `silent` suppresses the success toast — used by the autosave and the
  // save-on-open so they don't spam the user; manual saves still confirm.
  //
  // Every save also carries a freshly rendered preview of the design, painted
  // at the canvas's true dimensions (renderDesignToDataUrl downscales nothing,
  // it only compresses), so the creatives list shows exactly what opens here
  // instead of a stale or missing thumbnail. The render is best-effort: it
  // returns null rather than throwing, and a null is simply omitted from the
  // payload — a preview that couldn't be painted must never cost the user the
  // canvas edits the same request is carrying.
  const doSave = async ({ silent = false } = {}) => {
    setSaving(true);
    try {
      const thumbnail = await renderDesignToDataUrl({ canvas, elements });
      const payload = { name, canvas, elements, notes, thumbnail };
      if (onSave) {
        await onSave(payload);
      } else {
        const res = await updateDesignById(design.id, {
          name,
          canvas: JSON.stringify({ canvas, elements, notes }),
          ...(thumbnail ? { thumbnail } : {}),
        });
        if (!res?.ok) throw new Error(res?.message || "Save failed");
      }
      markSaved();
      setSavedMeta({ name, notes });
      if (!silent) toast.success("Design saved");
    } catch (err) {
      // Silent saves have no toast to carry the failure — the console is the
      // only signal that an autosave or save-on-open didn't land.
      console.error("Save failed:", err?.message || err);
      if (!silent) toast.error(err.message || "Could not save design");
    } finally {
      setSaving(false);
    }
  };

  // Effective dirty state — unsaved canvas/element edits or a renamed title.
  // Compared against what was last SAVED, not against the design as it was
  // loaded. `design` is a prop and never changes, so measuring against it meant
  // that once you renamed the design it counted as dirty forever — the autosave
  // re-fired every 15 seconds and the unsaved-changes guard would have caught
  // you on the way out of an already-saved design.
  const isDirty =
    dirty || name !== savedMeta.name || notes !== savedMeta.notes;

  // Warn before unsaved work is lost. The autosave below narrows the window to
  // 15 seconds; it does not close it, and the edits worth keeping are the ones
  // you just made.
  const { dialog: unsavedDialog, guard: guardLeave } = useUnsavedChangesGuard({
    isDirty,
    onSave: () => doSave({ silent: true }),
  });

  // Autosave every 15s when there are unsaved changes. A ref keeps the interval
  // pointed at the latest save fn / dirty flag without resetting each render —
  // refreshed from an effect rather than during render, for the same reason as
  // the paste handler above.
  const autosaveRef = useRef({});
  useEffect(() => {
    autosaveRef.current = { save: doSave, dirty: isDirty, saving };
  });
  useEffect(() => {
    const id = setInterval(() => {
      const s = autosaveRef.current;
      if (s.dirty && !s.saving) s.save({ silent: true });
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Save once when a design is opened, even with nothing edited yet. Designs
  // created before saves carried a preview have no thumbnail at all, and a
  // design only ever gets one by being saved — so opening it backfills the
  // preview instead of leaving the creatives list blank until the first edit.
  // Keyed on the design id so it fires once per design, not once per render.
  const openedIdRef = useRef(null);
  useEffect(() => {
    if (!design?.id || openedIdRef.current === design.id) return;
    openedIdRef.current = design.id;
    const s = autosaveRef.current;
    if (!s.saving) s.save({ silent: true });
  }, [design?.id]);

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
      <style dangerouslySetInnerHTML={{
        __html:
          "@keyframes kluxApplyFlash{0%{opacity:0}12%{opacity:1}68%{opacity:1}100%{opacity:0}}",
      }} />
      <EditorTopBar
        name={name}
        onNameChange={setName}
        onBack={() => guardLeave(onBack)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.1, MAX_ZOOM))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.1, MIN_ZOOM))}
        dirty={isDirty}
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
          kluxSeedRedesign={initialPanel === "klux" && !kluxSeedUsed}
          onKluxSeedUsed={markKluxSeedUsed}
          colorTarget={colorTarget}
          positionSection={positionSection}
          onPositionSection={setPositionSection}
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

        {/* Stage viewport — a native scroll container at every size.
            Once a zoom takes the artboard past the viewport there has to be
            some way to reach its edges, and native overflow scrolling gives
            that (with momentum on touch) for free. It used to clip at `lg`,
            which meant zooming in on a desktop put the rest of the design
            somewhere you simply could not get to.
            `[&>*]:m-auto` keeps the artboard centred while it still fits and
            stops flexbox centring from making the top-left unreachable once it
            does not — the classic overflow + justify-center trap.
            pb-nav clears the icon rail, which is fixed to the bottom edge below
            `lg`. See useStageViewport for the wheel/pan/keyboard behaviour. */}
        <div
          ref={stageWrapRef}
          className={`relative flex-1 flex items-center justify-center overflow-auto pb-nav [&>*]:m-auto lg:pb-0 ${
            panning ? "select-none" : ""
          }`}
          onPointerDown={(e) => {
            onStagePointerDown(e);
            // click empty area → deselect, and start a marquee from here so a
            // sweep can begin on the pasteboard and run across the artboard.
            // ⚠️ Depends on the click landing on THIS node — do not wrap the
            // stage below in another element without moving this check with it.
            if (e.target === e.currentTarget) {
              if (!e.shiftKey) selectElement(null);
              setEditingId(null);
              setActiveCell(null);
              if (!isDrawTool && !addNodeMode) startMarquee(e);
            }
          }}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerUp}
          onPointerCancel={onStagePointerUp}
        >
          {/* Static launchers pinned to the stage's top-right. */}
          <div className="absolute top-3 right-3 z-[9999] flex items-center gap-2">
            <button
              onClick={() => setShowNotes((v) => !v)}
              title={showNotes ? "Hide notes" : "Notes"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-surface shadow-lg transition cursor-pointer ${
                showNotes
                  ? "border-blue-400 text-[#155dfc]"
                  : "border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-[#155dfc]"
              }`}
            >
              <NotebookPen className="h-4 w-4" />
              {/* A dot rather than a count: the point is "there is something in
                  here", and a note's length is not a number worth reading. */}
              {!showNotes && notes.trim() && (
                <span className="absolute -mt-4 ml-4 h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setShowTimer((v) => !v)}
              title={showTimer ? "Hide timer" : "Timer"}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-surface shadow-lg transition cursor-pointer ${
                showTimer
                  ? "border-blue-400 text-[#155dfc]"
                  : "border-gray-200 text-gray-700 hover:bg-blue-50 hover:text-[#155dfc]"
              }`}
            >
              <TimerIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setActivePanel("klux")}
              title="Ask Klux AI"
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-surface pl-2 pr-3 text-gray-700 shadow-lg transition hover:bg-blue-50 hover:text-[#155dfc] cursor-pointer"
            >
              <KluxLogoIcon className="h-4 w-4" />
              <span className="text-xs font-semibold">Ask Klux</span>
            </button>
          </div>

          {/* Countdown. Mounted only while open, so closing it ends the run —
              nothing else in the editor needs the time remaining. */}
          {showTimer && <EditorTimer onClose={() => setShowTimer(false)} />}

          {/* Notes. Bottom-LEFT, opposite the timer, so both can be open at
              once without either covering the other. */}
          {showNotes && (
            <EditorNotes
              value={notes}
              onChange={setNotes}
              onClose={() => setShowNotes(false)}
            />
          )}

          {!croppingId && !erasingId && (
            <EditorContextBar
              // Formatting is per-element: with several selected there is no one
              // element these controls belong to, so a multi-selection gets no
              // bar. A GROUP does get one — the union of what its contents can be
              // styled with (see EditorContextBar), because grouping things is
              // how you say "treat these as one".
              element={multiSelected ? null : selectedElement}
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
              onOpenShapeEffectsPanel={() => setActivePanel("shape-effects")}
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

          {/* Scaled stage. `position: relative` anchors the chrome layer that
              sits over it — see the sibling below. */}
          <div
            style={{
              position: "relative",
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
              onPointerDown={(e) => {
                // Bare artboard: clear the selection and start a marquee.
                if (e.target === e.currentTarget) {
                  if (!e.shiftKey) selectElement(null);
                  setEditingId(null);
                  if (!isDrawTool && !addNodeMode) startMarquee(e);
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
                    selected={selectedIds.includes(el.id)}
                    editing={el.id === editingId}
                    onSelect={handleSelect}
                    onContextMenu={openContextMenu}
                    coDragging={
                      draggingId !== null &&
                      draggingId !== el.id &&
                      selectedIds.includes(el.id) &&
                      !el.locked
                    }
                    onDragBegin={handleDragBegin}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                    onChange={updateElement}
                    onStartEdit={setEditingId}
                    onEndEdit={endEdit}
                    onCurveAddPoint={addCurveNodeAt}
                    activeCell={
                      activeCell?.id === el.id ? activeCell : null
                    }
                    onCellFocus={focusCell}
                    onFrameFill={fillFrame}
                    onGridCellFill={fillGridCell}
                    animateToken={animateToken}
                    suppressChrome={el.id === croppingId || el.id === erasingId}
                    entered={el.id === enteredGroupId}
                    // Only the entered group needs this. Passing it to every
                    // element would re-render the whole page each time the
                    // active child changed inside one group.
                    activeChildId={
                      el.id === enteredGroupId ? activeChildId : null
                    }
                    onChildSelect={selectElement}
                    onChildChange={updateElement}
                    onChildGestureBegin={commit}
                  />
                ))}

              {/* "Applied" flash — a brief blue pulse when a whole design is
                  swapped in (Klux AI / template apply). */}
              {applyFlash && (
                <div
                  className="pointer-events-none absolute inset-0 z-50"
                  style={{
                    animation: "kluxApplyFlash 1.4s ease-out forwards",
                    boxShadow: "inset 0 0 0 6px rgba(37,99,235,0.85)",
                    background:
                      "radial-gradient(ellipse at center, rgba(37,99,235,0.32), rgba(37,99,235,0.04) 72%)",
                  }}
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

            {/* Chrome layer.
                Carries the same zoom transform and origin as the stage so it
                shares its coordinate system exactly — anything in here is
                positioned in canvas units, the same as if it were a child —
                but it never clips, which is the whole point of it being a
                sibling rather than a child. The stage clips at the artboard
                edge, which is what makes artwork crop there; when the selection
                outline and handles lived inside that clip, scaling an element
                past the edge took its handles with it and left nothing to
                scale back from.
                EVERY piece of editing chrome belongs here, not just the
                single-selection frame: a multi-selection box, line and curve
                nodes, crop and erase handles and the marquee all describe
                geometry that can legitimately sit off the artboard, and each
                one is unusable the moment it is clipped away.
                Inert by default so clicks fall through to the artboard; each
                grip re-enables pointer events for itself. */}
            <div
              ref={chromeLayerRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: canvas.width,
                height: canvas.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                pointerEvents: "none",
                zIndex: 44,
              }}
            >
              {/* You are inside this group. Without it, a selected member looks
                  exactly like a selected top-level element, and there is nothing
                  on screen to explain why the next click doesn't leave — or that
                  Escape has somewhere to go. */}
              {activeChildId &&
                (() => {
                  const g = elements.find((el) => el.id === enteredGroupId);
                  if (!g) return null;
                  return (
                    <div
                      style={{
                        position: "absolute",
                        left: g.x,
                        top: g.y,
                        width: g.width,
                        height: g.height,
                        transform: g.rotation ? `rotate(${g.rotation}deg)` : undefined,
                        border: `${1 / zoom}px dashed #94a3b8`,
                        pointerEvents: "none",
                        zIndex: 38,
                      }}
                    />
                  );
                })()}

              {selectedElement &&
                !multiSelected &&
                !editingId &&
                !croppingId &&
                !erasingId &&
                !isDrawTool &&
                !selLine &&
                !selCurve && (
                  <SelectionChrome
                    el={selectedElement}
                    stack={elements}
                    zoom={zoom}
                    coarse={isTouch}
                    onChange={(patch, opts) =>
                      updateElement(selectedElement.id, patch, opts)
                    }
                    onGestureBegin={commit}
                    onDuplicate={duplicateElement}
                    onRemove={removeElement}
                    onMoveLayer={moveLayer}
                    onToggleLock={(id) =>
                      updateElement(id, { locked: !selectedElement.locked })
                    }
                    onUngroup={ungroupElement}
                    canPaste={Boolean(copied?.length)}
                    onCopy={copySelection}
                    onPaste={() => pasteCopied()}
                    onAlign={alignSelection}
                    onSetAsBackground={() => setImageAsBackground(selectedElement.id)}
                    onShowLayers={showLayers}
                  />
                )}

              {/* Multi-selection chrome — one dashed box and one action pill
                  for the whole selection (the members' own pills stand down). */}
              {multiSelected && !editingId && !croppingId && !erasingId && !isDrawTool && (
                <SelectionOverlay
                  bounds={selectionBounds}
                  elements={selectedElements}
                  stack={elements}
                  zoom={zoom}
                  canPaste={Boolean(copied?.length)}
                  onCopy={copySelection}
                  onPaste={() => pasteCopied()}
                  onGroup={() => groupElements(selectedIds)}
                  onDuplicate={() => duplicateElements(selectedIds)}
                  onRemove={() => removeElements(selectedIds)}
                  onMoveLayer={(dir) => selectedIds.forEach((id) => moveLayer(id, dir))}
                  onAlign={alignSelection}
                  onShowLayers={showLayers}
                  onToggleLock={() => {
                    const lock = !selectedElements.some((el) => el.locked);
                    updateElements(
                      selectedIds.map((id) => ({ id, locked: lock })),
                      { record: true },
                    );
                  }}
                />
              )}

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

              {/* Add-node overlay — click on the selected line/curve to drop a
                  node. Stacked ABOVE the node handles on purpose: in this mode
                  every click on the shape means "add", so the existing nodes
                  must not intercept it. Sits in this layer with the handles it
                  covers, since a layer below could not cover them at all. */}
              {addNodeMode && (selCurve || selLine) && !isDrawTool && (
                <div
                  className="absolute inset-0"
                  style={{
                    zIndex: 47,
                    cursor: "copy",
                    touchAction: "none",
                    pointerEvents: "auto",
                  }}
                  onPointerDown={handleAddNodeClick}
                />
              )}

              {/* Image crop / erase overlays. Both draw their own box in canvas
                  units and dim only inside it, so neither depends on the
                  artboard clip to stay tidy — and an image hanging off the edge
                  keeps handles you can reach. */}
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

              {/* Marquee — the rubber band, in canvas units like everything
                  else in this layer. A sweep may start on the pasteboard and
                  run onto the artboard, so the band has to be drawable outside
                  it. Pointer-transparent so the sweep isn't interrupted by its
                  own rectangle. */}
              {marquee && (
                <div
                  style={{
                    position: "absolute",
                    left: Math.min(marquee.x0, marquee.x1),
                    top: Math.min(marquee.y0, marquee.y1),
                    width: Math.abs(marquee.x1 - marquee.x0),
                    height: Math.abs(marquee.y1 - marquee.y0),
                    border: `${1 / zoom}px solid #6366f1`,
                    background: "rgba(99,102,241,0.10)",
                    pointerEvents: "none",
                    zIndex: 60,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Full-screen preview — clean render of the design, Esc to exit */}
      {unsavedDialog}

      {/* Right-click menu. Rendered at the editor's top level, not inside the
          stage, because it is positioned in viewport coordinates and so must
          not be scaled by the zoom or clipped by the artboard. It carries the
          same actions as the pill's "…" menu — see EditorContextMenu. */}
      {contextMenu && selectedElements.length > 0 && (
        <EditorContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elements={selectedElements}
          stack={elements}
          onClose={closeContextMenu}
          canPaste={Boolean(copied?.length)}
          onCopy={copySelection}
          onPaste={() => pasteCopied()}
          onDuplicate={() => duplicateElements(selectedIds)}
          onRemove={() => removeElements(selectedIds)}
          onMoveLayer={(dir) => selectedIds.forEach((id) => moveLayer(id, dir))}
          onToggleLock={() => {
            // Unlock-all if anything is locked, otherwise lock-all — the same
            // rule the multi-select pill uses, so the two never disagree.
            const lock = !selectedElements.some((el) => el.locked);
            updateElements(
              selectedIds.map((id) => ({ id, locked: lock })),
              { record: true },
            );
          }}
          onGroup={() => groupElements(selectedIds)}
          onUngroup={() => {
            const group = selectedElements.find(isGroup);
            if (group) ungroupElement(group.id);
          }}
          onAlign={alignSelection}
          onSetAsBackground={() => setImageAsBackground(selectedElement?.id)}
          onShowLayers={showLayers}
        />
      )}

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
