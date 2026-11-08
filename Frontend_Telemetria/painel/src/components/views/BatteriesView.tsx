import { Database, BatteryCharging } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "avgBmsTemp" | "cells" | "darkMode" | "tensaoReal" | "voltageImbalance">;

export function BatteriesView(props: Props) {
  const {
    avgBmsTemp,
    cells,
    darkMode,
    tensaoReal,
    voltageImbalance,
  } = props;
  return (
            <div className="h-full w-full max-w-6xl mx-auto flex flex-col animate-in fade-in duration-300 min-h-0">
              {/* #region Aba Baterias */}
              <div className="flex items-center space-x-3 mb-2 md:mb-6 shrink-0">
                <div className="p-2 md:p-3 bg-orange-500/10 rounded-xl md:rounded-2xl">
                  <BatteryCharging className="text-orange-500 w-5 h-5 md:w-7 md:h-7" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold">
                    Diagnóstico do BMS
                  </h2>
                  <p
                    className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Monitoramento individual de células e pack.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-6 mb-2 md:mb-6 shrink-0">
                <div
                  className={`rounded-xl md:rounded-3xl p-2 md:p-6 shadow-sm border transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <h3 className="text-gray-500 font-bold text-[7px] sm:text-xs uppercase tracking-wider mb-1 md:mb-2 truncate">
                    Tensão Total
                  </h3>
                  <div className="flex items-baseline">
                    <span className="text-sm sm:text-4xl font-black text-blue-500 tabular-nums">
                      {tensaoReal}
                    </span>
                    <span className="text-[10px] sm:text-xl font-bold ml-0.5 md:ml-1 text-blue-500">
                      V
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-xl md:rounded-3xl p-2 md:p-6 shadow-sm border transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <h3 className="text-gray-500 font-bold text-[7px] sm:text-xs uppercase tracking-wider mb-1 md:mb-2 truncate">
                    Desbalanço
                  </h3>
                  <div className="flex items-baseline">
                    <span
                      className={`text-sm sm:text-4xl font-black tabular-nums ${voltageImbalance > 0.15 ? "text-red-500" : "text-green-500"}`}
                    >
                      {voltageImbalance.toFixed(3)}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xl font-bold ml-0.5 md:ml-1 ${voltageImbalance > 0.15 ? "text-red-500" : "text-green-500"}`}
                    >
                      V
                    </span>
                  </div>
                </div>

                <div
                  className={`rounded-xl md:rounded-3xl p-2 md:p-6 shadow-sm border transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <h3 className="text-gray-500 font-bold text-[7px] sm:text-xs uppercase tracking-wider mb-1 md:mb-2 truncate">
                    Temp. Média
                  </h3>
                  <div className="flex items-baseline">
                    <span
                      className={`text-sm sm:text-4xl font-black tabular-nums ${avgBmsTemp > 45 ? "text-red-500" : "text-orange-500"}`}
                    >
                      {avgBmsTemp.toFixed(1)}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xl font-bold ml-0.5 md:ml-1 ${avgBmsTemp > 45 ? "text-red-500" : "text-orange-500"}`}
                    >
                      °C
                    </span>
                  </div>
                </div>
              </div>

              <div
                className={`flex-1 rounded-2xl md:rounded-3xl shadow-sm border overflow-hidden flex flex-col min-h-0 transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
              >
                <div
                  className={`p-2 md:p-5 border-b flex justify-between items-center shrink-0 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50"}`}
                >
                  <h3 className="text-xs md:text-lg font-bold flex items-center">
                    <Database className="mr-1 md:mr-2 text-orange-500 w-3 h-3 md:w-5 md:h-5" />{" "}
                    Células Individuais
                  </h3>
                  <span
                    className={`px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[8px] md:text-xs font-bold ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                  >
                    Total: {cells.length}
                  </span>
                </div>

                <div className="flex-1 p-2 md:p-6 overflow-y-auto grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-1.5 md:gap-4 content-start">
                  {cells.map((cell) => {
                    const isHighTemp = cell.temperature >= 45;
                    const isLowVoltage = cell.voltage <= 3.2;
                    const isHighVoltage = cell.voltage >= 4.15;

                    let cellStatusBorder = darkMode
                      ? "border-gray-700"
                      : "border-gray-300";
                    if (isHighTemp || isLowVoltage || isHighVoltage) {
                      cellStatusBorder =
                        "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
                    }

                    return (
                      <div
                        key={cell.id}
                        className={`p-1.5 md:p-4 rounded-xl md:rounded-2xl border flex flex-col items-center justify-center transition-all ${darkMode ? "bg-gray-900" : "bg-gray-50"} ${cellStatusBorder}`}
                      >
                        <span className="text-[7px] md:text-xs font-bold text-gray-500 mb-1 md:mb-2">
                          CÉLULA {cell.id}
                        </span>

                        <div className="flex items-baseline mb-1">
                          <span
                            className={`text-xs md:text-xl font-bold tabular-nums ${isLowVoltage || isHighVoltage ? "text-red-500" : darkMode ? "text-gray-200" : "text-gray-800"}`}
                          >
                            {cell.voltage.toFixed(3)}
                          </span>
                          <span className="text-[8px] md:text-xs ml-0.5 md:ml-1 font-medium text-gray-500">
                            V
                          </span>
                        </div>

                        <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-1 md:h-1.5 mb-1.5 md:mb-3 overflow-hidden">
                          <div
                            className={`h-1 md:h-1.5 rounded-full ${isLowVoltage ? "bg-red-500" : isHighVoltage ? "bg-orange-500" : "bg-green-500"}`}
                            style={{
                              width: `${Math.max(0, Math.min(100, ((cell.voltage - 3.0) / (4.2 - 3.0)) * 100))}%`,
                            }}
                          ></div>
                        </div>

                        {/* <div
                          className={`flex items-center text-[8px] md:text-xs font-bold tabular-nums ${isHighTemp ? "text-red-500" : "text-orange-400"}`}
                        >
                          <Thermometer className="w-2 h-2 md:w-3.5 md:h-3.5 mr-0.5 md:mr-1" />
                          {cell.temperature.toFixed(1)}°C
                        </div> */}
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* #endregion */}
            </div>
  );
}
