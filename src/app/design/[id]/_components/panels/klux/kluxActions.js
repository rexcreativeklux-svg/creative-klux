import { Sparkles, ImagePlus, Wand2 } from "lucide-react";

/**
 * Quick-action chips shown in the Klux AI empty state, mirroring Canva AI's
 * "Redesign this page / Add background / Change style". Each chip just seeds the
 * composer with its `prompt` and sends it, so actions and free text share one
 * path through the assistant.
 */
export const KLUX_ACTIONS = [
  {
    id: "redesign",
    label: "Redesign this page",
    icon: Sparkles,
    prompt:
      "Redesign this page with a fresh, modern look while keeping the same content",
  },
  {
    id: "background",
    label: "Add background",
    icon: ImagePlus,
    prompt: "Add a background that fits this design",
  },
  {
    id: "style",
    label: "Change style",
    icon: Wand2,
    prompt: "Change the overall style of this design",
  },
];
