import { useRef, useState } from "react";
import { X, MoveHorizontal } from "lucide-react";

// Full-screen Before/After comparison (the top-bar "panels" button). A draggable
// vertical divider reveals the original (`before`) on the left and the edited
// result (`after`) on the right. Self-contained — drag state lives here.
export default function BeforeAfterView({ before, after, onClose }) {
  const [pos, setPos] = useState(50); // % of width showing "before" (from left)
  const boxRef = useRef(null);

  // The divider follows the cursor anywhere on the page (no click needed).
  // clientX is mapped to the image box and clamped to its edges.
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

      {/* Image compare box (wraps to the After image's rendered size) */}
      <div ref={boxRef} className="relative inline-block touch-none">

        {/* After (base) sets the box size */}
        <img
          src={after}
          alt="After"
          draggable={false}
          className="block max-h-[85vh] max-w-[92vw] w-auto h-auto pointer-events-none"
        />
        {/* Before, clipped to the left `pos%` */}
        <img
          src={before}
          alt="Before"
          draggable={false}
          className="absolute inset-0 w-full h-full pointer-events-none"
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
