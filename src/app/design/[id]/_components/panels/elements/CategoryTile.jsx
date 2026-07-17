"use client";

import React from "react";

/**
 * CategoryTile — one "Browse categories" entry: a rounded gradient icon square
 * with its label underneath. Purely presentational; the parent owns navigation.
 *
 * Props: { category: {label, icon, gradient}, onClick }
 */
export default function CategoryTile({ category, onClick }) {
  const { label, icon: Icon, gradient } = category;

  return (
    <button
      onClick={onClick}
      title={label}
      className="group flex flex-col items-center gap-2 cursor-pointer"
    >
      <span
        className={`w-full aspect-square rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-sm ring-1 ring-black/5 transition group-hover:scale-105 group-hover:shadow-md`}
      >
        <Icon className="w-7 h-7" strokeWidth={2.2} />
      </span>
      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition">
        {label}
      </span>
    </button>
  );
}
