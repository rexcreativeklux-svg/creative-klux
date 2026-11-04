"use client";

/**
 * SelectionMark — the tick box in a tile's corner, and the ring that says it's
 * ticked. On hover until something is picked, then on every tile; always on
 * below `lg`, where there is no hover to find it with.
 *
 * @param {object} props
 * @param {boolean} props.selected
 * @param {boolean} props.picking Whether anything is ticked yet.
 * @param {(range: boolean) => void} props.onToggle Told whether Shift was held.
 * @param {string} [props.label] What's being selected, for screen readers.
 * @param {string} [props.position] Where the box sits within its tile.
 * @param {string|false} [props.ring] Extra classes for the ring, or false for a
 *   tile that shows being ticked some other way.
 * @param {"button"|"span"} [props.as] "span" inside a tile that is itself a
 *   <button>, which may not contain another.
 */
import { Check } from "lucide-react";

export default function SelectionMark({
  selected,
  picking,
  onToggle,
  label = "this result",
  position = "left-2 top-2",
  ring = "",
  as: Tag = "button",
}) {
  return (
    <>
      {selected && ring !== false && (
        <span
          className={`pointer-events-none absolute inset-0 z-10 ring-3 ring-inset ring-blue-600 ${ring}`}
        />
      )}
      <Tag
        {...(Tag === "button" ? { type: "button" } : { role: "button" })}
        onClick={(event) => {
          event.stopPropagation();
          onToggle(event.shiftKey);
        }}
        aria-pressed={selected}
        aria-label={`Select ${label}`}
        className={`absolute ${position} z-20 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-2 backdrop-blur-sm transition-opacity ${
          selected
            ? "border-blue-600 bg-blue-600"
            : `border-white bg-black/30 hover:bg-black/55 ${
                picking
                  ? ""
                  : "lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100"
              }`
        }`}
      >
        {selected && <Check className="h-3.5 w-3.5 stroke-3 text-white" />}
      </Tag>
    </>
  );
}
