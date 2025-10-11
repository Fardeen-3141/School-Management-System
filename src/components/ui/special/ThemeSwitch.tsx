// src\components\ui\special\ThemeSwitch.tsx

import React from "react";
import { useTheme } from "next-themes";
import { Monitor, Sun, Moon, SunDim } from "lucide-react";
import { Button } from "../button";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  };

  return (
    <div className="flex justify-between items-center gap-3 p-5">
      <div className="flex items-center gap-2">
        <SunDim className="w-6 h-6 text-card-foreground" />
        <span className="text-sm text-card-foreground">Change theme</span>
      </div>
      <Button
        onClick={cycleTheme}
        className="relative w-10 h-10 rounded-full bg-background hover:bg-accent transition-colors overflow-hidden cursor-pointer"
        aria-label="Toggle theme"
      >
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
          style={{
            transform:
              theme === "system"
                ? "translateY(0)"
                : theme === "light"
                ? "translateY(-100%)"
                : "translateY(100%)",
            opacity: theme === "system" ? 1 : 0,
          }}
        >
          <Monitor className="w-5 h-5 text-foreground" />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
          style={{
            transform:
              theme === "light"
                ? "translateY(0)"
                : theme === "dark"
                ? "translateY(-100%)"
                : "translateY(100%)",
            opacity: theme === "light" ? 1 : 0,
          }}
        >
          <Sun className="w-5 h-5 text-foreground" />
        </div>
        <div
          className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
          style={{
            transform:
              theme === "dark"
                ? "translateY(0)"
                : theme === "system"
                ? "translateY(-100%)"
                : "translateY(100%)",
            opacity: theme === "dark" ? 1 : 0,
          }}
        >
          <Moon className="w-5 h-5 text-foreground" />
        </div>
      </Button>
    </div>
  );
}
