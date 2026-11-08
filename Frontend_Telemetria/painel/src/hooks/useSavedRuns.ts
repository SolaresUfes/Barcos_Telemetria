/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { supabase } from "../lib/supabase";
import type { ToastFn } from "../types/ui";

export function useSavedRuns(dispararToast: ToastFn) {
  const [showModalAnalise, setShowModalAnalise] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listaProvas, setListaProvas] = useState<any[]>([]);
  const [carregandoProvas, setCarregandoProvas] = useState(false);
  const [idEditando, setIdEditando] = useState<number | null>(null);
  const [novoNomeEditado, setNovoNomeEditado] = useState("");

  async function abrirAnaliseDeDados() {
    setShowModalAnalise(true);
    setCarregandoProvas(true);

    const { data, error } = await supabase
      .from("estado_prova")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao buscar provas:", error);
      dispararToast("Erro ao carregar as gravações.", "erro");
    } else {
      setListaProvas(data || []);
    }
    setCarregandoProvas(false);
  }

  async function baixarCSVHistorico(prova: any) {
    dispararToast(`A buscar a gravação #${prova.id} na tabela medicoes...`, "aviso");

    try {
      const NOME_DA_TABELA = 'medicoes'; 
      const NOME_COLUNA_DATA = 'momento'; 

      // 1. Converter as datas da prova (que estão em UTC) para o fuso brasileiro (-3h)
      // para que a busca no banco de dados "bata" com o que está gravado lá.
      const inicioOriginal = new Date(prova.inicio).getTime();
      const fimOriginal = new Date(prova.fim).getTime();
      
      const milissegundosErro = 3 * 60 * 60 * 1000; // 3 horas
      const margemSeguranca = 2 * 60 * 1000; // 2 minutos de margem
      
      const inicioAjustado = new Date(inicioOriginal - milissegundosErro - margemSeguranca).toISOString();
      const fimAjustado = new Date(fimOriginal - milissegundosErro + margemSeguranca).toISOString();

      // 2. Busca direta no Supabase
      const { data: dadosFiltrados, error } = await supabase
        .from(NOME_DA_TABELA)
        .select('*')
        .gte(NOME_COLUNA_DATA, inicioAjustado)
        .lte(NOME_COLUNA_DATA, fimAjustado)
        .order(NOME_COLUNA_DATA, { ascending: true });

      if (error) {
        alert("ERRO DO SUPABASE: " + error.message);
        throw new Error(error.message);
      }

      if (!dadosFiltrados || dadosFiltrados.length === 0) {
        dispararToast("Nenhum dado encontrado para as datas ajustadas.", "erro");
        return;
      }

      // 3. Formatação para o CSV
      const dadosCorrigidos = dadosFiltrados.map((item: any) => {
        let dataFormatada = 'Sem Data';
        
        if (item[NOME_COLUNA_DATA]) {
          const tempoNoBanco = new Date(item[NOME_COLUNA_DATA]).getTime();
          
          // O navegador subtraiu 3 horas achando que era UTC.
          // Devolvemos as 3 horas (3 * 60 * 60 * 1000) para o CSV ficar igual à UI
          const tempoCorrigido = tempoNoBanco + (3 * 60 * 60 * 1000); 
          
          dataFormatada = new Date(tempoCorrigido).toLocaleString('pt-BR');
        }

        return {
          ...item,
          [NOME_COLUNA_DATA]: dataFormatada 
        };
      });

      // 4. Gerar e descarregar o ficheiro
      const cabecalhos = Object.keys(dadosCorrigidos[0]).join(",");
      const linhas = dadosCorrigidos.map((item: any) => {
        return Object.values(item).map(valor => `"${valor}"`).join(",");
      });

      const csvString = [cabecalhos, ...linhas].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const urlBlob = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = urlBlob;
      link.setAttribute("download", `telemetria_gravacao_${prova.id}.csv`);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(urlBlob);

      dispararToast("CSV baixado com sucesso!", "sucesso");

    } catch (erro) {
      console.error("Erro completo:", erro);
      dispararToast("Falha ao gerar o ficheiro.", "erro");
    }
  }

  async function salvarEdicaoNome(id: number) {
    if (!novoNomeEditado.trim()) {
      dispararToast("O nome não pode ficar vazio.", "aviso");
      return;
    }

    const { error } = await supabase
      .from("estado_prova")
      .update({ nome: novoNomeEditado })
      .eq("id", id);

    if (error) {
      dispararToast("Erro ao atualizar o nome.", "erro");
    } else {
      dispararToast("Nome atualizado com sucesso!");
      setListaProvas(listaProvas.map(p => p.id === id ? { ...p, nome: novoNomeEditado } : p));
      setIdEditando(null);
    }
  }

  async function deletarProvaBanco(id: number) {
    if (!window.confirm(`Tem certeza que deseja apagar a gravação #${id}?`)) return;

    const { error } = await supabase
      .from("estado_prova")
      .delete()
      .eq("id", id);

    if (error) {
      dispararToast("Erro ao apagar a gravação.", "erro");
    } else {
      dispararToast("Gravação apagada com sucesso!");
      setListaProvas(listaProvas.filter(p => p.id !== id));
    }
  }
  return {
    showModalAnalise,
    setShowModalAnalise,
    listaProvas,
    setListaProvas,
    carregandoProvas,
    setCarregandoProvas,
    idEditando,
    setIdEditando,
    novoNomeEditado,
    setNovoNomeEditado,
    abrirAnaliseDeDados,
    baixarCSVHistorico,
    salvarEdicaoNome,
    deletarProvaBanco,

  };
}

export type UseSavedRuns = ReturnType<typeof useSavedRuns>;
