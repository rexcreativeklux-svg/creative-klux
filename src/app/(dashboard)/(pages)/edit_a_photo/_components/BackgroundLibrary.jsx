import { BG_SECTIONS } from "./backgroundCategories";
import CategoryCard from "./CategoryCard";

// The grouped category browser shown under "Search backgrounds" when the search
// box is empty. Sections (Texture, Colors, Patterns, …) each hold a grid of
// category cards; opening a card hands the category up to the parent.
export default function BackgroundLibrary({ onOpenCategory }) {
  return (
    <div className="space-y-6">
      {BG_SECTIONS.map((section) => (
        <div key={section.title}>
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            {section.title}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {section.categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} onOpen={onOpenCategory} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
