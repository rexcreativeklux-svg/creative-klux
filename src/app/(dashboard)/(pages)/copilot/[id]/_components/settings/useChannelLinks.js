"use client";

/**
 * The links that carry a copilot into WhatsApp / Telegram, from
 * `GET copilots/{id}`:
 *
 *   { data: {…}, channels: { link_code, link_message, whatsapp, telegram, instructions } }
 *
 * ⚠️ The link block sits BESIDE `data`, not on the record — `copilot.channels`
 * is a different thing entirely (which channels the copilot may answer on, where
 * null means all). That is why this fetches instead of reading the list row:
 * the list carries no links, and the record's `channels` would read as "none".
 *
 * Fetched each time the connect view opens rather than cached in the store —
 * the code is a secret that rotates with the copilot's slug, and a stale one
 * links nobody.
 */

import { useCallback, useEffect, useState } from "react";
import { getCopilot } from "../../../_data/copilotApi";

const isRecord = (v) => Boolean(v) && typeof v === "object" && !Array.isArray(v);

/**
 * Where the deep links point, from the backend's channel doc. Only used when the
 * response carries `link_code` but not the `channels` block — the live API did
 * exactly that on 2026-09-27. When the block arrives it wins, so a change of
 * number or bot on the server cannot be overruled by these.
 */
const WHATSAPP_NUMBER = "14155238886";
const TELEGRAM_BOT = "creativekluxbot";

/** The link block — the server's own, else built from the record's code. */
const linksFrom = (payload) => {
  const block = [payload?.channels, payload?.data?.channels].find(
    (b) => isRecord(b) && b.link_code,
  );
  if (block) return block;

  const record = payload?.data;
  const code = isRecord(record) ? record.link_code : null;
  if (!code) return null;

  const message = record.link_message || `LINK ${code}`;
  return {
    link_code: code,
    link_message: message,
    whatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`,
    telegram: `https://t.me/${TELEGRAM_BOT}?start=${encodeURIComponent(code)}`,
  };
};

export default function useChannelLinks(copilotId) {
  const [attempt, setAttempt] = useState(0);
  // Tagged with the request it answers, so "loading" is simply "the result on
  // hand is for some other copilot / attempt" — no reset needed in the effect.
  const key = `${copilotId}:${attempt}`;
  const [result, setResult] = useState({ key: null, links: null, error: null });

  useEffect(() => {
    if (!copilotId) return;
    let alive = true;
    getCopilot(copilotId)
      .then((payload) => {
        if (!alive) return;
        const links = linksFrom(payload);
        setResult({
          key,
          links,
          error: links ? null : "This copilot has no link code yet.",
        });
      })
      .catch((err) => {
        if (!alive) return;
        setResult({
          key,
          links: null,
          error: err?.message || "Could not load the link for this copilot.",
        });
      });
    return () => {
      alive = false;
    };
  }, [copilotId, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const current = result.key === key;
  return {
    links: current ? result.links : null,
    error: current ? result.error : null,
    loading: !current,
    retry,
  };
}
