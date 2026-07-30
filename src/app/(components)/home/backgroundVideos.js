// app/(components)/home/backgroundVideos.js
// ─────────────────────────────────────────────────────────────────────────────
// The clips that play behind the home page hero.
//
// ➜ TO ADD A NEW BACKGROUND: paste its URL into the array below. That's it.
//   Nothing else needs touching — the rotation, the fade-in and the fallback all
//   read from this list and adapt to whatever length it has.
//
// One clip is shown per user per 24 hours (see useDailyVideo.js), so the order
// here is the order users move through. Keep them in the mood you want the app
// to open in.
//
// What makes a good clip here — the hero sits at low opacity under a heavy
// scrim, so the video reads as ATMOSPHERE, not content:
//   · slow, continuous motion (no hard cuts — a cut reads as a glitch)
//   · loops without an obvious seam
//   · no text, faces or focal subjects that fight the greeting above it
//   · muted by definition; these never play audio
//   · keep them small — they're decorative, and every visitor downloads one

/** @type {string[]} Absolute URLs, served from the CreativeKlux CDN. */
export const BACKGROUND_VIDEOS = [
  "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/videos/creativeklux-file-1785418796-6a6b542c1d9af.mp4",
  // "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/videos/creativeklux-file-1785418832-6a6b54504b9ce.mp4",
  "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/videos/creativeklux-file-1785418147-6a6b51a32d9a0.mp4",
  // "https://d3r8chxzp8ea06.cloudfront.net/creativeklux/videos/creativeklux-file-1784126442-6a579bea28e69.mp4",
];

export default BACKGROUND_VIDEOS;
