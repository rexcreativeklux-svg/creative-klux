"use client";

import { useState } from "react";
import { toast } from "sonner";
import { STYLES, ASPECTS, INSPIRE_PROMPTS, MIN_WORDS, GEN_COUNT } from "./constants";
import { generateImages } from "./generateImages";
import { generateGraphics } from "./generateGraphics";
import { generateVideo } from "./generateVideo";
import { generate3D } from "./generate3D";
import { MagicNotConnectedError } from "./magicErrors";

// Each mode picks its own generation seam and declares which controls it shows:
// images have a style + aspect ratio, graphics only a style, video/3D neither.
const GENERATORS = {
  images: { fn: generateImages, useStyle: true, useAspect: true, noun: "images" },
  graphics: { fn: generateGraphics, useStyle: true, useAspect: false, noun: "graphics" },
  videos: { fn: generateVideo, useStyle: false, useAspect: false, noun: "video" },
  "3d": { fn: generate3D, useStyle: false, useAspect: false, noun: "3D" },
};

/**
 * useMagicGenerate — owns one Magic Studio tab's state (prompt, style, optional
 * aspect, results, running flag) for the given `mode`. The transport lives
 * behind the per-mode generator, so this hook stays about state. Instantiate
 * one per mode so each tab keeps its own prompt and results.
 */
export default function useMagicGenerate(mode = "images") {
  const config = GENERATORS[mode] || GENERATORS.images;

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState(STYLES[0]);
  const [aspect, setAspect] = useState(ASPECTS[0]);
  const [results, setResults] = useState([]);
  const [generating, setGenerating] = useState(false);

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const canGenerate = wordCount >= MIN_WORDS && !generating;

  const inspire = () => {
    // Vary the pick off the current value so "Inspire me" doesn't repeat itself.
    const others = INSPIRE_PROMPTS.filter((p) => p !== prompt.trim());
    const pick = others[Math.floor(Math.random() * others.length)];
    setPrompt(pick);
  };

  const generate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const imgs = await config.fn({
        prompt: prompt.trim(),
        ...(config.useStyle ? { style: style.id } : {}),
        ...(config.useAspect ? { aspect } : {}),
        count: GEN_COUNT,
      });
      // Newest results on top, matching Canva's "most recent first".
      setResults((prev) => [...(imgs || []), ...prev]);
    } catch (e) {
      if (e instanceof MagicNotConnectedError) {
        toast.info(
          `${cap(config.noun)} generation isn't connected yet — paste your Magic Studio API to enable it.`,
        );
      } else {
        toast.error(e?.message || `Couldn't generate ${config.noun}. Try again.`);
      }
    } finally {
      setGenerating(false);
    }
  };

  return {
    mode,
    useStyle: config.useStyle,
    useAspect: config.useAspect,
    prompt,
    setPrompt,
    style,
    setStyle,
    aspect,
    setAspect,
    results,
    generating,
    wordCount,
    canGenerate,
    inspire,
    generate,
    minWords: MIN_WORDS,
  };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
