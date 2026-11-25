"use client";

// Smart Inbox windows: Saved replies and AI reply rules (prototype's
// repliesModal / rulesModal), each wired to its endpoints.

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createRule,
  createSavedReply,
  deleteRule,
  deleteSavedReply,
  updateRule,
  updateSavedReply,
} from "@/(lib)/smartInboxApi";
import { Modal } from "./shared";

// ── Saved replies ───────────────────────────────────────────────────────────

export function SavedRepliesModal({ replies, setReplies, brandId, onClose }) {
  const [edit, setEdit] = useState(""); // reply id, "new" or ""
  const [busy, setBusy] = useState(false);

  const save = async (id, title, text) => {
    if (!title.trim() || !text.trim()) {
      toast.error("Add a name and a message");
      return;
    }
    setBusy(true);
    try {
      if (id === "new") {
        const res = await createSavedReply({ title: title.trim(), text: text.trim() }, { brandId });
        setReplies((list) => [res.reply, ...list]);
        toast.success("Saved reply created");
      } else {
        const res = await updateSavedReply(id, { title: title.trim(), text: text.trim() }, { brandId });
        setReplies((list) => list.map((r) => (r.id === id ? res.reply : r)));
        toast.success("Saved reply updated");
      }
      setEdit("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (r) => {
    try {
      await deleteSavedReply(r.id, { brandId });
      setReplies((list) => list.filter((x) => x.id !== r.id));
      toast(`Deleted "${r.title}"`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const res = await createSavedReply({ title: r.title, text: r.text }, { brandId });
              setReplies((list) => [res.reply, ...list]);
            } catch (err) {
              toast.error(err.message);
            }
          },
        },
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal
      wide
      title="Saved replies"
      sub="Insert them in any conversation. AI also uses them when it writes for you."
      onClose={onClose}
      foot={<button className="btn btn-primary" onClick={onClose}>Done</button>}
    >
      {replies.map((r) =>
        edit === r.id ? (
          <ReplyForm key={r.id} reply={r} busy={busy} onSave={(t, x) => save(r.id, t, x)} onCancel={() => setEdit("")} />
        ) : (
          <div key={r.id} className="rule">
            <div className="grow stack" style={{ gap: 3 }}>
              <strong style={{ fontSize: 13 }}>{r.title}</strong>
              <span className="muted" style={{ lineHeight: 1.5 }}>{r.text}</span>
            </div>
            <button className="icon-btn" onClick={() => setEdit(r.id)} aria-label={`Edit ${r.title}`}><Pencil size={14} /></button>
            <button className="icon-btn" onClick={() => remove(r)} aria-label={`Delete ${r.title}`} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
          </div>
        ),
      )}
      {!replies.length && edit !== "new" && <p className="muted">No saved replies yet.</p>}
      {edit === "new" ? (
        <ReplyForm busy={busy} onSave={(t, x) => save("new", t, x)} onCancel={() => setEdit("")} />
      ) : (
        <button className="btn btn-dashed" onClick={() => setEdit("new")}><Plus size={14} />New saved reply</button>
      )}
    </Modal>
  );
}

function ReplyForm({ reply, busy, onSave, onCancel }) {
  const [title, setTitle] = useState(reply?.title || "");
  const [text, setText] = useState(reply?.text || "");
  return (
    <div className="card card-pad stack">
      <label className="field">Name<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example: Delivery times" autoFocus /></label>
      <label className="field">Message<textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="What should this reply say?" /></label>
      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onSave(title, text)}>{reply ? "Save" : "Create reply"}</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── AI rules ────────────────────────────────────────────────────────────────

export function RulesModal({ rules, setRules, actions, brandId, onClose }) {
  const [edit, setEdit] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (id, form) => {
    if (!form.name.trim() || !form.when.trim()) {
      toast.error("Add a name and when the rule applies");
      return;
    }
    setBusy(true);
    try {
      const body = { name: form.name.trim(), when: form.when.trim(), then: form.then };
      if (id === "new") {
        const res = await createRule({ ...body, on: true }, { brandId });
        setRules((list) => [...list, res.rule]);
        toast.success("Rule created");
      } else {
        const res = await updateRule(id, body, { brandId });
        setRules((list) => list.map((r) => (r.id === id ? res.rule : r)));
        toast.success("Rule saved");
      }
      setEdit("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (r) => {
    setRules((list) => list.map((x) => (x.id === r.id ? { ...x, on: !r.on } : x)));
    try {
      await updateRule(r.id, { on: !r.on }, { brandId });
    } catch (err) {
      setRules((list) => list.map((x) => (x.id === r.id ? { ...x, on: r.on } : x)));
      toast.error(err.message);
    }
  };

  const remove = async (r) => {
    try {
      await deleteRule(r.id, { brandId });
      setRules((list) => list.filter((x) => x.id !== r.id));
      toast(`Deleted rule "${r.name}"`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const res = await createRule({ name: r.name, when: r.when, then: r.then, on: r.on }, { brandId });
              setRules((list) => [...list, res.rule]);
            } catch (err) {
              toast.error(err.message);
            }
          },
        },
      });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const lower = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");

  return (
    <Modal
      wide
      title="AI reply rules"
      sub="AI replies to everything except what you list here. Rules are checked from top to bottom."
      onClose={onClose}
      foot={<button className="btn btn-primary" onClick={onClose}>Done</button>}
    >
      {rules.map((r) =>
        edit === r.id ? (
          <RuleForm key={r.id} rule={r} actions={actions} busy={busy} onSave={(f) => save(r.id, f)} onCancel={() => setEdit("")} />
        ) : (
          <div key={r.id} className="rule">
            <button className="switch" role="switch" aria-checked={!!r.on} aria-label={`Turn ${r.name} ${r.on ? "off" : "on"}`} onClick={() => toggle(r)} />
            <div className="grow stack" style={{ gap: 3 }}>
              <strong style={{ fontSize: 13 }}>{r.name}</strong>
              <span className="muted">
                When {lower(r.when)} → <strong style={{ color: "var(--text-2)" }}>{r.then}</strong>
              </span>
            </div>
            <button className="icon-btn" onClick={() => setEdit(r.id)} aria-label={`Edit ${r.name}`}><Pencil size={14} /></button>
            <button className="icon-btn" onClick={() => remove(r)} aria-label={`Delete ${r.name}`} style={{ color: "var(--red)" }}><Trash2 size={14} /></button>
          </div>
        ),
      )}
      {edit === "new" ? (
        <RuleForm actions={actions} busy={busy} onSave={(f) => save("new", f)} onCancel={() => setEdit("")} />
      ) : (
        <button className="btn btn-dashed" onClick={() => setEdit("new")}><Plus size={14} />New rule</button>
      )}
    </Modal>
  );
}

function RuleForm({ rule, actions, busy, onSave, onCancel }) {
  const [form, setForm] = useState({ name: rule?.name || "", when: rule?.when || "", then: rule?.then || actions[1] || actions[0] || "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <div className="card card-pad stack">
      <label className="field">Rule name<input className="input" value={form.name} onChange={set("name")} placeholder="For example: Refund requests" autoFocus /></label>
      <label className="field">
        When<input className="input" value={form.when} onChange={set("when")} placeholder="Someone asks for a refund" />
        <span className="hint">Describe it in plain words. AI understands it.</span>
      </label>
      <label className="field">
        Then
        <select className="select" value={form.then} onChange={set("then")}>
          {actions.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>
      <div className="row">
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => onSave(form)}>{rule ? "Save rule" : "Create rule"}</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
