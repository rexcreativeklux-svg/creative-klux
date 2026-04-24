

export default function BrandsLayout({ children }) {
  return (
    <div className="flex h-full">
  

      {/* Right side (swaps between create/reuse page) */}
      <div className="flex-1 py-2  ">
        {children}
      </div>
    </div>
  );
}
