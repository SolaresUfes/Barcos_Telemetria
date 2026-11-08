import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import type { ToastFn } from "../types/ui";

export function useRecording(dispararToast: ToastFn) {
  const [provaAtiva, setProvaAtiva] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [showModalFinalizacao, setShowModalFinalizacao] = useState(false);
  const [nomeDefinitivoProva, setNomeDefinitivoProva] = useState("");
  const [inicioTimestamp, setInicioTimestamp] = useState<string | null>(null);
  const [fimTimestamp, setFimTimestamp] = useState<string | null>(null);
  const [rascunhoAtivo, setRascunhoAtivo] = useState<{ id: number; nome: string; inicio: string | null } | null>(null);  // Novos estados para Notificações (Toast) e Confirmação de Descarte

  const [pedirConfirmacaoDescarte, setPedirConfirmacaoDescarte] = useState(false);

  const [provaFlags, setProvaFlags] = useState<number[]>([]);

  const [idProvaAtual, set_idProvaAtual] = useState(-1)

  const provaAtivaRef = useRef(false);
  useEffect(() => {
    provaAtivaRef.current = provaAtiva;
  }, [provaAtiva]);

  const [recordingData, setRecordingData] = useState({
    tensao: [] as number[], potenciaBateria: [] as number[], potenciaMotor: [] as number[],
    potenciaGeracao: [] as number[], bateria: [] as number[], velocidade: [] as number[],
    correnteBateria: [] as number[], correnteMotor: [] as number[], s1: [] as number[], s2: [] as number[]
  });

// Verifica se há rascunhos ou gravações ativas ao carregar
  useEffect(() => {
    const salvo = localStorage.getItem("telemetria_rascunho");
    if (salvo) {
      try {
        setRascunhoAtivo(JSON.parse(salvo));
      } catch (e) {
        console.log("Erro de parsing: ", e)
      }
    }

    // Verifica se havia uma gravação ativa antes do F5 / refresh
    const gravacaoAtivaSalva = localStorage.getItem("telemetria_gravacao_ativa");
    if (gravacaoAtivaSalva) {
      try {
        const parsed = JSON.parse(gravacaoAtivaSalva);
        if (parsed && parsed.inicio) {
          setProvaAtiva(true);
          setInicioTimestamp(parsed.inicio);
          
          // Calcula exatamente quantos segundos passaram desde o início da gravação até o F5
          const segundosDecorridos = Math.floor((Date.now() - new Date(parsed.inicio).getTime()) / 1000);
          setRecordingTime(segundosDecorridos > 0 ? segundosDecorridos : 0);
        }
      } catch (e) {
        console.log("Erro no recordingTime(): ", e)
      }
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (provaAtiva) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
      setRecordingTime(0);
    };
  }, [provaAtiva]);

  function exportarCSV() {
      if (!recordingData.tensao || recordingData.tensao.length === 0) {
          dispararToast("Nenhum dado gravado para exportar.", "aviso");
          return;
      }
      const headers = "Tensão(V),Potência Bateria(W),Potência Motor(W),Potência Geração(W),Bateria(%),Velocidade,Corrente Bateria(A),Corrente Motor(A),S1,S2\n";
      const rows = recordingData.tensao.map((_, i) => {
          return `${recordingData.tensao[i]},${recordingData.potenciaBateria[i]},${recordingData.potenciaMotor[i]},${recordingData.potenciaGeracao[i]},${recordingData.bateria[i]},${recordingData.velocidade[i]},${recordingData.correnteBateria[i]},${recordingData.correnteMotor[i]},${recordingData.s1[i]},${recordingData.s2[i]}`;
      }).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `telemetria_prova_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
  }

function prova_iniciar() {
    const agora = new Date().toISOString();
    
    // Ativa o estado localmente
    setProvaAtiva(true);
    setInicioTimestamp(agora);
    setNomeDefinitivoProva("");
    setPedirConfirmacaoDescarte(false);
    set_idProvaAtual(-1);
    setProvaFlags([]);

    // Salva no localStorage para resistir ao F5 / refresh
    localStorage.setItem("telemetria_gravacao_ativa", JSON.stringify({ inicio: agora }));

    setRecordingData({
      tensao: [], potenciaBateria: [], potenciaMotor: [],
      potenciaGeracao: [], bateria: [], velocidade: [],
      correnteBateria: [], correnteMotor: [], s1: [], s2: []
    });

    dispararToast("Gravação iniciada com sucesso!");
  }

  function lidarComCliqueFim() {
    if (!provaAtiva) {
      dispararToast("Nenhuma gravação ativa no momento!", "aviso");   
      return;  
    }
    setFimTimestamp(new Date().toISOString());
    setPedirConfirmacaoDescarte(false);
    setShowModalFinalizacao(true);
  }

  async function salvarProvaComNome() {
    if (!nomeDefinitivoProva.trim()) {
      dispararToast("Por favor, digite um nome para a gravação.", "aviso");
      return;
    }

    // Determina o ID: usa o do rascunho se existir, senão busca o maior ID atual no Supabase + 1
    let idParaSalvar = rascunhoAtivo?.id;

    if (!idParaSalvar) {
      const { data: ultimoRegistro } = await supabase
        .from("estado_prova")
        .select("id")
        .order("id", { ascending: false })
        .limit(1);

      idParaSalvar = ultimoRegistro && ultimoRegistro.length > 0 ? ultimoRegistro[0].id + 1 : 1;
    }

    const dadosInsercao = {
      id: idParaSalvar,
      nome: nomeDefinitivoProva,
      inicio: inicioTimestamp,
      fim: fimTimestamp || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("estado_prova")
      .insert([dadosInsercao])
      .select()
      .single();

    if (error) {
      console.log("Erro ao salvar a prova: ", error);
      dispararToast("Erro ao atualizar o registro no banco.", "erro");
      return;
    }

    if (data) {
      set_idProvaAtual(data.id);
    }
    
    // Limpa o rascunho e a gravação ativa do localStorage
    localStorage.removeItem("telemetria_rascunho");
    localStorage.removeItem("telemetria_gravacao_ativa");
    
    setRascunhoAtivo(null);
    setProvaAtiva(false);
    setShowModalFinalizacao(false);
    setPedirConfirmacaoDescarte(false);
    dispararToast(`Gravação #${data.id} salva com sucesso!`);
  }

  async function deixarComoRascunho() {
    const { data: ultimoRegistro } = await supabase
      .from("estado_prova")
      .select("id")
      .order("id", { ascending: false })
      .limit(1);

    const proximoId = ultimoRegistro && ultimoRegistro.length > 0 ? ultimoRegistro[0].id + 1 : 1;
    const nomeRascunho = nomeDefinitivoProva.trim() || `Rascunho - ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`;

    const rascunhoObj = {
      id: proximoId,
      nome: nomeRascunho,
      inicio: inicioTimestamp,
      fim: fimTimestamp || new Date().toISOString()
    };

    localStorage.setItem("telemetria_rascunho", JSON.stringify(rascunhoObj));
    localStorage.removeItem("telemetria_gravacao_ativa"); // Remove da gravação ativa
    
    setRascunhoAtivo(rascunhoObj);
    setProvaAtiva(false);
    setShowModalFinalizacao(false);
    setPedirConfirmacaoDescarte(false);
    dispararToast(`Rascunho guardado com a previsão de ID #${proximoId}!`, "aviso");
  }

  function executarDescarte() {
    localStorage.removeItem("telemetria_rascunho");
    localStorage.removeItem("telemetria_gravacao_ativa"); // Remove da gravação ativa
    
    setRascunhoAtivo(null);
    setProvaAtiva(false);
    setShowModalFinalizacao(false);
    setPedirConfirmacaoDescarte(false);
    dispararToast("Gravação descartada. Nenhum ID foi consumido.", "erro");
  }

  function carregarRascunhoSalvo() {
    const salvo = localStorage.getItem("telemetria_rascunho");
    if (salvo) {
      const parsed = JSON.parse(salvo);
      setRascunhoAtivo(parsed);
      setInicioTimestamp(parsed.inicio);
      setFimTimestamp(parsed.fim || new Date().toISOString());
      setNomeDefinitivoProva(parsed.nome || "");
      setShowModalFinalizacao(true); // Abre o modal com os dados do rascunho
    } else {
      dispararToast("Nenhum rascunho pendente encontrado.", "aviso");
    }
  }

  const formatarDataHora = (isoString: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleString("pt-BR");
  };
  return {
    provaAtiva,
    setProvaAtiva,
    recordingTime,
    setRecordingTime,
    showModalFinalizacao,
    setShowModalFinalizacao,
    nomeDefinitivoProva,
    setNomeDefinitivoProva,
    inicioTimestamp,
    setInicioTimestamp,
    fimTimestamp,
    setFimTimestamp,
    rascunhoAtivo,
    setRascunhoAtivo,
    pedirConfirmacaoDescarte,
    setPedirConfirmacaoDescarte,
    provaFlags,
    setProvaFlags,
    idProvaAtual,
    set_idProvaAtual,
    provaAtivaRef,
    recordingData,
    setRecordingData,
    exportarCSV,
    prova_iniciar,
    lidarComCliqueFim,
    salvarProvaComNome,
    deixarComoRascunho,
    executarDescarte,
    carregarRascunhoSalvo,
    formatarDataHora,

  };
}

export type UseRecording = ReturnType<typeof useRecording>;
