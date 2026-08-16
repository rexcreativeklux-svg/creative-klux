"use client";

import React, { useState } from "react";
import {
  Lock,
  Unlock,
  Copy,
  Trash2,
  MoreHorizontal,
  BringToFront,
  SendToBack,
  ChevronUp,
  ChevronDown,
  Ungroup,
} from "lucide-react";

/**
 * EditorElementMenu — the floating action pill that sits just below a selected
 * element (Canva-style). Lives inside the element's Rnd box as a sibling of the
 * rotated content, so it tracks the element but stays upright, and is
 * counter-scaled by 1/zoom to keep a constant on-screen size.
 *
 * Actions: lock/unlock, duplicate, delete, and a "more" popover for layer order.
 * A locked element collapses to just the unlock button.
 */
export default function EditorElementMenu({
  zoom = 1,
  locked,
  onDuplicate,
  onRemove,
  onMoveLayer,
  onToggleLock,
  // Only passed for a group element — see EditorElement.
  onUngroup,
}) {
  const [more, setMore] = useState(false);

  // Handles must not start a drag or bubble a fresh selection on the element.
  const stop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  };
  const act = (fn) => (e) => {
    stop(e);
    fn?.();
  };

  return (
    <div
      onMouseDown={stop}
      style={{
        position: "absolute",
        top: "100%",
        left: "50%",
        transform: `translate(-50%, 10px) scale(${1 / (zoom || 1)})`,
        transformOrigin: "top center",
        zIndex: 40,
      }}
    >
      <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-surface px-1.5 py-1 shadow-lg">
        <Btn title={locked ? "Unlock" : "Lock"} onClick={act(onToggleLock)}>
          {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
        </Btn>

        {!locked && (
          <>
            {onUngroup && (
              <Btn title="Ungroup (Ctrl+Shift+G)" onClick={act(onUngroup)}>
                <Ungroup className="h-4 w-4" />
              </Btn>
            )}
            <Btn title="Duplicate" onClick={act(onDuplicate)}>
              <Copy className="h-4 w-4" />
            </Btn>
            <Btn title="Delete" danger onClick={act(onRemove)}>
              <Trash2 className="h-4 w-4" />
            </Btn>
            <div className="relative">
              <Btn
                title="More"
                active={more}
                onClick={act(() => setMore((m) => !m))}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Btn>
              {more && (
                <div
                  onMouseDown={stop}
                  className="absolute left-1/2 top-full mt-1 w-44 -translate-x-1/2 rounded-xl border border-gray-100 bg-surface p-1 shadow-2xl"
                >
                  <Row
                    icon={BringToFront}
                    label="Bring to front"
                    onClick={act(() => {
                      onMoveLayer?.("front");
                      setMore(false);
                    })}
                  />
                  <Row
                    icon={ChevronUp}
                    label="Bring forward"
                    onClick={act(() => {
                      onMoveLayer?.("forward");
                      setMore(false);
                    })}
                  />
                  <Row
                    icon={ChevronDown}
                    label="Send backward"
                    onClick={act(() => {
                      onMoveLayer?.("backward");
                      setMore(false);
                    })}
                  />
                  <Row
                    icon={SendToBack}
                    label="Send to back"
                    onClick={act(() => {
                      onMoveLayer?.("back");
                      setMore(false);
                    })}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Btn({ children, onClick, title, active, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition cursor-pointer ${
        active
          ? "bg-blue-50 text-blue-600"
          : danger
            ? "text-gray-500 hover:bg-red-50 hover:text-red-600"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}

function Row({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-gray-600 transition hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </button>
  );
}
