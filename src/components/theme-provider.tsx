import { createContext, useContext, useEffect, useState } from "react";

type Mode = "light" | "dark" | "system";

const VALID_MODES: Mode[] = ["light", "dark", "system"];

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultMode?: Mode;
  storageKey?: string;
};

type ThemeProviderState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

const initialState: ThemeProviderState = {
  mode: "system",
  setMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultMode = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [mode, setMode] = useState<Mode>(() => {
    const stored = localStorage.getItem(`${storageKey}-mode`);
    return VALID_MODES.includes(stored as Mode)
      ? (stored as Mode)
      : defaultMode;
  });

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all mode classes
    root.classList.remove("light", "dark");

    // Determine actual mode
    let actualMode: "light" | "dark";
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      actualMode = mediaQuery.matches ? "dark" : "light";

      // Listen for system theme changes
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", handleChange);

      // Cleanup listener on unmount or when mode changes
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
      };
    } else {
      actualMode = mode;
    }

    // Apply mode class
    root.classList.add(actualMode);
  }, [mode]);

  const value = {
    mode,
    setMode: (newMode: Mode) => {
      localStorage.setItem(`${storageKey}-mode`, newMode);
      setMode(newMode);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
