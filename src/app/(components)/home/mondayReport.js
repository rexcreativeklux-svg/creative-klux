// mondayReport.js — the home page's weekly report, built from the data the
// page already loaded (useHomeData): published posts and their numbers, ad
// campaigns' last-7-days metrics, and the Smart Inbox summary.
//
// Nothing here is invented. A part with no data is left out (or says there was
// none) rather than filled with a 0, and there is no "what I'll do this week"
// line — that needs an AI plan the backend doesn't produce yet.
//
// downloadReportPdf() writes it out with jsPDF (already a dependency), loaded on
// click so it stays out of the home page's bundle.

const DAY = 24 * 60 * 60 * 1000;

const sum = (rows, key) =>
  rows.reduce((t, r) => (typeof r[key] === "number" ? (t ?? 0) + r[key] : t), undefined);

const num = (n) => (n === undefined ? "–" : Math.round(n).toLocaleString("en-US"));
// Ad amounts exactly as the backend sends them: it returns no currency, so
// none is shown, and nothing is converted.
const usd = (n) =>
  n === undefined || n === null ? "–" : n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const day = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const NETWORK = {
  facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn",
  twitter: "X", x: "X", youtube: "YouTube", pinterest: "Pinterest",
  meta_ads: "Meta", google_ads: "Google", tiktok_ads: "TikTok", snapchat_ads: "Snapchat", pinterest_ads: "Pinterest",
};
export const networkLabel = (p) => NETWORK[p] || p;

/**
 * @param {{posts: object, campaigns: object, inbox: object, brandName?: string, now?: Date}} data
 *   The three useHomeData sections, already loaded.
 */
export function buildReport({ posts, campaigns, inbox, brandName, now = new Date() }) {
  // Today and the 6 days before it, from midnight — the same week the rest of
  // the home page uses (networkInsights periods(7)).
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  from.setTime(from.getTime() - 6 * DAY);
  const range = `${day(from)} – ${day(now)}, ${now.getFullYear()}`;

  // ── Posts ──
  const recent = posts?.recent || [];
  const week = recent.filter((p) => p.date && new Date(p.date) >= from);
  const ranked = [...(week.length ? week : recent)].sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const postTotals = {
    count: week.length,
    likes: sum(week, "likes"),
    comments: sum(week, "comments"),
    shares: sum(week, "shares"),
    views: sum(week, "views"),
  };

  // ── Ads ──
  const ads = campaigns?.all || [];
  const adTotals = {
    count: ads.length,
    running: ads.filter((c) => /^(ACTIVE|ENABLED)$/i.test(c.status || "")).length,
    spend: sum(ads, "spend"),
    clicks: sum(ads, "clicks"),
    conversions: sum(ads, "conversions"),
  };

  // ── Inbox ──
  const s = inbox?.summary;
  const inboxTotals = s
    ? {
        conversations: s.conversations_7d ?? 0,
        // null until the AI has answered something — shown as "–", never 0%.
        aiPercent: s.answered_by_ai,
        waiting: inbox.needs ?? s.waiting ?? 0,
        customers: s.customers_7d,
      }
    : null;

  // ── The paragraph on the card ──
  const parts = [];
  if (postTotals.count) {
    const bits = [`${postTotals.count} post${postTotals.count === 1 ? "" : "s"} published`];
    if (postTotals.views !== undefined) bits.push(`${num(postTotals.views)} views`);
    if (postTotals.likes !== undefined) bits.push(`${num(postTotals.likes)} likes`);
    parts.push(`Last 7 days: ${bits.join(", ")}.`);
  } else if (recent.length) {
    parts.push("No posts were published in the last 7 days.");
  }
  if (best) {
    // Emoji out and trimmed, so the PDF (which can't draw emoji) doesn't end
    // the quote with a stray space.
    const title = best.title.replace(/\p{Extended_Pictographic}|️|‍/gu, "").replace(/\s+/g, " ").trim();
    parts.push(
      `Your best ${week.length ? "" : "recent "}post was "${title.slice(0, 60)}${title.length > 60 ? "…" : ""}" on ${networkLabel(best.platform)}` +
        (best.likes !== undefined ? ` with ${num(best.likes)} likes.` : "."),
    );
  }
  if (adTotals.count) {
    parts.push(
      `Ads: ad spend ${usd(adTotals.spend ?? 0)} across ${adTotals.count} campaign${adTotals.count === 1 ? "" : "s"}` +
        (adTotals.clicks !== undefined ? `, ${num(adTotals.clicks)} clicks` : "") +
        (adTotals.conversions !== undefined ? `, ${num(adTotals.conversions)} conversions` : "") +
        ".",
    );
  }
  if (inboxTotals) {
    parts.push(
      inboxTotals.conversations
        ? `Smart Inbox: ${inboxTotals.conversations} conversations${inboxTotals.aiPercent == null ? "" : `, ${inboxTotals.aiPercent}% answered by AI`}, ${inboxTotals.waiting} waiting for you.`
        : "Smart Inbox: no conversations yet.",
    );
  }

  return {
    brandName: brandName || "Your brand",
    range,
    generatedAt: now,
    summary: parts.join(" "),
    empty: !parts.length,
    posts: { ...postTotals, best, top: ranked.slice(0, 5) },
    ads: { ...adTotals, list: ads },
    inbox: inboxTotals,
  };
}

