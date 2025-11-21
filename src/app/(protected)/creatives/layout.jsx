
export default function CreativesLayout({ children }) {
  // console.log("CreativesLayout children:", children);
  return (
    <div className="flex h-full">
      {/* Right side (swaps between create/reuse page) */}
      <div className="flex-1 p-6 overflow-y-auto">{children}</div>
    </div>
  );
}