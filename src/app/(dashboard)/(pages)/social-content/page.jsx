/**
 * /social-content — section index.
 * The section is its secondary sidebar's pages; landing here just forwards to
 * Publishing.
 */

import { redirect } from "next/navigation";

export default function SocialContentIndex() {
  redirect("/social-content/publishing");
}
