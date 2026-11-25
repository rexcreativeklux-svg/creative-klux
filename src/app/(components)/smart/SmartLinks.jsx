"use client";

// SmartLinks list — the prototype's pageLinks: totals, search / filter / sort,
// link cards with a mini phone, the 14-day chart and visitor sources.
// Everything comes from /api/smart-links.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Globe, Link2, MoreHorizontal, Pencil, Plus, QrCode, Search, Smartphone, Trash2 } from "lucide-react";
import KluxLoader from "@/app/(components)/KluxLoader";
import { useAuth } from "@/context/AuthContext";
import {
  deleteLink,
  duplicateLink,
  fetchLinks,
  fetchLinksSummary,
  publishLink,
  restoreLink,
  unpublishLink,
} from "@/(lib)/smartLinksApi";
import { Confirm, Kpi, Menu, agoLong, amount, fmtNum, notifySmartChanged } from "./shared";
import { shortUrl } from "./linkBlocks";
import { MiniPhone } from "./PhonePreview";
import { NewLinkModal, PreviewModal, QrModal, Sources, VisitsChart, copyText } from "./LinkParts";
import "@/app/(components)/home/homeDashboard.css";
import "./smart.css";

const SORTS = [["new", "Newest first"], ["visits", "Most visits"], ["customers", "Most customers"], ["az", "Name A–Z"]];

