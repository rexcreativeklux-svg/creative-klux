"use client";

/**
 * AgentsComingSoon — shared "coming soon" empty state for the Agents section.
 * The Agents tab in the sidebar (Home / All Agents) links to real routes so
 * navigation already works; this placeholder is what those routes render until
 * the actual agent features land. Swap this component out page-by-page as the
 * real screens are built.
 *
 * @param {Object} props
 * @param {string} props.title     Page heading (e.g. "Agents")
 * @param {string} props.subtitle  One-line description under the heading
 */

import { Bot, Sparkles } from "lucide-react";

const AgentsComingSoon = ({ title, subtitle }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-4">
      <div className="relative mb-6">
        <div className="h-20 w-20 rounded-3xl bg-blue-50 flex items-center justify-center">
          <Bot className="h-10 w-10 text-blue-600" />
        </div>
        <div className="absolute -top-1.5 -right-1.5 h-7 w-7 rounded-full bg-surface border border-gray-200 shadow-sm flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-blue-500" />
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500">{subtitle}</p>

      <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-600">
        <Sparkles className="h-3.5 w-3.5" />
        Coming soon
      </span>
    </div>
  );
};

export default AgentsComingSoon;
