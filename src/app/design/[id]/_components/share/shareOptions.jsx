"use client";

import { Image as ImageIcon, FileText, Video, Film, Presentation } from "lucide-react";

/**
 * Colocated data + helpers shared by ShareModal and DownloadModal.
 * Kept beside the components that use them so the whole share feature is a
 * single, reusable folder.
 */

/** Anchor a popover under a button, pinned to the right edge of the viewport. */
export function getPopoverPosition(buttonRef) {
  if (!buttonRef?.current) return {};
  const rect = buttonRef.current.getBoundingClientRect();
  return {
    position: "fixed",
    top: `${rect.bottom + 10}px`,
    right: "10px",
  };
}

/** Download file-type options (reference parity). */
export const FILE_TYPES = [
  { value: "jpg", label: "JPG", icon: ImageIcon, description: "Best for sharing" },
  {
    value: "png",
    label: "PNG",
    icon: ImageIcon,
    description: "Best for complex images, illustrations",
    suggested: true,
  },
  {
    value: "pdf-standard",
    label: "PDF Standard",
    icon: FileText,
    description: "Best for documents (and emailing)",
  },
  {
    value: "pdf-print",
    label: "PDF Print",
    icon: FileText,
    description: "Best for printing",
  },
  { value: "svg", label: "SVG", icon: ImageIcon, description: "Best for web design and animations", premium: true },
  { value: "mp4", label: "MP4 Video", icon: Video, description: "High quality video", premium: true },
  { value: "gif", label: "GIF", icon: Film, description: "Short clip, no sound", premium: true },
  { value: "pptx", label: "PPTX", icon: Presentation, description: "Microsoft PowerPoint document", premium: true },
];

/** lucide 1.x dropped brand glyphs, so we ship our own Instagram mark. */
export function InstagramIcon({ className = "w-6 h-6" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="2" width="20" height="20" rx="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
