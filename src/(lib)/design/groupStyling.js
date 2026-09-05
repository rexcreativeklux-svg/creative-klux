/**
 * groupStyling.js — what it means to STYLE a group.
 *
 * A group owns its box: where it is, how big, how far turned, how transparent,
 * how it animates. It owns no colour, no font and no outline — those belong to
 * the things inside it. So a styling patch aimed at a group is not stored on the
 * group, it is DEALT OUT to its members.
 *
 * Two things make that more than a spread:
 *
 *  1. Each type keeps the same idea under a different name. "The colour of this"
 *     is `fill` on a shape, `color` on text, `stroke` on a curve — so a group's
 *     one colour swatch has to be translated on the way in, or it paints the
 *     shapes and silently misses the words.
 *
 *  2. Which members can hold what. A group of photos has no font to set, and a
 *     control that writes a property nothing in there reads is a control that
 *     does nothing — so the toolbar asks what's inside before offering it.
 *
 * The patch is also mirrored onto the group itself. Nothing draws from that: it
 * is there so the PANELS — Colour, Font, Effects — read a sensible current value
 * back when they are opened on a group, since they all ask the selected element
 * for its properties directly.
 */

import { GROUP_TYPE, isGroup } from "./groups";

/**
 * The properties a group keeps for itself. Everything else in a patch is
 * styling, and styling a group means styling what is inside it.
 *
 * Written as "what stays" rather than "what travels" on purpose. A control that
 * writes a property nobody thought of here reaches the children, which shows up
 * as a control that appears to do nothing — the recoverable direction. The other
 * way round, a stray property silently pins itself to the group and the members
 * never see it again.
 */
export const GROUP_OWN_PROPERTIES = new Set([
  "id",
  "type",
  "x",
  "y",
  "width",
  "height",
  "rotation",
  "opacity",
  "hidden",
  "locked",
  "name",
  "groupId",
  "children",
  // The group's own window over its contents (see groups.js / clip.js). A
  // member's crop is its own business and is never dealt out.
  "clip",
  // A group animates as one thing.
  "animation",
]);

/**
 * Where each type actually keeps the property the toolbar names.
 *
 * The alias is written ALONGSIDE the original, never instead of it: a type that
 * later gains a `fill` reader loses nothing, and one that ignores the extra
 * property just carries a dead one.
 */
const ALIASES = {
  // Our text drawer reads `fill` first and falls back to `color`; keeping both
  // in step stops a stale `color` from winning after the picker writes `fill`.
  text: { fill: "color" },
  // A curve has no interior — its colour IS its stroke.
  curve: { fill: "stroke" },
};

/** A group-level patch, in the words the given element type understands. */
export function styleForType(type, patch) {
  const alias = ALIASES[type];
  if (!alias) return patch;

  const out = { ...patch };
  for (const [from, to] of Object.entries(alias)) {
    if (patch[from] !== undefined) out[to] = patch[from];
  }
  return out;
}

/** Split a patch into what the group keeps and what its members get. */
export function splitGroupPatch(patch) {
  const own = {};
  const style = {};

  for (const [key, value] of Object.entries(patch || {})) {
    if (GROUP_OWN_PROPERTIES.has(key)) own[key] = value;
    else style[key] = value;
  }

  return { own, style };
}

/**
 * A group with a patch applied: box properties to the group, everything else to
 * every member that can hold it.
 *
 * A patch carrying its own `children` has already dealt with them — a corner
 * scale is the case, since it rescales each member's font and stroke by the drag
 * — and dealing anything out again would flatten every member to one value,
 * the exact opposite of what scaling a group promises.
 */
export function styleGroup(group, patch) {
  const { own, style } = splitGroupPatch(patch);
  if (own.children || !Object.keys(style).length) return { ...group, ...own };

  return {
    ...group,
    ...own,
    // The mirror. Derived, never drawn — see the header.
    ...style,
    children: (group.children || []).map((child) => {
      // A nested group deals the patch out again rather than wearing it, so a
      // colour reaches everything inside a group of groups.
      if (isGroup(child)) return styleGroup(child, style);
      return { ...child, ...styleForType(child.type, style) };
    }),
  };
}

/**
 * What a group's controls should SHOW for a property.
 *
 * The members are what's drawn, so they answer first — the first one holding
 * the property wins, the same way the toolbar shows the first heading's font
 * when three are selected. The group's mirror is the fallback, which covers a
 * property none of the members carries yet.
 */
export function readGroupStyle(group, key) {
  for (const child of group?.children || []) {
    const value = isGroup(child)
      ? readGroupStyle(child, key)
      : (child[key] ?? child[ALIASES[child.type]?.[key]]);
    if (value !== undefined) return value;
  }
  return group?.[key];
}

/** Every member of a group, flattened through nested groups. */
export function groupMembers(group) {
  const out = [];
  for (const child of group?.children || []) {
    if (isGroup(child)) out.push(...groupMembers(child));
    else out.push(child);
  }
  return out;
}

/** Does this group hold anything of these types? */
export function groupHasType(group, types) {
  const wanted = new Set(Array.isArray(types) ? types : [types]);
  return groupMembers(group).some((child) => wanted.has(child.type));
}

/**
 * Can a text style be written to this selection?
 *
 * The typography surfaces — the Font panel, its Text styles ladder, the text
 * Effects panel — each used to ask `type === "text"` for themselves, so a group
 * with a heading in it opened the panel, offered every face, and answered every
 * click with "select a text layer". One predicate, so the three can't disagree
 * about what counts as text again.
 */
export function takesTextStyle(el) {
  if (!el) return false;
  if (el.type === "text") return true;
  return isGroup(el) && groupHasType(el, "text");
}

/**
 * What a text control should SHOW for a selection: the element's own value, or,
 * for a group, whatever the words inside it currently say.
 */
export function readTextStyle(el, key) {
  if (!el) return undefined;
  return isGroup(el) ? readGroupStyle(el, key) : el[key];
}

/**
 * The largest corner radius that makes sense for a whole group.
 *
 * The group's own box is far too generous: half of a 1000-unit group would
 * swallow a 60-unit swatch inside it whole. The limit is the SMALLEST thing the
 * radius will land on.
 */
export function groupRadiusLimit(group) {
  const sides = groupMembers(group)
    .map((child) => Math.min(Number(child.width) || 0, Number(child.height) || 0))
    .filter((side) => side > 0);

  return sides.length ? Math.round(Math.min(...sides) / 2) : 0;
}

export { GROUP_TYPE };
