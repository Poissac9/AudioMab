"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type ThemeMode = "light" | "dark" | "auto";

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [mode, setModeState] = useState<ThemeMode>("auto");
    const [isDark, setIsDark] = useState(false);

    // Load saved preference
    useEffect(() => {
        const saved = localStorage.getItem("theme") as ThemeMode | null;
        if (saved && ["light", "dark", "auto"].includes(saved)) {
            setModeState(saved);
        }
    }, []);

    // Apply theme based on mode
    useEffect(() => {
        const applyTheme = () => {
            let shouldBeDark = false;

            if (mode === "dark") {
                shouldBeDark = true;
            } else if (mode === "light") {
                shouldBeDark = false;
            } else {
                // Auto mode - check system preference
                shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            }

            setIsDark(shouldBeDark);
            document.documentElement.setAttribute("data-theme", shouldBeDark ? "dark" : "light");
        };

        applyTheme();

        // Listen for system theme changes in auto mode
        if (mode === "auto") {
            const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => applyTheme();
            mediaQuery.addEventListener("change", handler);
            return () => mediaQuery.removeEventListener("change", handler);
        }
    }, [mode]);

    const setMode = (newMode: ThemeMode) => {
        setModeState(newMode);
        localStorage.setItem("theme", newMode);
    };

    return (
        <ThemeContext.Provider value={{ mode, isDark, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
