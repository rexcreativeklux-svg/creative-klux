"use client";

import React from "react";
import {
  Type,
  Square,
  Circle,
  Triangle,
  ImageIcon,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/** Human label + icon for a layer row. */
function meta(el) {
  if (el.type === "text") {
    const t = (el.content || el.text || "Text").toString().trim();
    return { icon: Type, label: t.slice(0, 22) || "Text" };
  }
  if (el.type === "image") return { icon: ImageIcon, label: "Image" };
  if (el.type === "shape") {
    if (el.shape === "circle") return { icon: Circle, label: "Circle" };
    if (el.shape === "triangle") return { icon: Triangle, label: "Triangle" };
    return { icon: Square, label: "Shape" };
  }
  return { icon: Square, label: "Layer" };
}

export default function LayersPanel({ editor }) {
  const {
    elements,
    selectedId,
    selectElement,
    updateElement,
    duplicateElement,
    removeElement,
    moveLayer,
  } = editor;

  // Front-most first (last in array renders on top).
  const rows = [...elements].reverse();

  if (!elements.length) {
    return (
      <div className="p-6 text-center text-xs text-gray-400">
        No layers yet. Add text, shapes or images to get started.
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-col gap-1">
      {rows.map((el) => {
        const { icon: Icon, label } = meta(el);
        const on = el.id === selectedId;
        return (
          <div
            key={el.id}
            onClick={() => selectElement(el.id)}
            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition border ${
              on
                ? "bg-blue-50 border-blue-200"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${on ? "text-blue-600" : "text-gray-400"}`} />
            <span
              className={`flex-1 text-xs truncate ${
                el.hidden ? "text-gray-300 line-through" : "text-gray-700"
              }`}
            >
              {label}
            </span>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition">
              <Mini
                title={el.hidden ? "Show" : "Hide"}
                onClick={(e) => {
                  e.stopPropagation();
                  updateElement(el.id, { hidden: !el.hidden }, { record: true });
                }}
              >
                {el.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </Mini>
              <Mini
                title="Bring forward"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(el.id, "forward");
                }}
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </Mini>
              <Mini
                title="Send backward"
                onClick={(e) => {
                  e.stopPropagation();
                  moveLayer(el.id, "backward");
                }}
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </Mini>
              <Mini
                title="Duplicate"
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateElement(el.id);
                }}
              >
                <Copy className="w-3.5 h-3.5" />
              </Mini>
              <Mini
                title="Delete"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(el.id);
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Mini>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Mini({ children, onClick, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-6 h-6 flex items-center justify-center rounded-md transition cursor-pointer text-gray-400 ${
        danger ? "hover:bg-red-50 hover:text-red-600" : "hover:bg-gray-200 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}
