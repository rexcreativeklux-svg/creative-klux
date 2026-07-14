// Temporary stand-in for tabs whose designs haven't landed yet (Uploads,
// Shopify products, AI images, Designs). Each will be replaced by its own
// colocated tab component in this folder as the screens are provided.
export default function PlaceholderTab({ label }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-1.5 text-gray-400">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-xs">Coming soon.</p>
    </div>
  );
}
