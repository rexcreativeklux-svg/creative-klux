"use client";

export default function Loader({ size = 12, color = "border-black" }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/50 z-50">
      <div
        className={`w-${size} h-${size} border-4 ${color} border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}
