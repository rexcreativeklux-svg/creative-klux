"use client";

// Smart Inbox — every DM and comment, AI answers, you step in.
// Layout and behaviour ported from the creativeklux-app.html prototype
// (pageInbox / threadHTML / profileHTML). Every number, conversation, draft,
// saved reply and rule comes from /api/smart-inbox — nothing is hardcoded.
//
// Things the backend can't do yet are marked "Waiting on backend" on screen:
//   · week-on-week changes and trend lines on the number cards (needs daily
//     history from /summary)
//   · "Past orders" on the profile (no orders field on a conversation)

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Calendar,
  Check,
  Eye,
  EyeOff,
  FileText,
  Inbox as InboxIcon,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Undo2,
  UserPlus,
  VolumeX,
} from "lucide-react";
import KluxLoader from "@/app/(components)/KluxLoader";
import { useAuth } from "@/context/AuthContext";
import {
  addNote,
  deleteConversation,
  deleteNote,
  deleteThreadNote,
  discardDrafts,
  draftReplies,
  fetchConversation,
  fetchInboxConversations,
  fetchInboxSummary,
  fetchRules,
  fetchSavedReplies,
  hideComment,
  replyToConversation,
  restoreConversation,
  updateConversation,
  updateInboxSettings,
  updateNote,
} from "@/(lib)/smartInboxApi";
import {
  Avatar,
  Confirm,
  INBOX_CHANNELS,
  Kpi,
  Menu,
  NetBadge,
  STAGES,
  agoLong,
  ago,
  amount,
  ch,
  clock,
  duration,
  notifySmartChanged,
} from "./shared";
import { RulesModal, SavedRepliesModal } from "./InboxModals";
import "@/app/(components)/home/homeDashboard.css";
import "./smart.css";

const TABS = [
  ["all", "All"],
  ["needs", "Needs you"],
  ["dm", "DM"],
  ["comment", "Comment"],
];
const STATUS_PILL = {
  needs: ["pill-red", "Needs you"],
  ai: ["pill-blue", "AI replied"],
  replied: ["", "You replied"],
  done: ["pill-green", "Done"],
};
const PAGE = 30;
const first = (name) => (name || "them").split(" ")[0];

function StatusPill({ status }) {
  const [cls, label] = STATUS_PILL[status] || ["", status];
  return <span className={`pill ${cls}`}>{label}</span>;
}

