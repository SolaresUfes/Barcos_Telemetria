import type { MutableRefObject } from "react";
import { calculateBatteryAutonomy } from "./batteryAutonomy";
import type { Member } from "../types/member";

/** Cálculos derivados do estado de telemetria (taxas, eficiências, autonomia...). */
export function deriveMetrics({
  battery,
  batteryHistoryRate,
  cells,
  members,
  currentTime,
  mainData,
  rpm,
  S1_power,
  tensaoReal,
  correnteRealBateria,
  batteryPowerHistory,
  currentUser,
}: {
  battery: number;
  batteryHistoryRate: { time: number; bat: number }[];
  cells: { id: number; voltage: number; temperature: number }[];
  members: Member[];
  currentTime: Date;
  mainData: number[];
  rpm: number;
  S1_power: number;
  tensaoReal: number;
  correnteRealBateria: number;
  batteryPowerHistory: MutableRefObject<number[]>;
  currentUser: Member | null;
}) {
// aqui vamos ter um sinalizador pra ver se a bateria ta carregando ou descarregando (olhando os números fica óbvio, mas to deixando mais visual)
  let batteryRate = 0;
  let batteryStatus = "Parado";
  if (batteryHistoryRate.length > 1) {
      const first = batteryHistoryRate[0];
      const last = batteryHistoryRate[batteryHistoryRate.length - 1];
      const timeDiffMins = (last.time - first.time) / 60000;
      if (timeDiffMins > 0) batteryRate = (last.bat - first.bat) / timeDiffMins;
  }
  if (batteryRate > 0.1) batteryStatus = "Carregando";
  else if (batteryRate < -0.1) batteryStatus = "Descarregando";

  // Cálculo do tempo estimado de carga (Falta para 100% / Taxa por minuto)
  const tempoCargaTotalMinutos = (batteryRate > 0.1 && battery >= 0 && battery < 100) 
    ? (100 - battery) / batteryRate 
    : 0;
  const tempoCargaH = Math.floor(tempoCargaTotalMinutos / 60);
  const tempoCargaM = Math.floor(tempoCargaTotalMinutos % 60);

  // #region Cálculos Derivados
  const avgBmsTemp =
    cells.reduce((acc, cell) => acc + cell.temperature, 0) / cells.length;
  const maxVoltageCell = [...cells].sort((a, b) => b.voltage - a.voltage)[0] || { voltage: 0 };
  const minVoltageCell = [...cells].sort((a, b) => a.voltage - b.voltage)[0] || { voltage: 0 };
  const voltageImbalance = maxVoltageCell.voltage - minVoltageCell.voltage;

  const onlineCount = members.filter((m) => m.isOnline).length;
  const brasiliaTime = currentTime.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });


// Cálculos de Eficiência Dinâmicos (Estimativas baseadas APENAS em Potências)

const currentPower = mainData[0] || 0;

  // Cálculos de Eficiência baseados ESTRITAMENTE E APENAS em Potências (W)
  const potBateria = currentPower || 0;
  const potMotor = rpm || 0;        // No seu código, 'rpm' guarda a Pot. do Motor (V * Corrente_2)
  const potGeracao = S1_power || 0; // No seu código, 'S1_power' guarda a Pot. de Geração (V * S1)

  // 1. Painel Solar: O quanto ele está a gerar em relação ao limite físico máximo dele (ex: 800W)
  const eficienciaPainel = potGeracao > 0 ? Math.min(100, (potGeracao / 800) * 100) : 0; 
  
  // 2. Motor: O quanto ele consegue aproveitar da energia total disponibilizada no sistema
  const energiaFornecida = potGeracao + Math.abs(potBateria);
  const eficienciaMotor = energiaFornecida > 0 ? Math.min(100, (potMotor / energiaFornecida) * 100) : 0; 
  
  // 3. Bateria: Perdas por resistência interna. Quanto mais potência forçada, menor a eficiência.
  const eficienciaBateria = Math.max(0, 100 - (Math.abs(potBateria) / 2000) * 10); 
 
 
 
  // Comentado para testes
  // const estimatedTimeRaw = (battery / Math.max(10, currentPower)) * 2.5;
  // const estHours = Math.floor(estimatedTimeRaw);
  // const estMinutes = Math.floor((estimatedTimeRaw - estHours) * 60);
  
  // 1. Calcula o objeto de dados da autonomia
  const autonomyData = calculateBatteryAutonomy(
    battery,
    tensaoReal,
    correnteRealBateria,
    batteryPowerHistory.current
  );

  // 2. Extrai as horas e minutos formatados
  const estimatedHoursRaw = autonomyData?.estimatedTimeRaw ?? 0;
  const estHours = Math.floor(estimatedHoursRaw);
  const estMinutes = Math.floor((estimatedHoursRaw - estHours) * 60);
  











  const userProfileSubtitle = currentUser?.isModerador
    ? currentUser.mainRole
      ? `${currentUser.mainRole} | Mod`
      : "Moderador"
    : currentUser?.mainRole || "Membro";

  const isTelemetryActive = tensaoReal !== -1 && tensaoReal !== -2; // verifica se não tem erro e se as coisas estão conectadas
  // #endregion

  return {
    batteryRate,
    batteryStatus,
    tempoCargaTotalMinutos,
    tempoCargaH,
    tempoCargaM,
    avgBmsTemp,
    maxVoltageCell,
    minVoltageCell,
    voltageImbalance,
    onlineCount,
    brasiliaTime,
    currentPower,
    potBateria,
    potMotor,
    potGeracao,
    eficienciaPainel,
    energiaFornecida,
    eficienciaMotor,
    eficienciaBateria,
    autonomyData,
    estimatedHoursRaw,
    estHours,
    estMinutes,
    userProfileSubtitle,
    isTelemetryActive,
  };
}

export type DerivedMetrics = ReturnType<typeof deriveMetrics>;
