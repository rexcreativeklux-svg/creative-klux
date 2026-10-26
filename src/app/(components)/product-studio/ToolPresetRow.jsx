"use client";

/**
 * ToolPresetRow — one tool's presets as a horizontal shelf on the Product Studio
 * landing page (its models, scenes, styles or clips), with "See all" opening the
 * full catalog.
 *
 * A tile is a way to START: clicking it opens the tool on that preset with the
 * image picker already up. Nothing is generated until the user clicks Generate.
 * The shelf shows a preview of the catalog; "See all" is the whole thing.
 *
 * Built on the same {@link PresetStrip} as the Classics / Studio rows above it,
 * so every shelf on the page scrolls the same way, and on the same TemplateTile
 * the tools' own pickers use, so a preset looks identical here and inside its
 * tool. Video tiles only play while on screen (see TemplateTile).
 */

import { PresetStrip } from "@/app/(dashboard)/(pages)/product-studio/PresetStrip";
import TemplateTile from "./TemplateTile";

/** How many presets the shelf previews before "See all". */
const ROW_TILES = 16;

/**
 * @param {object} props
 * @param {object} props.shelf An entry of TOOL_PRESET_SHELVES.
 * @param {(tile: object) => void} props.onPick Start the tool on this preset.
 * @param {() => void} props.onSeeAll Open the full catalog.
 * @param {() => void} props.onOpenTool Launch the tool with no preset.
 */
export default function ToolPresetRow({ shelf, onPick, onSeeAll, onOpenTool }) {
  const { Icon } = shelf;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        {/* The heading opens the tool on its own, for anyone who would rather
            set it up by hand than start from a preset. */}
        <button
          onClick={onOpenTool}
          className="flex items-center gap-2 min-w-0 cursor-pointer group/title"
        >
          {Icon && (
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${shelf.color}`}
            >
              <Icon className="w-4 h-4" />
            </span>
          )}
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover/title:text-blue-700 transition-colors">
            {shelf.name}
          </h3>
          <span className="text-xs text-gray-400 shrink-0 tabular-nums">
            {shelf.tiles.length}
          </span>
        </button>

        <button
          onClick={onSeeAll}
          className="text-sm text-gray-500 hover:text-gray-900 shrink-0 cursor-pointer transition-colors"
        >
          See all
        </button>
      </div>

      <PresetStrip>
        {shelf.rowTiles.slice(0, ROW_TILES).map((tile) => (
          <TemplateTile
            key={tile.id}
            template={tile}
            selected={false}
            onSelect={onPick}
            label={tile.name}
            applyLabel="Use with my photo"
            objectPosition={shelf.objectPosition}
            className="shrink-0 w-24 h-32 sm:w-28 sm:h-36 bg-gray-100"
          />
        ))}
      </PresetStrip>
    </section>
  );
}
