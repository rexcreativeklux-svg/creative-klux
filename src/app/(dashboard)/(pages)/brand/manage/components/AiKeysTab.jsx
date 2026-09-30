/**
 * AiKeysTab.jsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Bring-your-own-key settings for chat, image and video. With no key active a
 * capability runs on Creativeklux's key and costs tokens; with the brand's own
 * key active the provider bills them directly and no tokens are charged.
 *
 * One provider is active per capability (the backend stands the others down
 * atomically), so each card reads like a radio group: the Creativeklux row plus
 * every saved key, exactly one marked Active. Every mutation refetches rather
 * than patching local state, so the UI can't drift from what the backend did.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Check,
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Info,
  Coins,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import ConfirmDialog from "@/app/(components)/ConfirmDialog";
import { useManageApi } from "../lib/useManageApi";
import {
  AI_CAPABILITIES,
  SYSTEM_PROVIDER_LABEL,
  normalizeAiCredentials,
  providerLabel,
} from "../lib/aiCredentials";
import AddAiKeyModal from "./AddAiKeyModal";

function ActiveBadge() {
  return (
    <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs text-green-700">
      <Check className="h-3 w-3" />
      Active
    </span>
  );
}

function RowButton({ onClick, busy, disabled, danger, children, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      title={title}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 cursor-pointer ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function SystemRow({ capability, active, busy, disabled, onUse }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#155dfc]">
        <Coins className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Creativeklux key</span>
          {active && <ActiveBadge />}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {SYSTEM_PROVIDER_LABEL[capability.id]} · paid in tokens
        </p>
      </div>
      {!active && (
        <RowButton onClick={onUse} busy={busy} disabled={disabled}>
          Use
        </RowButton>
      )}
    </div>
  );
}

function CredentialRow({ cred, busyAction, disabled, onActivate, onVerify, onRemove }) {
  const failed = cred.status === "failed" || cred.status === "invalid" || !!cred.error;
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <KeyRound className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">
            {providerLabel(cred.provider)}
          </span>
          {cred.active && <ActiveBadge />}
          {failed && (
            <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              Check failed
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">
          {[cred.model, cred.keyPreview, "billed by provider"].filter(Boolean).join(" · ")}
        </p>
        {cred.error && <p className="mt-0.5 truncate text-xs text-amber-700">{cred.error}</p>}
      </div>
      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {!cred.active && (
          <RowButton onClick={onActivate} busy={busyAction === "activate"} disabled={disabled}>
            Use
          </RowButton>
        )}
        <RowButton
          onClick={onVerify}
          busy={busyAction === "verify"}
          disabled={disabled}
          title="Re-check this key with the provider"
        >
          {busyAction !== "verify" && <RefreshCw className="h-3.5 w-3.5" />}
          Re-check
        </RowButton>
        <RowButton onClick={onRemove} disabled={disabled} danger title="Remove key">
          <Trash2 className="h-3.5 w-3.5" />
        </RowButton>
      </div>
    </div>
  );
}

function CapabilityCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-surface">
      <div className="flex items-center justify-between px-4 py-4 sm:px-5">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-56 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-24 rounded-lg bg-gray-100" />
      </div>
      <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-3 sm:px-5">
        <div className="h-9 w-9 rounded-lg bg-gray-100" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 rounded bg-gray-200" />
          <div className="h-3 w-40 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function AiKeysTab({ brandId }) {
  const api = useManageApi();
  const [capabilities, setCapabilities] = useState(null);
  const [loadError, setLoadError] = useState("");
  // { key: "chat:system" | `${credId}`, action: "activate" | "verify" | "system" }
  const [busy, setBusy] = useState(null);
  const [adding, setAdding] = useState(null); // capability object
  const [removing, setRemoving] = useState(null); // credential
  const [removeBusy, setRemoveBusy] = useState(false);

  const apply = (res) => {
    if (!res.ok) return setLoadError(res.message);
    setLoadError("");
    setCapabilities(normalizeAiCredentials(res.data));
  };

  const load = useCallback(
    () => api.getAiCredentials(brandId).then(apply),
    [api, brandId],
  );

  useEffect(() => {
    let cancelled = false;
    api.getAiCredentials(brandId).then((res) => {
      if (!cancelled) apply(res);
    });
    return () => {
      cancelled = true;
    };
  }, [api, brandId]);

  const run = async (key, action, call, successMsg) => {
    setBusy({ key, action });
    const res = await call();
    if (res.ok) {
      toast.success(successMsg);
      await load();
    } else {
      toast.error(res.message);
      // A failed re-check may have updated the row's status server-side.
      if (action === "verify") await load();
    }
    setBusy(null);
  };

  // Takes the credential as an argument rather than reading `removing` — the
  // React Compiler memoizes on whatever the body reads, and `removing.id` as a
  // cache key throws on every render while nothing is being removed.
  const confirmRemove = async (cred) => {
    setRemoveBusy(true);
    const res = await api.deleteAiCredential(brandId, cred.id);
    setRemoveBusy(false);
    if (!res.ok) return toast.error(res.message);
    toast.success("Key removed");
    setRemoving(null);
    load();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4 sm:p-6">
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#c7d9fd] bg-[#eff4ff] px-4 py-3.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#155dfc]" />
        <p className="text-sm leading-relaxed text-[#1e40af]">
          <span className="font-semibold">Bring your own API key: </span>
          by default this brand runs on Creativeklux&apos;s AI and pays in tokens.
          Add your own provider key and that provider bills you directly — no
          tokens are charged for that capability.
        </p>
      </div>

      {loadError && !capabilities ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 py-12 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <p className="text-sm text-gray-600">Couldn&apos;t load AI keys: {loadError}</p>
          <button
            onClick={load}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(capabilities || AI_CAPABILITIES).map((cap) =>
            !capabilities ? (
              <CapabilityCardSkeleton key={cap.id} />
            ) : (
              <div key={cap.id} className="rounded-xl border border-gray-200 bg-surface">
                <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold tracking-tight text-gray-900">{cap.label}</h2>
                    <p className="mt-0.5 text-xs text-gray-500">{cap.description}</p>
                  </div>
                  <button
                    onClick={() => setAdding(cap)}
                    disabled={!!busy}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:scale-105 disabled:opacity-60 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #155dfc, #3b82f6)" }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add key
                  </button>
                </div>

                <div className="divide-y divide-gray-100 border-t border-gray-100">
                  <SystemRow
                    capability={cap}
                    active={cap.activeId === null}
                    busy={busy?.key === `${cap.id}:system`}
                    disabled={!!busy}
                    onUse={() =>
                      run(
                        `${cap.id}:system`,
                        "system",
                        () => api.revertToSystemAiKey(brandId, cap.id),
                        `${cap.label} is back on Creativeklux's key`,
                      )
                    }
                  />
                  {cap.credentials.map((cred) => (
                    <CredentialRow
                      key={cred.id}
                      cred={cred}
                      disabled={!!busy}
                      busyAction={busy?.key === String(cred.id) ? busy.action : null}
                      onActivate={() =>
                        run(
                          String(cred.id),
                          "activate",
                          () => api.activateAiCredential(brandId, cred.id),
                          `${cap.label} now uses your ${providerLabel(cred.provider)} key`,
                        )
                      }
                      onVerify={() =>
                        run(
                          String(cred.id),
                          "verify",
                          () => api.verifyAiCredential(brandId, cred.id),
                          `${providerLabel(cred.provider)} key is working`,
                        )
                      }
                      onRemove={() => setRemoving(cred)}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {adding && (
        <AddAiKeyModal
          brandId={brandId}
          capability={adding}
          onClose={() => setAdding(null)}
          onSaved={() => {
            setAdding(null);
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={!!removing}
        title="Remove this key?"
        message={
          removing?.active
            ? `This key is active. Removing it switches ${removing?.capability} back to Creativeklux's key, which is paid in tokens.`
            : "The key will be deleted from this brand."
        }
        confirmLabel="Remove"
        variant="danger"
        busy={removeBusy}
        onConfirm={() => removing && confirmRemove(removing)}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
