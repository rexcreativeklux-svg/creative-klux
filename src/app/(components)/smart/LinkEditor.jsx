"use client";

// SmartLink editor — the prototype's pageEditor: Blocks / Design / Settings /
// Analytics tabs, a live phone preview, Save (PUT /smart-links/{id}), Publish,
// Unpublish, Duplicate, Discard changes and Delete with Undo.

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  LayoutGrid,
  Link2,
  MoreHorizontal,
  Palette,
  Plus,
  QrCode,
  Save,
  Trash2,
  Undo2,
  Globe,
  AlertTriangle,
} from "lucide-react";
import KluxLoader from "@/app/(components)/KluxLoader";
import MediaPickerModal from "@/app/(components)/MediaPickerModal";
import { useAuth } from "@/context/AuthContext";
import {
  deleteLink,
  duplicateLink,
  fetchLink,
  fetchLinkAnalytics,
  publishLink,
  restoreLink,
  saveLink,
  unpublishLink,
} from "@/(lib)/smartLinksApi";
import { CH, Confirm, Kpi, Menu, Modal, amount, fmtNum, isHex, notifySmartChanged } from "./shared";
import { BT, LINK_TYPES, SOCIAL_KEYS, THEMES, blockMeta, blockTitle, copyBlock, newBlock, shortUrl, urlHint } from "./linkBlocks";
import { PhonePreview } from "./PhonePreview";
import { PreviewModal, QrModal, Sources, VisitsChart, copyText, useSlugCheck } from "./LinkParts";
import "@/app/(components)/home/homeDashboard.css";
import "./smart.css";

const EDITABLE = ["title", "slug", "design", "settings", "blocks"];
const pickEditable = (l) => (l ? Object.fromEntries(EDITABLE.map((k) => [k, l[k]])) : null);
const PUBLIC_PREFIX = "api.creativeklux.com/api/sl/";

