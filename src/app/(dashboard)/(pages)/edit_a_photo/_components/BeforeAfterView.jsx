import { useRef, useState } from "react";
import { X, MoveHorizontal } from "lucide-react";

// Full-screen Before/After comparison (the top-bar "panels" button). A vertical
// divider follows the cursor: the ORIGINAL photo shows on the left, the edited
// composite (subject on the current background) on the right — matching Photoroom.
//
//   beforeSrc      — original uploaded image (with its original background)
//   afterSrc       — the cut-out subject (same framing as the original)
//   backgroundStyle— canvas background fill (color / gradient / white for image)
//   backgroundImage— src when the background is an image (rendered under subject)
export default function BeforeAfterView({
  beforeSrc,
  afterSrc,
  backgroundStyle,
  backgroundImage,
  onClose,
}) {
  const [pos, setPos] = useState(50); // % of width showing "before" (from left)
  const boxRef = useRef(null);

  // Divider follows the cursor anywhere on the page (no click/drag needed).
  const updateFromX = (clientX) => {
    const el = boxRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      className="fixed inset-0 z-[130] bg-black flex items-center justify-center select-none"
      onPointerMove={(e) => updateFromX(e.clientX)}
    >
      <button
        onClick={onClose}
        title="Close"
        className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Compare box — sized by the subject image; both sides overlay it 1:1 so
          the subject stays put and only the background changes across the wipe. */}
      <div ref={boxRef} className="relative inline-block touch-none">
        {/* AFTER: background fill + optional bg image + subject (base = sizes box) */}
        <div className="absolute inset-0" style={backgroundStyle}>
          {backgroundImage && (
            <img
              src={backgroundImage}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
          )}
        </div>
        <img
          src={afterSrc}
          alt="After"
          draggable={false}
          className="relative block max-h-[85vh] max-w-[92vw] w-auto h-auto object-contain pointer-events-none"
        />

        {/* BEFORE: the original photo, clipped to the left `pos%` (covers the
            after composite, showing the original background on that side). */}
        <img
          src={beforeSrc}
          alt="Before"
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        />

        {/* Divider + handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
          style={{ left: `${pos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
            <MoveHorizontal className="w-4 h-4 text-gray-700" />
          </div>
        </div>
      </div>

      <span className="absolute bottom-6 left-8 text-white text-lg font-medium">
        Before
      </span>
      <span className="absolute bottom-6 right-8 text-white text-lg font-medium">
        After
      </span>
    </div>
  );
}
