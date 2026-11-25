"use client";

// The sidebar's Smart Inbox and SmartLinks badges: conversations that need you,
// and how many SmartLinks the brand has. Reloads when the brand changes, when a
// Smart page reports a change ("ck-smart-changed"), and every minute.
// null while loading, so the sidebar shows nothing rather than a wrong 0.

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchInboxConversations } from "@/(lib)/smartInboxApi";
import { fetchLinks } from "@/(lib)/smartLinksApi";

export default function useSmartCounts() {
  const { activeBrandId, token } = useAuth();
  const [counts, setCounts] = useState({ needs: null, links: null });

  useEffect(() => {
    if (!activeBrandId || !token) return;
    let alive = true;
    const load = () => {
      fetchInboxConversations({ brandId: activeBrandId, tab: "needs", perPage: 5 })
        .then((r) => alive && setCounts((c) => ({ ...c, needs: r?.counts?.needs ?? 0 })))
        .catch(() => {});
      fetchLinks({}, { brandId: activeBrandId })
        .then((r) => alive && setCounts((c) => ({ ...c, links: r?.counts?.all ?? r?.links?.length ?? 0 })))
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 60_000);
    window.addEventListener("ck-smart-changed", load);
    return () => {
      alive = false;
      clearInterval(t);
      window.removeEventListener("ck-smart-changed", load);
    };
  }, [activeBrandId, token]);

  return counts;
}
