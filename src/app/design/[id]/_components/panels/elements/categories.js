import {
  Shapes,
  Sparkles,
  Clapperboard,
  Image,
  Video,
  Music,
  BarChart3,
  ListChecks,
  Sheet,
  Table,
  Frame,
  Grid3x3,
  Shirt,
  Box,
} from "lucide-react";

/**
 * The "Browse categories" tiles for the Elements panel, in Canva's order.
 *
 * `content` is the drill-in component key resolved by ElementsPanel — categories
 * without one render the shared "coming soon" placeholder, so a tile can ship
 * before its library does.
 *
 * `gradient` is a Tailwind gradient pair; it must be written out in full here
 * (not composed at runtime) so the JIT compiler can see the class names.
 */
export const ELEMENT_CATEGORIES = [
  {
    id: "shapes",
    label: "Shapes",
    icon: Shapes,
    gradient: "from-sky-400 to-blue-600",
    content: "shapes",
  },
  {
    id: "graphics",
    label: "Graphics",
    icon: Sparkles,
    gradient: "from-amber-400 to-orange-600",
  },
  {
    id: "animations",
    label: "Animations",
    icon: Clapperboard,
    gradient: "from-lime-400 to-green-600",
  },
  {
    id: "photos",
    label: "Photos",
    icon: Image,
    gradient: "from-blue-400 to-indigo-600",
    content: "photos",
  },
  {
    id: "videos",
    label: "Videos",
    icon: Video,
    gradient: "from-fuchsia-400 to-purple-600",
  },
  {
    id: "audio",
    label: "Audio",
    icon: Music,
    gradient: "from-rose-400 to-red-600",
  },
  {
    id: "charts",
    label: "Charts",
    icon: BarChart3,
    gradient: "from-violet-400 to-purple-600",
  },
  {
    id: "forms",
    label: "Forms",
    icon: ListChecks,
    gradient: "from-emerald-400 to-green-600",
  },
  {
    id: "sheets",
    label: "Sheets",
    icon: Sheet,
    gradient: "from-cyan-400 to-blue-600",
  },
  {
    id: "tables",
    label: "Tables",
    icon: Table,
    gradient: "from-orange-400 to-amber-600",
  },
  {
    id: "frames",
    label: "Frames",
    icon: Frame,
    gradient: "from-teal-400 to-emerald-600",
  },
  {
    id: "grids",
    label: "Grids",
    icon: Grid3x3,
    gradient: "from-pink-400 to-fuchsia-600",
  },
  {
    id: "mockups",
    label: "Mockups",
    icon: Shirt,
    gradient: "from-teal-300 to-cyan-600",
  },
  {
    id: "3d",
    label: "3D",
    icon: Box,
    gradient: "from-indigo-400 to-violet-600",
  },
];
