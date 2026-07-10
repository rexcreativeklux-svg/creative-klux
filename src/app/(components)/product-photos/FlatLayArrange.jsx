"use client";

/**
 * Interactive arrange surface for the Flat Lay tool. Renders each grabbed product
 * item as a draggable + resizable layer (react-rnd) on a white canvas scaled to
 * fit the view. After each edit it re-flattens the layout back into the engine
 * hook (debounced) so Download/Save always export exactly what's on screen.
 */

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { flattenItems } from "@/(lib)/ai-engine/hooks/useFlatLay";

export default function FlatLayArrange({ tool }) {
  const { items, setItems, canvasSize, setFlattened } = tool;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const flattenTimer = useRef(null);

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
        const blob = await flattenItems(nextItems, canvasSize.width, canvasSize.height);
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

  useEffect(() => () => clearTimeout(flattenTimer.current), []);

  const dispW = canvasSize.width * scale;
  const dispH = canvasSize.height * scale;

  return (
    <div ref={wrapRef} className="w-full h-full flex items-center justify-center">
      <div
        className="relative bg-white rounded-2xl shadow-inner border border-gray-200 overflow-hidden"
        style={{ width: dispW, height: dispH }}
      >
        {items.map((it) => (
          <Rnd
            key={it.id}
            bounds="parent"
            size={{ width: it.w * scale, height: it.h * scale }}
            position={{ x: it.x * scale, y: it.y * scale }}
            lockAspectRatio
            onDragStop={(e, d) => updateItem(it.id, { x: d.x / scale, y: d.y / scale })}
            onResizeStop={(e, dir, ref, delta, pos) =>
              updateItem(it.id, {
                w: parseFloat(ref.style.width) / scale,
                h: parseFloat(ref.style.height) / scale,
                x: pos.x / scale,
                y: pos.y / scale,
              })
            }
            className="group"
          >
            <img
              src={it.url}
              alt="product item"
              draggable={false}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
            <span className="absolute inset-0 rounded-lg ring-1 ring-transparent group-hover:ring-violet-400 transition" />
          </Rnd>
        ))}
      </div>
    </div>
  );
}
