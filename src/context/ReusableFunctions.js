// src/context/ReusableFunctionsContext.jsx
"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Create the context
const ReusableFunctionsContext = createContext();

// Alert position mappings
const positionClasses = {
  "top-right": "top-4 right-4",
  "top-left": "top-4 left-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "top-center": "top-4 left-1/2 -translate-x-1/2",
  "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
};

// Alert type styles
const typeStyles = {
  success: {
    bg: "bg-green-500",
    border: "border-green-600",
    text: "text-white",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-500",
    border: "border-red-600",
    text: "text-white",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
  },
  warning: {
    bg: "bg-yellow-500",
    border: "border-yellow-600",
    text: "text-white",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  info: {
    bg: "bg-blue-500",
    border: "border-blue-600",
    text: "text-white",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

export const ReusableFunctionsProvider = ({ children}) => {
  const [alerts, setAlerts] = useState([]); 

  // Alert function
  const showAlert = useCallback(
    ({ type = "info", message, position = "top-right", timeout = 5000 }) => {
      const id = Date.now();
      setAlerts((prev) => [
        ...prev,
        { id, type, message, position: positionClasses[position] || positionClasses["top-right"] },
      ]);

      setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      }, timeout);
    },
    []
  );
 

  // Reusable functions object
  const reusableFunctions = {
    showAlert, 
  };

  return (
    <ReusableFunctionsContext.Provider value={reusableFunctions}>
      {/* Render alerts */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: '99999999' }}>
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              className={`pointer-events-auto flex items-center gap-2 p-4 shadow-lg max-w-sm ${alert.position} ${
                typeStyles[alert.type]?.bg || typeStyles.info.bg
              } ${typeStyles[alert.type]?.border || typeStyles.info.border} ${
                typeStyles[alert.type]?.text || typeStyles.info.text
              }`}
              initial={{ opacity: 0, x: alert.position.includes("right") ? 100 : -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: alert.position.includes("right") ? 100 : -100 }}
              transition={{ duration: 0.3 }}
            >
              {typeStyles[alert.type]?.icon || typeStyles.info.icon}
              <span>{alert.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {children}
    </ReusableFunctionsContext.Provider>
  );
};

// Hook to use reusable functions
export const useReusableFunctions = () => {
  const context = useContext(ReusableFunctionsContext);
  if (!context) {
    throw new Error("useReusableFunctions must be used within a ReusableFunctionsProvider");
  }
  return context;
};