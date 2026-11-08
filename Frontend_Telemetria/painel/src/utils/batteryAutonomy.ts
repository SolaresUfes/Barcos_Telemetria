// --- PARÂMETROS E FUNÇÃO DE AUTONOMIA ---
export const usableBatteryWh = 1996.8; // Capacidade de referência em Wh (2 x 12.8V x 78Ah)
export const historySeconds = 60;
export const minDischargePowerW = 5;

export function calculateBatteryAutonomy(
  batterySoC: number,
  batteryVoltage: number,
  batteryCurrentA: number,
  history: number[]
) {
  if (batterySoC < 0 || batterySoC > 100 || batteryVoltage <= 0) {
    return null;
  }

  // 1. Potência Instantânea (P = V x I)
  const instantaneousPowerW = batteryVoltage * Math.abs(batteryCurrentA);

  // Média móvel da potência (P_médio)
  const averagePowerW =
    history.length > 0
      ? history.reduce((sum, p) => sum + p, 0) / history.length
      : instantaneousPowerW;

  // 2. Energia Restante: E_restante = 1996.8 * (SOC / 100)
  const remainingEnergyWh = usableBatteryWh * (batterySoC / 100);

  // 3. Autonomia: t = E_restante / P_médio
  let estimatedTimeRaw: number | null = null;

  if (averagePowerW > minDischargePowerW) {
    estimatedTimeRaw = remainingEnergyWh / averagePowerW;
  }

  return {
    instantaneousPowerW,
    averagePowerW,
    remainingEnergyWh,
    estimatedTimeRaw,
  };
}
