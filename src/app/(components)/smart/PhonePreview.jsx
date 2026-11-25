"use client";

// The SmartLink phone preview (prototype's phoneHTML) and the small phone on
// list cards (miniPhone). Drawn from the link's own design and blocks.

import { Play } from "lucide-react";
import { CH, amount, hexA } from "./shared";
import { SOCIAL_KEYS } from "./linkBlocks";

const radiusOf = (shape) => (shape === "pill" ? "999px" : shape === "square" ? "4px" : "12px");
const fontOf = (font) => (font === "Georgia" ? "Georgia, serif" : `${font || "Inter"}, Inter, sans-serif`);

export function PhonePreview({ link, selId, onSelect }) {
  const d = link.design || {};
  const radius = radiusOf(d.shape);
  const sub = hexA(d.fg, 0.72);
  const wrap = (b, inner) => (
    <div
      key={b.id}
      className={`pv-blk ${onSelect && b.id === selId ? "sel" : ""}`}
      onClick={onSelect ? () => onSelect(b.id) : undefined}
    >
      {inner}
    </div>
  );
  const btn = (text, primary) => (
    <span
      className="pv-btn"
      style={{
        borderRadius: radius,
        ...(primary
          ? { background: d.btnBg, color: d.btnFg, borderColor: d.btnBg }
          : { background: hexA(d.fg, 0.08), color: d.fg, borderColor: hexA(d.fg, 0.28) }),
      }}
    >
      {text}
    </span>
  );
  const card = { background: hexA(d.fg, 0.08), border: `1px solid ${hexA(d.fg, 0.18)}` };
  const empty = (label, h) => (
    <div className="pv-img-empty" style={{ height: h, background: hexA(d.fg, 0.1), color: sub }}>{label}</div>
  );

  const blocks = (link.blocks || [])
    .filter((b) => b.on)
    .map((b) => {
      switch (b.type) {
        case "header":
          return wrap(
            b,
            <div className="stack" style={{ alignItems: "center", gap: 6 }}>
              {b.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pv-av" src={b.img} alt="" style={{ borderColor: hexA(d.fg, 0.9) }} />
              ) : (
                <span className="pv-av-empty" style={{ borderColor: hexA(d.fg, 0.9), background: hexA(d.fg, 0.12) }}>
                  {(b.name || "?").slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="pv-name">{b.name}</span>
              <span className="pv-bio" style={{ color: sub }}>{b.bio}</span>
            </div>,
          );
        case "button":
          return wrap(b, btn(b.label, b.style === "primary"));
        case "booking":
          return wrap(
            b,
            <div className="pv-card" style={card}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>{b.service}</span>
              {b.duration && <span style={{ fontSize: 11, color: sub }}>{b.duration}</span>}
              {b.price !== "" && b.price != null && (
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {amount(b.price)}
                  {b.was ? <s style={{ fontSize: 11, fontWeight: 500, color: sub, marginLeft: 6 }}>{amount(b.was)}</s> : null}
                </span>
              )}
              {btn(b.label, true)}
            </div>,
          );
        case "creative":
          return wrap(
            b,
            <div className="stack" style={{ gap: 6 }}>
              {b.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="pv-img" src={b.img} alt={b.caption || ""} />
              ) : (
                empty("Add an image", 140)
              )}
              <span style={{ fontSize: 11, fontWeight: 600 }}>{b.caption}</span>
            </div>,
          );
        case "form":
          return wrap(
            b,
            <div className="pv-card pv-form" style={card}>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{b.title}</span>
              <input placeholder={b.placeholder} tabIndex={-1} aria-hidden="true" readOnly style={{ borderRadius: radius === "999px" ? "999px" : "9px" }} />
              {btn(b.label, true)}
            </div>,
          );
        case "video":
          return wrap(
            b,
            <>
              <div className="pv-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {b.img && <img src={b.img} alt="" />}
                <span className="play"><span><Play size={16} /></span></span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, display: "block", marginTop: 6 }}>{b.title}</span>
            </>,
          );
        case "text":
          return wrap(b, <p style={{ fontSize: 12, lineHeight: 1.55, textAlign: b.align || "center", color: sub, margin: 0 }}>{b.text}</p>);
        case "socials": {
          const s = SOCIAL_KEYS.filter(([k]) => b[k]);
          return s.length
            ? wrap(
                b,
                <div className="pv-soc">
                  {s.map(([k, c]) => (
                    <span key={k} className="pf" style={{ background: CH[c].color }}>{CH[c].g}</span>
                  ))}
                </div>,
              )
            : null;
        }
        default:
          return null;
      }
    });

  return (
    <div className="phone">
      <div className="screen" style={{ background: d.bg, color: d.fg, fontFamily: fontOf(d.font) }}>
        <span className="island" />
        <div className="status" style={{ color: d.fg }}>
          <span>9:41</span>
          <span className="ind">
            <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.5" y="5" width="3" height="6" rx="1" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" /><rect x="13" y="0" width="3" height="11" rx="1" /></svg>
            <svg width="25" height="12" viewBox="0 0 26 12" aria-hidden="true"><rect x=".5" y=".5" width="22" height="11" rx="3.5" fill="none" stroke="currentColor" opacity=".5" /><rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" /><rect x="23.5" y="4" width="2" height="4" rx="1" fill="currentColor" opacity=".5" /></svg>
          </span>
        </div>
        <div className="screen-body">
          {blocks.some(Boolean) ? blocks : <span style={{ margin: "auto", fontSize: 12, color: sub }}>Turn on a block to see it here</span>}
          {link.settings?.badge && <span className="pv-foot" style={{ color: sub }}>Made with Creative Klux</span>}
        </div>
      </div>
    </div>
  );
}

export function MiniPhone({ link }) {
  const d = link.design || {};
  const head = (link.blocks || []).find((b) => b.type === "header" && b.on);
  const btns = (link.blocks || []).filter((b) => b.on && (b.type === "button" || b.type === "booking")).slice(0, 3);
  const r = d.shape === "pill" ? "99px" : d.shape === "square" ? "2px" : "5px";
  return (
    <div className="mini-phone" style={{ background: d.bg }}>
      {head && (
        <>
          {head.img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="av" src={head.img} alt="" />
          ) : (
            <span className="av" style={{ background: hexA(d.fg, 0.3) }} />
          )}
          <span className="ln" style={{ background: d.fg }} />
          <span className="ln" style={{ background: d.fg, width: "40%", opacity: 0.4 }} />
        </>
      )}
      {btns.map((b, i) => (
        <span key={b.id} className="bt" style={{ background: i === 0 ? d.btnBg : hexA(d.fg, 0.14), borderRadius: r }} />
      ))}
    </div>
  );
}
