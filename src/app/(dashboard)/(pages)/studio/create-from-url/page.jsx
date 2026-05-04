"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ── Icons (inline SVGs to avoid lucide dependency issues) ─────────────────────
const Icon = ({ d, size = 16, color = "currentColor", strokeWidth = 1.75, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d={d} />
  </svg>
);

const Icons = {
  Globe: (p) => <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 0c-2.8 3.3-4.4 7-4.4 10s1.6 6.7 4.4 10m0-20c2.8 3.3 4.4 7 4.4 10s-1.6 6.7-4.4 10M2 12h20" {...p} />,
  Loader: (p) => <Icon d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" {...p} />,
  Check: (p) => <Icon d="M20 6 9 17l-5-5" {...p} />,
  ChevronRight: (p) => <Icon d="m9 18 6-6-6-6" {...p} />,
  ChevronLeft: (p) => <Icon d="m15 18-6-6 6-6" {...p} />,
  Megaphone: (p) => <Icon d="M3 11l19-9-9 19-2-8-8-2z" {...p} />,
  Share2: (p) => <Icon d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" {...p} />,
  ImageIcon: (p) => <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16" {...p} />,
  Sparkles: (p) => <Icon d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3z" {...p} />,
  FileUp: (p) => <Icon d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2zM14 2v6h6M12 12v6m-3-3 3-3 3 3" {...p} />,
  X: (p) => <Icon d="M18 6 6 18M6 6l12 12" {...p} />,
  Star: (p) => <Icon d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" {...p} />,
  Save: (p) => <Icon d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" {...p} />,
  Edit3: (p) => <Icon d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" {...p} />,
};

// ── Constants ─────────────────────────────────────────────────────────────────
const SIZE_OPTIONS = [
  { value: "1200x627", label: "LinkedIn Horizontal" },
  { value: "627x627", label: "LinkedIn Square" },
  { value: "1200x628", label: "Google Landscape" },
  { value: "1200x1200", label: "Google Square" },
  { value: "1080x1920", label: "TikTok Vertical" },
  { value: "1080x1080", label: "Meta Square" },
  { value: "1080x1350", label: "Meta Vertical" },
  { value: "1080x1921", label: "Meta Stories/Reels" },
];
const CAMPAIGN_GOALS = ["Brand Awareness", "Engagement", "Sales", "Lead Generation", "Website Traffic"];
const AUDIENCES = [
  { value: "B2B", label: "B2B", desc: "Business owners, startups, agencies" },
  { value: "B2C", label: "B2C", desc: "End consumers, everyday users" },
  { value: "Casual", label: "Casual", desc: "Broad social media audience" },
  { value: "Inspirational", label: "Inspirational", desc: "Entrepreneurs & creators" },
  { value: "Sales", label: "Sales", desc: "Hot leads, ad audiences" },
];
const FILE_FORMATS = ["PNG", "JPEG", "WEBP", "AVIF"];
const VISUAL_STYLES = ["Minimal", "Bold", "Elegant", "Playful", "Corporate", "Modern", "Neon", "Pastel"];
const BRAND_COLORS = ["#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444"];

const STEPS = [
  { id: 1, label: "URL" },
  { id: 2, label: "Type" },
  { id: 3, label: "Details" },
  { id: 4, label: "Settings" },
];

// ── Utility ───────────────────────────────────────────────────────────────────
const getPlatformLabel = (size) => {
  const map = {
    "1200x627": "LinkedIn", "627x627": "LinkedIn",
    "1200x628": "Google", "1200x1200": "Google",
    "1080x1920": "TikTok / Meta Stories", "1080x1080": "Meta",
    "1080x1350": "Meta", "1080x1921": "Meta Stories",
  };
  return map[size] || "all platforms";
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => {
        const done = currentStep > s.id;
        const active = currentStep === s.id;
        return (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, transition: "all 0.3s",
                background: done ? "#16a34a" : active ? "#2563eb" : "#f1f5f9",
                color: done || active ? "#fff" : "#94a3b8",
                border: active ? "none" : done ? "none" : "2px solid #e2e8f0",
              }}>
                {done ? <Icons.Check size={14} /> : s.id}
              </div>
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? "#1e293b" : done ? "#16a34a" : "#94a3b8" }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 12px", borderRadius: 2, background: done ? "#16a34a" : "#e2e8f0", transition: "background 0.4s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ brandUrl, setBrandUrl, importing, onImport, onContinue, error }) {
  return (
    <div style={{ animation: "fadeSlide 0.35s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>Enter your website URL</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>We'll automatically extract your brand details to get started.</p>
      </div>

      <div style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 16, padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Icons.Globe size={16} color="#2563eb" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>URL</span>
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>Auto-fills brand info</span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            type="url"
            value={brandUrl}
            onChange={e => setBrandUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onImport()}
            placeholder="https://yourwebsite.com"
            style={inputStyle}
          />
          <button onClick={onImport} disabled={importing || !brandUrl.trim()} style={primaryBtnStyle(importing || !brandUrl.trim())}>
            {importing ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><SpinLoader />Importing…</span> : "Import"}
          </button>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
        <button onClick={onContinue} style={primaryBtnStyle(false)}>
          Continue <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Step2({ creativeType, setCreativeType, onBack, onContinue }) {
  const options = [
    {
      value: "ads",
      label: "Create Ads",
      desc: "Generate paid ad creatives for Meta, Google, TikTok, LinkedIn and more.",
      icon: <Icons.Megaphone size={22} color="#a855f7" />,
      accent: "#a855f7",
      bg: "#faf5ff",
      border: "#d8b4fe",
    },
    {
      value: "content",
      label: "Create Content",
      desc: "Design social media posts, stories, reels, banners and thumbnails.",
      icon: <Icons.Share2 size={22} color="#0d9488" />,
      accent: "#0d9488",
      bg: "#f0fdfa",
      border: "#5eead4",
    },
  ];

  return (
    <div style={{ animation: "fadeSlide 0.35s ease" }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.5px" }}>What would you like to create?</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Choose your creative type to get started.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {options.map(opt => {
          const sel = creativeType === opt.value;
          return (
            <button key={opt.value} onClick={() => setCreativeType(opt.value)} style={{
              textAlign: "left", padding: 24, borderRadius: 16, cursor: "pointer", transition: "all 0.2s",
              border: `2px solid ${sel ? opt.accent : "#e2e8f0"}`,
              background: sel ? opt.bg : "#fafafa",
              boxShadow: sel ? `0 0 0 4px ${opt.accent}18` : "none",
              position: "relative",
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: sel ? opt.bg : "#f1f5f9", border: `1.5px solid ${sel ? opt.border : "#e2e8f0"}`, marginBottom: 16 }}>
                {opt.icon}
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{opt.label}</p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
              {sel && (
                <div style={{ position: "absolute", bottom: 16, left: 24, display: "flex", alignItems: "center", gap: 5, background: opt.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20 }}>
                  <Icons.Check size={10} /> Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <button onClick={onBack} style={ghostBtnStyle}>← Back</button>
        <button onClick={onContinue} disabled={!creativeType} style={primaryBtnStyle(!creativeType)}>
          Continue <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Step3Ads({ form, setForm, onBack, onContinue, error }) {
  const field = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const logoRef = useRef();

  return (
    <div style={{ animation: "fadeSlide 0.35s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>Brand Details</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Tell us about your brand so we can tailor the creative.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <Field label="Brand Name / Project Name" required>
          <input type="text" value={form.brandName || ""} onChange={e => field("brandName", e.target.value)} placeholder="Acme Inc." style={inputStyle} />
        </Field>

        <Field label="Description">
          <textarea value={form.description || ""} onChange={e => field("description", e.target.value)} placeholder="Brief description of your brand or campaign…" rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
        </Field>

        <Field label="Visual Style">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VISUAL_STYLES.map(s => (
              <button key={s} onClick={() => field("visualStyle", s.toLowerCase())} style={chipStyle(form.visualStyle === s.toLowerCase())}>
                {s}
              </button>
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Brand Color">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {BRAND_COLORS.map(hex => (
                <button key={hex} onClick={() => field("brandColor", hex)} style={{
                  width: 28, height: 28, borderRadius: 8, background: hex, cursor: "pointer",
                  border: form.brandColor === hex ? "2.5px solid #0f172a" : "2.5px solid transparent",
                  transform: form.brandColor === hex ? "scale(1.15)" : "scale(1)",
                  transition: "all 0.15s",
                }} />
              ))}
              <label style={{ width: 28, height: 28, borderRadius: 8, cursor: "pointer", overflow: "hidden", border: "1.5px solid #e2e8f0", background: form.brandColor || "#2563eb" }}>
                <input type="color" value={form.brandColor || "#2563eb"} onChange={e => field("brandColor", e.target.value)} style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
              </label>
              <input type="text" value={form.brandColor || ""} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("brandColor", e.target.value)} maxLength={7} style={{ ...inputStyle, width: 90, padding: "6px 10px", fontFamily: "monospace", fontSize: 12 }} />
            </div>
          </Field>

          <Field label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => logoRef.current?.click()} style={{ flex: 1, padding: "8px 12px", border: "1.5px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icons.FileUp size={13} /> Upload Logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => field("logo", r.result);
                r.readAsDataURL(f);
              }} />
              {form.logo && <img src={form.logo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", border: "1px solid #e2e8f0" }} />}
            </div>
          </Field>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <button onClick={onBack} style={ghostBtnStyle}>← Back</button>
        <button onClick={onContinue} style={primaryBtnStyle(false)}>
          Continue <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Step4Ads({ form, setForm, onBack, onGenerate, generating, error }) {
  const field = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ animation: "fadeSlide 0.35s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>Size, Goals & Audience</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Configure your ad specifications.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Field label="Ad Size">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {SIZE_OPTIONS.map(s => (
              <button key={s.value} onClick={() => field("size", s.value)} style={{
                padding: "10px 8px", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                border: `1.5px solid ${form.size === s.value ? "#2563eb" : "#e2e8f0"}`,
                background: form.size === s.value ? "#eff6ff" : "#fafafa",
              }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: form.size === s.value ? "#1d4ed8" : "#374151", margin: "0 0 2px" }}>{s.label}</p>
                <p style={{ fontSize: 10, color: form.size === s.value ? "#3b82f6" : "#9ca3af", margin: 0, fontFamily: "monospace" }}>{s.value}</p>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Campaign Goal">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAMPAIGN_GOALS.map(g => (
              <button key={g} onClick={() => field("campaignGoal", g)} style={chipStyle(form.campaignGoal === g)}>{g}</button>
            ))}
          </div>
        </Field>

        <Field label="Audience">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {AUDIENCES.map(a => (
              <button key={a.value} onClick={() => field("audience", a.value)} style={{
                padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                border: `1.5px solid ${form.audience === a.value ? "#2563eb" : "#e2e8f0"}`,
                background: form.audience === a.value ? "#eff6ff" : "#fafafa",
              }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: form.audience === a.value ? "#1d4ed8" : "#374151", margin: "0 0 2px" }}>{a.label}</p>
                <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>{a.desc}</p>
              </button>
            ))}
          </div>
        </Field>

        <Field label="File Format">
          <div style={{ display: "flex", gap: 8 }}>
            {FILE_FORMATS.map(f => (
              <button key={f} onClick={() => field("fileFormat", f)} style={chipStyle(form.fileFormat === f)}>
                {f}{f === "PNG" && " ✓"}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <button onClick={onBack} style={ghostBtnStyle}>← Back</button>
        <button onClick={onGenerate} disabled={generating} style={{ ...primaryBtnStyle(generating), background: "linear-gradient(135deg, #2563eb, #7c3aed)", gap: 8 }}>
          {generating ? <><SpinLoader /> Generating…</> : <><Icons.Sparkles size={15} /> Generate Creative</>}
        </button>
      </div>
    </div>
  );
}

// ── Mock design result panel ──────────────────────────────────────────────────
function ResultsPanel({ result, onBack }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const variations = result?.variations || [];

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedIds(selectedIds.length === variations.length ? [] : variations.map(v => v.id));

  const scoreNum = (v) => parseInt((v.copy?.performance_score || "").split("/")[0]) || 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", animation: "fadeSlide 0.35s ease" }}>
      {/* toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 16, marginBottom: 16, borderBottom: "1.5px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ ...ghostBtnStyle, padding: "6px 12px", fontSize: 12 }}>
            <Icons.ChevronLeft size={14} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", boxShadow: "0 0 0 3px #bbf7d0" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{variations.length} designs ready</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={selectAll} style={{ ...ghostBtnStyle, fontSize: 11, padding: "5px 10px" }}>
            {selectedIds.length === variations.length ? "Deselect All" : "Select All"}
          </button>
          {selectedIds.length > 0 && (
            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...ghostBtnStyle, fontSize: 11, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
                <Icons.Edit3 size={12} /> Edit
              </button>
              <button style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Icons.Save size={12} /> Save {selectedIds.length}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* grid */}
      <div style={{ columnCount: 2, columnGap: 12, flex: 1, overflowY: "auto" }}>
        {variations.map(v => {
          const selected = selectedIds.includes(v.id);
          const score = scoreNum(v);
          return (
            <div key={v.id} onClick={() => toggleSelect(v.id)} style={{
              breakInside: "avoid", marginBottom: 12, borderRadius: 14, overflow: "hidden", cursor: "pointer",
              border: `2px solid ${selected ? "#2563eb" : "#e2e8f0"}`,
              background: "#fff", position: "relative",
              boxShadow: selected ? "0 0 0 4px #dbeafe" : "0 1px 4px rgba(0,0,0,0.06)",
              transition: "all 0.15s",
            }}>
              {/* checkbox */}
              <div style={{
                position: "absolute", top: 8, left: 8, zIndex: 5, width: 20, height: 20, borderRadius: "50%",
                background: selected ? "#2563eb" : "rgba(255,255,255,0.95)",
                border: selected ? "none" : "1.5px solid #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 1px 4px rgba(0,0,0,0.1)", transition: "all 0.15s",
              }}>
                {selected && <Icons.Check size={11} color="#fff" />}
              </div>

              {/* canvas preview */}
              <DesignCardCanvas variation={v} />

              {/* copy */}
              <div style={{ padding: "10px 12px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#111", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.name}</p>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: "#f3f4f6", color: "#777", marginLeft: 6, flexShrink: 0 }}>{v.category}</span>
                </div>
                {v.copy?.headline && <p style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", margin: "0 0 2px", lineHeight: 1.3 }}>{v.copy.headline}</p>}
                {(v.copy?.tagline || v.copy?.hook) && <p style={{ fontSize: 10, color: "#64748b", margin: "0 0 6px", fontStyle: "italic" }}>{v.copy.tagline || v.copy.hook}</p>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                  {v.copy?.cta && <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: "#0f172a", color: "#fff" }}>{v.copy.cta}</span>}
                  {score > 0 && (
                    <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 700, color: score >= 90 ? "#16a34a" : score >= 75 ? "#d97706" : "#94a3b8", marginLeft: "auto" }}>
                      <Icons.Star size={9} /> {score}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// simple canvas card that draws a colored gradient preview
function DesignCardCanvas({ variation }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !variation?.canvas) return;
    const ctx = canvas.getContext("2d");
    const { width = 800, height = 600, background = "#e2e8f0" } = variation.canvas;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    // draw gradient overlay
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `${variation.accentColor || "#2563eb"}33`);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // draw brand name text
    ctx.fillStyle = variation.accentColor || "#2563eb";
    ctx.font = `bold ${Math.floor(height * 0.09)}px 'Georgia', serif`;
    ctx.textAlign = "center";
    ctx.fillText(variation.name || "Ad Design", width / 2, height * 0.45);

    ctx.fillStyle = "#334155";
    ctx.font = `${Math.floor(height * 0.055)}px sans-serif`;
    ctx.fillText(variation.copy?.headline || "", width / 2, height * 0.58);
  }, [variation]);

  return (
    <div style={{ background: "#f4f5f8", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 8, display: "block", maxHeight: 160, objectFit: "cover" }} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
        {label}{required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, marginTop: 12 }}>
      <Icons.X size={14} /> {msg}
    </div>
  );
}

function SpinLoader() {
  return (
    <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10,
  fontSize: 14, color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box",
  fontFamily: "inherit", transition: "border-color 0.15s",
};

const primaryBtnStyle = (disabled) => ({
  display: "flex", alignItems: "center", gap: 8, padding: "10px 22px",
  background: disabled ? "#e2e8f0" : "#2563eb", color: disabled ? "#94a3b8" : "#fff",
  border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
  transition: "all 0.2s", flexShrink: 0,
});

const ghostBtnStyle = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
  background: "#fff", color: "#374151", border: "1.5px solid #e2e8f0",
  borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: "pointer",
};

const chipStyle = (active) => ({
  padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 500,
  border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`,
  background: active ? "#eff6ff" : "#fafafa",
  color: active ? "#1d4ed8" : "#6b7280",
  transition: "all 0.15s",
});

// ── Mock data generator ───────────────────────────────────────────────────────
function generateMockResult(form) {
  const colors = ["#2563eb", "#7c3aed", "#0d9488", "#dc2626", "#d97706"];
  return {
    type: "design",
    variations: Array.from({ length: 4 }, (_, i) => ({
      id: `var_${i}`,
      name: `Variation ${i + 1}`,
      category: ["Social", "Banner", "Story", "Feed"][i] || "Ad",
      accentColor: colors[i % colors.length],
      canvas: { width: 800, height: 600, background: ["#f0f9ff", "#faf5ff", "#f0fdf4", "#fff7ed"][i] },
      copy: {
        headline: `${form.brandName || "Brand"} — ${["Elevate Your Game", "Be Different", "Start Today", "Drive Results"][i]}`,
        tagline: `${form.campaignGoal || "Engage"} · ${form.audience || "Everyone"}`,
        cta: ["Get Started", "Learn More", "Shop Now", "Try Free"][i],
        performance_score: `${82 + i * 4}/100 — ${["Good", "Great", "Excellent", "Top"][i]}`,
      },
    })),
  };
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CreateFromUrl() {
  const [step, setStep] = useState(1);
  const [brandUrl, setBrandUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creativeType, setCreativeType] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    brandName: "", description: "", visualStyle: "minimal",
    brandColor: "#2563eb", logo: null,
    size: "", campaignGoal: "", audience: "", fileFormat: "PNG",
  });

  const handleImport = async () => {
    if (!brandUrl.trim()) return setError("Please enter a valid URL.");
    setImporting(true);
    setError("");
    await new Promise(r => setTimeout(r, 1800));
    // mock imported data
    setForm(p => ({
      ...p,
      brandName: new URL(brandUrl.startsWith("http") ? brandUrl : "https://" + brandUrl).hostname.replace("www.", "").split(".")[0].replace(/^./, c => c.toUpperCase()),
      description: "Auto-imported brand description from your website.",
      brandColor: "#2563eb",
    }));
    setImporting(false);
  };

  const handleGenerate = async () => {
    if (!form.size) return setError("Please select an ad size.");
    if (!form.campaignGoal) return setError("Please select a campaign goal.");
    if (!form.audience) return setError("Please select an audience.");
    setError("");
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2400));
    setResult(generateMockResult(form));
    setGenerating(false);
  };

  const validateStep3 = () => {
    if (!form.brandName.trim()) { setError("Brand name is required."); return false; }
    setError("");
    return true;
  };

  const validateStep4 = () => {
    if (!form.size || !form.campaignGoal || !form.audience) {
      setError("Please complete all required fields.");
      return false;
    }
    return true;
  };

  const showResults = result !== null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        @keyframes rise { from { opacity: 0; transform: scale(0.96) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        * { box-sizing: border-box; }
        input:focus, textarea:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px #dbeafe; }
        button:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
        button:active:not(:disabled) { transform: translateY(0); }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }
      `}</style>

      <div className="pt-10" style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "flex-start", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
  
        <div style={{ width: "100%", maxWidth: 780, position: "relative", zIndex: 1 }}>
          {/* Header */}
          {/* <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 20, background: "#eff6ff", border: "1px solid #bfdbfe", marginBottom: 16 }}>
              <Icons.Sparkles size={13} color="#2563eb" />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8", letterSpacing: "0.05em", textTransform: "uppercase" }}>AI Creative Studio</span>
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.8px", fontFamily: "'Lora', Georgia, serif" }}>
              Create from URL
            </h1>
            <p style={{ fontSize: 15, color: "#64748b", margin: 0 }}>Generate beautiful ad creatives from your brand in minutes.</p>
          </div> */}

          {/* Step indicator */}
          {!showResults && <StepIndicator currentStep={step} />}

          {/* Card */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1.5px solid #e2e8f0", padding: "36px 40px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", animation: "rise 0.4s ease" }}>
            {showResults ? (
              <ResultsPanel result={result} onBack={() => { setResult(null); setStep(4); }} />
            ) : (
              <>
                {step === 1 && (
                  <Step1
                    brandUrl={brandUrl} setBrandUrl={setBrandUrl}
                    importing={importing} onImport={handleImport}
                    error={error}
                    onContinue={() => { setError(""); setStep(2); }}
                  />
                )}
                {step === 2 && (
                  <Step2
                    creativeType={creativeType} setCreativeType={setCreativeType}
                    onBack={() => { setError(""); setStep(1); }}
                    onContinue={() => { setError(""); setStep(3); }}
                  />
                )}
                {step === 3 && creativeType === "ads" && (
                  <Step3Ads
                    form={form} setForm={setForm}
                    error={error}
                    onBack={() => { setError(""); setStep(2); }}
                    onContinue={() => { if (validateStep3()) setStep(4); }}
                  />
                )}
                {step === 3 && creativeType === "content" && (
                  <Step3Content
                    form={form} setForm={setForm}
                    error={error}
                    onBack={() => { setError(""); setStep(2); }}
                    onContinue={() => { if (validateStep3()) setStep(4); }}
                  />
                )}
                {step === 4 && (
                  <Step4Ads
                    form={form} setForm={setForm}
                    error={error}
                    onBack={() => { setError(""); setStep(3); }}
                    onGenerate={handleGenerate}
                    generating={generating}
                  />
                )}
              </>
            )}
          </div>

          {/* Generating overlay */}
          {generating && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
              <div style={{ background: "#fff", borderRadius: 20, padding: 40, textAlign: "center", border: "1.5px solid #e2e8f0", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", minWidth: 260 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", animation: "pulse 1.5s infinite" }}>
                  <Icons.Sparkles size={24} color="#fff" />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>Generating your creatives…</p>
                <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>AI is crafting your ad variations</p>
                <div style={{ marginTop: 20, height: 4, borderRadius: 4, background: "#f1f5f9", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, #2563eb, #7c3aed)", animation: "progressBar 2.4s ease-in-out" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
      `}</style>
    </>
  );
}

// ── Step 3 for Content type ───────────────────────────────────────────────────
const POST_TONES = ["Professional", "Casual", "Humorous", "Inspirational", "Urgent", "Educational"];
const PLATFORMS = ["Instagram", "LinkedIn", "Facebook", "Twitter / X", "TikTok", "Pinterest"];
const BRAND_COLORS_2 = ["#2563eb", "#0ea5e9", "#8b5cf6", "#ec4899", "#ef4444"];

function Step3Content({ form, setForm, onBack, onContinue, error }) {
  const field = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const logoRef = useRef();

  return (
    <div style={{ animation: "fadeSlide 0.35s ease" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "0 0 4px", letterSpacing: "-0.5px" }}>Post Details</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>Tell us about your post so we can design the perfect content.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <Field label="Brand Name / Project Name" required>
          <input type="text" value={form.brandName || ""} onChange={e => field("brandName", e.target.value)} placeholder="Acme Inc." style={inputStyle} />
        </Field>

        <Field label="Post Description">
          <textarea value={form.description || ""} onChange={e => field("description", e.target.value)} placeholder="What is this post about?" rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
        </Field>

        <Field label="Post Tone">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {POST_TONES.map(t => (
              <button key={t} onClick={() => field("postTone", t)} style={chipStyle(form.postTone === t)}>{t}</button>
            ))}
          </div>
        </Field>

        <Field label="Target Platform">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PLATFORMS.map(p => (
              <button key={p} onClick={() => field("platform", p)} style={chipStyle(form.platform === p)}>{p}</button>
            ))}
          </div>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Brand Color">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {BRAND_COLORS_2.map(hex => (
                <button key={hex} onClick={() => field("brandColor", hex)} style={{
                  width: 28, height: 28, borderRadius: 8, background: hex, cursor: "pointer",
                  border: form.brandColor === hex ? "2.5px solid #0f172a" : "2.5px solid transparent",
                  transform: form.brandColor === hex ? "scale(1.15)" : "scale(1)", transition: "all 0.15s",
                }} />
              ))}
              <label style={{ width: 28, height: 28, borderRadius: 8, cursor: "pointer", overflow: "hidden", border: "1.5px solid #e2e8f0", background: form.brandColor || "#2563eb" }}>
                <input type="color" value={form.brandColor || "#2563eb"} onChange={e => field("brandColor", e.target.value)} style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
              </label>
              <input type="text" value={form.brandColor || ""} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && field("brandColor", e.target.value)} maxLength={7} style={{ ...inputStyle, width: 90, padding: "6px 10px", fontFamily: "monospace", fontSize: 12 }} />
            </div>
          </Field>

          <Field label="Logo">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => logoRef.current?.click()} style={{ flex: 1, padding: "8px 12px", border: "1.5px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc", color: "#64748b", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <Icons.FileUp size={13} /> Upload Logo
              </button>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                const r = new FileReader();
                r.onload = () => field("logo", r.result);
                r.readAsDataURL(f);
              }} />
              {form.logo && <img src={form.logo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", border: "1px solid #e2e8f0" }} />}
            </div>
          </Field>
        </div>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <button onClick={onBack} style={ghostBtnStyle}>← Back</button>
        <button onClick={onContinue} style={primaryBtnStyle(false)}>
          Continue <Icons.ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}