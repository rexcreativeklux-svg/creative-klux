"use client";

import { useTheme } from "@/app/(components)/ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="relative p-2.5 cursor-pointer rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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