// jsPDF's built-in Helvetica only has the WinAnsi characters. Post titles can
// hold emoji and other scripts that would print as garbage, so anything outside
// Latin-1 (bar the dashes, bullets and quotes WinAnsi does carry) is dropped.
const WINANSI_EXTRA = "–—·…‘’“”•€™";
const safe = (s) =>
  String(s ?? "")
    .split("")
    .filter((ch) => ch.charCodeAt(0) <= 0xff || WINANSI_EXTRA.includes(ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim();

/** Save the report as a one-page (or more) A4 PDF. */
export async function downloadReportPdf(report) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 0;

  const ensure = (h) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };
  const text = (str, { size = 11, bold = false, color = [13, 15, 20], x = M, maxW = W - 2 * M, gap = 4 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(safe(str), maxW);
    const lh = size * 1.35;
    ensure(lines.length * lh);
    doc.text(lines, x, y + size);
    y += lines.length * lh + gap;
  };
  const heading = (str) => {
    y += 10;
    text(str, { size: 13, bold: true, color: [20, 71, 230], gap: 6 });
  };
  const row = (cells, widths, { bold = false, color = [48, 52, 61] } = {}) => {
    ensure(18);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...color);
    let x = M;
    cells.forEach((c, i) => {
      const w = widths[i];
      const s = doc.splitTextToSize(safe(c ?? "–"), w - 8)[0] || "";
      doc.text(s, i === 0 ? x : x + w - 8, y + 10, i === 0 ? undefined : { align: "right" });
      x += w;
    });
    y += 16;
    doc.setDrawColor(230, 232, 236);
    doc.line(M, y - 3, W - M, y - 3);
  };

  // Header band
  doc.setFillColor(11, 21, 51);
  doc.rect(0, 0, W, 96, "F");
  y = 30;
  text("Monday report", { size: 20, bold: true, color: [255, 255, 255], gap: 2 });
  text(`${report.brandName} · ${report.range}`, { size: 11, color: [199, 212, 255] });
  y = 120;

  text(report.empty ? "There's no data for this week yet. Connect your social and ad accounts to fill this report." : report.summary, {
    size: 11.5,
    color: [48, 52, 61],
    gap: 8,
  });

  // Posts
  const p = report.posts;
  heading("Social posts");
  text(
    `Published in the last 7 days: ${p.count}   ·   Views: ${num(p.views)}   ·   Likes: ${num(p.likes)}   ·   Comments: ${num(p.comments)}   ·   Shares: ${num(p.shares)}`,
    { size: 10, color: [74, 79, 92], gap: 8 },
  );
  if (p.top.length) {
    const widths = [W - 2 * M - 4 * 62, 62, 62, 62, 62];
    row(["Post", "Likes", "Comments", "Shares", "Views"], widths, { bold: true, color: [107, 112, 128] });
    p.top.forEach((t) =>
      row(
        [`${t.date ? day(new Date(t.date)) + " · " : ""}${networkLabel(t.platform)} — ${t.title}`, num(t.likes), num(t.comments), num(t.shares), num(t.views)],
        widths,
      ),
    );
  } else {
    text("No published posts found on your connected accounts.", { size: 10, color: [107, 112, 128] });
  }

  // Ads
  const a = report.ads;
  heading("Ad campaigns (last 7 days)");
  if (a.list.length) {
    text(
      `Campaigns: ${a.count} (${a.running} running)   ·   Spend: ${usd(a.spend ?? 0)}   ·   Clicks: ${num(a.clicks)}   ·   Conversions: ${num(a.conversions)}`,
      { size: 10, color: [74, 79, 92], gap: 8 },
    );
    const widths = [W - 2 * M - 4 * 66, 66, 66, 66, 66];
    row(["Campaign", "Status", "Spend", "Clicks", "Conversions"], widths, { bold: true, color: [107, 112, 128] });
    a.list.forEach((c) =>
      row([`${networkLabel(c.platform)} — ${c.name}`, (c.status || "").toLowerCase(), usd(c.spend), num(c.clicks), num(c.conversions)], widths),
    );
  } else {
    text("No ad campaigns found on your connected ad accounts.", { size: 10, color: [107, 112, 128] });
  }

  // Inbox
  heading("Smart Inbox (last 7 days)");
  const i = report.inbox;
  text(
    i
      ? `Conversations: ${i.conversations}   ·   Answered by AI: ${i.aiPercent == null ? "–" : `${i.aiPercent}%`}   ·   Waiting for you: ${i.waiting}` +
          (i.customers !== undefined ? `   ·   New customers: ${i.customers}` : "")
      : "Smart Inbox data wasn't available.",
    { size: 10, color: [74, 79, 92] },
  );

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(154, 160, 173);
  const pages = doc.getNumberOfPages();
  for (let n = 1; n <= pages; n++) {
    doc.setPage(n);
    doc.text(
      `Creative Klux · generated ${report.generatedAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · page ${n} of ${pages}`,
      M,
      H - 24,
    );
  }

  const stamp = report.generatedAt.toISOString().slice(0, 10);
  doc.save(`monday-report-${stamp}.pdf`);
}