export default function LinkEditor({ id }) {
  const router = useRouter();
  const { activeBrandId, activeBrand } = useAuth();
  const brand = { brandId: activeBrandId };

  const [base, setBase] = useState(null); // last saved, from the server
  const [edit, setEdit] = useState(null); // working copy
  const [error, setError] = useState(null);
  const [selBlock, setSelBlock] = useState(null);
  const [tab, setTab] = useState("blocks");
  const [busy, setBusy] = useState("");
  const [modal, setModal] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overId, setOverId] = useState(null);

  useEffect(() => {
    if (!activeBrandId) return;
    let alive = true;
    fetchLink(id, brand)
      .then((r) => {
        if (!alive) return;
        setBase(r.link);
        setEdit(r.link);
        setSelBlock((r.link.blocks[1] || r.link.blocks[0] || {}).id || null);
      })
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeBrandId]);

  const dirty = useMemo(() => !!edit && JSON.stringify(pickEditable(edit)) !== JSON.stringify(pickEditable(base)), [edit, base]);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const fn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);

  const slugCheck = useSlugCheck(edit?.slug, { ignore: id, brandId: activeBrandId, enabled: !!edit && edit.slug !== base?.slug });
  const slugBad = edit && edit.slug !== base?.slug && slugCheck.state === "bad";

  const upd = (fn) => setEdit((e) => fn(structuredClone(e)));
  const setBlock = (key, value) =>
    upd((e) => {
      const b = e.blocks.find((x) => x.id === selBlock);
      if (b) b[key] = value;
      return e;
    });

  /** Save the working copy; returns the saved link or null. */
  const save = useCallback(
    async ({ quiet = false } = {}) => {
      if (!edit.title.trim()) {
        toast.error("Give your SmartLink a name first.");
        return null;
      }
      if (edit.slug !== base.slug && slugCheck.state !== "ok") {
        setTab("settings");
        toast.error(`Fix the link address first${slugCheck.msg ? `: ${slugCheck.msg}` : ""}`);
        return null;
      }
      setBusy("save");
      try {
        const res = await saveLink(id, pickEditable(edit), brand);
        setBase(res.link);
        setEdit(res.link);
        if (!quiet) toast.success("Saved");
        notifySmartChanged();
        return res.link;
      } catch (err) {
        toast.error(err.message);
        return null;
      } finally {
        setBusy("");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edit, base, slugCheck, id, activeBrandId],
  );

  // Ctrl/⌘+S saves.
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (dirty && !busy) save();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [dirty, busy, save]);

  const publish = async (live) => {
    if (dirty && !(await save({ quiet: true }))) return;
    setBusy("publish");
    try {
      const res = live ? await publishLink(id, brand) : await unpublishLink(id, brand);
      setBase(res.link);
      setEdit(res.link);
      notifySmartChanged();
      toast.success(live ? (base.status === "live" ? "Live page updated" : `Published at ${shortUrl(res.link)}`) : "Unpublished. The link shows “page isn't available” until you publish again.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy("");
    }
  };

  const dup = async () => {
    if (dirty) return toast.error("Save your changes first");
    try {
      const res = await duplicateLink(id, brand);
      notifySmartChanged();
      toast.success(`Duplicated as "${res.link.title}"`);
      router.push(`/smart-links/${res.link.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async () => {
    setBusy("delete");
    try {
      await deleteLink(id, brand);
      notifySmartChanged();
      const title = base.title;
      router.push("/smart-links");
      toast(`Deleted "${title}"`, {
        action: {
          label: "Undo",
          onClick: () =>
            restoreLink(id, brand)
              .then(() => {
                notifySmartChanged();
                router.push(`/smart-links/${id}`);
              })
              .catch((e) => toast.error(e.message)),
        },
      });
    } catch (err) {
      toast.error(err.message);
      setBusy("");
    }
  };

  const leave = () => (dirty ? setModal({ type: "leave" }) : router.push("/smart-links"));

  if (error)
    return (
      <div className="ck-home">
        <div className="card empty-state" style={{ padding: "72px 20px" }}>
          <span className="big-ic"><AlertTriangle size={24} /></span>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{error.status === 404 ? "This SmartLink doesn't exist" : "Couldn't open this SmartLink"}</h2>
          <p className="muted">{error.status === 404 ? "It may have been deleted, or it belongs to another brand." : error.message}</p>
          <button className="btn btn-primary" onClick={() => router.push("/smart-links")}>Back to SmartLinks</button>
        </div>
      </div>
    );
  if (!edit) return <div className="ck-home"><KluxLoader label="Opening your SmartLink" /></div>;

  const l = edit;
  const live = base.status === "live";
  const phoneCol = (
    <section className="card phone-col" aria-label="Live preview">
      <div className="row between" style={{ alignSelf: "stretch" }}>
        <h2 className="h2">Live preview</h2>
        <span className="tiny ellipsis">{shortUrl(l)}</span>
      </div>
      <PhonePreview link={l} selId={tab === "blocks" ? selBlock : null} onSelect={(bid) => { setSelBlock(bid); setTab("blocks"); }} />
    </section>
  );

  return (
    <div className="ck-home">
      <div className="card ed-top">
        <button className="icon-btn" onClick={leave} aria-label="Back to SmartLinks"><ChevronLeft size={16} /></button>
        <input className="title-input" value={l.title} onChange={(e) => upd((x) => ({ ...x, title: e.target.value }))} aria-label="SmartLink name" />
        <span className={`pill ${live ? "pill-green" : ""}`}>{live ? <><span className="d" />Live</> : "Draft"}</span>
        <button className="link-btn row" style={{ fontWeight: 500 }} onClick={() => copyText(base.url, `Copied ${shortUrl(base)}`)}>
          <Link2 size={13} />{shortUrl(base)}
        </button>
        <span className="grow" />
        <span className={`save-state ${dirty ? "dirty" : ""}`}><i />{dirty ? "Unsaved changes" : "All changes saved"}</span>
        <button className="btn" onClick={() => setModal({ type: "preview" })}><Eye size={14} />Preview</button>
        <button className="btn" onClick={() => save()} disabled={!dirty || !!busy}><Save size={14} />{busy === "save" ? "Saving…" : "Save"}</button>
        {live ? (
          <button className="btn btn-primary" onClick={() => publish(true)} disabled={!dirty || !!busy}><Globe size={14} />Update live page</button>
        ) : (
          <button className="btn btn-primary" onClick={() => publish(true)} disabled={!!busy}><Globe size={14} />{busy === "publish" ? "Publishing…" : "Publish"}</button>
        )}
        <Menu button={({ toggle }) => <button className="icon-btn" onClick={toggle} aria-label="More"><MoreHorizontal size={16} /></button>}>
          <button onClick={() => setModal({ type: "qr" })}><QrCode size={14} />QR code</button>
          <button onClick={dup}><Copy size={14} />Duplicate</button>
          {live && <button onClick={() => publish(false)}><EyeOff size={14} />Unpublish</button>}
          <button disabled={!dirty} onClick={() => setModal({ type: "revert" })}><Undo2 size={14} />Discard changes</button>
          <div className="menu-sep" />
          <button className="danger" onClick={() => setModal({ type: "delete" })}><Trash2 size={14} />Delete SmartLink</button>
        </Menu>
      </div>

      <div className="row wrap between">
        <div className="seg" role="tablist" aria-label="Editor">
          {[["blocks", "Blocks", LayoutGrid], ["design", "Design", Palette], ["settings", "Settings", null], ["analytics", "Analytics", BarChart3]].map(([k, n]) => (
            <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{n}</button>
          ))}
        </div>
        <span className="tiny">Tip: press ⌘S / Ctrl+S to save</span>
      </div>

      {tab === "blocks" && (
        <div className="editor">
          <section className="card" aria-label="Blocks">
            <div className="blocks">
              <div className="row between" style={{ padding: "2px 2px 4px" }}>
                <h2 className="h2">Blocks</h2>
                <span className="tiny">{l.blocks.filter((b) => b.on).length} showing · drag to reorder</span>
              </div>
              {l.blocks.map((b) => {
                const t = BT[b.type] || BT.text;
                return (
                  <div
                    key={b.id}
                    className={`blk ${b.id === selBlock ? "on" : ""} ${b.on ? "" : "hidden-blk"} ${overId === b.id && dragId !== b.id ? "drag-over" : ""}`}
                    draggable
                    onDragStart={(e) => { setDragId(b.id); e.dataTransfer.effectAllowed = "move"; }}
                    onDragOver={(e) => { e.preventDefault(); setOverId(b.id); }}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && dragId !== b.id)
                        upd((x) => {
                          const from = x.blocks.findIndex((y) => y.id === dragId);
                          const to = x.blocks.findIndex((y) => y.id === b.id);
                          const [m] = x.blocks.splice(from, 1);
                          x.blocks.splice(to, 0, m);
                          return x;
                        });
                      setSelBlock(dragId);
                      setDragId(null);
                      setOverId(null);
                    }}
                    onClick={(e) => { if (!e.target.closest(".switch")) setSelBlock(b.id); }}
                  >
                    <span className="grip" aria-hidden="true"><GripVertical size={16} /></span>
                    <span className="ic" style={{ background: t.tint, borderColor: t.ring, color: t.color }}>{t.g}</span>
                    <span className="grow stack" style={{ gap: 1 }}>
                      <span className="blk-t ellipsis">{blockTitle(b, CH)}</span>
                      <span className="tiny ellipsis">{blockMeta(b)}</span>
                    </span>
                    <button
                      className="switch"
                      role="switch"
                      aria-checked={!!b.on}
                      aria-label={`${b.on ? "Hide" : "Show"} ${blockTitle(b, CH)}`}
                      onClick={() => upd((x) => { const y = x.blocks.find((z) => z.id === b.id); y.on = !y.on; return x; })}
                    />
                  </div>
                );
              })}
              <Menu
                align="left"
                style={{ right: 0, width: "auto" }}
                button={({ toggle }) => <button className="btn btn-dashed btn-block" style={{ minHeight: 40 }} onClick={toggle}><Plus size={14} />Add block</button>}
              >
                {Object.entries(BT).map(([k, t]) => (
                  <button
                    key={k}
                    onClick={() => {
                      const nb = newBlock(k);
                      upd((x) => {
                        const i = x.blocks.findIndex((y) => y.id === selBlock);
                        x.blocks.splice(i === -1 ? x.blocks.length : i + 1, 0, nb);
                        return x;
                      });
                      setSelBlock(nb.id);
                      toast.success(`${t.name} added`);
                    }}
                  >
                    <span className="ic" style={{ width: 28, height: 28, borderRadius: 8, background: t.tint, borderColor: t.ring, color: t.color, fontWeight: 700, fontSize: 12 }}>{t.g}</span>
                    <span className="grow"><strong style={{ fontSize: 12 }}>{t.name}</strong><br /><small>{t.desc}</small></span>
                  </button>
                ))}
              </Menu>
            </div>
          </section>
          <section className="card">
            <Inspector
              link={l}
              selBlock={selBlock}
              setBlock={setBlock}
              activeBrand={activeBrand}
              onToggle={(bid) => upd((x) => { const y = x.blocks.find((z) => z.id === bid); y.on = !y.on; return x; })}
              onMove={(dir) =>
                upd((x) => {
                  const i = x.blocks.findIndex((y) => y.id === selBlock);
                  const j = i + dir;
                  if (j < 0 || j >= x.blocks.length) return x;
                  [x.blocks[i], x.blocks[j]] = [x.blocks[j], x.blocks[i]];
                  return x;
                })
              }
              onDuplicate={() => {
                const src = l.blocks.find((b) => b.id === selBlock);
                const c = copyBlock(src);
                upd((x) => { x.blocks.splice(x.blocks.findIndex((y) => y.id === selBlock) + 1, 0, c); return x; });
                setSelBlock(c.id);
                toast.success("Block duplicated");
              }}
              onDelete={() => {
                const i = l.blocks.findIndex((b) => b.id === selBlock);
                const removed = l.blocks[i];
                upd((x) => { x.blocks.splice(i, 1); return x; });
                setSelBlock((l.blocks[i + 1] || l.blocks[i - 1] || {}).id || null);
                toast(`Deleted "${blockTitle(removed, CH)}"`, {
                  action: { label: "Undo", onClick: () => { upd((x) => { x.blocks.splice(i, 0, removed); return x; }); setSelBlock(removed.id); } },
                });
              }}
            />
          </section>
          {phoneCol}
        </div>
      )}

      {tab === "design" && (
        <div className="editor two-col">
          <section className="card card-pad stack" style={{ gap: 18 }}>
            <DesignPanel design={l.design} setDesign={(fn) => upd((x) => ({ ...x, design: fn(x.design) }))} />
          </section>
          {phoneCol}
        </div>
      )}

      {tab === "settings" && (
        <div className="editor two-col">
          <section className="card card-pad stack" style={{ gap: 14 }}>
            <div><h2 className="h2">Settings</h2><p className="sub">Address, Google details and tracking.</p></div>
            <label className="field">
              Link address
              <span className={`prefix ${slugBad ? "bad" : ""}`}>
                <span>{PUBLIC_PREFIX}</span>
                <input value={l.slug} onChange={(e) => upd((x) => ({ ...x, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} />
              </span>
              <span className={slugBad ? "err" : l.slug !== base.slug && slugCheck.state === "ok" ? "ok" : "hint"}>
                {l.slug !== base.slug ? slugCheck.msg : live ? "Changing this breaks links you already shared." : "Lowercase letters, numbers and dashes."}
              </span>
            </label>
            <label className="field">
              Title on Google and when shared
              <input className="input" maxLength={70} value={l.settings.seoTitle || ""} onChange={(e) => upd((x) => ({ ...x, settings: { ...x.settings, seoTitle: e.target.value } }))} />
              <span className="hint">Up to 70 characters</span>
            </label>
            <label className="field">
              Description
              <textarea className="textarea" maxLength={160} style={{ minHeight: 60 }} value={l.settings.seoDesc || ""} onChange={(e) => upd((x) => ({ ...x, settings: { ...x.settings, seoDesc: e.target.value } }))} />
              <span className="hint">Up to 160 characters</span>
            </label>
            {[
              ["track", "Count customers", "Track bookings and checkouts back to each button"],
              ["inbox", "Send messages to Smart Inbox", "Email sign-ups from this page land with your DMs"],
              ["badge", "Show “Made with Creative Klux”", "Shown at the bottom of the page"],
            ].map(([k, t, s]) => (
              <div key={k} className="set-row">
                <span><strong>{t}</strong><br /><span className="muted">{s}</span></span>
                <button className="switch" role="switch" aria-checked={!!l.settings[k]} aria-label={t} onClick={() => upd((x) => ({ ...x, settings: { ...x.settings, [k]: !x.settings[k] } }))} />
              </div>
            ))}
            <div className="danger-zone">
              <div><h2 className="h2" style={{ color: "var(--red)" }}>Danger zone</h2><p className="sub">Unpublishing takes the page offline; deleting can be undone straight after.</p></div>
              <div className="row wrap">
                {live && <button className="btn" onClick={() => publish(false)}><EyeOff size={14} />Unpublish</button>}
                <button className="btn btn-danger" onClick={() => setModal({ type: "delete" })}><Trash2 size={14} />Delete SmartLink</button>
              </div>
            </div>
          </section>
          {phoneCol}
        </div>
      )}

      {tab === "analytics" && <Analytics id={id} link={base} brand={brand} onPublish={() => publish(true)} />}

      {modal?.type === "preview" && <PreviewModal link={{ ...l, url: base.url, status: base.status }} onClose={() => setModal(null)} />}
      {modal?.type === "qr" && <QrModal link={base} onClose={() => setModal(null)} />}
      {modal?.type === "delete" && (
        <Confirm
          title={`Delete "${base.title}"?`}
          body={`${shortUrl(base)} will stop working${live ? " for everyone who has it, including QR codes you printed" : ""}. You can undo this straight after.`}
          ok="Delete SmartLink"
          busy={busy === "delete"}
          onOk={remove}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "revert" && (
        <Confirm
          title="Discard your changes?"
          body="Everything goes back to the last saved version."
          ok="Discard changes"
          onOk={() => {
            setEdit(base);
            if (!base.blocks.some((b) => b.id === selBlock)) setSelBlock(base.blocks[0]?.id || null);
            setModal(null);
            toast("Changes discarded");
          }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === "leave" && (
        <Modal
          title="Save changes before you leave?"
          sub={`${l.title} has changes that aren't saved.`}
          onClose={() => setModal(null)}
          foot={
            <>
              <button className="btn" onClick={() => setModal(null)}>Keep editing</button>
              <button className="btn btn-danger" onClick={() => { setEdit(base); router.push("/smart-links"); }}>Discard changes</button>
              <button className="btn btn-primary" onClick={async () => { if (await save()) router.push("/smart-links"); }}>Save and leave</button>
            </>
          }
        />
      )}
    </div>
  );
}

