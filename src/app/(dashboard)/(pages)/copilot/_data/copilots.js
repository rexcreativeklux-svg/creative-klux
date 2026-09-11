"use client";

/**
 * The Copilot catalog — ONE list behind every Copilot surface: the sidebar's
 * Favorites + Recents sections and the /copilot/all grid.
 *
 * ⚠️ THIS IS NOW THE REAL API (`GET /copilots`, see ./copilotApi). It used to be
 * a seed array with a module-level store; the store stayed, the seed went. One
 * store rather than a `useState` per screen is still the point: favouriting on
 * /copilot/all has to light up in the sidebar's Favorites the same instant, and
 * deleting has to drop it from Recents.
 *
 * `useSyncExternalStore` rather than a context provider: the two consumers sit
 * on opposite sides of the dashboard layout (the sidebar and the page), so a
 * provider would have to wrap the whole shell to join them.
 *
 * ⚠️ `category` is a key into IDEAS (./ideas.js) — it decides which starter
 * ideas a copilot suggests. THE SERVER HAS NO SUCH FIELD, so every copilot
 * currently defaults to Brand; see adaptCopilot below. It needs to become a real
 * column, otherwise a product-photography copilot offers ad-buying starters.
 */

import { useSyncExternalStore } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Palette, CalendarDays, Megaphone, Camera, Radar, Mic } from "lucide-react";
import {
  createCopilot,
  describeApiError,
  destroyCopilot,
  listCopilots,
  patchCopilot,
  toCopilotRecord,
} from "./copilotApi";

/** How many copilots the sidebar's Recents lists before "View all" takes over. */
export const RECENTS_LIMIT = 3;

/**
 * Say out loud that a control is waiting on the backend.
 *
 * Every Copilot surface has some of these (opening a copilot, folders, sharing,
 * rename, settings), and they should all answer the same way — a control that
 * silently does nothing reads as broken, and the user clicks it twice before
 * giving up. Lives here beside the mock data so it disappears with it.
 *
 * @param {string} label What is missing, capitalised ("Folders", "Sharing").
 */
export const notifyPending = (label) =>
  toast(`${label} lands with the Copilot backend.`);

/**
 * Report a failed write in the SERVER'S OWN WORDS.
 *
 * ⚠️ THE SERVER'S SENTENCE IS THE HEADLINE, not ours. "Unknown integration
 * provider: facebook" is the line that tells the backend dev what to fix;
 * "Couldn't connect Facebook Pages" tells them nothing. So the server's message
 * is the toast's title and our own context drops to the description — the
 * reverse of the usual arrangement, and deliberate while the backend is being
 * brought up.
 *
 * Long enough to read (these are diagnostics, not confirmations), and with a
 * Copy action, because the next thing that happens to this text is being pasted
 * to whoever can fix it.
 *
 * @param {unknown} err   Whatever the request threw.
 * @param {string} what   What was being attempted ("Couldn't delete").
 */
export const reportFailure = (err, what) => {
  const { status, detail, text } = describeApiError(err);
  toast.error(detail, {
    description: status ? `${what} · HTTP ${status}` : what,
    duration: 12000,
    action: {
      label: "Copy",
      onClick: () => {
        navigator.clipboard?.writeText(`${what} — ${text}`);
        toast.success("Error copied");
      },
    },
  });
};

/**
 * Every `?c=` minted in this page load.
 *
 * ⚠️ OPENING A COPILOT LOADS ITS HISTORY FROM THE SERVER, and a minted
 * `?c=` is the one thing that says "not this time, give me a blank thread". But
 * a `?c=` outlives the click that meant it: it stays in the address bar, so a
 * refresh would go on showing the empty hero over messages the server has been
 * storing all along. Module state is exactly the right lifetime — an id is
 * "new" for every client-side navigation within one visit and stops being new
 * the moment the page is loaded again. Same arrangement as Macrid's agents.
 *
 * ⚠️ Dev-only wrinkle: a Fast Refresh that re-evaluates this module clears the
 * set, so a blank thread can flip to resuming mid-edit. It cannot happen in
 * production, where the module is evaluated once.
 */
const sessionConversations = new Set();

/**
 * An id for a conversation that does not exist server-side yet.
 *
 * It rides the URL as `?c=` and is the conversation's React `key`, so all it has
 * to be is different from the last one — that is what makes "New conversation"
 * an ordinary navigation instead of a no-op when you are already on the thread.
 *
 * ⚠️ EVENT HANDLERS ONLY, never during render: `Date.now()` is impure, so a
 * render that called it would produce a new key on every pass and remount the
 * conversation under the user. It lives out here rather than inline so the
 * two callers (the panel's New conversation, a workflow's Send to chat) mint
 * them the same way.
 */
