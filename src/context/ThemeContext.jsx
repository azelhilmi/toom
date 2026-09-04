import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { listenToCustomization } from "../firebase/firestore";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [customSkin, setCustomSkin] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToCustomization(user.uid, (data) => {
      setCustomSkin(data?.background || null);
    });
    return unsub;
  }, [user?.uid]);

  return (
    <ThemeContext.Provider value={{ customSkin, setCustomSkin }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme doit être utilisé dans un ThemeProvider");
  return ctx;
}
