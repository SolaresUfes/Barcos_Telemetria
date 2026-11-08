import { useState, useEffect } from "react";
import type { Member } from "../types/member";

export function useTheme(currentUser: Member | null) {
  const [darkMode, setDarkMode] = useState(false);

  // Efeito para controlar o modo escuro
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    // REGRA 1: Se estiver na tela de   in (sem currentUser),
    // a interface é escura por padrão.
    if (!currentUser) {
      if (metaThemeColor) metaThemeColor.setAttribute("content", "#111827");
      return; // Interrompe o código aqui até a pessoa logar.
    }

    // REGRA 2: Se já estiver logado, obedece o botão do modo claro/escuro.
    if (darkMode) {
      document.documentElement.classList.add("dark");
      if (metaThemeColor) metaThemeColor.setAttribute("content", "#111827");
    } else {
      document.documentElement.classList.remove("dark");
      if (metaThemeColor) metaThemeColor.setAttribute("content", "#f3f4f6");
    }

    // Adicionamos o currentUser aqui para o React saber
    // que precisa rodar isso de novo no momento do login
  }, [darkMode, currentUser]);
  return {
    darkMode,
    setDarkMode,

  };
}

export type UseTheme = ReturnType<typeof useTheme>;
