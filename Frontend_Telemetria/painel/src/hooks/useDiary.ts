import { useState } from "react";
import type { Member } from "../types/member";
import type { ToastFn } from "../types/ui";

export function useDiary(currentUser: Member | null, dispararToast: ToastFn) {
  const [diarioLogs, setDiarioLogs] = useState<{id: string, titulo: string, texto: string, data: string, autor: string, fotoAutor: string}[]>(() => {
    const salvo = localStorage.getItem("telemetria_diario");
    if (salvo) {
      try {
        return JSON.parse(salvo);
      } catch (e) {
        console.log("Erro ao carregar o diário: ", e);
        return [];
      }
    }
    return [];
  });

  const [tituloDiario, setTituloDiario] = useState("");
  const [textoDiario, setTextoDiario] = useState("");

  function salvarDiario() {
    if (!tituloDiario.trim() || !textoDiario.trim()) {
      dispararToast("Preencha o título e o texto da anotação.", "aviso");
      return;
    }
    const novaAnotacao = {
      id: Date.now().toString(),
      titulo: tituloDiario,
      texto: textoDiario,
      data: new Date().toLocaleString("pt-BR"),
      autor: currentUser?.name || "Desconhecido",
      fotoAutor: currentUser?.photo || ""
    };
    
    // Cria a nova lista de anotações juntando a nova com as antigas
    const novosLogs = [novaAnotacao, ...diarioLogs];
    
    // Atualiza o estado da tela
    setDiarioLogs(novosLogs);
    
    // Salva a lista inteira no armazenamento local do navegador
    localStorage.setItem("telemetria_diario", JSON.stringify(novosLogs));

    setTituloDiario("");
    setTextoDiario("");
    dispararToast("Anotação salva no Diário de Bordo!", "sucesso");
  }
  return {
    diarioLogs,
    setDiarioLogs,
    tituloDiario,
    setTituloDiario,
    textoDiario,
    setTextoDiario,
    salvarDiario,

  };
}

export type UseDiary = ReturnType<typeof useDiary>;
