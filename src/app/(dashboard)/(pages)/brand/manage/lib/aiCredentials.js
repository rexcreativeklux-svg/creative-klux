/**
 * aiCredentials.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Static copy + response normalizer for the "AI Keys" (bring your own key) tab.
 *
 * GET /ai-credentials returns "what's available, what's saved, what's active",
 * but its exact shape isn't pinned down in the handover doc — so everything the
 * tab renders goes through `normalizeAiCredentials`, which accepts the likely
 * variants (provider list per capability or a flat provider map, `active` map
 * or per-row `is_active`, etc.). Once the shape is confirmed this can shrink.
 *
 * The backend's config/ai.php is the source of truth for providers and models;
 * FALLBACK_PROVIDERS only fills in when the response doesn't carry them.
 */

export const AI_CAPABILITIES = [
  {
    id: "chat",
    label: "Chat",
    description: "Copilot conversations, captions and every text generation.",
  },
  {
    id: "image",
    label: "Image",
    description: "Magic Studio and creative image generation.",
  },
  {
    id: "video",
    label: "Video",
    description: "Video generation jobs.",
  },
];

// Per-provider UX copy. Keyed by provider id as it appears in config/ai.php.
export const PROVIDER_META = {
  openai: { label: "OpenAI", placeholder: "sk-…" },
  anthropic: { label: "Anthropic", placeholder: "sk-ant-…" },
  gemini: { label: "Google Gemini", placeholder: "AIza…" },
  ariziy_byok: { label: "Ariziy", placeholder: "Your Ariziy API key" },
  fal_byok: {
    label: "fal",
    placeholder: "key_id:key_secret",
    hint: "Paste the full key including the colon — key_id:key_secret. The first half alone will be rejected.",
  },
  veo: { label: "Google Veo", placeholder: "AIza…" },
  runway: {
    label: "Runway",
    placeholder: "key_…",
    hint: "Runway is image-to-video only — text-only prompts will fail while it's active.",
  },
};

const FALLBACK_PROVIDERS = {
  chat: ["openai", "anthropic", "gemini", "ariziy_byok"],
  image: ["openai", "gemini", "fal_byok", "ariziy_byok"],
  video: ["veo", "runway", "fal_byok"],
};

// Our own default per capability — shown on the "Creativeklux key" row.
export const SYSTEM_PROVIDER_LABEL = { chat: "Ariziy", image: "Ariziy", video: "fal" };

export const providerLabel = (id, fallback) =>
  fallback || PROVIDER_META[id]?.label || id;

const truthy = (v) => v === true || v === 1 || v === "1";

const normalizeModels = (models) => {
  if (!models) return [];
  const list = Array.isArray(models) ? models : Object.entries(models).map(
    ([id, v]) => (typeof v === "string" ? { id, label: v } : { id, ...v }),
  );
  return list
    .map((m) =>
      typeof m === "string"
        ? { id: m, label: m }
        : { id: m.id ?? m.model ?? m.value, label: m.label ?? m.name ?? m.id ?? m.model },
    )
    .filter((m) => m.id);
};

const normalizeProvider = (raw, id, capability) => {
  const models = raw?.models;
  return {
    id: raw?.id ?? raw?.key ?? raw?.provider ?? id,
    label: providerLabel(raw?.id ?? raw?.provider ?? id, raw?.label ?? raw?.name),
    // Models may be a flat list or split per capability for multi-capability providers.
    models: normalizeModels(
      models && !Array.isArray(models) && models[capability] ? models[capability] : models,
    ),
    freeModel: truthy(raw?.free_model),
  };
};

// Providers offered for one capability, from whichever shape the backend used.
const providersFor = (payload, capability) => {
  const src = payload?.providers ?? payload?.available ?? payload?.capabilities;

  const perCap = src?.[capability];
  if (perCap) {
    const inner = perCap.providers ?? perCap;
    if (Array.isArray(inner)) return inner.map((p) => normalizeProvider(p, p?.id, capability));
    return Object.entries(inner).map(([id, p]) => normalizeProvider(p, id, capability));
  }

  // Flat provider map: { openai: { capabilities: ["chat","image"], … } }
  if (src && typeof src === "object" && !Array.isArray(src)) {
    const flat = Object.entries(src)
      .filter(([, p]) => Array.isArray(p?.capabilities) && p.capabilities.includes(capability))
      .map(([id, p]) => normalizeProvider(p, id, capability));
    if (flat.length) return flat;
  }

  return FALLBACK_PROVIDERS[capability].map((id) => normalizeProvider(null, id, capability));
};

const normalizeCredential = (c) => ({
  id: c.id,
  capability: c.capability,
  provider: c.provider,
  model: c.model || "",
  active: truthy(c.is_active ?? c.active),
  // Keys are encrypted at rest; the backend should only ever send a masked tail.
  keyPreview: c.key_preview ?? c.masked_key ?? c.key_hint ?? (c.last_four ? `••••${c.last_four}` : ""),
  verifiedAt: c.verified_at || c.last_verified_at || null,
  status: c.status || (c.verified_at ? "verified" : ""),
  error: c.last_error || c.error || "",
});

export function normalizeAiCredentials(raw) {
  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const savedRaw = payload?.credentials ?? payload?.saved ?? (Array.isArray(raw?.data) ? raw.data : []);
  const saved = (Array.isArray(savedRaw) ? savedRaw : Object.values(savedRaw || {})).flat().map(normalizeCredential);
  const activeMap = payload?.active || {};

  return AI_CAPABILITIES.map((cap) => {
    const credentials = saved.filter((c) => c.capability === cap.id);
    const activeEntry = activeMap[cap.id];
    const activeVal =
      activeEntry && typeof activeEntry === "object"
        ? activeEntry.id ?? activeEntry.credential_id ?? activeEntry.provider
        : activeEntry;

    // `active` map wins when present; it may name the credential id or its provider.
    let activeId = credentials.find((c) => c.active)?.id ?? null;
    if (activeVal !== undefined && activeVal !== null) {
      const match = credentials.find(
        (c) => String(c.id) === String(activeVal) || c.provider === activeVal,
      );
      activeId = match ? match.id : null; // "system" or unknown → our key
    }

    return {
      ...cap,
      providers: providersFor(payload, cap.id),
      credentials: credentials.map((c) => ({ ...c, active: c.id === activeId })),
      activeId,
    };
  });
}
