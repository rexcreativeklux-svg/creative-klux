/**
 * A brand's `fonts` is a comma-separated string ("Inter" / "Inter, Poppins"),
 * not a list. Parse it in one place: the Brand panel and the Text panel's
 * "Brand fonts" section both read it and must agree.
 *
 * @returns {{name: string, family: string}[]} — FontList's shape.
 */
export const brandFontList = (brand) =>
  (brand?.fonts || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({ name, family: `'${name}', sans-serif` }));
