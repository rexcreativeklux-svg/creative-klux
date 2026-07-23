"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { INVOICES_PER_PAGE } from "@/app/(components)/billing/billingData";

/**
 * InvoicesTable
 * -------------
 * Billing history for /billing: searchable, status-filterable and paginated,
 * all client-side over the list it's given (the placeholder set is small enough
 * that server-side paging isn't needed yet).
 *
 * ⚠️ Placeholder: "Download" and "Export" have no endpoint — they call
 * `onDownload` / `onExport` so the parent can toast until the real ones exist.
 *
 * @param {Array}    invoices    - Rows from `INVOICES` (src/data/billingData.js).
 * @param {Function} onDownload  - Called with the invoice row.
 * @param {Function} onExport    - Called when "Export" is pressed.
 */

const STATUS_FILTERS = ["All", "Paid", "Pending", "Failed"];

// Status → pill styling. Kept as a map so an unknown status still renders.
const STATUS_STYLES = {
  Paid: "bg-green-50 text-green-600 border-green-200",
  Pending: "bg-amber-50 text-amber-600 border-amber-200",
  Failed: "bg-red-50 text-red-600 border-red-200",
};

export default function InvoicesTable({ invoices = [], onDownload, onExport }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(1);

  // Search matches the invoice name or its number so either works.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery =
        !q ||
        inv.name.toLowerCase().includes(q) ||
        inv.number.toLowerCase().includes(q);
      const matchesStatus = status === "All" || inv.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / INVOICES_PER_PAGE),
  );
  // Filtering can shrink the list under the current page — clamp instead of
  // resetting in an effect, so the table never renders an empty middle page.
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * INVOICES_PER_PAGE,
    currentPage * INVOICES_PER_PAGE,
  );

  // Any filter change puts the user back on page 1 of the new result set.
  const updateFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-5">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Your billing history and receipts
          </p>
        </div>
        <button
          type="button"
          onClick={onExport}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      {/* Search + status filter */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => updateFilter(setQuery)(e.target.value)}
            placeholder="Search invoice or number…"
            aria-label="Search invoices"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[#155dfc] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 p-1">
          {STATUS_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => updateFilter(setStatus)(option)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                status === option
                  ? "bg-[#155dfc] text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-400">
              <th className="p-3 text-left font-medium">Invoice</th>
              <th className="p-3 text-left font-medium">Number</th>
              <th className="p-3 text-left font-medium">Date</th>
              <th className="p-3 text-left font-medium">Due</th>
              <th className="p-3 text-right font-medium">Amount</th>
              <th className="p-3 text-left font-medium">Status</th>
              <th className="p-3 text-right font-medium">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-gray-500"
                >
                  No invoices match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <td className="p-3 font-medium text-gray-900">{inv.name}</td>
                  <td className="p-3 text-gray-500">{inv.number}</td>
                  <td className="p-3 text-gray-500">{inv.invoiceDate}</td>
                  <td className="p-3 text-gray-500">{inv.dueDate}</td>
                  <td className="p-3 text-right font-medium text-gray-900">
                    ${inv.amount}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_STYLES[inv.status] ||
                        "border-gray-200 bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDownload?.(inv)}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[#155dfc] transition-colors hover:text-[#0d44b3]"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing {(currentPage - 1) * INVOICES_PER_PAGE + 1}–
            {Math.min(currentPage * INVOICES_PER_PAGE, filtered.length)} of{" "}
            {filtered.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setPage(num)}
                className={`min-w-8 cursor-pointer rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  num === currentPage
                    ? "bg-[#155dfc] text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="cursor-pointer rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
