// app/(dashboard)/(pages)/magic-studio/page.jsx
// ─────────────────────────────────────────────────────────────────────────────
// /magic-studio has no screen of its own — it opens the FIRST tool.
//
// The section is a set of tools, and every one of them is a working surface:
// its own history above, its own prompt below. A landing page in front of them
// would be a menu duplicating the secondary sidebar, one click from anywhere
// useful. So the sidebar's Magic Studio icon lands you in the first tool the
// side nav lists, ready to work, and the panel is how you get to the rest.
//
// A SERVER redirect, deliberately — it resolves before anything paints, where a
// client-side one would flash an empty frame first. /magic-studio stays a real,
// linkable URL either way, which is why the sidebar still points at it rather
// than at whichever tool happens to be first today.

import { redirect } from "next/navigation";
import { MAGIC_TOOLS } from "./magicTools";

export default function MagicStudioIndexPage() {
  // Skips a tool kept out of the nav — landing on a screen the panel doesn't
  // list would leave nothing highlighted and no way back to it.
  const first = MAGIC_TOOLS.find((tool) => tool.nav !== false);
  redirect(`/magic-studio/${first.slug}`);
}
