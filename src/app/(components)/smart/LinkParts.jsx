"use client";

// SmartLinks pieces shared by the list and the editor: the New SmartLink
// window, QR code, preview, the 14-day visits chart and "where visitors come
// from". Ported from the prototype; every number comes from the API.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Copy, Download, ExternalLink } from "lucide-react";
import QRCode from "qrcode";
import { checkSlug, createLink } from "@/(lib)/smartLinksApi";
import { Modal, ch, fmtNum, notifySmartChanged } from "./shared";
import { TEMPLATES, shortUrl, slugError, slugify } from "./linkBlocks";
import { PhonePreview } from "./PhonePreview";

/**
 * The public address minus the link's own part, e.g. "api.creativeklux.com/api/sl/"
 * — read from an address the backend sent, so it follows SMARTLINK_PUBLIC_BASE
 * (and becomes "creativeklux.link/" when the backend switches to it).
 */
export function prefixFrom(url, slug) {
  const s = String(url || "").replace(/^https?:\/\//, "");
  if (!s) return "";
  return slug && s.endsWith(slug) ? s.slice(0, -slug.length) : s.replace(/[^/]*$/, "");
}

/**
 * The prefix to show in front of an address box. Uses `knownUrl` (+ its slug)
 * when there is one; otherwise asks the backend's address check, which answers
 * with the full public url for a sample address.
 */
export function usePublicPrefix({ brandId, knownUrl, knownSlug } = {}) {
  const known = knownUrl ? prefixFrom(knownUrl, knownSlug) : "";
  const [asked, setAsked] = useState("");
  useEffect(() => {
    if (known || !brandId) return;
    let alive = true;
    const sample = "your-name";
    checkSlug(sample, undefined, { brandId })
      .then((r) => alive && setAsked(prefixFrom(r.url, r.slug || sample)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [known, brandId]);
  return known || asked;
}

export const copyText = (text, msg = "Copied") => {
  const done = () => toast.success(msg);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => toast.error("Couldn't copy"));
  else done();
};

/** Debounced server check of an address: { state: "idle"|"checking"|"ok"|"bad", msg }. */
export function useSlugCheck(slug, { ignore, brandId, enabled = true } = {}) {
  const [res, setRes] = useState({ state: "idle", msg: "" });
  useEffect(() => {
    if (!enabled) return;
    const local = slug ? slugError(slug) : "";
    if (!slug || local) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- local rules answer at once
      setRes(slug ? { state: "bad", msg: local } : { state: "idle", msg: "" });
      return;
    }
    setRes({ state: "checking", msg: "Checking…" });
    let alive = true;
    const t = setTimeout(() => {
      checkSlug(slug, ignore, { brandId })
        .then(
          (r) =>
            alive &&
            setRes(
              r.available
                ? { state: "ok", msg: `${String(r.url || slug).replace(/^https?:\/\//, "")} is free`, url: r.url }
                : { state: "bad", msg: r.error || "Another SmartLink already uses this address." },
            ),
        )
        .catch((e) => alive && setRes({ state: "bad", msg: e.message }));
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [slug, ignore, brandId, enabled]);
  return res;
}

export function NewLinkModal({ brandId, brandName, sampleLink, onClose }) {
  const prefix = usePublicPrefix({ brandId, knownUrl: sampleLink?.url, knownSlug: sampleLink?.slug });
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tpl, setTpl] = useState("bookings");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const check = useSlugCheck(slug, { brandId, enabled: step === 2 });

  const create = async () => {
    if (!name.trim()) return toast.error("Give it a name");
    if (check.state !== "ok") return toast.error(check.msg || "Pick a free link address");
    setBusy(true);
    try {
      const res = await createLink({ title: name.trim(), slug, template: tpl }, { brandId });
      notifySmartChanged();
      toast.success("SmartLink created as a draft");
      router.push(`/smart-links/${res.link.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  if (step === 1)
    return (
      <Modal
        wide
        head={<div className="steps"><b>1 Start</b><i /><span>2 Name it</span></div>}
        title="New SmartLink"
        sub="Pick a starting point. You can change everything after."
        onClose={onClose}
        foot={
          <>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continue <ChevronRight size={14} /></button>
          </>
        }
      >
        <div className="tpl-grid">
          {Object.entries(TEMPLATES).map(([k, t]) => (
            <button key={k} className={`tpl ${tpl === k ? "on" : ""}`} onClick={() => setTpl(k)}>
              <span className="ic" style={{ background: t.tint, color: t.color, borderColor: "transparent", fontWeight: 700 }}>{t.g}</span>
              <strong style={{ fontSize: 13 }}>{t.name}</strong>
              <span className="tiny">{t.desc}</span>
            </button>
          ))}
        </div>
      </Modal>
    );

  return (
    <Modal
      head={<div className="steps"><span>1 Start</span><i /><b>2 Name it</b></div>}
      title="Name your SmartLink"
      sub={`Template: ${TEMPLATES[tpl].name}`}
      onClose={onClose}
      foot={
        <>
          <button className="btn" onClick={() => setStep(1)}><ChevronLeft size={14} />Back</button>
          <span className="grow" />
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create SmartLink"}</button>
        </>
      }
    >
      <label className="field">
        <span>Name <span className="hint">Only you see this</span></span>
        <input
          className="input"
          value={name}
          placeholder="For example: Instagram bio"
          autoFocus
          onChange={(e) => {
            setName(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
      </label>
      <label className="field">
        Link address
        <span className={`prefix ${check.state === "bad" ? "bad" : ""}`}>
          {prefix && <span>{prefix}</span>}
          <input
            value={slug}
            placeholder="your-name"
            onChange={(e) => {
              setTouched(true);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
            }}
            onKeyDown={(e) => e.key === "Enter" && create()}
          />
        </span>
        <span className={check.state === "bad" ? "err" : check.state === "ok" ? "ok" : "hint"}>{check.msg}</span>
      </label>
      <label className="field">
        Brand kit
        <select className="select" disabled value="active"><option value="active">{brandName || "Your active brand"}</option></select>
        <span className="hint">Colours, logo and name come from your active brand. Switch brands from the brand menu at the top.</span>
      </label>
    </Modal>
  );
}

export function QrModal({ link, onClose }) {
  const [src, setSrc] = useState("");
  // ?src=qr so scans are counted as "Flyer QR code" visits (see the API doc).
  const target = `${link.url}?src=qr`;
  useEffect(() => {
    QRCode.toDataURL(target, { width: 640, margin: 1, color: { dark: "#0d0f14", light: "#ffffff" } })
      .then(setSrc)
      .catch(() => toast.error("Couldn't draw the QR code"));
  }, [target]);
  return (
    <Modal
      title="QR code"
      sub={shortUrl(link)}
      onClose={onClose}
      foot={
        <>
          <button className="btn" onClick={() => copyText(link.url, `Copied ${shortUrl(link)}`)}><Copy size={14} />Copy link</button>
          <a className="btn btn-primary" href={src || undefined} download={`smartlink-${link.slug}-qr.png`} aria-disabled={!src}>
            <Download size={14} />Download PNG
          </a>
        </>
      }
    >
      <div style={{ alignSelf: "center", padding: 16, background: "#fff", borderRadius: 16, border: "1px solid var(--line)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {src ? <img src={src} alt={`QR code for ${shortUrl(link)}`} width={220} height={220} /> : <div style={{ width: 220, height: 220 }} />}
      </div>
      <p className="muted" style={{ textAlign: "center" }}>
        Print it on flyers, menus and packaging. Scans are counted as &quot;Flyer QR code&quot; visits.
        {link.status !== "live" && " This SmartLink is a draft, so the code shows “page isn't available” until you publish it."}
      </p>
    </Modal>
  );
}

export function PreviewModal({ link, onClose }) {
  return (
    <Modal
      title={link.title}
      sub={`${shortUrl(link)} · ${link.status === "live" ? "Live" : "Draft preview"}`}
      onClose={onClose}
      foot={
        link.status === "live" ? (
          <a className="btn" href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={14} />Open live page</a>
        ) : null
      }
    >
      <div style={{ alignSelf: "center" }}><PhonePreview link={link} /></div>
    </Modal>
  );
}

/** 14 days of visits (wide, light) and clicks (narrow, dark) from `daily`. */
export function VisitsChart({ daily = [] }) {
  const max = Math.max(10, ...daily.map((d) => d.visits || 0)) * 1.1;
  const label = (d) => new Date(d.date + "T00:00:00").getDate();
  return (
    <>
      <div className="vbars">
        {daily.map((d) => (
          <div key={d.date} title={`${new Date(d.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${d.visits || 0} visits, ${d.clicks || 0} clicks`}>
            <span className="v" style={{ height: `${(((d.visits || 0) / max) * 100).toFixed(1)}%` }} />
            <span className="c" style={{ height: `${(((d.clicks || 0) / max) * 100).toFixed(1)}%` }} />
          </div>
        ))}
      </div>
      <div className="vlabels">{daily.map((d) => <span key={d.date}>{label(d)}</span>)}</div>
    </>
  );
}

const SOURCE_NAMES = {
  instagram: "Instagram bio", tiktok: "TikTok bio", facebook: "Facebook", qr: "Flyer QR code", linkedin: "LinkedIn",
  x: "X", youtube: "YouTube", whatsapp: "WhatsApp", email: "Email", direct: "Direct", other: "Other",
};
const SOURCE_STYLE = { qr: ["#0d0f14", "QR"], direct: ["#9aa0ad", "↗"], other: ["#9aa0ad", "•"], email: ["#4a4f5c", "@"] };

/** Where visitors come from, as the API sends it. */
export function Sources({ sources = [] }) {
  const rows = sources.map((s) => {
    const key = String(s.source ?? s.key ?? s.name ?? s.label ?? "other").toLowerCase();
    const count = Number(s.visits ?? s.count ?? s.value ?? 0);
    return { key, name: s.label || SOURCE_NAMES[key] || key, count, pct: s.pct ?? s.percent };
  });
  const total = rows.reduce((a, r) => a + r.count, 0);
  if (!rows.length) return <p className="muted">No visits yet. Share the link with <code>?src=instagram</code> (or tiktok, qr…) to see where people come from.</p>;
  return rows.map((r) => {
    const pct = r.pct != null ? Number(r.pct) : total ? Math.round((r.count / total) * 100) : 0;
    const [color, g] = SOURCE_STYLE[r.key] || [ch(r.key).color, ch(r.key).g];
    return (
      <div key={r.key} className="row" style={{ gap: 10 }}>
        <span className="pf" style={{ background: color }}>{g}</span>
        <span className="grow" style={{ fontSize: 12 }}>{r.name}</span>
        <div className="bar" style={{ width: 90 }}><i style={{ width: `${pct}%`, background: color }} /></div>
        <span style={{ fontSize: 12, fontWeight: 600, width: 64, textAlign: "right" }}>{fmtNum(r.count)} · {pct}%</span>
      </div>
    );
  });
}