export default function SmartLinks() {
  const router = useRouter();
  const { activeBrandId, activeBrand } = useAuth();
  const brand = { brandId: activeBrandId };
  const [data, setData] = useState({ loading: true, links: [], counts: {} });
  const [summary, setSummary] = useState(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");
  const [modal, setModal] = useState(null); // {type, link}

  const load = useCallback(async () => {
    try {
      const res = await fetchLinks({ sort, ...(filter !== "all" ? { status: filter } : {}), ...(q.trim() ? { q: q.trim() } : {}) }, brand);
      setData({ loading: false, links: res.links || [], counts: res.counts || {} });
    } catch (err) {
      setData((d) => ({ ...d, loading: false, error: err.message }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrandId, sort, filter, q]);

  useEffect(() => {
    if (!activeBrandId) return;
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [activeBrandId, load, q]);

  const loadSummary = useCallback(() => {
    fetchLinksSummary(brand).then(setSummary).catch((e) => setSummary({ error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrandId]);
  useEffect(() => {
    if (activeBrandId) loadSummary();
  }, [activeBrandId, loadSummary]);

  const changed = () => {
    load();
    loadSummary();
    notifySmartChanged();
  };

  const toggleLive = async (l) => {
    try {
      if (l.status === "live") await unpublishLink(l.id, brand);
      else await publishLink(l.id, brand);
      toast.success(l.status === "live" ? `${l.title} is unpublished` : `${l.title} is live`);
      changed();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const dup = async (l) => {
    try {
      const res = await duplicateLink(l.id, brand);
      notifySmartChanged();
      toast.success(`Duplicated as "${res.link.title}"`);
      router.push(`/smart-links/${res.link.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const remove = async (l) => {
    setModal((m) => ({ ...m, busy: true }));
    try {
      await deleteLink(l.id, brand);
      setModal(null);
      changed();
      toast(`Deleted "${l.title}"`, {
        action: {
          label: "Undo",
          onClick: () =>
            restoreLink(l.id, brand)
              .then((r) => {
                changed();
                toast.success(r?.link?.slug && r.link.slug !== l.slug ? `SmartLink restored at ${shortUrl(r.link)}` : "SmartLink restored");
              })
              .catch((e) => toast.error(e.message)),
        },
      });
    } catch (err) {
      toast.error(err.message);
      setModal((m) => ({ ...m, busy: false }));
    }
  };

  const s = summary && !summary.error ? summary : null;
  const kpis = [
    { label: "Visits", value: s ? fmtNum(s.visits) : "", glyph: "◉", color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb", series: s?.daily?.map((d) => d.visits) },
    { label: "Clicks", value: s ? fmtNum(s.clicks) : "", glyph: "↗", color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb", series: s?.daily?.map((d) => d.clicks) },
    { label: "Click rate", value: s?.click_rate == null ? "–" : `${s.click_rate}%`, glyph: "%", color: "#7c3aed", tint: "#f4effe", ring: "#e2d6fb" },
    { label: "Customers", value: s ? fmtNum(s.customers) : "", glyph: "★", color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc" },
    { label: "Customer value", value: s ? amount(s.value) : "", glyph: "÷", color: "#c2410c", tint: "#fff5eb", ring: "#fde2c4" },
  ].map((k) => ({ ...k, loading: !summary }));

  const noneAtAll = !data.loading && !data.error && (data.counts.all ?? 0) === 0;

  return (
    <div className="ck-home">
      <div className="page-head">
        <div className="grow">
          <h1 className="h1">SmartLinks</h1>
          <p className="sub">One link for every bio, flyer and QR code. It sends people to book, buy or message you, and shows which button brings customers.</p>
        </div>
        {!noneAtAll && (
          <div className="row wrap"><button className="btn btn-primary" onClick={() => setModal({ type: "new" })}><Plus size={14} />New SmartLink</button></div>
        )}
      </div>

      {data.loading ? (
        <KluxLoader label="Fetching your SmartLinks" />
      ) : data.error ? (
        <div className="card empty-state"><span className="err">{data.error}</span><button className="btn btn-sm" onClick={load}>Try again</button></div>
      ) : noneAtAll ? (
        <div className="card empty-state" style={{ padding: "72px 20px" }}>
          <span className="big-ic"><Smartphone size={26} /></span>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Create your first SmartLink</h2>
          <p className="muted" style={{ maxWidth: 420, lineHeight: 1.55 }}>
            Put it in your Instagram and TikTok bio, print it on flyers as a QR code, and see which button brings you customers.
          </p>
          <button className="btn btn-primary" onClick={() => setModal({ type: "new" })}><Plus size={14} />New SmartLink</button>
        </div>
      ) : (
        <>
          <section className="grid-auto">{kpis.map((k) => <Kpi key={k.label} k={k} />)}</section>
          <div className="toolbar">
            <label className="search-sm">
              <Search size={14} />
              <input type="search" placeholder="Search SmartLinks" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search SmartLinks" />
            </label>
            <div className="seg">
              {[["all", "All"], ["live", "Live"], ["draft", "Draft"]].map(([k, n]) => (
                <button key={k} className={filter === k ? "on" : ""} onClick={() => setFilter(k)}>
                  {n}<span className="n">{data.counts[k] ?? 0}</span>
                </button>
              ))}
            </div>
            <span className="grow" />
            <label className="row muted">
              Sort
              <select className="select" style={{ width: "auto", padding: "6px 8px" }} value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORTS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
              </select>
            </label>
          </div>

          <div className="link-grid">
            <button className="card link-card link-new" onClick={() => setModal({ type: "new" })}>
              <span className="big-ic" style={{ width: 52, height: 52, borderRadius: 14, background: "var(--brand-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={24} />
              </span>
              <strong style={{ fontSize: 14 }}>New SmartLink</strong>
              <span className="muted" style={{ maxWidth: 200 }}>Start from a template or a blank page</span>
            </button>
            {!data.links.length ? (
              <div className="card empty-state" style={{ gridColumn: "span 2" }}>
                <span className="big-ic"><Search size={24} /></span>
                <strong>No SmartLinks match</strong>
                <span className="muted">Try another word or clear the filter.</span>
                <button className="btn" onClick={() => { setFilter("all"); setQ(""); }}>Clear filters</button>
              </div>
            ) : (
              data.links.map((l) => (
                <article key={l.id} className="card link-card">
                  <div className="link-thumb" onClick={() => router.push(`/smart-links/${l.id}`)} title={`Edit ${l.title}`}>
                    <MiniPhone link={l} />
                  </div>
                  <div className="link-body">
                    <div className="row between">
                      <Link href={`/smart-links/${l.id}`} className="ellipsis" style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{l.title}</Link>
                      <div className="row" style={{ gap: 6 }}>
                        <span className={`pill ${l.status === "live" ? "pill-green" : ""}`}>
                          {l.status === "live" ? <><span className="d" />Live</> : "Draft"}
                        </span>
                        <Menu button={({ toggle }) => <button className="icon-btn" onClick={toggle} aria-label={`More actions for ${l.title}`}><MoreHorizontal size={16} /></button>}>
                          <button onClick={() => router.push(`/smart-links/${l.id}`)}><Pencil size={14} />Edit</button>
                          <button onClick={() => setModal({ type: "preview", link: l })}><Eye size={14} />Preview</button>
                          <button onClick={() => copyText(l.url, `Copied ${shortUrl(l)}`)}><Copy size={14} />Copy link</button>
                          <button onClick={() => setModal({ type: "qr", link: l })}><QrCode size={14} />QR code</button>
                          <button onClick={() => dup(l)}><Copy size={14} />Duplicate</button>
                          <button onClick={() => toggleLive(l)}>{l.status === "live" ? <EyeOff size={14} /> : <Globe size={14} />}{l.status === "live" ? "Unpublish" : "Publish"}</button>
                          <div className="menu-sep" />
                          <button className="danger" onClick={() => setModal({ type: "delete", link: l })}><Trash2 size={14} />Delete</button>
                        </Menu>
                      </div>
                    </div>
                    <button className="row link-btn" style={{ fontWeight: 500 }} title="Copy link" onClick={() => copyText(l.url, `Copied ${shortUrl(l)}`)}>
                      <Link2 size={13} /><span className="ellipsis">{shortUrl(l)}</span>
                    </button>
                    <div className="link-stats">
                      <div><span className="tiny">Visits</span><b>{fmtNum(l.visits)}</b></div>
                      <div><span className="tiny">Clicks</span><b>{fmtNum(l.clicks)}</b></div>
                      <div><span className="tiny">Customers</span><b style={{ color: "var(--green)" }}>{fmtNum(l.customers)}</b></div>
                    </div>
                    <div className="row between">
                      <span className="tiny">Edited {agoLong(l.updated_at)}</span>
                      <Link className="btn btn-sm" href={`/smart-links/${l.id}`}><Pencil size={13} />Edit</Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="flex-row">
            <section className="card card-pad stack" style={{ flex: "2 1 440px", minWidth: 0 }}>
              <div className="card-head">
                <div className="grow"><h2 className="h2">Visits and clicks, all SmartLinks</h2><p className="sub">Last 14 days</p></div>
                <span className="legend-i"><i style={{ background: "var(--brand-ring)", height: 10, width: 10, borderRadius: 3 }} />Visits</span>
                <span className="legend-i"><i style={{ background: "var(--brand)", height: 10, width: 10, borderRadius: 3 }} />Clicks</span>
              </div>
              {s ? <VisitsChart daily={s.daily} /> : <KluxLoader label="Counting visits" />}
            </section>
            <section className="card card-pad stack" style={{ flex: "1 1 300px" }}>
              <div><h2 className="h2">Where visitors come from</h2><p className="sub">{s ? `${fmtNum(s.visits)} visits in the last 14 days` : "All SmartLinks"}</p></div>
              {s && <Sources sources={s.sources} />}
            </section>
          </div>
        </>
      )}

      {modal?.type === "new" && <NewLinkModal brandId={activeBrandId} brandName={activeBrand?.name} onClose={() => setModal(null)} />}
      {modal?.type === "qr" && <QrModal link={modal.link} onClose={() => setModal(null)} />}
      {modal?.type === "preview" && <PreviewModal link={modal.link} onClose={() => setModal(null)} />}
      {modal?.type === "delete" && (
        <Confirm
          title={`Delete "${modal.link.title}"?`}
          body={`${shortUrl(modal.link)} will stop working${modal.link.status === "live" ? " for everyone who has it, including QR codes you printed" : ""}. You can undo this straight after.`}
          ok="Delete SmartLink"
          busy={modal.busy}
          onOk={() => remove(modal.link)}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