export default function SmartInbox() {
  const { activeBrandId, user, teams } = useAuth();
  const brand = { brandId: activeBrandId };
  const me = user?.name || "Me";

  // ── Data ──
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState({ loading: true, items: [], counts: {}, done: 0, page: 1, last: 1 });
  const [replies, setReplies] = useState([]);
  const [rules, setRules] = useState({ rules: [], actions: [] });
  const [convo, setConvo] = useState(null); // the open conversation (full shape)
  const [convoLoading, setConvoLoading] = useState(false);

  // ── UI ──
  const [tab, setTab] = useState("all");
  const [state, setState] = useState("open");
  const [chans, setChans] = useState(() => new Set(INBOX_CHANNELS));
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [selId, setSelId] = useState(null);
  const [composer, setComposer] = useState({});
  const [mode, setMode] = useState({});
  const [draftIdx, setDraftIdx] = useState({});
  const [modal, setModal] = useState(null); // "replies" | "rules" | {confirmDelete}
  const [busy, setBusy] = useState("");
  const prevStatus = useRef({}); // for Reopen: the API has no "open" status
  const replyRef = useRef(null);

  // Open a conversation from ?c=<id> (Home links here).
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("c");
    if (id) setSelId(Number(id) || id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadSummary = useCallback(async () => {
    try {
      setSummary(await fetchInboxSummary(brand));
    } catch (err) {
      setSummary({ error: err.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrandId]);

  // Only the newest list request may write to the list: switching tabs or
  // filters quickly must not let an older, slower answer land last.
  const listReq = useRef(0);

  const loadList = useCallback(
    async ({ page = 1, quiet = false } = {}) => {
      const req = ++listReq.current;
      if (!chans.size) {
        setList({ loading: false, items: [], counts: {}, done: 0, page: 1, last: 1 });
        return;
      }
      if (!quiet && page === 1) setList((l) => ({ ...l, loading: true }));
      try {
        const res = await fetchInboxConversations({
          ...brand,
          tab,
          state,
          q: qDebounced,
          channels: chans.size === INBOX_CHANNELS.length ? undefined : [...chans],
          perPage: PAGE,
          page,
        });
        if (req !== listReq.current) return;
        setList((l) => ({
          loading: false,
          items: page === 1 ? res.conversations || [] : [...l.items, ...(res.conversations || []).filter((c) => !l.items.some((x) => x.id === c.id))],
          counts: res.counts || {},
          done: res.done_count ?? 0,
          page: res.page ?? page,
          last: res.last_page ?? 1,
        }));
      } catch (err) {
        if (req !== listReq.current) return;
        setList((l) => ({ ...l, loading: false, error: err.message }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeBrandId, tab, state, qDebounced, chans],
  );

  useEffect(() => {
    if (!activeBrandId) return;
    loadSummary();
    fetchSavedReplies(brand).then((r) => setReplies(r.replies || [])).catch(() => {});
    fetchRules(brand).then((r) => setRules({ rules: r.rules || [], actions: r.actions || [] })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBrandId, loadSummary]);

  useEffect(() => {
    if (!activeBrandId) return;
    loadList();
  }, [activeBrandId, loadList]);

  // New messages arrive through Meta's webhook — check every 30 s while visible.
  useEffect(() => {
    if (!activeBrandId) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      loadList({ quiet: true });
      loadSummary();
    }, 30_000);
    return () => clearInterval(t);
  }, [activeBrandId, loadList, loadSummary]);

  // Pick the first conversation when none is chosen (as the prototype does).
  const shownId = selId ?? list.items[0]?.id ?? null;

  useEffect(() => {
    if (!shownId || !activeBrandId) {
      setConvo(null);
      return;
    }
    let alive = true;
    setConvoLoading(true);
    fetchConversation(shownId, brand)
      .then((res) => {
        if (!alive) return;
        setConvo(res.conversation);
        // Opening it marked it read on the server.
        setList((l) => ({ ...l, items: l.items.map((c) => (c.id === shownId ? { ...c, unread: false } : c)) }));
      })
      .catch((err) => alive && (toast.error(err.message), setConvo(null)))
      .finally(() => alive && setConvoLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownId, activeBrandId]);

  const select = (id) => {
    setSelId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("c", id);
    window.history.replaceState(null, "", url);
  };

  // The latest open conversation, so updates never build on a stale copy.
  const convoRef = useRef(null);
  useEffect(() => {
    convoRef.current = convo;
  }, [convo]);

  /**
   * Put a fresh conversation on screen and in the list. Takes the server's
   * conversation, or a function of the current one (for local edits such as
   * clearing drafts after a reply).
   */
  const applyConvo = (next) => {
    const c = typeof next === "function" ? next(convoRef.current) : next;
    if (!c) return;
    convoRef.current = c;
    setConvo(c);
    const last = c.messages?.[c.messages.length - 1];
    setList((l) => ({
      ...l,
      items: l.items.map((x) =>
        x.id === c.id
          ? { ...x, status: c.status, stage: c.stage, unread: c.unread, assignee: c.assignee, updated_at: c.updated_at, last: last ? { from: last.from, text: last.text } : x.last }
          : x,
      ),
    }));
  };
  const refreshAround = () => {
    loadList({ quiet: true });
    loadSummary();
    notifySmartChanged();
  };

  const patch = async (fields, msg) => {
    try {
      const res = await updateConversation(convo.id, fields, brand);
      applyConvo(res.conversation);
      if (msg) toast.success(msg);
      refreshAround();
      return res.conversation;
    } catch (err) {
      toast.error(err.message);
      return null;
    }
  };

  // ── Actions ──
  const toggleAi = async () => {
    const on = !summary?.ai_on;
    setSummary((s) => ({ ...s, ai_on: on }));
    try {
      const res = await updateInboxSettings({ ...brand, aiOn: on });
      setSummary((s) => ({ ...s, ai_on: res?.ai_on ?? on }));
      toast.success(on ? "AI replies are on" : "AI replies paused. Every message waits for you.");
    } catch (err) {
      setSummary((s) => ({ ...s, ai_on: !on }));
      toast.error(err.message);
    }
  };

  const send = async (text, m) => {
    const body = (text || "").trim();
    if (!body) {
      replyRef.current?.focus();
      toast.error("Write something first");
      return false;
    }
    setBusy("send");
    try {
      const res = await replyToConversation(convo.id, { text: body, mode: m }, brand);
      applyConvo(res.conversation);
      const where = ch(convo.platform).name;
      if (m === "note") toast.success("Note added. Only your team sees it.");
      else if (res.delivery === "sent") toast.success(m === "dm" ? `DM sent to ${first(convo.name)}` : `Reply sent on ${where}`);
      else if (res.delivery === "local") toast(`Saved here, not sent: there's no connected ${where} account yet.`);
      else if (res.delivery === "failed") toast.error(res.error || `${where} refused the reply.`);
      setComposer((s) => ({ ...s, [convo.id]: "" }));
      refreshAround();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy("");
    }
  };

  const markDone = async () => {
    prevStatus.current[convo.id] = convo.status;
    const id = convo.id;
    const before = convo.status;
    const c = await patch({ status: "done" });
    if (!c) return;
    toast("Marked done. Find it under Done.", {
      action: { label: "Undo", onClick: () => updateConversation(id, { status: before }, brand).then(refreshAround).catch((e) => toast.error(e.message)) },
    });
    if (state === "open") {
      const next = list.items.find((x) => x.id !== id);
      setSelId(next?.id ?? null);
    }
  };
  const reopen = async () => {
    const back = prevStatus.current[convo.id] || (convo.why ? "needs" : "replied");
    const c = await patch({ status: back }, "Conversation reopened");
    if (c) setState("open");
  };

  const doDelete = async () => {
    const c = convo;
    setBusy("delete");
    try {
      await deleteConversation(c.id, brand);
      setModal(null);
      setSelId(null);
      refreshAround();
      toast("Conversation deleted", {
        action: {
          label: "Undo",
          onClick: () =>
            restoreConversation(c.id, brand)
              .then(() => {
                refreshAround();
                select(c.id);
              })
              .catch((e) => toast.error(e.message)),
        },
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy("");
    }
  };

  // ── Team for "Assign" ──
  const team = useMemo(() => {
    const names = new Map();
    names.set(me, { id: user?.id ?? null, name: me });
    for (const t of teams || [])
      for (const m of t?.members || t?.users || [])
        if (m?.name && !names.has(m.name)) names.set(m.name, { id: m.id ?? m.user_id ?? null, name: m.name });
    return [...names.values()];
  }, [teams, me, user?.id]);

  // ── Number cards ──
  const kpis = [
    { label: "Conversations, 7 days", value: summary ? fmt(summary.conversations_7d) : "", glyph: "✉", color: "#1c64d6", tint: "#eef4fe", ring: "#d1e0fb" },
    { label: "Answered by AI", value: summary?.answered_by_ai == null ? "–" : `${summary.answered_by_ai}%`, glyph: "✦", color: "#1447e6", tint: "#eef2fd", ring: "#c9d6fb" },
    { label: "Median reply time", value: duration(summary?.median_reply_sec), glyph: "◷", color: "#7c3aed", tint: "#f4effe", ring: "#e2d6fb" },
    { label: "Became customers", value: summary ? fmt(summary.customers_7d) : "", glyph: "★", color: "#0a7a48", tint: "#edf8f2", ring: "#cdeedc" },
    {
      label: "Waiting for you",
      value: summary ? fmt(summary.waiting) : "",
      delta: summary ? (summary.waiting ? "reply soon" : "all clear") : null,
      bad: !!summary?.waiting,
      glyph: "!",
      color: "#b42328",
      tint: "#fdeeee",
      ring: "#f6c9cb",
    },
  ].map((k) => ({ ...k, loading: !summary }));

  const aiOn = summary?.ai_on;

  return (
    <div className="ck-home">
      <div className="page-head">
        <div className="grow">
          <h1 className="h1">Smart Inbox</h1>
          <p className="sub">Every DM and comment from every platform. AI answers, you step in when money or a complaint is on the table.</p>
        </div>
        <div className="row wrap">
          <button className="btn" onClick={() => setModal("replies")}><FileText size={14} />Saved replies</button>
          <button className="btn" onClick={() => setModal("rules")}><Sparkles size={14} />AI rules</button>
          <button className={`btn ${aiOn ? "btn-autopilot" : ""}`} onClick={toggleAi} disabled={!summary || summary.error}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: aiOn ? "#12a05c" : "#9aa0ad" }} />
            {aiOn ? "AI replies on" : "AI replies paused"}
          </button>
        </div>
      </div>

      <section className="grid-auto">{kpis.map((k) => <Kpi key={k.label} k={k} />)}</section>
      <div className="kpi-note">
        <span className="pill pill-orange">Waiting on backend</span>
        Week-on-week changes and trend lines need /smart-inbox/summary to also send each of the last 7 days.
        {summary?.error && <span className="err"> · {summary.error}</span>}
      </div>

      <div className="card inbox">
        {/* ── Conversation list ── */}
        <section className="ib-list" aria-label="Conversations">
          <div className="ib-tools">
            <label className="search">
              <Search size={14} />
              <input type="search" placeholder="Search people or messages" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search conversations" />
            </label>
            <div className="seg" role="tablist" aria-label="Type">
              {TABS.map(([k, n]) => (
                <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? "on" : ""} onClick={() => { setTab(k); setSelId(null); }}>
                  {n}
                  <span className="n">{list.counts[k] ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="row between wrap">
              <div className="row" style={{ gap: 4 }}>
                {INBOX_CHANNELS.map((k) => (
                  <button
                    key={k}
                    className={`chip ${chans.has(k) ? "" : "off"}`}
                    title={`Show ${ch(k).name}`}
                    aria-pressed={chans.has(k)}
                    onClick={() =>
                      setChans((s) => {
                        const n = new Set(s);
                        if (n.has(k)) n.delete(k);
                        else n.add(k);
                        return n;
                      })
                    }
                  >
                    <NetBadge platform={k} />
                  </button>
                ))}
              </div>
              <div className="seg">
                <button className={state === "open" ? "on" : ""} onClick={() => { setState("open"); setSelId(null); }}>Open</button>
                <button className={state === "done" ? "on" : ""} onClick={() => { setState("done"); setSelId(null); }}>
                  Done{list.done ? <span className="n">{list.done}</span> : null}
                </button>
              </div>
            </div>
          </div>
          <div className="ib-scroll">
            {list.loading ? (
              <KluxLoader label="Checking your inbox" />
            ) : list.error ? (
              <div className="empty-state"><span className="err">{list.error}</span><button className="btn btn-sm" onClick={() => loadList()}>Try again</button></div>
            ) : !list.items.length ? (
              <div className="empty-state">
                <span className="big-ic"><InboxIcon size={24} /></span>
                <strong>Nothing here</strong>
                <span className="muted">
                  {q
                    ? "No conversation matches your search."
                    : state === "done"
                      ? "Conversations you mark as done show up here."
                      : list.counts.all === 0 && tab === "all"
                        ? "No messages yet. They arrive once a Facebook Page, Instagram or WhatsApp account is connected to Smart Inbox."
                        : "You're all caught up. AI is handling the rest."}
                </span>
              </div>
            ) : (
              <>
                {list.items.map((c) => {
                  const prefix = c.last?.from === "ai" ? "AI: " : c.last?.from === "you" ? "You: " : c.last?.from === "note" ? "Note: " : "";
                  return (
                    <button
                      key={c.id}
                      className={`cv ${c.id === shownId ? "on" : ""} ${c.unread ? "unread" : ""} ${c.status === "done" ? "done" : ""}`}
                      onClick={() => select(c.id)}
                    >
                      <span className="cv-av">
                        <Avatar person={c} />
                        <NetBadge platform={c.platform} />
                      </span>
                      <span className="cv-body">
                        <span className="row between">
                          <span className="cv-name ellipsis">{c.name}</span>
                          <span className="tiny" style={{ flex: "none" }}>{ago(c.updated_at)}</span>
                        </span>
                        <span className="cv-prev ellipsis">{prefix + (c.last?.text || "")}</span>
                        <span className="row" style={{ gap: 6 }}>
                          <StatusPill status={c.status} />
                          <span className="tiny">{c.type === "dm" ? "DM" : "Comment"} · {ch(c.platform).name}</span>
                          {c.unread && <span style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "var(--brand)" }} />}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {list.page < list.last && (
                  <div style={{ padding: 10, textAlign: "center" }}>
                    <button className="btn btn-sm" onClick={() => loadList({ page: list.page + 1 })}>Load more</button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── Thread + profile ── */}
        {convo && convo.id === shownId ? (
          <>
            <Thread
              c={convo}
              me={me}
              team={team}
              replies={replies}
              composer={composer[convo.id] || ""}
              setComposer={(v) => setComposer((s) => ({ ...s, [convo.id]: v }))}
              mode={mode[convo.id] || (convo.type === "comment" ? "public" : "reply")}
              setMode={(v) => setMode((s) => ({ ...s, [convo.id]: v }))}
              draftIdx={draftIdx[convo.id] || 0}
              setDraftIdx={(v) => setDraftIdx((s) => ({ ...s, [convo.id]: v }))}
              busy={busy}
              setBusy={setBusy}
              replyRef={replyRef}
              brand={brand}
              send={send}
              patch={patch}
              applyConvo={applyConvo}
              markDone={markDone}
              reopen={reopen}
              askDelete={() => setModal("delete")}
              openReplies={() => setModal("replies")}
            />
            <Profile
              c={convo}
              replies={replies}
              brand={brand}
              patch={patch}
              applyConvo={applyConvo}
              onUseReply={(r) => {
                setComposer((s) => ({ ...s, [convo.id]: r.text }));
                setMode((s) => ({ ...s, [convo.id]: convo.type === "comment" ? "dm" : "reply" }));
                setTimeout(() => replyRef.current?.focus(), 0);
              }}
            />
          </>
        ) : (
          <>
            <section className="ib-thread no-sel">
              {convoLoading ? (
                <KluxLoader label="Opening the conversation" />
              ) : (
                <div className="empty-state">
                  <span className="big-ic"><MessageCircle size={24} /></span>
                  <strong>Pick a conversation</strong>
                  <span className="muted">Choose someone on the left to read and reply.</span>
                </div>
              )}
            </section>
            <aside className="ib-profile" />
          </>
        )}
      </div>

      {modal === "replies" && <SavedRepliesModal replies={replies} setReplies={setReplies} brandId={activeBrandId} onClose={() => setModal(null)} />}
      {modal === "rules" && (
        <RulesModal
          rules={rules.rules}
          setRules={(fn) => setRules((r) => ({ ...r, rules: typeof fn === "function" ? fn(r.rules) : fn }))}
          actions={rules.actions}
          brandId={activeBrandId}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "delete" && convo && (
        <Confirm
          title={`Delete conversation with ${convo.name}?`}
          body={`It is removed from Smart Inbox for your whole team. The message stays on ${ch(convo.platform).name}.`}
          ok="Delete conversation"
          busy={busy === "delete"}
          onOk={doDelete}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}

const fmt = (n) => (n === null || n === undefined ? "–" : Number(n).toLocaleString("en-US"));

// ── Thread ──────────────────────────────────────────────────────────────────

function Thread({
  c, team, replies, composer, setComposer, mode, setMode, draftIdx, setDraftIdx, busy, setBusy,
  replyRef, brand, send, patch, applyConvo, markDone, reopen, askDelete, openReplies,
}) {
  const isComment = c.type === "comment";
  const drafts = c.drafts || [];
  const dIdx = drafts.length ? draftIdx % drafts.length : 0;
  const net = ch(c.platform).name;
  const modes = isComment ? [["public", "Reply in public"], ["dm", "Send DM"], ["note", "Note"]] : [["reply", "Reply"], ["note", "Note"]];
  const msgsRef = useRef(null);

  useEffect(() => {
    const el = msgsRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [c.id, c.messages?.length]);

  // A day separator before the first message of each day.
  const today = new Date().toDateString();
  const dayOf = (m) => {
    const d = new Date(m.ts);
    return d.toDateString() === today ? "Today" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };
  const days = (c.messages || []).map(dayOf);

  const writeDrafts = async () => {
    setBusy("draft");
    try {
      const res = await draftReplies(c.id, 2, brand);
      applyConvo((cur) => ({ ...cur, drafts: res.drafts || [] }));
      setDraftIdx(0);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy("");
    }
  };
  const clearDrafts = async (msg) => {
    try {
      await discardDrafts(c.id, brand);
      applyConvo((cur) => ({ ...cur, drafts: [] }));
      if (msg) toast(msg);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="ib-thread" aria-label={`Conversation with ${c.name}`}>
      <div className="th-head">
        <Avatar person={c} />
        <div className="grow" style={{ minWidth: 140 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{c.name}</div>
          <div className="tiny">
            {[c.handle, `${net} ${isComment ? "comment" : "DM"}`].filter(Boolean).join(" · ")}
            {c.ai_off && <span style={{ color: "var(--orange)" }}> · AI muted for this person</span>}
            {!c.connected && <span> · not connected, replies are saved here only</span>}
          </div>
        </div>
        <Menu
          button={({ toggle }) => (
            <button className="btn btn-sm" onClick={toggle}>
              {c.assignee?.name ? (
                <>
                  <span className="avatar" style={{ width: 18, height: 18, fontSize: 8, background: "var(--text)", color: "var(--panel)" }}>
                    {c.assignee.name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                  {first(c.assignee.name)}
                </>
              ) : (
                <><UserPlus size={14} />Assign</>
              )}
            </button>
          )}
        >
          <div className="menu-head">Assign to</div>
          {team.map((t) => (
            <button key={t.name} onClick={() => patch({ assignee_id: t.id, assignee_name: t.name }, `Assigned to ${t.name}`)}>
              <span className="grow">{t.name}</span>
              {c.assignee?.name === t.name && <Check size={14} />}
            </button>
          ))}
          <div className="menu-sep" />
          <button onClick={() => patch({ assignee_id: null, assignee_name: null }, "Unassigned")}>Unassign</button>
        </Menu>
        {c.status === "done" ? (
          <button className="btn btn-sm" onClick={reopen}><Undo2 size={14} />Reopen</button>
        ) : (
          <button className="btn btn-sm" onClick={markDone}><Check size={14} />Mark done</button>
        )}
        <Menu button={({ toggle }) => <button className="icon-btn" onClick={toggle} aria-label="More actions"><MoreHorizontal size={16} /></button>}>
          <button onClick={() => patch({ unread: true }, "Marked as unread")}><Mail size={14} />Mark as unread</button>
          <button onClick={() => patch({ ai_off: !c.ai_off }, c.ai_off ? `AI can reply to ${first(c.name)} again` : `AI won't reply to ${first(c.name)}`)}>
            <VolumeX size={14} />{c.ai_off ? "Let AI reply to this person" : "Stop AI for this person"}
          </button>
          {isComment && (
            <button
              onClick={() =>
                hideComment(c.id, !c.hidden, brand)
                  .then((r) => {
                    applyConvo(r.conversation);
                    toast.success(c.hidden ? "Comment visible again" : "Comment hidden. Only the writer and you can see it.");
                  })
                  .catch((e) => toast.error(e.message))
              }
            >
              {c.hidden ? <Eye size={14} /> : <EyeOff size={14} />}{c.hidden ? "Show comment" : "Hide comment"}
            </button>
          )}
          <div className="menu-sep" />
          <button className="danger" onClick={askDelete}><Trash2 size={14} />Delete conversation</button>
        </Menu>
      </div>

      {isComment && c.post && (
        <div className="post-ref">
          {c.post.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.post.image} alt="" />
          ) : (
            <NetBadge platform={c.platform} style={{ width: 40, height: 40, borderRadius: 6, fontSize: 14 }} />
          )}
          <div className="grow">
            <div className="tiny">Comment on your {net} post</div>
            <div className="ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
              {c.post.url ? <a href={c.post.url} target="_blank" rel="noreferrer" style={{ color: "inherit" }}>{c.post.title || "Your post"}</a> : c.post.title || "Your post"}
            </div>
          </div>
          {c.hidden ? <span className="pill pill-orange">Hidden</span> : <span className="pill">Public</span>}
        </div>
      )}
      {c.status === "needs" && c.why && (
        <div className="banner">
          <AlertTriangle size={16} style={{ flex: "none" }} />
          <span><strong>Why AI paused:</strong> {c.why}</span>
        </div>
      )}

      <div className="msgs" ref={msgsRef}>
        {(c.messages || []).map((m, i) => {
          const day = days[i];
          const showDay = i === 0 || day !== days[i - 1];
          const firstDay = i === 0;
          const who =
            m.from === "ai" ? "AI replied" : m.from === "you" ? m.by || "You" : m.from === "note" ? `Internal note · ${m.by || "You"}` : first(c.name);
          const where = m.mode === "public" ? " · in public" : m.mode === "dm" ? " · by DM" : "";
          return (
            <div key={m.id ?? i} style={{ display: "contents" }}>
              {showDay && <div className="day">{day}{firstDay && c.source ? ` · came from ${c.source}` : ""}</div>}
              <div className={`msg ${m.from}`}>
                <span className="b">{m.text}</span>
                <span className="meta">
                  {who}{where} · {clock(m.ts)}
                  {m.delivery === "local" && m.from !== "note" && " · saved here, not sent"}
                  {m.delivery === "failed" && <span className="bad"> · not delivered{m.error ? `: ${m.error}` : ""}</span>}
                  {m.from === "note" && (
                    <>
                      {" · "}
                      <button
                        className="link-btn"
                        style={{ fontSize: 11 }}
                        onClick={() =>
                          deleteThreadNote(c.id, m.id, brand)
                            .then(() => {
                              applyConvo((cur) => ({ ...cur, messages: cur.messages.filter((x) => x.id !== m.id) }));
                              toast("Note deleted");
                            })
                            .catch((e) => toast.error(e.message))
                        }
                      >
                        Delete
                      </button>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="composer">
        {drafts.length > 0 ? (
          <div className="draft">
            <div className="draft-label">
              <Sparkles size={13} />AI draft {drafts.length > 1 ? `${dIdx + 1} of ${drafts.length}` : ""} · written in your Brand Kit tone, uses your saved replies
            </div>
            <p>{drafts[dIdx]}</p>
            <div className="row wrap" style={{ gap: 6 }}>
              <button
                className="btn btn-sm btn-primary"
                disabled={busy === "send"}
                onClick={async () => {
                  const ok = await send(drafts[dIdx], isComment ? "public" : "reply");
                  if (ok) clearDrafts();
                }}
              >
                <Send size={13} />Send{isComment ? " in public" : ""}
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setComposer(drafts[dIdx]);
                  clearDrafts();
                  setTimeout(() => replyRef.current?.focus(), 0);
                }}
              >
                <Pencil size={13} />Edit
              </button>
              {drafts.length > 1 ? (
                <button className="btn btn-sm" onClick={() => setDraftIdx(dIdx + 1)}><RefreshCw size={13} />Another version</button>
              ) : (
                <button className="btn btn-sm" disabled={busy === "draft"} onClick={writeDrafts}><RefreshCw size={13} />{busy === "draft" ? "Writing…" : "Another version"}</button>
              )}
              <button className="btn btn-sm btn-ghost" onClick={() => clearDrafts("Draft discarded")}>Discard</button>
            </div>
          </div>
        ) : (
          c.status !== "done" && (
            <div className="row">
              <button className="btn btn-sm" disabled={busy === "draft"} onClick={writeDrafts}>
                <Sparkles size={13} />{busy === "draft" ? "Writing…" : "Write a reply with AI"}
              </button>
              <span className="tiny">Uses AI credits</span>
            </div>
          )
        )}
        <div className="reply-box">
          <textarea
            ref={replyRef}
            rows={2}
            value={composer}
            onChange={(e) => setComposer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(composer, mode);
              }
            }}
            placeholder={mode === "note" ? "Write a note only your team can see" : `Write a reply to ${first(c.name)}… (Enter to send, Shift+Enter for a new line)`}
          />
          <div className="reply-bar">
            <div className="reply-mode">
              {modes.map(([k, l]) => (
                <button key={k} className={mode === k ? "on" : ""} onClick={() => { setMode(k); replyRef.current?.focus(); }}>{l}</button>
              ))}
            </div>
            <Menu
              align="left"
              up
              style={{ width: 300 }}
              button={({ toggle }) => <button className="btn btn-sm btn-ghost" onClick={toggle}><FileText size={14} />Saved replies</button>}
            >
              <div className="menu-head">Insert a saved reply</div>
              {replies.map((r) => (
                <button key={r.id} onClick={() => setComposer((composer ? composer.trimEnd() + " " : "") + r.text)}>
                  <span className="grow">
                    <strong style={{ fontSize: 12 }}>{r.title}</strong>
                    <br />
                    <small className="ellipsis" style={{ display: "block", maxWidth: 240 }}>{r.text}</small>
                  </span>
                </button>
              ))}
              {!replies.length && <div className="tiny" style={{ padding: "8px 10px" }}>No saved replies yet.</div>}
              <div className="menu-sep" />
              <button onClick={openReplies}><Pencil size={14} />Manage saved replies</button>
            </Menu>
            <span className="grow" />
            <button className={`btn btn-sm ${mode === "note" ? "" : "btn-primary"}`} disabled={busy === "send"} onClick={() => send(composer, mode)}>
              {mode === "note" ? <FileText size={13} /> : <Send size={13} />}
              {busy === "send" ? "Sending…" : mode === "note" ? "Add note" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Profile ─────────────────────────────────────────────────────────────────

function Profile({ c, replies, brand, patch, applyConvo, onUseReply }) {
  const [tag, setTag] = useState("");
  const [note, setNote] = useState("");
  const [editNote, setEditNote] = useState(null);
  const [editText, setEditText] = useState("");

  const findReply = (re) => replies.find((r) => re.test(r.title) || re.test(r.text));
  const priceReply = findReply(/price|pricing|rates?\b|cost/i);
  const bookReply = findReply(/book/i);

  const quick = (r, label, hint) => (
    <button
      className="btn"
      style={{ justifyContent: "flex-start" }}
      disabled={!r}
      title={r ? r.text : hint}
      onClick={() => r && onUseReply(r)}
    >
      {label === "Send booking link" ? <Calendar size={14} /> : <FileText size={14} />}
      {label}
    </button>
  );

  const saveNotes = async (fn, msg) => {
    try {
      const res = await fn();
      applyConvo((cur) => ({ ...cur, notes: res.notes || [] }));
      if (msg) toast.success(msg);
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  return (
    <aside className="ib-profile" aria-label="Customer profile">
      <div className="prof-top">
        <Avatar person={c} size="avatar-lg" />
        <strong style={{ fontSize: 15 }}>{c.name}</strong>
        <span className="tiny">{[c.city, c.handle].filter(Boolean).join(" · ")}</span>
        <select
          className="select"
          value={c.stage || "New"}
          onChange={(e) => patch({ stage: e.target.value }, `Stage: ${e.target.value}`)}
          aria-label="Customer stage"
          style={{ width: "auto", padding: "4px 8px", fontSize: 12, fontWeight: 600 }}
        >
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="facts">
        <div className="fact"><span className="tiny">Wants</span><b>{c.intent || "–"}</b></div>
        <div className="fact"><span className="tiny">Likely value</span><b>{c.value ? amount(c.value) : "–"}</b></div>
        <div className="fact"><span className="tiny">Came from</span><b>{c.source || "–"}</b></div>
        <div className="fact" title="A conversation has no orders field yet — the backend needs to link people to their orders.">
          <span className="tiny">Past orders</span>
          <b><span className="pill pill-orange" style={{ fontSize: 10 }}>Waiting on backend</span></b>
        </div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span className="row" style={{ fontSize: 12, fontWeight: 600, color: "var(--brand)" }}><Sparkles size={13} />AI summary</span>
        <p style={{ fontSize: 12, lineHeight: 1.55, color: "var(--text-3)" }}>{c.summary || "No summary yet."}</p>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Tags</span>
        <div className="row wrap" style={{ gap: 6 }}>
          {(c.tags || []).map((t, i) => (
            <span key={t + i} className="pill" style={{ paddingRight: 4 }}>
              {t}
              <button className="chip-x" aria-label={`Remove tag ${t}`} onClick={() => patch({ tags: c.tags.filter((_, j) => j !== i) })}>×</button>
            </span>
          ))}
          <input
            className="input"
            style={{ width: 110, padding: "3px 8px", fontSize: 11, borderRadius: 999 }}
            placeholder="+ Add tag"
            aria-label="Add a tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const v = tag.trim();
              if (!v) return;
              setTag("");
              if (!(c.tags || []).includes(v)) patch({ tags: [...(c.tags || []), v] });
            }}
          />
        </div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Quick actions</span>
        {quick(priceReply, "Send price list", "Add a saved reply with “price” in its name to use this.")}
        {quick(bookReply, "Send booking link", "Add a saved reply with “booking” in its name to use this.")}
        <button
          className="btn"
          style={{ justifyContent: "flex-start", ...(c.stage === "Customer" ? {} : { borderColor: "var(--green-ring)", color: "var(--green)" }) }}
          disabled={c.stage === "Customer"}
          onClick={() => patch({ stage: "Customer" }, `${c.name} is now a customer`)}
        >
          <UserPlus size={14} />{c.stage === "Customer" ? "Already a customer" : "Mark as customer"}
        </button>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Notes</span>
        {(c.notes || []).map((n) =>
          editNote === n.id ? (
            <div key={n.id} className="note-item">
              <textarea className="textarea" style={{ minHeight: 60 }} value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
              <div className="row">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={async () => {
                    if (!editText.trim()) return toast.error("A note can't be empty");
                    if (await saveNotes(() => updateNote(c.id, n.id, editText.trim(), brand), "Note updated")) setEditNote(null);
                  }}
                >
                  Save
                </button>
                <button className="btn btn-sm" onClick={() => setEditNote(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div key={n.id} className="note-item">
              <span>{n.text}</span>
              <span className="row between">
                <span className="tiny">{[n.by, n.ts && agoLong(n.ts)].filter(Boolean).join(" · ")}</span>
                <span className="row" style={{ gap: 10 }}>
                  <button className="link-btn" onClick={() => { setEditNote(n.id); setEditText(n.text); }}>Edit</button>
                  <button className="link-btn" style={{ color: "var(--red)" }} onClick={() => saveNotes(() => deleteNote(c.id, n.id, brand), "Note deleted")}>Delete</button>
                </span>
              </span>
            </div>
          ),
        )}
        <textarea className="textarea" placeholder={`Add a note about ${first(c.name)}`} style={{ minHeight: 56 }} value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn btn-sm"
          style={{ alignSelf: "flex-start" }}
          onClick={async () => {
            if (!note.trim()) return;
            if (await saveNotes(() => addNote(c.id, note.trim(), brand), "Note saved")) setNote("");
          }}
        >
          <Plus size={13} />Add note
        </button>
      </div>
      {(c.activity || []).length > 0 && (
        <div className="stack" style={{ gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Activity</span>
          {c.activity.map((a, i) => <div key={i} className="tl"><i /><span>{a}</span></div>)}
        </div>
      )}
    </aside>
  );
}
