import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

interface ThemeCtx {
  darkMode: boolean;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx>({ darkMode: false, toggleTheme: () => {} });

const CHAVE = "inventario_tema";

function temaInicial(): boolean {
  try {
    const salvo = localStorage.getItem(CHAVE);
    if (salvo) return salvo === "dark";
  } catch {
    /* ignora */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(temaInicial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", darkMode ? "#111827" : "#f3f4f6");
    try {
      localStorage.setItem(CHAVE, darkMode ? "dark" : "light");
    } catch {
      /* ignora */
    }
  }, [darkMode]);

  const toggleTheme = useCallback(() => setDarkMode((d) => !d), []);

  return <Ctx.Provider value={{ darkMode, toggleTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
