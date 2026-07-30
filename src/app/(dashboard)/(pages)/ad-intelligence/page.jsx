/**
 * /ad-intelligence — section index.
 * The section is its secondary sidebar's pages; landing here just forwards to
 * the first tool.
 */

import { redirect } from "next/navigation";

export default function AdIntelligenceIndex() {
  redirect("/ad-intelligence/ad-performance");
}
