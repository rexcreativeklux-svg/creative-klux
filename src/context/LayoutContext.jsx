j// context/LayoutContext.js
"use client";
import { createContext, useContext, useState } from "react";

const LayoutContext = createContext({});
export const useLayout = () => useContext(LayoutContext);
export function LayoutProvider({ children }) {
  const [pageConfig, setPageConfig] = useState({});
  return (
    <LayoutContext.Provider value={{ pageConfig, setPageConfig }}>
      {children}
    </LayoutContext.Provider>
  );
}