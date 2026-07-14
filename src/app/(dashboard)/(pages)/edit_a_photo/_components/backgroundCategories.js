// Background library taxonomy (Photoroom parity). Sections group categories;
// each category maps a display label to a Pexels search query. Clicking a
// category card opens a dedicated infinite-scroll panel for that query.
export const BG_SECTIONS = [
  {
    title: "Texture",
    categories: [
      { id: "wood", label: "Wood", query: "wood texture" },
      { id: "marble", label: "Marble", query: "marble texture" },
      { id: "concrete", label: "Concrete", query: "concrete texture" },
      { id: "bokeh", label: "Bokeh", query: "bokeh lights" },
      { id: "paper", label: "Paper", query: "paper texture" },
      { id: "wall", label: "Wall", query: "wall texture" },
      { id: "pastel", label: "Pastel", query: "pastel gradient background" },
    ],
  },
  {
    title: "Colors",
    categories: [
      { id: "white", label: "White", query: "white background texture" },
      { id: "black", label: "Black", query: "black background texture" },
      { id: "blue", label: "Blue", query: "blue background texture" },
      { id: "green", label: "Green", query: "green background texture" },
      { id: "red", label: "Red", query: "red background" },
      { id: "beige", label: "Beige", query: "beige background texture" },
      { id: "irised", label: "Irised", query: "iridescent holographic gradient" },
    ],
  },
  {
    title: "Patterns",
    categories: [
      { id: "geometric", label: "Geometric", query: "geometric pattern" },
      { id: "fur", label: "Fur", query: "fur texture" },
      { id: "patterns", label: "Patterns", query: "seamless pattern" },
    ],
  },
  {
    title: "Scenes",
    categories: [
      { id: "podiums", label: "Podiums", query: "product podium display" },
      { id: "scenes", label: "Scenes", query: "product photography scene" },
      { id: "closeup", label: "Close-up", query: "macro texture close up" },
      { id: "shelf", label: "Shelf", query: "empty shelf" },
      { id: "studio", label: "Studio", query: "studio backdrop" },
      { id: "shadows", label: "Shadows", query: "shadow on wall" },
      { id: "flatlays", label: "Flatlays", query: "flat lay background" },
    ],
  },
  {
    title: "Nature",
    categories: [
      { id: "nature", label: "Nature", query: "nature landscape" },
      { id: "cities", label: "Cities", query: "city street" },
      { id: "sky", label: "Sky", query: "sky clouds" },
      { id: "night", label: "Night", query: "night city lights" },
      { id: "starrynight", label: "Starry night", query: "starry night sky" },
      { id: "fall", label: "Fall", query: "autumn leaves" },
    ],
  },
  {
    title: "Art",
    categories: [
      { id: "vangogh", label: "Van gogh", query: "van gogh painting" },
      { id: "masterpiece", label: "Masterpiece", query: "classic oil painting" },
    ],
  },
  {
    title: "Events",
    categories: [
      { id: "christmas", label: "Christmas", query: "christmas background" },
      { id: "valentine", label: "Valentine", query: "valentine hearts background" },
      { id: "halloween", label: "Halloween", query: "halloween background" },
      { id: "birthday", label: "Birthday", query: "birthday balloons" },
    ],
  },
];