export const newConversationId = () => {
  const id = Date.now().toString(36);
  sessionConversations.add(id);
  return id;
};

/**
 * Whether this `?c=` was minted by a click in the visit that is still running —
 * i.e. whether the blank thread it asked for is still the right answer.
 *
 * ⚠️ FALSE AFTER A RELOAD, AND THAT IS THE FEATURE. See the set above: by then
 * what was said in it is in `GET copilots/{id}/messages`, and loading that
 * history is right again.
 *
 * @param {string|null|undefined} conversationId
 * @returns {boolean}
 */
export const isSessionConversation = (conversationId) =>
  Boolean(conversationId) && sessionConversations.has(conversationId);

/* ── Server rows → what the UI renders ─────────────────────────────────────
 *
 * ⚠️ THE SERVER MODEL IS NARROWER THAN THE UI'S. A copilot row is
 * { id, name, description, instructions, greeting, channels, allowed_tools },
 * with no `category`, no icon and no tint — but every card, avatar and settings
 * sheet on this screen renders those. They are derived here, in one place, so
 * the rest of the feature keeps the shape it already renders.
 *
 * `category` in particular is NOT cosmetic: it picks which starter ideas a
 * copilot suggests (see ./ideas.js). Defaulted below, and flagged to the
 * backend as a field the API needs — a guess would put ad-buying starters in a
 * product-photography copilot.
 */

const GLYPHS = [Palette, CalendarDays, Megaphone, Camera, Radar, Mic];
const TINTS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-orange-500",
  "bg-violet-600",
  "bg-rose-500",
  "bg-cyan-600",
];

/** Stable per id, so a copilot keeps its face between renders and screens. */
const hashOf = (value) => {
  const key = String(value ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(hash);
};

/** "3 days ago" from a timestamp, or a plain fallback when none came back. */
const editedAgoFrom = (row) => {
  const stamp = row?.updated_at ?? row?.created_at;
  if (!stamp) return "recently";
  const at = new Date(stamp);
  if (Number.isNaN(at.getTime())) return "recently";
  return formatDistanceToNow(at, { addSuffix: true });
};

/** One server row in the shape the cards, avatar and settings sheet expect. */
export function adaptCopilot(row) {
  const id = row?.id;
  const seed = hashOf(id ?? row?.name);
  return {
    ...row,
    id: String(id),
    name: row?.name ?? "Untitled copilot",
    description: row?.description ?? "",
    // ⚠️ Not from the server — see above. Every copilot therefore suggests the
    // Brand starters until the API carries a category.
    category: row?.category ?? "Brand",
    Icon: GLYPHS[seed % GLYPHS.length],
    tint: TINTS[seed % TINTS.length],
    favorite: Boolean(row?.favorite),
    editedAgo: editedAgoFrom(row),
  };
}

/** The list out of a response, whichever envelope it arrives in. */
const rowsFrom = (data) => {
  const list = Array.isArray(data)
    ? data
    : (data?.data ?? data?.copilots ?? data?.items ?? []);
  return Array.isArray(list) ? list.map(adaptCopilot) : [];
};

/* ── The store ─────────────────────────────────────────────────────────────
 *
 * Still useSyncExternalStore rather than a context provider: the consumers sit
 * on opposite sides of the dashboard layout (the sidebar rail and the page), so
 * a provider would have to wrap the whole shell to join them.
 *
 * ⚠️ IT LOADS ONCE, ON FIRST SUBSCRIBE. Whichever surface mounts first triggers
 * the fetch; the second one joins the same store rather than firing a second
 * request. `loading` starts true so nothing renders "no copilots yet" during the
 * round trip — an empty catalog and an unfinished request look identical on
 * screen and mean opposite things.
 */

let state = { items: [], loading: true, error: null };
let started = false;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());

// Identity-stable while nothing has changed, which is what useSyncExternalStore
// needs — building a fresh object here would re-render on every check.
const snapshot = () => state;
const setState = (patch) => {
  state = { ...state, ...patch };
  emit();
};

const subscribe = (fn) => {
  listeners.add(fn);
  if (!started) {
    started = true;
    void refreshCopilots();
  }
  return () => listeners.delete(fn);
};

/** Server-render snapshot: never loading, because no fetch happens there. */
const SERVER_STATE = { items: [], loading: false, error: null };
const serverSnapshot = () => SERVER_STATE;

