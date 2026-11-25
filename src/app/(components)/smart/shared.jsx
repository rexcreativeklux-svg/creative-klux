"use client";

// Shared pieces for Smart Inbox and SmartLinks: networks, time helpers, avatars,
// dropdown menus, modal windows and the number cards. Ported from the
// creativeklux-app.html prototype; styles in smart.css / homeDashboard.css.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Network key (the API's platform names) → label, colour, glyph. */
export const CH = {
  instagram: { name: "Instagram", color: "#c13584", g: "in" },
  facebook: { name: "Facebook", color: "#1877f2", g: "f" },
  tiktok: { name: "TikTok", color: "#e5274f", g: "t" },
  linkedin: { name: "LinkedIn", color: "#0a66c2", g: "li" },
  whatsapp: { name: "WhatsApp", color: "#25d366", g: "w" },
  x: { name: "X", color: "#0d0f14", g: "X" },
  youtube: { name: "YouTube", color: "#e62117", g: "▶" },
};
export const ch = (p) => CH[p] || { name: p || "Other", color: "#6b7080", g: (p || "?").slice(0, 1).toUpperCase() };

/** Inbox filter chips — the five networks the inbox takes messages from. */
export const INBOX_CHANNELS = ["instagram", "facebook", "tiktok", "linkedin", "whatsapp"];

export const STAGES = ["New", "Interested", "Hot customer", "Customer", "Not a customer"];

const ts = (v) => (v ? new Date(v).getTime() : 0);
export const ago = (v) => {
  const d = Date.now() - ts(v);
  if (d < MIN) return "Just now";
  if (d < HOUR) return Math.floor(d / MIN) + "m";
  if (d < DAY) return Math.floor(d / HOUR) + "h";
  return Math.floor(d / DAY) + "d";
};
export const agoLong = (v) => {
  const d = Date.now() - ts(v);
  if (d < MIN) return "just now";
  if (d < HOUR) return Math.floor(d / MIN) + " min ago";
  if (d < DAY) return Math.floor(d / HOUR) + " h ago";
  const n = Math.floor(d / DAY);
  return n + (n === 1 ? " day ago" : " days ago");
};
export const clock = (v) => new Date(v).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
export const fmtNum = (n) =>
  n === null || n === undefined
    ? "–"
    : n >= 10000
      ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
      : n >= 1000
        ? n.toLocaleString("en-US")
        : String(Math.round(n));
/** An amount exactly as the backend sent it — it sends no currency, so none is added. */
export const amount = (n) =>
  n === null || n === undefined || n === "" || Number.isNaN(Number(n)) ? "–" : Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 });
export const duration = (sec) => {
  if (sec === null || sec === undefined) return "–";
  if (sec < 60) return `${Math.round(sec)} sec`;
  if (sec < 3600) return `${Math.round(sec / 60)} min`;
  return `${(sec / 3600).toFixed(1).replace(/\.0$/, "")} h`;
};
export const hexA = (hex, a) => {
  const h = String(hex || "#000000").replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16) || 0;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v);

const TINTS = [
  ["#fde3cf", "#8a4b00"], ["#dbe4ff", "#1447e6"], ["#e6f6ee", "#0a7a48"],
  ["#f1e8fe", "#6d28d9"], ["#e0f2fe", "#075985"], ["#fde8ec", "#a3123a"],
  ["#fff1d6", "#8a5a00"], ["#e7eef6", "#334e68"],
];
/** A steady colour per person, from their id. */
export const tintFor = (id) => {
  const s = String(id ?? "");
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TINTS[h % TINTS.length];
};

export function Avatar({ person, size = "", style }) {
  const [bg, fg] = tintFor(person?.id ?? person?.name);
  if (person?.avatar_url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={person.avatar_url} alt="" className={`avatar ${size}`} style={style} />;
  return (
    <span className={`avatar ${size}`} style={{ background: bg, color: fg, ...style }}>
      {person?.initials || (person?.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function NetBadge({ platform, style }) {
  const c = ch(platform);
  return (
    <span className="pf" style={{ background: c.color, ...style }} title={c.name}>
      {c.g}
    </span>
  );
}

/** A dropdown that closes on outside click and Escape. `button` gets {open, toggle}. */
export function Menu({ button, children, align = "right", up = false, style, className = "" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="menu-wrap" ref={ref}>
      {button({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={`menu ${align === "right" ? "menu-right" : ""} ${up ? "menu-up" : ""} ${className}`}
          role="menu"
          style={style}
          onClick={(e) => {
            // Any item closes the menu; inputs inside it don't.
            if (e.target.closest("button,a")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/** A modal window. Closes on the backdrop and Escape unless `locked`. */
export function Modal({ title, sub, head, onClose, wide, children, foot, locked = false }) {
  useEffect(() => {
    if (locked) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, locked]);
  return (
    <div
      className="modal-root"
      onMouseDown={(e) => {
        if (!locked && e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`modal ${wide ? "wide" : ""}`} role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
        <div className="modal-head">
          <div className="grow">
            {head}
            <h2 style={head ? { marginTop: 6 } : undefined}>{title}</h2>
            {sub && <p className="sub">{sub}</p>}
          </div>
          {!locked && (
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          )}
        </div>
        {children && <div className="modal-body">{children}</div>}
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

/** "Are you sure?" window. */
export function Confirm({ title, body, ok = "Delete", danger = true, busy, onOk, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      foot={
        <>
          <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onOk} disabled={busy}>
            {busy ? "Working…" : ok}
          </button>
        </>
      }
    >
      <p className="muted" style={{ fontSize: 13, lineHeight: 1.55 }}>{body}</p>
    </Modal>
  );
}

/** Number card, same as the prototype's. `delta` and `series` only when the backend sends them. */
export function Kpi({ k }) {
  return (
    <div className="card kpi">
      <div className="kpi-top">
        <span className="ic ic-sm" style={{ background: k.tint, borderColor: k.ring, color: k.color }}>
          {k.glyph}
        </span>
        {k.series?.some((v) => v > 0) && <Spark values={k.series} color={k.color} />}
      </div>
      <span className="kpi-label">{k.label}</span>
      {k.loading ? (
        <span className="kpi-skel" aria-label="Loading" />
      ) : (
        <div className="kpi-val">
          <span className="kpi-num">{k.value}</span>
          {k.delta && <span className={k.bad ? "down" : "up"}>{k.delta}</span>}
        </div>
      )}
    </div>
  );
}

function Spark({ values, color }) {
  const max = Math.max(...values) || 1;
  const d = values
    .map((v, i) => `${i ? "L" : "M"}${((i * 56) / Math.max(1, values.length - 1)).toFixed(1)} ${(18 - (v / max) * 16).toFixed(1)}`)
    .join(" ");
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/** Let other parts of the app (the sidebar counts) know inbox or links changed. */
export const notifySmartChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("ck-smart-changed"));
};
