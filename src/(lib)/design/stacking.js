/**
 * stacking.js — who overlaps whom, and whether a layer move would mean anything.
 *
 * Three surfaces ask the same questions: the element pill's Layer submenu, the
 * Position panel's Arrange buttons, and that panel's "Overlapping" filter.
 * Overlap maths written three times is overlap maths that disagrees once, so it
 * lives here.
 *
 * Stacking IS array order in this editor — there is no zIndex on an element —
 * so "in front of" means "later in the array". See moveLayer in useDesignEditor.
 *
 * The page background is a property of the canvas here rather than an element,
 * so unlike the layer list nothing has to be excluded from these answers: every
 * element in the array is a real, movable layer.
 */

/** Do two element boxes share any area? Touching edges don't count. */
export function rectsOverlap(a, b) {
  if (!a || !b) return false;
  const aw = Number(a.width) || 0;
  const ah = Number(a.height) || 0;
  const bw = Number(b.width) || 0;
  const bh = Number(b.height) || 0;
  return !(
    a.x + aw <= b.x ||
    b.x + bw <= a.x ||
    a.y + ah <= b.y ||
    b.y + bh <= a.y
  );
}

/**
 * The elements sharing space with `target`, INCLUDING the target itself.
 *
 * The target is kept because every caller is showing the user a stack — a list
 * of what is piled up here — and a pile that doesn't contain the thing you
 * selected reads as the wrong list.
 */
export function overlappingWith(elements, target) {
  if (!target) return [];
  return (elements || []).filter(
    (el) => el.id === target.id || rectsOverlap(el, target),
  );
}

/**
 * What a layer move would actually achieve for `target`.
 *
 * `hasOverlap` is the question that decides whether stacking is worth offering
 * at all: an element sitting on its own, touching nothing, looks identical at
 * every position in the array, so a Layer menu there is four buttons that
 * appear to do nothing.
 *
 * `canMoveUp` / `canMoveDown` are about the array — is there anywhere to go —
 * and are what disable the individual items.
 *
 * @returns {{hasOverlap: boolean, canMoveUp: boolean, canMoveDown: boolean, canLayer: boolean}}
 */
export function layerAbility(elements, target) {
  const none = {
    hasOverlap: false,
    canMoveUp: false,
    canMoveDown: false,
    canLayer: false,
  };
  if (!target || !elements?.length) return none;

  const index = elements.findIndex((el) => el.id === target.id);
  if (index === -1) return none;

  const hasOverlap = overlappingWith(elements, target).length > 1;
  const canMoveUp = index < elements.length - 1;
  const canMoveDown = index > 0;

  return {
    hasOverlap,
    canMoveUp,
    canMoveDown,
    canLayer: hasOverlap && (canMoveUp || canMoveDown),
  };
}

/**
 * Where `target` sits in the stack, counting from the BACK, 1-based.
 *
 * Counting from the back is what makes the number behave the way the buttons
 * read: Forward increases it, Backward decreases it. Front-first numbering
 * would have "bring forward" count down, which is the sort of thing that makes
 * people click the other button to check.
 *
 * @returns {{index: number, total: number}} index 0 when the element is gone
 */
export function layerDepth(elements, target) {
  const total = elements?.length || 0;
  const index = target
    ? (elements || []).findIndex((el) => el.id === target.id)
    : -1;
  return { index: index === -1 ? 0 : index + 1, total };
}

/**
 * The ability of a whole selection: offered when it is worth offering for ANY
 * member, since the actions run per-element and skip the ones they can't help.
 */
export function selectionLayerAbility(elements, selection) {
  return (selection || []).reduce(
    (acc, el) => {
      const ability = layerAbility(elements, el);
      return {
        hasOverlap: acc.hasOverlap || ability.hasOverlap,
        canMoveUp: acc.canMoveUp || ability.canMoveUp,
        canMoveDown: acc.canMoveDown || ability.canMoveDown,
        canLayer: acc.canLayer || ability.canLayer,
      };
    },
    { hasOverlap: false, canMoveUp: false, canMoveDown: false, canLayer: false },
  );
}