// ── Inspector ───────────────────────────────────────────────────────────────

function Field({ label, hint, children, after }) {
  return (
    <label className="field">
      <span>{label}{hint && <> <span className="hint">{hint}</span></>}</span>
      {children}
      {after}
    </label>
  );
}

function ImageField({ value, onChange, activeBrand }) {
  const [open, setOpen] = useState(false);
  const bad = value && !/^https:\/\//.test(value);
  return (
    <div className="field">
      Image
      <div className="img-field">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" />
        ) : (
          <span className="img-empty">No image</span>
        )}
        <div className="stack grow" style={{ gap: 6 }}>
          <div className="row wrap">
            <button type="button" className="btn btn-sm" onClick={() => setOpen(true)}><ImagePlus size={13} />Choose from gallery</button>
            {value && <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange("")}>Remove</button>}
          </div>
          <input className={`input ${bad ? "bad" : ""}`} placeholder="…or paste an https:// image address" value={value || ""} onChange={(e) => onChange(e.target.value.trim())} />
        </div>
      </div>
      <span className={bad ? "err" : "hint"}>{bad ? "Images must be full https:// addresses." : "Your gallery, Creative Studio designs or uploads."}</span>
      {open && (
        <MediaPickerModal
          isOpen
          initialTab="library"
          activeBrand={activeBrand}
          maxSelectable={1}
          onClose={() => setOpen(false)}
          onCancel={() => setOpen(false)}
          onApply={(items, others = []) => {
            const src = items?.[0]?.src || items?.[0]?.url || others[0];
            setOpen(false);
            if (src) onChange(src);
          }}
        />
      )}
    </div>
  );
}

