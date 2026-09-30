/**
 * AddAiKeyModal.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Save a provider key for one capability. The backend tests the key against the
 * provider before storing, so a rejection is shown inline under the key field
 * (it's the provider's own message — the most useful thing the user can see).
 *
 * `free_model` providers (fal) accept any model id, so the model field is a
 * free-text input with suggestions rather than a locked dropdown.
 */

"use client";

import { useId, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ResponsiveModal from "@/app/(components)/ui/ResponsiveModal";
import Input from "@/app/(components)/ui/Input";
import { useManageApi } from "../lib/useManageApi";
import { PROVIDER_META } from "../lib/aiCredentials";

const selectClass =
  "w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-[13.5px] text-gray-900 outline-none transition-all focus:bg-surface focus:border-[#1447e6] focus:ring-3 focus:ring-[#1447e6]/10";

export default function AddAiKeyModal({ brandId, capability, initialProvider, onClose, onSaved }) {
  const { saveAiCredential } = useManageApi();
  const listId = useId();

  const providers = capability.providers;
  const [providerId, setProviderId] = useState(initialProvider || providers[0]?.id || "");
  const provider = providers.find((p) => p.id === providerId);
  const [model, setModel] = useState(provider?.models[0]?.id || "");
  const [apiKey, setApiKey] = useState("");
  const [activate, setActivate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = PROVIDER_META[providerId] || {};

  const pickProvider = (id) => {
    setProviderId(id);
    setModel(providers.find((p) => p.id === id)?.models[0]?.id || "");
    setError("");
  };

  const save = async () => {
    const key = apiKey.trim();
    if (!key) return setError("Paste your API key.");
    if (providerId === "fal_byok" && !key.includes(":")) {
      return setError("fal keys look like key_id:key_secret — paste the whole thing, colon included.");
    }

    setSaving(true);
    setError("");
    const res = await saveAiCredential(brandId, {
      capability: capability.id,
      provider: providerId,
      api_key: key,
      model: model.trim() || undefined,
      activate,
    });
    setSaving(false);

    if (!res.ok) return setError(res.message);
    toast.success(`${provider?.label || providerId} key verified and saved`);
    onSaved();
  };

  return (
    <ResponsiveModal
      isOpen
      onClose={onClose}
      dismissible={!saving}
      title={`Add ${capability.label.toLowerCase()} key`}
      icon={KeyRound}
      footer={
        <>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#155dfc] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Verifying…" : "Verify & save"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Provider</label>
          <select
            value={providerId}
            onChange={(e) => pickProvider(e.target.value)}
            disabled={saving}
            className={selectClass}
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <Input
          label="API key"
          password
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setError(""); }}
          placeholder={meta.placeholder}
          disabled={saving}
          error={error}
          hint={meta.hint || "Tested against the provider before it's stored. Encrypted at rest."}
        />

        {(provider?.models.length > 0 || provider?.freeModel) && (
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Model</label>
            {provider.freeModel ? (
              <>
                <input
                  list={listId}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Pick a suggestion or paste any model id"
                  disabled={saving}
                  spellCheck={false}
                  className={selectClass}
                />
                <datalist id={listId}>
                  {provider.models.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </datalist>
                <p className="mt-1.5 text-[11px] leading-snug text-gray-400">
                  Any model id from {provider.label} works — the list is only suggestions.
                </p>
              </>
            ) : (
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={saving}
                className={selectClass}
              >
                {provider.models.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 accent-[#155dfc]"
          />
          Use this key for {capability.label.toLowerCase()} right away
        </label>
      </div>
    </ResponsiveModal>
  );
}
