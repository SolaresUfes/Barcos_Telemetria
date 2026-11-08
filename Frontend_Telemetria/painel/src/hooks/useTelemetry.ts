import type { Dispatch, SetStateAction, MutableRefObject } from "react";
import { useState, useEffect, useRef } from "react";
import { historySeconds } from "../utils/batteryAutonomy";
import type { Member } from "../types/member";
import type { SeriesData } from "../types/telemetry";

export function useTelemetry(currentUser: Member | null,
  provaAtivaRef: MutableRefObject<boolean>,
  setRecordingData: Dispatch<SetStateAction<SeriesData>>) {
  const initialMainData: number[] = []                                // Array vazio de numeros
  const [mainData, setMainData] = useState(initialMainData);          // Valores para a construção do grafico   

  const [tensaoReal, set_tensaoReal] = useState(-1)                    // Tensao total da bateria
  const [correnteRealBateria, set_correnteRealBateria] = useState(-1)  // Corrente da bateria
  const [correnteMotor, set_correnteMotor] = useState(-1)
  const [battery, setBattery] = useState(-1);                          // Porcentagem da bateria
  const [cells, setCells] = useState(Array.from({ length:16 }, (_, i) => ({ id: i, voltage: 0, temperature: 0 })));  // Parte das celulas

  const [rpm, setRpm] = useState(-1);                                  // Rpm motor
  const [speed, setSpeed] = useState(-1);                              // Velocidade do motor (em Km/h)
  const [string_1, setString_1] = useState(-1);
  const [S1_power, setS1_power] = useState(-1)
  const [string_2, setString_2] = useState(-1);

  const [idleData, setIdleData] = useState({
    tensao: [] as number[], potenciaBateria: [] as number[], potenciaMotor: [] as number[],
    potenciaGeracao: [] as number[], bateria: [] as number[], velocidade: [] as number[],
    correnteBateria: [] as number[], correnteMotor: [] as number[], s1: [] as number[], s2: [] as number[]
  });

  const [idleBatteryData, setIdleBatteryData] = useState<number[]>([]);
  const [batteryHistoryRate, setBatteryHistoryRate] = useState<{time: number, bat: number}[]>([]);

  const batteryPowerHistory = useRef<number[]>([]);

  const buscarUltimaMedicao = async () => {
    try {
      // Substitua pela URL real gerada pela Vercel para o seu backend
      const res = await fetch("https://telemetria-be.vercel.app/api/sensores/ultimo");
      const data = await res.json();

      if (data && data.length > 0) {
        const medicao = data[0];
        
        // 2. Atualiza as variáveis da tela com os dados reais
        if (medicao.tensao      != null) set_tensaoReal(medicao.tensao);
        if (medicao.corrente    != null) set_correnteRealBateria(medicao.corrente);
        if (medicao.corrente_2  != null) set_correnteMotor(medicao.corrente_2);
        if (medicao.potencia    != null) setMainData(prev => [medicao.potencia, ...prev].slice(0,40));
        // if (medicao.porcentagem != null) setBattery(medicao.porcentagem); se der merda, apaga o de baixo e restaura esse daqui
        // esse aqui vai pra taxa de bateria
        if (medicao.porcentagem != null) {
            setBattery(medicao.porcentagem);
            setIdleBatteryData(prev => [medicao.porcentagem, ...prev].slice(0, 40)); // Gráfico em movimento contínuo
            setBatteryHistoryRate(prev => {
                const now = Date.now();
                return [...prev, {time: now, bat: medicao.porcentagem}].filter(item => now - item.time <= 60000); // Mantém apenas os últimos 60 seg
            });
        }
        // if (medicao.rpm         != null) setRpm(medicao.rpm);
        if (medicao.tensao      != null) setRpm(medicao.tensao * medicao.corrente_2);
        if (medicao.velocidade  != null) setSpeed(medicao.velocidade);
        if (medicao.string_1    != null) {
          setString_1(medicao.string_1); 
          setS1_power(medicao.tensao * medicao.string_1);
        }
        if (medicao.string_2    != null) setString_2(medicao.string_2); 

        // matriz para alimentar os gráficos em tempo real quando parado
        setIdleData(prev => ({
            tensao: [medicao.tensao ?? 0, ...prev.tensao].slice(0, 40),
            potenciaBateria: [medicao.potencia ?? 0, ...prev.potenciaBateria].slice(0, 40),
            potenciaMotor: [(medicao.tensao ?? 0) * (medicao.corrente_2 ?? 0), ...prev.potenciaMotor].slice(0, 40),
            potenciaGeracao: [(medicao.tensao ?? 0) * (medicao.string_1 ?? 0), ...prev.potenciaGeracao].slice(0, 40),
            bateria: [medicao.porcentagem ?? 0, ...prev.bateria].slice(0, 40),
            velocidade: [medicao.velocidade ?? 0, ...prev.velocidade].slice(0, 40),
            correnteBateria: [medicao.corrente ?? 0, ...prev.correnteBateria].slice(0, 40),
            correnteMotor: [medicao.corrente_2 ?? 0, ...prev.correnteMotor].slice(0, 40),
            s1: [medicao.string_1 ?? 0, ...prev.s1].slice(0, 40),
            s2: [medicao.string_2 ?? 0, ...prev.s2].slice(0, 40)
        }));

        // isso aqui é pra gravar os dados no grafico da aba de análise
        if (provaAtivaRef.current) {
            setRecordingData(prev => ({
              tensao: [...prev.tensao, medicao.tensao ?? 0],
              potenciaBateria: [...prev.potenciaBateria, medicao.potencia ?? 0],
              potenciaMotor: [...prev.potenciaMotor, (medicao.tensao ?? 0) * (medicao.corrente_2 ?? 0)],
              potenciaGeracao: [...prev.potenciaGeracao, (medicao.tensao ?? 0) * (medicao.string_1 ?? 0)],
              bateria: [...prev.bateria, medicao.porcentagem ?? 0],
              velocidade: [...prev.velocidade, medicao.velocidade ?? 0],
              correnteBateria: [...prev.correnteBateria, medicao.corrente ?? 0],
              correnteMotor: [...prev.correnteMotor, medicao.corrente_2 ?? 0],
              s1: [...prev.s1, medicao.string_1 ?? 0],
              s2: [...prev.s2, medicao.string_2 ?? 0]
            }));
        }

        // Bloco de codigo de teste

        // --- ALIMENTA O HISTÓRICO DE POTÊNCIA (P = V x I) ---
        if (medicao.tensao != null && medicao.corrente != null) {
          const pW = medicao.tensao * Math.abs(medicao.corrente);
          batteryPowerHistory.current.push(pW);

          if (batteryPowerHistory.current.length > historySeconds) {
            batteryPowerHistory.current.shift();
          }
        }
      }
    } catch (error) {
      console.error("Erro na comunicação com o backend:", error);
    }
  };

  const buscarCelulas = async () => {
    try {
      const res = await fetch("https://telemetria-be.vercel.app/api/celulas/ultimo");
      const data = await res.json();

      console.log("Resposta completa:", data);

      if (data && data.length > 0) {
        const celulasBanco = data[0]; // Pega a linha completa mais recente

        // Puxar a coluna de array do supabase
        const tensoes = celulasBanco.celula; 
        
        // Vamos usar essa mesma coisa para puxar a temperatura depois...
        const temperaturas = celulasBanco.temperatura;

        // 2. Transforma o array simples de floats no formato de objetos que a tela exige
        if (tensoes && Array.isArray(tensoes)) {
          const novasCelulas = tensoes.map((valorTensao: number, index: number) => ({
            id: index + 1, // O índice começa em 0, então somamos 1 para a Célula 1, Célula 2...
            voltage: valorTensao,
            
            // Se tiver a coluna de temperaturas, puxa a temperatura na mesma posição. 
            // Se não tiver, coloca um valor padrão (ex: 35).
            temperature: temperaturas && temperaturas[index] !== undefined ? temperaturas[index] : -1
          }));

          // 3. Atualiza os estados na tela, acionando as barras e as cores instantaneamente
          setCells(novasCelulas);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar células:", error);
    }
  };

  // Efeito que roda a função em loop quando o usuário está logado (Usado para buscar as medições)
  useEffect(() => {
    if (!currentUser) return; // Impede a busca de dados na tela de login

    // Executa a função imediatamente ao logar
    buscarUltimaMedicao();
    buscarCelulas();

    // Configura o loop para rodar a cada 2 segundos (2000 ms)
    const interval = setInterval(() => {
      buscarUltimaMedicao();
      buscarCelulas();
    }, 500);

    // Limpa o loop se o usuário deslogar ou fechar o painel
    return () => clearInterval(interval);
  }, [currentUser]);
  return {
    mainData,
    setMainData,
    tensaoReal,
    set_tensaoReal,
    correnteRealBateria,
    set_correnteRealBateria,
    correnteMotor,
    set_correnteMotor,
    battery,
    setBattery,
    cells,
    setCells,
    rpm,
    setRpm,
    speed,
    setSpeed,
    string_1,
    setString_1,
    S1_power,
    setS1_power,
    string_2,
    setString_2,
    idleData,
    setIdleData,
    idleBatteryData,
    setIdleBatteryData,
    batteryHistoryRate,
    setBatteryHistoryRate,
    batteryPowerHistory,
    buscarUltimaMedicao,
    buscarCelulas,

  };
}

export type UseTelemetry = ReturnType<typeof useTelemetry>;
