import { useState } from "react";
import type { SeriesData } from "../types/telemetry";


export function useGraphs(provaAtiva: boolean, recordingData: SeriesData, idleData: SeriesData) {

	// Cria um estado de gráfico expandido que pode conter essas 4 propriedades ou pode ser nulo
	const [expandedGraph,         setExpandedGraph] = useState<{ id: string, label: string, data: number[], color: string } | null>(null);
	// PROPRIEDADES DE UM ESTADO GRÁFICO ("objeto gráfico")
	// id: tipo do gráfico
	// label: título que vai aparecer na interface
	// data: uma lista numérica que contém a série de dados
	// color: a cor da série de dados [hexadecimal]
	// | null>(null): quer dizer que pode receber as propriedades anteriores ou pode ser nulo

	// EXEMPLO DE ESTADO GRÁFICO
	/* {
			id: "tensao",
			label: "Tensão (V)",
			data: [12.1, 12.3, 12.2],
			color: "#3b82f6"
		}
	*/

	// Estados para definir sobreposição de gráficos (na função de sobreposição da aba de análise)
	const [overlaySelections, setOverlaySelections] = useState<string[]>([]);         // inicia vazio e recebe os id's dos gráficos que serão sobrepostos
	const [showOverlayModal,   setShowOverlayModal] = useState(false);                // dita se o modal de sobreposição está ativo ou não. Inicia desativado

	// Estado para controlar o modal de informações de eficiência (a tela que abre quando você clica na eficiência pra ver a explicação dela)
	const [infoModalOpen,         setInfoModalOpen] = useState<{ titulo: string; descricao: string; cor: string } | null>(null);
	// PROPRIEDADES DE UM ESTADO DE MODAL DE INFORMAÇÕES
	// titulo: é o título do card do modal explicativo
	// descricao: a explicação daquele card
	// cor: a cor do card
	// | null>(null): quer dizer que pode receber as propriedades anteriores ou pode ser nulo

	// EXEMPLO DE ESTADO MODAL DE INFORMAÇÕES
	/* {
			titulo: "Eficiência energética",
			descricao: "Informações sobre o rendimento do sistema.",
			cor: "#14b8a6"
		}
	*/

	// Troca automática entre o Histórico Permanente e a Variação em Tempo Real
	const currentGraphData                          = provaAtiva ? recordingData : idleData;
	// FUNCIONAMENTO
	// Se a prova estiver ativa, ou seja, se houver uma gravação em andamento (provaAtiva(TRUE)), os dados assumem o modo de gravação e se acumulam na tela
	// Caso contrário, dados antigos atravessam o eixo y para a esquerda e somem, dando espaço ao novos dados (dados ficam passageiros)

	// Lista de gráficos disponíveis (aqueles que aparecem na aba de análise)
	// O "data" de cada gráfico recebe da série de dados selecionada (recording ou idle, conforme o estado de gravação) a propriedade de interesse (tensão, potencia, corrente, etc)
	const availableGraphs = [
		{ id: "tensao",      label: "Tensão (V)",        data: currentGraphData.tensao,          color: "#3b82f6" },
		{ id: "potBateria",  label: "Pot. Bateria (W)",  data: currentGraphData.potenciaBateria, color: "#14b8a6" },
		{ id: "potMotor",    label: "Pot. Motor (W)",    data: currentGraphData.potenciaMotor,   color: "#8b5cf6" },
		{ id: "potGeracao",  label: "Pot. Geração (W)",  data: currentGraphData.potenciaGeracao, color: "#ef4444" },
		{ id: "velocidade",  label: "Velocidade",        data: currentGraphData.velocidade,      color: "#eab308" },
		{ id: "corrBateria", label: "Corr. Bateria (A)", data: currentGraphData.correnteBateria, color: "#f97316" },
		{ id: "corrMotor",   label: "Corr. Motor (A)",   data: currentGraphData.correnteMotor,   color: "#d946ef" },
		{ id: "s1",          label: "S1 Status",         data: currentGraphData.s1,              color: "#22c55e" },
		{ id: "s2",          label: "S2 Status",         data: currentGraphData.s2,              color: "#f43f5e" },
		{ id: "bateria",     label: "Bateria (%)",       data: currentGraphData.bateria,         color: "#10b981" }
	];

	// Função para marcar/desmarcar na configuração
	const toggleOverlay = (id: string) => {
		setOverlaySelections(prev => 
			prev.includes(id) 
				? prev.filter(x => x !== id) // cria um novo array selecionando x elementos (gráficos), tal que x seja diferente de id
				: [...prev, id]);            // cria um novo array adicionando o id selecionado
	};
	// A função recebe o parametro id (o identificador do gráfico), algo como toggleOverlay("tensao"), para que altere a seleção do grafico que tem esse identificador
	// "prev" representa a lista de parâmetros de graficos pré-selecionados
	// prev.includes(id) verfica se o id já estava previamente na lista
	// se já, prev.filter() remove o id da lista
	// se não, [...prev, id] adiciona na lista

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

// Cria e exporta um tipo chamado useGraphs, que corresponde ao tipo de valor retornado pela função useGraphs
export type useGraphs = ReturnType<typeof useGraphs>