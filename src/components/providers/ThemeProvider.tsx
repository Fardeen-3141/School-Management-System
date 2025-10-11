// src\components\providers\ThemeProvider.tsx

"use client";

import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";
import React from "react";

// Define the interface for your ThemeProvider's props
// This combines the children prop with the props from next-themes' ThemeProviderProps
interface MyThemeProviderProps extends ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children, ...props }: MyThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
