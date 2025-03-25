"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center justify-between space-x-4 py-2 w-full">
      <div className="flex items-center">
        {isDarkMode ? (
          <Sun className="ml-2 h-4 w-4 mr-2" />
        ) : (
          <Moon className="ml-2 h-4 w-4 mr-2" />
        )}
        <Label
          htmlFor="theme-mode"
          className="cursor-pointer text-sm font-medium"
        >
          {isDarkMode ? "Light Mode" : "Dark Mode"}
        </Label>
      </div>
      <Switch
        id="theme-mode"
        checked={isDarkMode}
        onCheckedChange={handleToggle}
        className="data-[state=checked]:bg-primary ml-auto"
      />
    </div>
  );
}
