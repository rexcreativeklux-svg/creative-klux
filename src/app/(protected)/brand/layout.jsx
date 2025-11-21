

export default function BrandsLayout({ children }) {
  return (
    <div className="flex h-full">
  

      {/* Right side (swaps between create/reuse page) */}
      <div className="flex-1 py-2 px-3 lg:px-5 ">
        {children}
      </div>
    </div>
  );
}
