"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

/**
 * Searchable country dropdown. Click to open, type to filter, arrows + Enter
 * or click to pick. The list is short (max-h-56) and scrolls.
 */
export default function CountrySelect({ id, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value) || options[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || (o.value && o.value.toLowerCase() === q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  useEffect(() => {
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (o) => {
    onChange(o.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open) {
        e.preventDefault();
        if (filtered[active]) pick(filtered[active]);
      }
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={rootRef} className="relative w-full sm:w-52">
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        autoComplete="off"
        value={open ? query : selected.label}
        placeholder={open ? "Search country..." : undefined}
        onFocus={() => {
          setOpen(true);
          setActive(0);
        }}
        onClick={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-xl border border-gray-200 bg-surface pl-3.5 pr-9 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

      {open && (
        <ul
          id={`${id}-list`}
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-surface py-1 shadow-lg"
        >
          {filtered.length === 0 && (
            <li className="px-3.5 py-2 text-sm text-gray-400">No countries found</li>
          )}
          {filtered.map((o, i) => (
            <li
              key={o.value || "all"}
              role="option"
              aria-selected={o.value === value}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between px-3.5 py-1.5 text-sm text-gray-800 ${
                i === active ? "bg-blue-50 dark:bg-white/10" : ""
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
