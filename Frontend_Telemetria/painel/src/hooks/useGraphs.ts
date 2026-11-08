import { useState } from "react";
import type { SeriesData } from "../types/telemetry";

export function useGraphs(provaAtiva: boolean, recordingData: SeriesData, idleData: SeriesData) {
  const [expandedGraph, setExpandedGraph] = useState<{ id: string, label: string, data: number[], color: string } | null>(null);

  const [overlaySelections, setOverlaySelections] = useState<string[]>([]);
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  const [infoModalOpen, setInfoModalOpen] = useState<{ titulo: string; descricao: string; cor: string } | null>(null);

// Troca automática entre o Histórico Permanente e a Variação em Tempo Real
  const currentGraphData = provaAtiva ? recordingData : idleData;

  const availableGraphs = [
    { id: "tensao", label: "Tensão (V)", data: currentGraphData.tensao, color: "#3b82f6" },
    { id: "potBateria", label: "Pot. Bateria (W)", data: currentGraphData.potenciaBateria, color: "#14b8a6" },
    { id: "potMotor", label: "Pot. Motor (W)", data: currentGraphData.potenciaMotor, color: "#8b5cf6" },
    { id: "potGeracao", label: "Pot. Geração (W)", data: currentGraphData.potenciaGeracao, color: "#ef4444" },
    { id: "velocidade", label: "Velocidade", data: currentGraphData.velocidade, color: "#eab308" },
    { id: "corrBateria", label: "Corr. Bateria (A)", data: currentGraphData.correnteBateria, color: "#f97316" },
    { id: "corrMotor", label: "Corr. Motor (A)", data: currentGraphData.correnteMotor, color: "#d946ef" },
    { id: "s1", label: "S1 Status", data: currentGraphData.s1, color: "#22c55e" },
    { id: "s2", label: "S2 Status", data: currentGraphData.s2, color: "#f43f5e" },
    { id: "bateria", label: "Bateria (%)", data: currentGraphData.bateria, color: "#10b981" }
  ];

  const toggleOverlay = (id: string) => {
    setOverlaySelections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  return {
    expandedGraph,
    setExpandedGraph,
    overlaySelections,
    setOverlaySelections,
    showOverlayModal,
    setShowOverlayModal,
    infoModalOpen,
    setInfoModalOpen,
    currentGraphData,
    availableGraphs,
    toggleOverlay,

  };
}

export type UseGraphs = ReturnType<typeof useGraphs>;
