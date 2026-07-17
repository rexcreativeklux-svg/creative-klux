import { ImageIcon, Palette, Type } from "lucide-react";

/**
 * The Brand Kit sub-nav. Scoped to what the brand record actually carries:
 * `logo` (one nullable URL), `primary_color` / `secondary_color`, and `fonts`
 * (a comma-separated string). Canva's other rows (Guidelines, Brand voice,
 * Photos…) have no backing data, so they aren't here.
 */
export const BRAND_SECTIONS = [
  { id: "logos", label: "Logos", icon: ImageIcon },
  { id: "colors", label: "Colors", icon: Palette },
  { id: "fonts", label: "Fonts", icon: Type },
];
