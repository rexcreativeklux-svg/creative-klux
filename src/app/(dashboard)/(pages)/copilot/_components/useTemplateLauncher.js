"use client";

/**
 * useTemplateLauncher — what clicking a template does, in one place for the
 * /copilot home and /copilot/templates.
 *
 * A template IS a copilot waiting to exist: clicking it creates a copilot under
 * the template's name (no naming step — the name is part of the template, and
 * it can be renamed later), then opens it and asks the template's task through
 * `?send=` (see [id]/page.jsx), exactly like the home composer's first task.
 *
 * Using the same template twice gives "Brand Sentinel 2" rather than a second
 * identical "Brand Sentinel" in Recents.
 *
 * @returns {{ launch: (idea) => Promise<void>, busyName: string|null }}
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addCopilot,
  newConversationId,
  reportFailure,
  useCopilots,
} from "../_data/copilots";

/** `name`, or `name 2`, `name 3`… — the first not already taken. */
function freeName(name, copilots) {
  const taken = new Set(copilots.map((c) => c.name.trim().toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  let n = 2;
  while (taken.has(`${name} ${n}`.toLowerCase())) n += 1;
  return `${name} ${n}`;
}

export default function useTemplateLauncher() {
  const router = useRouter();
  const copilots = useCopilots();
  // The template being created — one at a time, so a double click (or a click
  // on a second card) cannot make two copilots.
  const [busyName, setBusyName] = useState(null);

  const launch = async (idea) => {
    if (busyName) return;
    setBusyName(idea.name);
    try {
      const copilot = await addCopilot({
        name: freeName(idea.name, copilots),
        description: idea.description,
      });
      router.push(
        `/copilot/${copilot.id}?new=1&c=${newConversationId()}&send=${encodeURIComponent(idea.description)}`,
      );
      // Stays busy: the page is navigating away.
    } catch (err) {
      reportFailure(err, "Couldn't create a copilot");
      setBusyName(null);
    }
  };

  return { launch, busyName };
}
