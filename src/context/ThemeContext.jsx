import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCustomBackground, listenToCustomization } from "../firebase/firestore";

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialTheme = "kodak-funsaver" }) {
  const [theme, setTheme] = useState(initialTheme);
  const [customColors, setCustomColors] = useState(null);
  const [customBackground, setCustomBackground] = useState(null);
  const { user } = useAuth();

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
    
    if (customBackground) {
      root.setProperty("--custom-background", `url(${customBackground})`);
    } else {
      root.setProperty("--custom-background", "");
    }
  }, [theme, customColors, customBackground]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToCustomization(user.uid, (data) => {
      if (data?.background) {
        setCustomBackground(data.background);
      } else {
        setCustomBackground(null);
      }
    });
    return unsub;
  }, [user?.uid]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors, customBackground, setCustomBackground }}>
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