/** Re-read the catalog. Exported so a failed load can be retried from the UI. */
export async function refreshCopilots() {
  setState({ loading: true, error: null });
  try {
    setState({ items: rowsFrom(await listCopilots()), loading: false });
  } catch (err) {
    // The server's own words, kept intact — while the backend is being fixed
    // that sentence is the useful thing on the screen.
    setState({ loading: false, error: describeApiError(err).text });
  }
}

/** The live catalog. Unchanged contract: an array. */
export function useCopilots() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot).items;
}

/** The same store with its request state, for screens that show loading/errors. */
export function useCopilotsState() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

/**
 * Optimistic write: change the list now, put it back if the server refuses.
 *
 * ⚠️ The rollback restores the SNAPSHOT taken before the change, not an inverse
 * operation — inverting is only correct if nothing else moved in between, and
 * two writes overlapping is exactly when a rollback matters.
 */
async function optimistic(next, request) {
  const before = state.items;
  setState({ items: next });
  try {
    return await request();
  } catch (err) {
    setState({ items: before });
    throw err;
  }
}

/**
 * ⚠️ `favorite` IS NOT A DOCUMENTED SERVER FIELD. It is sent anyway rather than
 * kept locally, because a favourite that lives in one browser tab is not a
 * favourite. If the API rejects it the error surfaces — which is how the gap
 * gets reported rather than quietly papered over.
 */
export function toggleFavorite(id) {
  const current = state.items.find((c) => c.id === id);
  const favorite = !current?.favorite;
  return optimistic(
    state.items.map((c) => (c.id === id ? { ...c, favorite } : c)),
    () => patchCopilot(id, { favorite }),
  );
}

/** Patch one copilot — the settings sheet saving a name, brief or instructions. */
export function updateCopilot(id, patch) {
  return optimistic(
    state.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    () => patchCopilot(id, patch),
  );
}

export function removeCopilot(id) {
  return optimistic(
    state.items.filter((c) => c.id !== id),
    () => destroyCopilot(id),
  );
}

const NEW_COPILOT_NAME = "New copilot";

/**
 * A name for a copilot nobody has named.
 *
 * ⚠️ THIS IS A STOPGAP. `POST /copilots` rejects a request with no name — "The
 * name field is required" — so the server will not name one for us the way the
 * sibling product's `POST /autopilots` does. Until it defaults the column, the
 * name has to come from somewhere, and a form in front of an empty copilot is
 * the thing we were trying to avoid.
 *
 * Numbered only when it has to be: the second "New copilot" becomes "New
 * copilot 2", so the list stays readable without stamping a number on the very
 * first one. Counted from names already in the store, so it is wrong only when
 * the catalog has not loaded — and a duplicate name is a rename, not a bug.
 */
function defaultCopilotName() {
  const taken = new Set(state.items.map((c) => c.name));
  if (!taken.has(NEW_COPILOT_NAME)) return NEW_COPILOT_NAME;
  let n = 2;
  while (taken.has(`${NEW_COPILOT_NAME} ${n}`)) n += 1;
  return `${NEW_COPILOT_NAME} ${n}`;
}

/**
 * Create one, and put it at the front — it is now the most recently edited.
 *
 * ⚠️ NOTHING IS ASKED OF THE USER. A plain create sends only the placeholder
 * name above; they rename it from the settings sheet once it exists and they
 * know what it is for.
 *
 * ⚠️ Not optimistic. The id comes from the server, and a card with an invented
 * id breaks the moment someone clicks it.
 *
 * Some APIs answer a create with a bare success message and no record. Rather
 * than invent one, refetch and take the newest — the same fallback the sibling
 * product's autopilot client uses against this backend's conventions.
 */
export async function addCopilot(payload = {}) {
  const body = { name: defaultCopilotName(), ...payload };
  const record = toCopilotRecord(await createCopilot(body));

  if (!record) {
    await refreshCopilots();
    const newest = state.items[0];
    if (!newest) {
      throw new Error("The copilot was created but could not be loaded.");
    }
    return newest;
  }

  const created = adaptCopilot(record);
  setState({ items: [created, ...state.items], loading: false, error: null });
  return created;
}

/** Duplicate a copilot. A real create, so the copy survives a reload. */
export function cloneCopilot(id) {
  const source = state.items.find((c) => c.id === id);
  if (!source) return Promise.resolve(null);
  return addCopilot({
    name: `${source.name} copy`,
    description: source.description,
    instructions: source.instructions ?? null,
    greeting: source.greeting ?? null,
    channels: source.channels ?? null,
    allowed_tools: source.allowed_tools ?? null,
  });
}
