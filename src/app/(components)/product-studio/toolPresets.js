/**
 * TOOL_PRESET_SHELVES — the Product Studio landing page's "start from a preset"
 * rows: one shelf per tool that has a preset catalog, listing those presets.
 *
 * Picking a tile opens that tool on the preset with its image picker already
 * open; generating waits for the tool's Generate button (see each modal's
 * `initialPresetId` / `autoStart`). Tools with no catalog — Beautifier, Flat
 * lay, Ghost Mannequin, Batch — have no shelf; the tool grid still opens them.
 *
 * Every tile is normalised to the shape TemplateTile renders
 * ({ id, name, category, poster, src, alt }), so the shelf and the "See all"
 * browser (TemplateBrowserModal) are shared by every tool. A tile's id is the
 * id its own modal looks the preset up by.
 *
 * Order follows TOOL_LIST, so the shelves read in the same order as the tool
 * grid above them.
 */

import { TOOL_LIST, pxsq } from "./constants";
import { VIRTUAL_MODELS, MODEL_CATEGORIES } from "./virtualModels";
import { STAGING_TEMPLATES, STAGING_CATEGORIES } from "./stagingTemplates";
import { IMAGE_BACKGROUNDS, IMAGE_BG_CATEGORIES } from "./backdrops";
import { PROMPT_TOOLS } from "./promptToolConfigs";
import {
  PRODUCT_VIDEO_TEMPLATES,
  PRODUCT_VIDEO_CATEGORIES,
} from "./productVideoTemplates";

/**
 * Round-robin a catalog across its categories, keeping each category's own
 * order. The shelf only shows its first dozen tiles, and a grouped catalog
 * would open on twelve variations of one category instead of showing the range.
 */
const interleaveByCategory = (items) => {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  const lists = [...groups.values()];
  const out = [];
  const deepest = Math.max(0, ...lists.map((g) => g.length));
  for (let i = 0; i < deepest; i++) {
    for (const list of lists) if (list[i]) out.push(list[i]);
  }
  return out;
};

const CATEGORY_LABEL = Object.fromEntries(
  MODEL_CATEGORIES.map((c) => [c.id, c.label]),
);

const SHELF_CATALOGS = {
  virtual: {
    browserTitle: "Model",
    // Model photos are people — keep the head in a cropped tile.
    objectPosition: "object-top",
    categories: ["All", ...MODEL_CATEGORIES.map((c) => c.label)],
    tiles: VIRTUAL_MODELS.map((m) => ({
      id: m.id,
      name: m.name,
      category: CATEGORY_LABEL[m.category],
      poster: m.img,
      src: null,
      alt: `${m.name} — ${m.desc}`,
    })),
  },
  staging: {
    browserTitle: "Scene template",
    objectPosition: "object-center",
    categories: STAGING_CATEGORIES,
    tiles: STAGING_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      poster: pxsq(t.pexelsId, t.ext),
      src: null,
      alt: `${t.name} — ${t.category.toLowerCase()} scene template`,
    })),
  },
  bgremove: {
    browserTitle: "Backdrop",
    objectPosition: "object-center",
    categories: ["All", ...IMAGE_BG_CATEGORIES],
    tiles: IMAGE_BACKGROUNDS.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      poster: b.url,
      src: null,
      alt: `${b.name} — ${b.category.toLowerCase()} backdrop`,
    })),
  },
  ...Object.fromEntries(
    Object.values(PROMPT_TOOLS).map((config) => [
      config.toolId,
      {
        browserTitle: config.templateBrowserTitle,
        objectPosition: "object-center",
        categories: config.categories,
        tiles: config.templates.map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          poster: pxsq(t.pexelsId, t.ext),
          src: null,
          alt: `${t.name} — ${t.category.toLowerCase()} template`,
        })),
      },
    ]),
  ),
  product_video: {
    browserTitle: "Video template",
    objectPosition: "object-center",
    categories: PRODUCT_VIDEO_CATEGORIES,
    tiles: PRODUCT_VIDEO_TEMPLATES.map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      poster: t.poster,
      src: t.src,
      alt: `${t.name} — ${t.category.toLowerCase()} product video template`,
    })),
  },
};

/**
 * @type {Array<{
 *   id: string, name: string, Icon: Function, color: string,
 *   browserTitle: string, objectPosition: string, categories: string[],
 *   tiles: Array, rowTiles: Array
 * }>}
 */
export const TOOL_PRESET_SHELVES = TOOL_LIST.filter(
  (tool) => SHELF_CATALOGS[tool.id],
).map((tool) => {
  const catalog = SHELF_CATALOGS[tool.id];
  return {
    id: tool.id,
    name: tool.name,
    Icon: tool.Icon,
    color: tool.color,
    ...catalog,
    rowTiles: interleaveByCategory(catalog.tiles),
  };
});
