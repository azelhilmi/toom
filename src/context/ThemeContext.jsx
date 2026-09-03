import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialTheme = "kodak-funsaver" }) {
  const [theme, setTheme] = useState(initialTheme);
  const [customColors, setCustomColors] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const root = document.documentElement.style;
    if (theme === "custom" && customColors) {
      root.setProperty("--custom-body-color", customColors.bodyColor);
      root.setProperty("--custom-body-color-dark", customColors.bodyColorDark);
      root.setProperty("--custom-body-shadow", customColors.bodyShadow);
      root.setProperty("--custom-accent", customColors.accent);
      root.setProperty("--custom-accent-soft", customColors.accentSoft);
    }
  }, [theme, customColors]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
}

export const AVAILABLE_THEMES = [
  { id: "kodak-funsaver", label: "Jetable classique" },
  { id: "fuji-quicksnap", label: "Bleu argentique" },
  { id: "noir", label: "Noir & blanc" },
  { id: "custom", label: "Personnalisé" },
];