function Inspector({ link, selBlock, setBlock, activeBrand, onToggle, onMove, onDuplicate, onDelete }) {
  const b = link.blocks.find((x) => x.id === selBlock);
  if (!b)
    return (
      <div className="empty-state">
        <span className="big-ic"><LayoutGrid size={22} /></span>
        <strong>Select a block</strong>
        <span className="muted">Click a block on the left or in the phone preview to edit it.</span>
      </div>
    );
  const t = BT[b.type] || BT.text;
  const err = urlHint(b);
  const urlAfter = <span className="err">{err}</span>;
  const inp = (key, props = {}) => (
    <input
      className="input"
      value={b[key] ?? ""}
      onChange={(e) => setBlock(key, props.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
      {...props}
    />
  );
  const opts = (key, list) => (
    <div className="opt-row">
      {list.map(([k, n]) => <button key={k} type="button" className={`opt ${b[key] === k ? "on" : ""}`} onClick={() => setBlock(key, k)}>{n}</button>)}
    </div>
  );
  const idx = link.blocks.indexOf(b);

  let fields = null;
  if (b.type === "header")
    fields = (
      <>
        <Field label="Name">{inp("name")}</Field>
        <Field label="Bio"><textarea className="textarea" value={b.bio || ""} placeholder="What you do, for whom, and where" onChange={(e) => setBlock("bio", e.target.value)} /></Field>
        <ImageField value={b.img} onChange={(v) => setBlock("img", v)} activeBrand={activeBrand} />
      </>
    );
  if (b.type === "button") {
    const ph = { url: "https://yourwebsite.com", booking: "https://yourwebsite.com/book", whatsapp: "+1 512 555 0199", email: "hello@yourbusiness.com", phone: "+1 512 555 0199" }[b.linkType || "url"];
    const lab = b.linkType === "email" ? "Email address" : b.linkType === "whatsapp" || b.linkType === "phone" ? "Phone number" : "Web address";
    fields = (
      <>
        <Field label="Button text">{inp("label")}</Field>
        <Field label="Opens">
          <select className="select" value={b.linkType || "url"} onChange={(e) => setBlock("linkType", e.target.value)}>
            {Object.entries(LINK_TYPES).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
          </select>
        </Field>
        <Field label={lab} after={urlAfter}>{inp("url", { placeholder: ph })}</Field>
        <div className="field">Style{opts("style", [["primary", "Main button"], ["secondary", "Normal"]])}<span className="hint">Use the main style for the one thing you want people to do most.</span></div>
      </>
    );
  }
  if (b.type === "booking")
    fields = (
      <>
        <Field label="Service">{inp("service")}</Field>
        <div className="two">
          <Field label="Price">{inp("price", { type: "number", min: 0 })}</Field>
          <Field label="Was" hint="optional">{inp("was", { type: "number", min: 0 })}</Field>
        </div>
        <Field label="Details">{inp("duration", { placeholder: "2 hours · 20 photos" })}</Field>
        <Field label="Button text">{inp("label")}</Field>
        <Field label="Booking page" after={urlAfter}>{inp("url", { placeholder: "https://yourwebsite.com/book" })}</Field>
      </>
    );
  if (b.type === "creative")
    fields = (
      <>
        <ImageField value={b.img} onChange={(v) => setBlock("img", v)} activeBrand={activeBrand} />
        <Field label="Caption">{inp("caption")}</Field>
        <Field label="Opens" after={urlAfter}>{inp("url", { placeholder: "https://" })}</Field>
      </>
    );
  if (b.type === "form")
    fields = (
      <>
        <Field label="Title">{inp("title")}</Field>
        <Field label="Placeholder">{inp("placeholder")}</Field>
        <Field label="Button text">{inp("label")}</Field>
        <div className="set-row">
          <span><strong>Send sign-ups to Smart Inbox</strong><br /><span className="muted">Each new email becomes a conversation</span></span>
          <button className="switch" role="switch" aria-checked={!!b.toInbox} aria-label="Send sign-ups to Smart Inbox" onClick={() => setBlock("toInbox", !b.toInbox)} />
        </div>
      </>
    );
  if (b.type === "video")
    fields = (
      <>
        <Field label="Title">{inp("title")}</Field>
        <Field label="Video link" after={urlAfter}>{inp("url", { placeholder: "https://youtube.com/watch?v=…" })}</Field>
        <ImageField value={b.img} onChange={(v) => setBlock("img", v)} activeBrand={activeBrand} />
      </>
    );
  if (b.type === "text")
    fields = (
      <>
        <Field label="Text"><textarea className="textarea" value={b.text || ""} onChange={(e) => setBlock("text", e.target.value)} /></Field>
        <div className="field">Align{opts("align", [["left", "Left"], ["center", "Center"]])}</div>
      </>
    );
  if (b.type === "socials")
    fields = (
      <>
        <p className="muted">Add a username or number. Empty ones are hidden.</p>
        {SOCIAL_KEYS.map(([k, c]) => (
          <label key={k} className="field">
            <span className="row"><span className="pf" style={{ background: CH[c].color }}>{CH[c].g}</span>{CH[c].name}</span>
            <input className="input" value={b[k] || ""} placeholder={k === "whatsapp" ? "+1 512 555 0199" : "username"} onChange={(e) => setBlock(k, e.target.value)} />
          </label>
        ))}
      </>
    );

  return (
    <div className="inspector">
      <div className="insp-head">
        <span className="ic" style={{ background: t.tint, borderColor: t.ring, color: t.color, fontWeight: 700 }}>{t.g}</span>
        <div className="grow"><h2 className="h2">{t.name}</h2><p className="sub">{t.desc}</p></div>
        <span className="row tiny">
          {b.on ? "Showing" : "Hidden"}
          <button className="switch" role="switch" aria-checked={!!b.on} aria-label="Show block" onClick={() => onToggle(b.id)} />
        </span>
      </div>
      {fields}
      {b.clicks != null && !["header", "text"].includes(b.type) && (
        <div className="two">
          <div className="fact"><span className="tiny">Clicks</span><b>{fmtNum(b.clicks)}</b></div>
          <div className="fact"><span className="tiny">Customers</span><b style={{ color: "var(--green)" }}>{fmtNum(b.customers ?? 0)}</b></div>
        </div>
      )}
      <div className="insp-foot">
        <button className="btn btn-sm" onClick={() => onMove(-1)} disabled={idx === 0}><ArrowUp size={13} />Move up</button>
        <button className="btn btn-sm" onClick={() => onMove(1)} disabled={idx === link.blocks.length - 1}><ArrowDown size={13} />Move down</button>
        <button className="btn btn-sm" onClick={onDuplicate}><Copy size={13} />Duplicate</button>
        <span className="grow" />
        <button className="btn btn-sm btn-danger" onClick={onDelete}><Trash2 size={13} />Delete block</button>
      </div>
    </div>
  );
}

// ── Design ──────────────────────────────────────────────────────────────────

function DesignPanel({ design: d, setDesign }) {
  const [hexDraft, setHexDraft] = useState({});
  const setColor = (k, v) => setDesign((x) => ({ ...x, [k]: v.toLowerCase(), theme: "custom" }));
  return (
    <>
      <div className="stack">
        <div><h2 className="h2">Theme</h2><p className="sub">Pick one, then fine-tune the colours.</p></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([k, t]) => (
            <button key={k} className={`theme-card ${d.theme === k ? "on" : ""}`} onClick={() => setDesign((x) => ({ ...x, theme: k, ...THEMES[k] }))}>
              <span className="sw" style={{ background: t.bg }}>
                <span style={{ width: 20, height: 20, borderRadius: "50%", background: t.fg, opacity: 0.85 }} />
                <i style={{ background: t.btnBg }} />
                <i style={{ background: t.fg, opacity: 0.2 }} />
              </span>
              <b>{t.name}</b>
            </button>
          ))}
          <button className={`theme-card ${d.theme === "custom" ? "on" : ""}`} onClick={() => setDesign((x) => ({ ...x, theme: "custom" }))}>
            <span className="sw" style={{ background: "repeating-linear-gradient(45deg,var(--hover),var(--hover) 8px,var(--panel) 8px,var(--panel) 16px)" }}><Palette size={22} /></span>
            <b>Custom</b>
          </button>
        </div>
      </div>
      <div className="stack">
        <h2 className="h2">Colours</h2>
        <div className="color-row">
          {[["bg", "Background"], ["fg", "Text"], ["btnBg", "Main button"], ["btnFg", "Main button text"]].map(([k, n]) => (
            <label key={k} className="field">
              {n}
              <span className="color-in">
                <input type="color" value={isHex(d[k]) ? d[k] : "#000000"} onChange={(e) => setColor(k, e.target.value)} aria-label={`${n} colour`} />
                <input
                  type="text"
                  maxLength={7}
                  aria-label={`${n} hex`}
                  value={hexDraft[k] ?? d[k] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.startsWith("#") ? e.target.value : "#" + e.target.value;
                    setHexDraft((h) => ({ ...h, [k]: v }));
                    if (isHex(v)) setColor(k, v);
                  }}
                  onBlur={() => setHexDraft((h) => ({ ...h, [k]: undefined }))}
                />
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="stack">
        <h2 className="h2">Button shape</h2>
        <div className="opt-row">
          {[["rounded", "Rounded"], ["pill", "Pill"], ["square", "Square"]].map(([k, n]) => (
            <button key={k} className={`opt ${d.shape === k ? "on" : ""}`} onClick={() => setDesign((x) => ({ ...x, shape: k }))}>{n}</button>
          ))}
        </div>
      </div>
      <div className="stack">
        <h2 className="h2">Font</h2>
        <div className="opt-row">
          {[["Inter", "Inter"], ["Poppins", "Poppins"], ["Georgia", "Georgia (serif)"]].map(([k, n]) => (
            <button key={k} className={`opt ${d.font === k ? "on" : ""}`} style={{ fontFamily: k }} onClick={() => setDesign((x) => ({ ...x, font: k }))}>{n}</button>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Analytics ───────────────────────────────────────────────────────────────

function Analytics({ id, link, brand, onPublish }) {
  const [a, setA] = useState(null);
  useEffect(() => {
    fetchLinkAnalytics(id, brand).then(setA).catch((e) => setA({ error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  if (!a) return <KluxLoader label="Counting visits and clicks" />;
  if (a.error) return <div className="card empty-state"><span className="err">{a.error}</span></div>;
  if (link.status === "draft" && !a.visits)
    return (
      <div className="card empty-state" style={{ padding: "64px 20px" }}>
        <span className="big-ic"><BarChart3 size={24} /></span>
        <strong>No numbers yet</strong>
        <span className="muted">Publish this SmartLink and put it in your bio. Visits and clicks show up here.</span>
        <button className="btn btn-primary" onClick={onPublish}><Globe size={14} />Publish</button>
      </div>
    );
  const kpis = [
    { label: "Visits", value: fmtNum(a.visits), glyph: "◉", color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb", series: a.daily?.map((d) => d.visits) },
    { label: "Clicks", value: fmtNum(a.clicks), glyph: "↗", color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb", series: a.daily?.map((d) => d.clicks) },
    { label: "Click rate", value: a.click_rate == null ? "–" : `${a.click_rate}%`, glyph: "%", color: "#7c3aed", tint: "#f4effe", ring: "#e2d6fb" },
    { label: "Customers", value: fmtNum(a.customers), glyph: "★", color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc" },
    { label: "Customer value", value: amount(a.value), glyph: "÷", color: "#c2410c", tint: "#fff5eb", ring: "#fde2c4" },
  ];
  const blocks = [...(a.blocks || [])].sort((x, y) => (y.clicks || 0) - (x.clicks || 0));
  const maxC = Math.max(1, ...blocks.map((b) => b.clicks || 0));
  return (
    <>
      <section className="grid-auto">{kpis.map((k) => <Kpi key={k.label} k={k} />)}</section>
      <div className="flex-row">
        <section className="card card-pad stack" style={{ flex: "2 1 440px", minWidth: 0 }}>
          <div className="card-head">
            <div className="grow"><h2 className="h2">Visits and clicks</h2><p className="sub">Last 14 days</p></div>
            <span className="legend-i"><i style={{ background: "var(--brand-ring)", height: 10, width: 10, borderRadius: 3 }} />Visits</span>
            <span className="legend-i"><i style={{ background: "var(--brand)", height: 10, width: 10, borderRadius: 3 }} />Clicks</span>
          </div>
          <VisitsChart daily={a.daily} />
        </section>
        <section className="card card-pad stack" style={{ flex: "1 1 300px" }}>
          <div><h2 className="h2">Where visitors come from</h2><p className="sub">This SmartLink</p></div>
          <Sources sources={a.sources} />
        </section>
      </div>
      <section className="card stack" style={{ padding: "14px 0 4px" }}>
        <div style={{ padding: "0 14px" }}><h2 className="h2">What people click</h2><p className="sub">Each block, and the customers it brought</p></div>
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr><th style={{ paddingLeft: 14 }}>Block</th><th>Type</th><th>Clicks</th><th className="num">Customers</th><th className="num" style={{ paddingRight: 14 }}>Showing</th></tr>
            </thead>
            <tbody>
              {blocks.map((b) => (
                <tr key={b.id}>
                  <td style={{ paddingLeft: 14, fontWeight: 600 }}>{b.title || BT[b.type]?.name}</td>
                  <td>{BT[b.type]?.name || b.type}</td>
                  <td style={{ minWidth: 200 }}>
                    <div className="row"><div className="bar grow"><i style={{ width: `${(((b.clicks || 0) / maxC) * 100).toFixed(0)}%` }} /></div><span style={{ width: 40, textAlign: "right" }}>{fmtNum(b.clicks || 0)}</span></div>
                  </td>
                  <td className="num" style={{ color: "var(--green)", fontWeight: 600 }}>{fmtNum(b.customers || 0)}</td>
                  <td className="num" style={{ paddingRight: 14 }}>{b.on ? <span className="pill pill-green">Yes</span> : <span className="pill">Hidden</span>}</td>
                </tr>
              ))}
              {!blocks.length && <tr><td colSpan={5} style={{ paddingLeft: 14 }} className="muted">No clickable blocks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
