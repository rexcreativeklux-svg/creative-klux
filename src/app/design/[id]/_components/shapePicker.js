/**
 * Builds the click handler for a shape preview.
 *
 * Curved & elbow lines are real multi-node paths rather than a shape stretched
 * to its box, so they route to their own inserters. Shared by every shape
 * picker (Elements › Shapes, the See-all gallery, Tools › Lines) so a preview
 * can't insert one thing in one place and something else in another.
 *
 * @param {object} insert — the editor's insert API
 * @returns {(key: string) => void}
 */
export const makeShapePicker = (insert) => (key) => {
  if (key === "line-curved") return insert.curve();
  if (key === "line-elbow") return insert.elbow();
  return insert.shape(key);
};
