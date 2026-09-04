import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getCustomBackground, listenToCustomization, listenToCustomTheme } from "../firebase/firestore";
import { DEFAULT_COLORS, themeToCssVariables } from "../utils/themeUtils";

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialTheme = "kodak-funsaver" }) {
  const [theme, setTheme] = useState(initialTheme);
  const [customColors, setCustomColors] = useState(null);
  const [customBackground, setCustomBackground] = useState(null);
  const [customTheme, setCustomTheme] = useState(null);
  const { user } = useAuth();

  // Appliquer les variables CSS
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const root = document.documentElement.style;
    
    // Appliquer les couleurs custom si thème personnalisé
    if (theme === "custom" && customColors) {
      root.setProperty("--custom-body-color", customColors.bodyColor);
      root.setProperty("--custom-body-color-dark", customColors.bodyColorDark);
      root.setProperty("--custom-body-shadow", customColors.bodyShadow);
      root.setProperty("--custom-accent", customColors.accent);
      root.setProperty("--custom-accent-soft", customColors.accentSoft);
    }
    
    // Appliquer le background custom
    if (customBackground) {
      root.setProperty("--custom-background", `url(${customBackground})`);
    } else {
      root.setProperty("--custom-background", "");
    }
    
    // Appliquer les couleurs du thème custom complet
    if (customTheme?.colors) {
      Object.entries(customTheme.colors).forEach(([key, value]) => {
        root.setProperty(`--custom-${key}`, value);
      });
    }
    
    // Appliquer le background du thème custom complet
    if (customTheme?.background) {
      root.setProperty("--custom-background", `url(${customTheme.background})`);
    }
  }, [theme, customColors, customBackground, customTheme]);

  // Écouter les changements de personnalisation simple (background seulement)
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

  // Écouter les changements de thème personnalisé complet
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToCustomTheme(user.uid, (themeData) => {
      if (themeData) {
        setCustomTheme(themeData);
        // Si un thème custom existe, basculer automatiquement dessus
        if (theme !== "custom") {
          setTheme("custom");
        }
      } else {
        setCustomTheme(null);
      }
    });
    return unsub;
  }, [user?.uid, theme]);

  // Synchroniser customColors depuis customTheme
  useEffect(() => {
    if (customTheme?.colors) {
      setCustomColors(customTheme.colors);
    }
  }, [customTheme]);

  // Synchroniser customBackground depuis customTheme
  useEffect(() => {
    if (customTheme?.background) {
      setCustomBackground(customTheme.background);
    }
  }, [customTheme]);

  return (
    <ThemeContext.Provider value={{
      theme, 
      setTheme, 
      customColors, 
      setCustomColors, 
      customBackground, 
      setCustomBackground,
      customTheme,
      setCustomTheme
    }}>
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
  { id: "realistic", label: "Réaliste" },
  { id: "custom", label: "Personnalisé" },
];
