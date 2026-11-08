import { useState } from "react";
import { tocarSomSuave } from "../utils/sound";

export function useToast() {
  const [toast, setToast] = useState<{ mensagem: string; tipo: 'sucesso' | 'aviso' | 'erro' } | null>(null);
  const [isExiting, setIsExiting] = useState(false);

// Função auxiliar para disparar notificações com animação de esmaecimento
  function dispararToast(mensagem: string, tipo: 'sucesso' | 'aviso' | 'erro' = 'sucesso') {
    setIsExiting(false);
    setToast({ mensagem, tipo });

    // Toca o sonzinho 
    tocarSomSuave();

    // Inicia o esmaecimento (fade-out) após 3.5 segundos
    setTimeout(() => {
      setIsExiting(true);
    }, 3500);

    // Remove completamente do DOM após a transição terminar (4 segundos no total)
    setTimeout(() => {
      setToast(null);
      setIsExiting(false);
    }, 4000);
  }
  return {
    toast,
    setToast,
    isExiting,
    setIsExiting,
    dispararToast,

  };
}

export type UseToast = ReturnType<typeof useToast>;
