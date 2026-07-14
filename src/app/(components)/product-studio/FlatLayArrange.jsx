"use client";

/**
 * Interactive arrange surface for the Flat Lay tool. Renders each grabbed product
 * item as a draggable + resizable layer (react-rnd) on a canvas scaled to fit
 * the view, painted with the tool's chosen background (swatch row in the modal
 * overlay). After each edit it re-flattens the layout back into the engine hook
 * (debounced) so Download/Save always export exactly what's on screen.
 *
 * Per-item context menu (right-click on desktop, long-press on touch):
 * download just that item as a transparent PNG, bring to front / send to back
 * (array order = stacking order = flatten order), or remove it.
 *
 * Lives inside the modal's react-zoom-pan-pinch surface: `useTransformEffect`
 * feeds the live zoom scale to react-rnd (its `scale` prop) so item drags track
 * the cursor 1:1 at any zoom level.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { AnimatePresence, motion } from "framer-motion";
import { Download, ArrowUpToLine, ArrowDownToLine, Trash2 } from "lucide-react";
import { useTransformEffect } from "react-zoom-pan-pinch";
import { flattenItems } from "@/(lib)/ai-engine/hooks/useFlatLay";

const CHECKER =
  "repeating-conic-gradient(#e4e4e7 0% 25%, #fff 0% 50%) 50% / 20px 20px";
const LONG_PRESS_MS = 500;

export default function FlatLayArrange({ tool }) {
  const { items, setItems, canvasSize, setFlattened, background } = tool;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [viewScale, setViewScale] = useState(1); // live react-zoom-pan-pinch zoom
  const [draggingId, setDraggingId] = useState(null);
  const [menu, setMenu] = useState(null); // { id, x, y }
  const flattenTimer = useRef(null);
  const longPressTimer = useRef(null);

  // Track the surrounding pan/zoom scale so react-rnd's drag math stays 1:1
  // with the cursor while zoomed (Rnd's `scale` prop exists for exactly this).
  useTransformEffect(({ state }) => {
    setViewScale((prev) => (prev === state.scale ? prev : state.scale));
  });

  // Fit the (full-resolution) canvas into the available preview box.
  useEffect(() => {
    const fit = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const s = Math.min(
        wrap.clientWidth / canvasSize.width,
        wrap.clientHeight / canvasSize.height,
        1,
      );
      setScale(s || 1);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [canvasSize.width, canvasSize.height]);

  // Debounced re-flatten so Download/Save reflect the current arrangement.
  const scheduleFlatten = (nextItems) => {
    clearTimeout(flattenTimer.current);
    flattenTimer.current = setTimeout(async () => {
      try {
        const blob = await flattenItems(
          nextItems,
          canvasSize.width,
          canvasSize.height,
          background,
        );
        setFlattened(blob);
      } catch (err) {
        console.warn("⚠️ FlatLay: re-flatten failed:", err?.message);
      }
    }, 220);
  };

  const updateItem = (id, patch) => {
    setItems((prev) => {
      const next = prev.map((it) => (it.id === id ? { ...it, ...patch } : it));
      scheduleFlatten(next);
      return next;
    });
  };

  // ── Context-menu actions ──
  const closeMenu = () => setMenu(null);

  const downloadItem = (id) => {
    const it = items.find((x) => x.id === id);
    if (!it) return;
    console.log("💾 [flatlay] downloading single item (transparent PNG)");
    const a = document.createElement("a");
    a.href = it.url; // already a transparent-PNG object URL
    a.download = "klux-flatlay-item.png";
    a.click();
    closeMenu();
  };

  // Array order = DOM order = flatten draw order, so "front" = end of array.
  const reorderItem = (id, toFront) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (!it) return prev;
      const rest = prev.filter((x) => x.id !== id);
      const next = toFront ? [...rest, it] : [it, ...rest];
      scheduleFlatten(next);
      return next;
    });
    closeMenu();
  };

  const removeItem = (id) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it) URL.revokeObjectURL(it.url);
      const next = prev.filter((x) => x.id !== id);
      scheduleFlatten(next);
      return next;
    });
    closeMenu();
  };

  const openMenu = (id, clientX, clientY) => {
    // Clamp near the viewport edges so the menu never renders off-screen.
    const x = Math.min(clientX, window.innerWidth - 220);
    const y = Math.min(clientY, window.innerHeight - 190);
    setMenu({ id, x, y });
  };

  // Long-press (touch) opens the same menu as right-click.
  const startLongPress = (id, e) => {
    if (e.pointerType !== "touch") return;
    clearTimeout(longPressTimer.current);
    const { clientX, clientY } = e;
    longPressTimer.current = setTimeout(() => openMenu(id, clientX, clientY), LONG_PRESS_MS);
  };
  const cancelLongPress = () => clearTimeout(longPressTimer.current);

  useEffect(
    () => () => {
      clearTimeout(flattenTimer.current);
      clearTimeout(longPressTimer.current);
    },
    [],
  );

  // Esc closes the menu.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => e.key === "Escape" && closeMenu();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const dispW = canvasSize.width * scale;
  const dispH = canvasSize.height * scale;
  const transparent = background === "transparent";

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
      <div
        className="relative rounded-2xl shadow-inner border border-gray-200 overflow-hidden"
        style={{
          width: dispW,
          height: dispH,
          ...(transparent
            ? { background: CHECKER }
            : { backgroundColor: background }),
        }}
      >
        {items.map((it) => (
          <Rnd
            key={it.id}
            bounds="parent"
            scale={viewScale}
            size={{ width: it.w * scale, height: it.h * scale }}
            position={{ x: it.x * scale, y: it.y * scale }}
            lockAspectRatio
            minWidth={24}
            minHeight={24}
            onDragStart={() => {
              cancelLongPress();
              setDraggingId(it.id);
            }}
            onDragStop={(e, d) => {
              setDraggingId(null);
              updateItem(it.id, { x: d.x / scale, y: d.y / scale });
            }}
            onResizeStart={cancelLongPress}
            onResizeStop={(e, dir, ref, delta, pos) =>
              updateItem(it.id, {
                w: parseFloat(ref.style.width) / scale,
                h: parseFloat(ref.style.height) / scale,
                x: pos.x / scale,
                y: pos.y / scale,
              })
            }
            // "flatlay-item" is excluded from the modal's pan gesture so
            // dragging an item never pans the canvas underneath it.
            className={`group flatlay-item ${draggingId === it.id ? "z-10" : ""}`}
          >
            <div
              className={`w-full h-full transition-transform duration-150 ${
                draggingId === it.id ? "scale-[1.02] drop-shadow-xl" : ""
              }`}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openMenu(it.id, e.clientX, e.clientY);
              }}
              onPointerDown={(e) => startLongPress(it.id, e)}
              onPointerUp={cancelLongPress}
              onPointerLeave={cancelLongPress}
            >
              <img
                src={it.url}
                alt="product item"
                draggable={false}
                className="w-full h-full object-contain select-none pointer-events-none"
              />
              <span className="absolute inset-0 rounded-lg ring-1 ring-transparent group-hover:ring-violet-400 transition" />
            </div>
          </Rnd>
        ))}
      </div>

      {/* Per-item context menu — portaled to <body>: the zoom surface is CSS-
          transformed, which would break `position: fixed` coordinates inside. */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {menu && (
              <>
                <div className="fixed inset-0 z-[300]" onClick={closeMenu} onContextMenu={(e) => { e.preventDefault(); closeMenu(); }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.14, ease: "easeOut" }}
                  className="flatlay-menu fixed z-[310] w-52 rounded-xl bg-surface border border-gray-200 shadow-2xl p-1.5"
                  style={{ top: menu.y, left: menu.x }}
                >
                  <MenuButton
                    icon={Download}
                    label="Download item (PNG)"
                    onClick={() => downloadItem(menu.id)}
                  />
                  <MenuButton
                    icon={ArrowUpToLine}
                    label="Bring to front"
                    onClick={() => reorderItem(menu.id, true)}
                  />
                  <MenuButton
                    icon={ArrowDownToLine}
                    label="Send to back"
                    onClick={() => reorderItem(menu.id, false)}
                  />
                  <div className="my-1 border-t border-gray-200" />
                  <MenuButton
                    icon={Trash2}
                    label="Remove item"
                    danger
                    onClick={() => removeItem(menu.id)}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );
}
