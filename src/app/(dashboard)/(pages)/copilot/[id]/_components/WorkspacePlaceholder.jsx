"use client";

/**
 * WorkspacePlaceholder — the holding screen for a workspace page whose design
 * has not landed yet (Workflows, Plugins, Customize).
 *
 * It exists so the panel's nav can be REAL. The alternative was leaving those
 * three items inert or pointing them at routes that 404, and a nav item that
 * does nothing teaches the user the panel is broken. This says what the screen
 * will be and lets them walk back out.
 *
 * Delete it as each screen is built — it is scaffolding, not a pattern.
 *
 * @param {Object} props
 * @param {import("react").ElementType} props.icon
 * @param {string} props.title
 * @param {string} props.description  What this screen will do, in one line.
 */

export default function WorkspacePlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <Icon className="h-6 w-6 text-gray-500" />
      </div>
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-gray-500">
        {description}
      </p>
    </div>
  );
}
