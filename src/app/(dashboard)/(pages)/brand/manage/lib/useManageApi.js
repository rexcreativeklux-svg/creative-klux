/**
 * useManageApi.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Thin, brand-scoped data layer for the Brand management page.
 *
 * The app's global data layer lives in AuthContext; these calls are colocated
 * here to keep that (already large) file from growing and because they're only
 * used by this page. They still reuse the shared auth `token` from AuthContext,
 * so behaviour (401 handling aside) matches the rest of the app. If the team
 * prefers everything in AuthContext, each function ports over verbatim.
 *
 * Every method resolves to a normalized shape:
 *   { ok: boolean, data: any, message: string }
 * so callers never touch raw fetch/JSON parsing.
 */

"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

// Same origin as AuthContext's BASE_URL (kept in sync manually — no export there).
const BASE_URL = "https://api.creativeklux.com/api/creativeklux-userend";

export function useManageApi() {
  const { token } = useAuth();

  // Core request helper — parses defensively and always returns a normalized result.
  const request = useCallback(
    async (path, { method = "GET", body } = {}) => {
      if (!token) {
        console.warn("⚠️ useManageApi: no auth token — request skipped:", path);
        return { ok: false, data: null, message: "Not authenticated" };
      }

      const url = `${BASE_URL}${path}`;
      try {
        const res = await fetch(url, {
          method,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            ...(body ? { "Content-Type": "application/json" } : {}),
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        });

        const text = await res.text();
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          console.error(`❌ useManageApi: non-JSON response from ${path}:`, text);
          return { ok: false, data: null, message: "Unexpected server response" };
        }

        if (!res.ok) {
          // Surface Laravel-style validation errors when present.
          const firstFieldError = data?.errors
            ? Object.values(data.errors)[0]?.[0]
            : null;
          const message =
            firstFieldError || data?.message || `Request failed (${res.status})`;
          console.warn(`❌ useManageApi ${method} ${path}:`, message);
          return { ok: false, data, message };
        }

        return { ok: true, data, message: data?.message || "" };
      } catch (err) {
        console.error(`❌ useManageApi ${method} ${path} threw:`, err);
        return { ok: false, data: null, message: err.message || "Network error" };
      }
    },
    [token],
  );

  return useMemo(
    () => ({
      // ── Members ────────────────────────────────────────────────────────────
      getMembers: (brandId) => request(`/brands/${brandId}/members`),

      inviteByEmail: (brandId, { email, role }) =>
        request(`/brands/${brandId}/members/invite-email`, {
          method: "POST",
          body: { email, role },
        }),

      updateMemberRole: (brandId, memberId, role) =>
        request(`/brands/${brandId}/members/${memberId}/role`, {
          method: "PATCH",
          body: { role },
        }),

      removeMember: (brandId, memberId) =>
        request(`/brands/${brandId}/members/${memberId}`, { method: "DELETE" }),

      leaveBrand: (brandId) =>
        request(`/brands/${brandId}/leave`, { method: "POST" }),

      // ── Invite links ───────────────────────────────────────────────────────
      getInviteLinks: (brandId) =>
        request(`/brands/${brandId}/members/invites`),

      createInviteLink: (brandId, { role, max_uses }) =>
        request(`/brands/${brandId}/members/invite-link`, {
          method: "POST",
          body: { role, max_uses },
        }),

      deleteInviteLink: (brandId, inviteId) =>
        request(`/brands/${brandId}/members/invites/${inviteId}`, {
          method: "DELETE",
        }),

      // ── Allocations ────────────────────────────────────────────────────────
      // slug ∈ { tokens, team, resells, creatives, integrations, storage }
      updateAllocation: (brandId, slug, value) =>
        request(`/brands/${brandId}/allocations/${slug}`, {
          method: "PATCH",
          body: { allocation: value },
        }),
    }),
    [request],
  );
}
