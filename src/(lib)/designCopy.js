// (lib)/designCopy.js
// ─────────────────────────────────────────────────────────────────────────────
// A saved design's `copy` — the text the backend writes for each creative —
// read for Creative Studio's design sidebar and its "Copy Text" button, and
// laid out for the composers when a design is published (postFromCopy /
// adFromCopy).
//
// TWO SHAPES arrive from GET creative-designs (`copy` is a JSON string):
//
//   current   { title, description, primary_text, cta, alt_text,
//               headlines[], descriptions[], hashtags[], keywords[], tags[],
//               platforms: {
//                 facebook:   { primary_text, headline, description },
//                 instagram:  { caption, hashtags[] },
//                 x:          { post },          linkedin: { post },
//                 tiktok:     { caption },
//                 pinterest:  { title, description },
//                 youtube:    { title, description, tags[] },
//                 google_ads: { headlines[], long_headline, descriptions[] } } }
//   older     { headline, tagline, body, cta }
//
// A design saved before the backend wrote copy has `"{}"` — hasCopy() is false.

/** `copy` as an object, whatever it arrived as. Never null. */
export function parseCopy(copy) {
  if (!copy) return {};
  if (typeof copy === "string") {
    try {
      const parsed = JSON.parse(copy);
      return parsed && typeof parsed === "object" ? parsed : { body: String(parsed) };
    } catch {
      return { body: copy };
    }
  }
  return typeof copy === "object" ? copy : {};
}

export const str = (v) => (typeof v === "string" ? v.trim() : "");
export const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** Whether there is any copy to show. */
export function hasCopy(copy) {
  const c = parseCopy(copy);
  return Object.values(c).some((v) =>
    Array.isArray(v) ? list(v).length > 0 : v && typeof v === "object" ? Object.keys(v).length > 0 : !!str(v),
  );
}

/** Hashtags as a "#a #b" line, with any missing "#" added. */
export const hashtagLine = (tags) =>
  list(tags)
    .map((t) => (t.startsWith("#") ? t : `#${t.replace(/\s+/g, "")}`))
    .join(" ");

/** A caption with the hashtags underneath, unless it already carries some. */
const withHashtags = (text, tags) => {
  const line = hashtagLine(tags);
  if (!text || !line || /(^|\s)#\w/.test(text)) return text;
  return `${text}\n\n${line}`;
};

/** The main text in the older shape: headline — tagline, body, CTA. */
const legacyText = (c) =>
  str(c.headline)
    ? [`${str(c.headline)}${str(c.tagline) ? ` — ${str(c.tagline)}` : ""}`, str(c.body), str(c.cta)]
        .filter(Boolean)
        .join("\n\n")
    : str(c.body);

/**
 * The copy laid out for the Create new post composer. Each network gets the
 * text written for it; a network with none follows the main text, and
 * anything the copy doesn't have is left blank.
 *
 * @returns {{
 *   text: string,                          the main (template) text
 *   networkText: Object<string, string>,   composer network id → its own text
 *   options: Object<string, {title}>,      Pinterest / YouTube titles
 *   platforms: string[],                   networks the copy was written for
 * }}
 */
export function postFromCopy(copy) {
  const c = parseCopy(copy);
  const p = c.platforms || {};
  const texts = {
    facebook: str(p.facebook?.primary_text),
    instagram: withHashtags(str(p.instagram?.caption), p.instagram?.hashtags || c.hashtags),
    twitter: str(p.x?.post) || str(p.twitter?.post),
    linkedin: str(p.linkedin?.post),
    tiktok: str(p.tiktok?.caption),
    pinterest: str(p.pinterest?.description),
    youtube: str(p.youtube?.description),
  };
  const options = {};
  if (str(p.pinterest?.title)) options.pinterest = { title: str(p.pinterest.title) };
  if (str(p.youtube?.title)) options.youtube = { title: str(p.youtube.title) };

  const text = str(c.primary_text) || texts.facebook || legacyText(c);
  const networkText = Object.fromEntries(
    Object.entries(texts).filter(([, v]) => v && v !== text),
  );
  const platforms = Object.keys(texts).filter((k) => texts[k] || options[k]);
  return { text, networkText, options, platforms };
}

/** The first ad's copy for the Create campaign composer — blanks where absent. */
export function adFromCopy(copy) {
  const c = parseCopy(copy);
  const fb = c.platforms?.facebook || {};
  return {
    title: str(fb.headline) || list(c.headlines)[0] || str(c.title) || str(c.headline),
    description: str(fb.description) || str(c.description) || str(c.tagline),
    text: str(fb.primary_text) || str(c.primary_text) || str(c.body),
  };
}

const NETWORK_LABELS = {
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  twitter: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  youtube: "YouTube",
  google_ads: "Google Ads",
};
export const networkLabel = (id) =>
  NETWORK_LABELS[id] || id.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase());

/** "primary_text" → "Primary text". */
export const fieldLabel = (key) =>
  ({ cta: "Call to action", alt_text: "Alt text", long_headline: "Long headline" })[key] ||
  key.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase());

/** Everything, as readable plain text — what "Copy Text" puts on the clipboard. */
export function copyAsText(copy) {
  const c = parseCopy(copy);
  const lines = [];
  for (const [key, value] of Object.entries(c)) {
    if (key === "platforms") continue;
    if (Array.isArray(value)) {
      const items = list(value);
      if (!items.length) continue;
      lines.push(
        key === "hashtags"
          ? `Hashtags:\n${hashtagLine(items)}`
          : `${fieldLabel(key)}:\n${items.map((v) => `• ${v}`).join("\n")}`,
      );
    } else if (str(value)) lines.push(`${fieldLabel(key)}:\n${str(value)}`);
  }
  for (const [net, fields] of Object.entries(c.platforms || {})) {
    if (!fields || typeof fields !== "object") continue;
    const parts = Object.entries(fields)
      .map(([k, v]) =>
        Array.isArray(v)
          ? list(v).length > 0 &&
            `${fieldLabel(k)}: ${k === "hashtags" ? hashtagLine(v) : list(v).join(" · ")}`
          : str(v) && `${fieldLabel(k)}: ${str(v)}`,
      )
      .filter(Boolean);
    if (parts.length) lines.push(`— ${networkLabel(net)} —\n${parts.join("\n")}`);
  }
  return lines.join("\n\n");
}
