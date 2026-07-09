"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import useDesignEditor from "./useDesignEditor";
import EditorTopBar from "./EditorTopBar";
import EditorSidebar from "./EditorSidebar";
import EditorContextBar from "./EditorContextBar";
import EditorElement from "./EditorElement";
import { renderDesignToBlob } from "./renderDesign";
import { SHAPES, aspectOf } from "./shapes";
import { ensureEditorFontsLoaded } from "./fonts";

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
export default function DesignEditor({ design, onSave, onBack }) {
  const { updateDesignById, uploadImage } = useAuth();
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
    markSaved,
  } = editor;

  const [name, setName] = useState(design?.name || "Untitled design");
  const [zoom, setZoom] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const stageWrapRef = useRef(null);

  // Make the curated web fonts available for on-canvas text + PNG export.
  useEffect(() => {
    ensureEditorFontsLoaded();
  }, []);

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId, selectedId, undo, redo, removeElement, selectElement]);

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

    addElement({
      type: "shape",
      shape: key,
      x: cx() - w / 2,
      y: cy() - h / 2,
      width: Math.round(w),
      height: Math.round(h),
      fill: opts.fill ?? (isStroke ? "#111111" : "#6366f1"),
      borderRadius: isRounded ? Math.round(Math.min(w, h) * 0.14) : opts.borderRadius ?? 0,
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
        const res = await uploadImage(file);
        const url =
          res?.url || res?.data?.url || res?.image_url || res?.data?.image_url;
        if (url) updateElement(id, { src: url }, { record: false });
      } catch {
        toast.error("Image upload failed — it won't persist after save.");
      }
    };
    img.src = localUrl;
  };

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
        onDownload={doDownload}
      />

      <div className="flex-1 flex min-h-0">
        <EditorSidebar
          insert={{
            text: insertText,
            shape: insertShape,
            imageUrl: insertImageUrl,
            imageFile: handleAddImage,
          }}
          setBackground={setBackground}
          background={typeof bg === "string" && bg.startsWith("#") ? bg : "#ffffff"}
          editor={editor}
          designId={design?.id}
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
            }
          }}
        >
          <EditorContextBar
            element={selectedElement}
            onChange={updateElement}
            onDuplicate={duplicateElement}
            onRemove={removeElement}
            onMoveLayer={moveLayer}
          />

          {/* Scaled stage */}
          <div
            style={{
              width: canvas.width * zoom,
              height: canvas.height * zoom,
              flexShrink: 0,
            }}
          >
            <div
              className="relative shadow-xl"
              style={{
                width: canvas.width,
                height: canvas.height,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                backgroundColor: isImageBg ? "#ffffff" : bg,
                backgroundImage: isImageBg ? `url(${bg})` : undefined,
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
              {elements.filter((el) => !el.hidden).map((el) => (
                <EditorElement
                  key={el.id}
                  element={el}
                  zoom={zoom}
                  selected={el.id === selectedId}
                  editing={el.id === editingId}
                  onSelect={selectElement}
                  onChange={(patch, opts) => updateElement(el.id, patch, opts)}
                  onStartEdit={setEditingId}
                  onEndEdit={() => setEditingId(null)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
