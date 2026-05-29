"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial: Theme = saved === "light" ? "light" : "dark";
    setTheme(initial);
    applyTheme(initial);
    setMounted(true);
  }, []);

  const select = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className="h-8 w-[4.5rem] rounded-full border border-purple-500/20 bg-gray-800/40"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="flex h-8 items-center rounded-full border border-purple-500/25 bg-gray-800/40 p-0.5 dark:border-purple-500/25 dark:bg-gray-900/60"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => select("light")}
        aria-pressed={theme === "light"}
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors ${
          theme === "light"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Light
      </button>
      <button
        type="button"
        onClick={() => select("dark")}
        aria-pressed={theme === "dark"}
        className={`rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors ${
          theme === "dark"
            ? "bg-gray-700 text-white shadow-sm"
            : "text-gray-400 hover:text-gray-200"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
