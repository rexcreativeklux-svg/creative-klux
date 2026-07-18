"use client";

import React, { useState } from "react";
import { ChevronDown, Wand2, Check } from "lucide-react";
import { STYLES, ASPECTS } from "./constants";

/**
 * GenerateControls — the Styles picker and the aspect-ratio picker sitting side
 * by side, matching Canva's "Styles" + "Square" row. Each is a lightweight
 * dropdown that closes on outside click.
 */
export default function GenerateControls({
  style,
  setStyle,
  aspect,
  setAspect,
  showStyle = true,
  showAspect = true,
}) {
  const [open, setOpen] = useState(null); // 'style' | 'aspect' | null
  const toggle = (name) => setOpen((o) => (o === name ? null : name));
  const close = () => setOpen(null);

  const AspectIcon = aspect.icon;

  return (
    <div className="relative flex items-center gap-2">
      {/* Styles */}
      {showStyle && (
        <PickerButton
          label={style.id === "none" ? "Styles" : style.label}
          onClick={() => toggle("style")}
          active={open === "style"}
          icon={Wand2}
        />
      )}
      {/* Aspect — images only; graphics have no fixed ratio */}
      {showAspect && (
        <PickerButton
          label={aspect.ratio}
          onClick={() => toggle("aspect")}
          active={open === "aspect"}
          icon={AspectIcon}
        />
      )}

      {open && <Backdrop onClick={close} />}

      {open === "style" && (
        <Dropdown>
          <div className="grid grid-cols-2 gap-1">
            {STYLES.map((s) => (
              <Option
                key={s.id}
                label={s.label}
                selected={s.id === style.id}
                onClick={() => {
                  setStyle(s);
                  close();
                }}
              />
            ))}
          </div>
        </Dropdown>
      )}

      {open === "aspect" && (
        <Dropdown>
          <div className="flex flex-col gap-0.5">
            {ASPECTS.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setAspect(a);
                    close();
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition cursor-pointer ${
                    a.id === aspect.id
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-left">{a.label}</span>
                  <span className="text-xs text-gray-400 tabular-nums">
                    {a.ratio}
                  </span>
                </button>
              );
            })}
          </div>
        </Dropdown>
      )}
    </div>
  );
}

function PickerButton({ label, onClick, active, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition cursor-pointer ${
        active
          ? "border-blue-400 text-blue-600 bg-blue-50"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      <ChevronDown className="w-3.5 h-3.5" />
    </button>
  );
}

function Dropdown({ children }) {
  return (
    <div className="absolute top-full left-0 z-50 mt-1.5 w-56 rounded-xl border border-gray-100 bg-surface p-2 shadow-2xl">
      {children}
    </div>
  );
}

function Option({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition cursor-pointer ${
        selected ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span className="truncate">{label}</span>
      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}

/** Invisible full-viewport catcher so a click anywhere closes the dropdown. */
function Backdrop({ onClick }) {
  return <div className="fixed inset-0 z-40" onClick={onClick} />;
}
