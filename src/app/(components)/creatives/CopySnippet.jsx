"use client";

// app/(components)/creatives/CopySnippet.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A design's copy, cut down to what fits on a result card without turning it
// into a long rectangle: the title on one line, the description on two, and a
// single line of hashtags. Used by the generator result grids (Create from
// URL / the studio forms, and the AI chat page).
//
// Reads both copy shapes (see (lib)/designCopy): the current one (title,
// description, primary_text, hashtags…) and the older headline / tagline /
// body. Renders nothing when there's no copy.

import { hashtagLine, list, parseCopy, str } from "@/(lib)/designCopy";

const clamp = (lines) => ({
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});

/**
 * @param {object} props
 * @param {object|string} props.copy
 * @param {number} [props.size]  Base font size in px (the title); the rest scale from it.
 */
export default function CopySnippet({ copy, size = 10 }) {
  const c = parseCopy(copy);
  const fb = c.platforms?.facebook || {};
  const title = str(c.title) || str(c.headline) || str(fb.headline) || list(c.headlines)[0];
  const description =
    str(c.description) || str(c.tagline) || str(fb.description) || str(c.primary_text) || str(c.body);
  const tags = list(c.hashtags).length ? list(c.hashtags) : list(c.platforms?.instagram?.hashtags);
  const shown = hashtagLine(tags.slice(0, 3));
  const more = tags.length - 3;

  if (!title && !description && !shown) return null;

  return (
    <div style={{ margin: "0 0 6px" }}>
      {title && (
        <p
          title={title}
          style={{
            fontSize: size,
            fontWeight: 700,
            color: "var(--color-gray-900)",
            margin: "0 0 2px",
            lineHeight: 1.3,
            ...clamp(1),
          }}
        >
          {title}
        </p>
      )}
      {description && (
        <p
          title={description}
          style={{
            fontSize: size - 1,
            color: "var(--color-gray-500)",
            margin: "0 0 3px",
            lineHeight: 1.45,
            ...clamp(2),
          }}
        >
          {description}
        </p>
      )}
      {shown && (
        <p
          title={hashtagLine(tags)}
          style={{
            fontSize: size - 1.5,
            color: "var(--color-blue-600)",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {shown}
          {more > 0 && <span style={{ color: "var(--color-gray-400)" }}> +{more}</span>}
        </p>
      )}
    </div>
  );
}
