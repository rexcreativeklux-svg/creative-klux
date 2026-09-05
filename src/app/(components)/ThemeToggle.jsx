"use client";

import { useTheme } from "@/app/(components)/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  // Hover: `dark:hover:bg-gray-200`, not `gray-800`. The dark palette is
  // INVERTED, so `gray-800` resolves to near-white (#e6e6ea) and the hover
  // flashed a bright block behind the icon. `gray-200` (#2a2a30) is the subtle
  // raise above the surface that was intended.
  return (
    <button
      onClick={toggle}
      className="relative p-2.5 cursor-pointer rounded-xl hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
      aria-label="Toggle dark mode"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 360 : 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="relative w-5 h-5"
      >
        <Sun className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-opacity ${isDark ? "opacity-0" : "opacity-100"}`} />
        <Moon className={`absolute inset-0 w-5 h-5 text-blue-400 transition-opacity ${isDark ? "opacity-100" : "opacity-0"}`} />
      </motion.div>
    </button>
  );
}