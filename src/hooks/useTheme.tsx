// src/hooks/useTheme.tsx
"use client";

import React, { createContext, useContext } from "react";
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeContextInner({ children }: { children: React.ReactNode }) {
  const { setTheme, resolvedTheme } = useNextTheme();
  
  const toggleTheme = () => {
    // If current is dark, go light, else dark
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Safe theme value ensuring it is 'light' or 'dark'
  const currentTheme = (resolvedTheme === "dark" ? "dark" : "light") as Theme;

  return (
    <ThemeContext.Provider 
      value={{ 
        theme: currentTheme,
        toggleTheme, 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContextInner>
        {children}
      </ThemeContextInner>
    </NextThemesProvider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
