"use client";

// app/(components)/ui/ResponsiveTable.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A table on desktop, a list of cards on phones — from ONE column definition,
// so a row's contents are written once and never drift between the two forms.
//
// ── WHY NOT JUST SCROLL THE TABLE SIDEWAYS ──────────────────────────────────
// Because a horizontally-scrolling table is only readable one column at a
// time: the row you are reading slides out from under its own header, and the
// actions column — the thing you actually came for — is the furthest off
// screen. Stacking each row into a labelled card keeps every field beside its
// label and puts the actions where a thumb already is.
//
// The app already had one hand-rolled version of this idea in
// (components)/ProductsTable.jsx. This generalises it, and fixes the two bugs
// that copy has: it reads `window.innerWidth` during render (undefined on the
// server) and never re-reads it, so the card view never appears on a rotate or
// a resize. This uses `useMediaQuery`, which is SSR-safe and subscribes.
//
// ── COLUMN CONFIG ───────────────────────────────────────────────────────────
// One array drives both layouts. Per column:
//
//   key           unique id (also the React key)
//   header        <th> text; also the card's field label unless `label` is set
//   label         override for the card label (e.g. shorter than the header)
//   cell          (row, index) => ReactNode — the ONLY place a cell is rendered
//   primary       true → on a card this is the TITLE: no label, larger type.
//                 Mark exactly one; it is what the card is "about".
//   cardSlot      "footer" pins it to the card's action row (use for menus and
//                 buttons); "hidden" drops it from the card entirely — for
//                 columns that only make sense in a dense grid.
//   thClassName / tdClassName  extra classes on the desktop cells
//   align         "left" (default) | "right" | "center"
//
// ── USAGE ───────────────────────────────────────────────────────────────────
//   <ResponsiveTable
//     rows={members}
//     rowKey={(m) => m.id}
//     columns={[
//       { key: "name",   header: "Member", primary: true, cell: (m) => m.name },
//       { key: "role",   header: "Role",   cell: (m) => <Badge>{m.role}</Badge> },
//       { key: "joined", header: "Joined", cell: (m) => formatDate(m.joined) },
//       { key: "act",    header: "",       cardSlot: "footer", align: "right",
//         cell: (m) => <RowMenu member={m} /> },
//     ]}
//   />

import { useMediaQuery } from "@/utils/useMediaQuery";

const ALIGN_CLASS = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

/**
 * @param {object} props
 * @param {Array<object>} props.rows
 * @param {Array<object>} props.columns          See COLUMN CONFIG above.
 * @param {(row: object, index: number) => string|number} props.rowKey
 * @param {(row: object, index: number) => void} [props.onRowClick]
 * @param {React.ReactNode} [props.empty]        Shown when `rows` is empty.
 * @param {boolean} [props.loading=false]        Suppresses the empty state.
 * @param {React.ReactNode} [props.loadingState] Shown while `loading`.
 * @param {string}  [props.className]            Extra classes on the wrapper.
 */
export default function ResponsiveTable({
  rows = [],
  columns = [],
  rowKey,
  onRowClick,
  empty = null,
  loading = false,
  loadingState = null,
  className = "",
}) {
  // `md` (768px) is where a 4–5 column table stops being legible. Assume
  // desktop on the server so SSR emits the <table>.
  const isCards = !useMediaQuery("(min-width: 768px)", true);

  const keyOf = (row, i) => (rowKey ? rowKey(row, i) : i);

  if (loading && loadingState) return loadingState;
  if (!loading && rows.length === 0 && empty) return empty;

  // ── Cards (below md) ─────────────────────────────────────────────────────
  if (isCards) {
    const titleCol = columns.find((c) => c.primary);
    const footerCols = columns.filter((c) => c.cardSlot === "footer");
    const bodyCols = columns.filter(
      (c) => !c.primary && c.cardSlot !== "footer" && c.cardSlot !== "hidden",
    );

    return (
      <div className={`flex flex-col gap-stack ${className}`}>
        {rows.map((row, i) => {
          const clickable = Boolean(onRowClick);
          return (
            <div
              key={keyOf(row, i)}
              onClick={clickable ? () => onRowClick(row, i) : undefined}
              // A clickable card must be reachable and operable by keyboard —
              // the desktop <tr> equivalent is, so this must be too.
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRowClick(row, i);
                      }
                    }
                  : undefined
              }
              className={`rounded-xl border border-gray-200 bg-surface p-card ${
                clickable ? "cursor-pointer transition-colors hover:bg-gray-50" : ""
              }`}
            >
              {titleCol && (
                <div className="mb-2 text-sm font-semibold text-gray-900">
                  {titleCol.cell(row, i)}
                </div>
              )}

              {bodyCols.length > 0 && (
                <dl className="flex flex-col gap-1.5">
                  {bodyCols.map((col) => (
                    <div key={col.key} className="flex items-start justify-between gap-3">
                      <dt className="shrink-0 text-xs font-medium text-gray-500">
                        {col.label ?? col.header}
                      </dt>
                      {/* min-w-0 + text-right: long values wrap inside their
                          own column instead of pushing the label off screen. */}
                      <dd className="min-w-0 text-right text-xs text-gray-900">
                        {col.cell(row, i)}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {footerCols.length > 0 && (
                <div
                  className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5"
                  // Actions live inside a clickable card, so a tap on one must
                  // not also fire the row's own click.
                  onClick={(e) => e.stopPropagation()}
                >
                  {footerCols.map((col) => (
                    <div key={col.key}>{col.cell(row, i)}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Table (md and up) ────────────────────────────────────────────────────
  // overflow-x-auto is still here as a backstop: it only engages if the
  // content genuinely cannot fit, and it keeps the scroll inside this
  // container so the PAGE never scrolls sideways.
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 ${className}`}>
      <table className="w-full border-collapse">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 ${
                  ALIGN_CLASS[col.align] || ALIGN_CLASS.left
                } ${col.thClassName || ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-surface">
          {rows.map((row, i) => (
            <tr
              key={keyOf(row, i)}
              onClick={onRowClick ? () => onRowClick(row, i) : undefined}
              className={onRowClick ? "cursor-pointer transition-colors hover:bg-gray-50" : ""}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-sm text-gray-900 ${
                    ALIGN_CLASS[col.align] || ALIGN_CLASS.left
                  } ${col.tdClassName || ""}`}
                >
                  {col.cell(row, i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
