import { Activity, Clock, BatteryCharging } from "lucide-react";
import { generatePolyline } from "../../utils/chartGeometry";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "S1_power" | "battery" | "correnteMotor" | "correnteRealBateria" | "currentPower" | "darkMode" | "estHours" | "estMinutes" | "isTelemetryActive" | "mainData" | "maxVoltageCell" | "minVoltageCell" | "rpm" | "speed" | "string_1" | "string_2" | "tensaoReal" | "voltageImbalance">;

export function SummaryView(props: Props) {
  const {
    S1_power,
    battery,
    correnteMotor,
    correnteRealBateria,
    currentPower,
    darkMode,
    estHours,
    estMinutes,
    isTelemetryActive,
    mainData,
    maxVoltageCell,
    minVoltageCell,
    rpm,
    speed,
    string_1,
    string_2,
    tensaoReal,
    voltageImbalance,
  } = props;
  return (
            <div className="flex flex-col h-full w-full gap-2 md:gap-4 min-h-0 animate-in fade-in duration-300">
              <div className="flex gap-2 md:gap-6 md:max-h-[45%] flex-col md:flex-row shrink-0 w-full min-h-0">
                <div
                  className={`hidden md:flex flex-[2] rounded-2xl p-4 md:p-6 shadow-sm border transition-colors duration-300 flex-col h-full min-h-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold flex items-center shrink-0">
                      <Activity className="mr-2 text-orange-500" size={20} />
                      Desempenho Principal
                    </h2>
                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 shrink-0">
                      {currentPower.toFixed(1)}{" "}
                      <span className="text-sm text-gray-400">W</span>
                    </span>
                  </div>

                  <div className="flex-1 w-full relative mt-2 min-h-0">
                    <svg
                      viewBox="0 0 1000 200"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full h-full overflow-visible"
                    >
                      <defs>
                        <linearGradient
                          id="mainGradient"
                          x1="0"
                          x2="0"
                          y1="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#f97316"
                            stopOpacity="0.4"
                          />
                          <stop
                            offset="100%"
                            stopColor="#f97316"
                            stopOpacity="0.0"
                          />
                        </linearGradient>
                      </defs>

                      {[0, 50, 100, 150, 200].map((y) => (
                        <line
                          key={`grid-${y}`}
                          x1="0"
                          y1={y}
                          x2="1000"
                          y2={y}
                          stroke={darkMode ? "#374151" : "#f3f4f6"}
                          strokeWidth="1"
                          strokeDasharray="5,5"
                        />
                      ))}

                      {/* LINHA DE ZERO DESTACADA */}
                      <line
                        x1="0"
                        y1="100"
                        x2="1000"
                        y2="100"
                        stroke={darkMode ? "#ef4444" : "#f97316"}
                        strokeWidth="2"
                        strokeDasharray="4,4"
                      />
                      <text 
                        x="10" 
                        y="93" 
                        fill={darkMode ? "#9ca3af" : "#6b7280"} 
                        fontSize="12" 
                        fontWeight="bold"
                      >                        
                        0 W
                      </text>

                      <polygon
                        points={`${mainData.length > 0 ? 1000 - ((mainData.length - 1) * (1000 / 39)) : 1000},100 ${generatePolyline(mainData, 1000, 200, 5000)} 1000,100`}
                        fill="url(#mainGradient)"
                      />
                      <polyline
                        points={generatePolyline(mainData, 1000, 200, 5000)}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="drop-shadow-md"
                      />
                      <line
                        x1="0"
                        y1="200"
                        x2="1000"
                        y2="200"
                        stroke={darkMode ? "#4b5563" : "#d1d5db"}
                        strokeWidth="2"
                      />
                      <line
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="200"
                        stroke={darkMode ? "#4b5563" : "#d1d5db"}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>

                <div
                  className={`shrink-0 md:flex-[1] rounded-2xl p-3 md:p-6 shadow-sm border transition-colors duration-300 flex flex-col md:h-full min-h-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <h2 className="text-sm md:text-lg font-bold flex items-center shrink-0">
                    <BatteryCharging className="mr-1 md:mr-2 text-blue-500 w-4 h-4 md:w-5 md:h-5" />
                    Geral da Bateria (BMS)
                  </h2>

                  <div className="my-3 md:flex-1 md:min-h-0 flex flex-col justify-center">
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5 md:gap-4 w-full">
                      <div
                        className={`flex flex-col md:flex-row justify-between items-center p-1.5 md:p-3 rounded-lg border text-center md:text-left ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                      >
                        <span className="text-[9px] md:text-xs uppercase font-bold text-gray-500">
                          Tensão Pack
                        </span>
                        <span className="font-bold text-blue-500 text-xs md:text-base tabular-nums">
                          {tensaoReal} V
                        </span>
                      </div>
                      <div
                        className={`flex flex-col md:flex-row justify-between items-center p-1.5 md:p-3 rounded-lg border text-center md:text-left ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                      >
                        <span className="text-[9px] md:text-xs uppercase font-bold text-gray-500">
                          Célula Máx/Mín
                        </span>
                        <span
                          className={`font-bold text-[10px] md:text-base tabular-nums ${darkMode ? "text-gray-100" : "text-gray-800"}`}
                        >
                          {maxVoltageCell.voltage.toFixed(3)} /{" "}
                          {minVoltageCell.voltage.toFixed(3)}
                        </span>
                      </div>
                      <div
                        className={`flex flex-col md:flex-row justify-between items-center p-1.5 md:p-3 rounded-lg border text-center md:text-left ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                      >
                        <span className="text-[9px] md:text-xs uppercase font-bold text-gray-500">
                          Desbalanço
                        </span>
                        <span
                          className={`font-bold text-xs md:text-base tabular-nums ${voltageImbalance > 0.15 ? "text-red-500" : "text-green-500"}`}
                        >
                          Δ {voltageImbalance.toFixed(3)} V
                        </span>
                      </div>
                      <div
                        className={`flex flex-col md:flex-row justify-between items-center p-1.5 md:p-3 rounded-lg border text-center md:text-left ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-300"}`}
                      >
                        <span className="text-[9px] md:text-xs uppercase font-bold text-gray-500">
                          Status BMS
                        </span>
                        <span
                          className={`px-2 py-0.5 md:py-1 rounded text-[9px] md:text-[10px] font-black uppercase ${voltageImbalance > 0.15 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"}`}
                        >
                          {voltageImbalance > 0.15 ? "Atenção" : "Normal"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 flex flex-col md:flex-row justify-between items-center">
                      <div className="flex items-center space-x-1.5 md:space-x-2 mb-1.5 md:mb-0">
                        <Clock className="w-3.5 h-3.5 md:w-5 md:h-5 text-emerald-500" />
                        <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Tempo Remanescente
                        </span>
                      </div>

                      {/* Wrapper do status no telemóvel e relógio */}
                      <div className="flex items-center justify-center space-x-3 w-full md:w-auto">
                        <span className={`md:hidden flex px-2 py-0.5 text-[9px] font-bold ring-1 ring-inset rounded-full items-center whitespace-nowrap shadow-sm transition-colors ${
                          isTelemetryActive 
                            ? "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20" 
                            : "bg-gray-50 text-gray-600 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            isTelemetryActive 
                              ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                              : "bg-gray-500"
                          }`}></span>
                          {isTelemetryActive ? "ESP Online" : "Offline"}
                        </span>
                      
                        <div className="flex items-baseline space-x-1">
                          <span className="text-xl md:text-2xl font-black text-emerald-500 tabular-nums">
                            {estHours}
                          </span>
                          <span className="text-[10px] md:text-sm font-bold text-emerald-500 opacity-80">
                            h
                          </span>
                          <span className="text-xl md:text-2xl font-black text-emerald-500 ml-1 tabular-nums">
                            {estMinutes.toString().padStart(2, "0")}
                          </span>
                          <span className="text-[10px] md:text-sm font-bold text-emerald-500 opacity-80">
                            m
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`flex-1 rounded-2xl shadow-sm overflow-hidden transition-colors duration-300 w-full flex flex-col min-h-0 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-300 shadow-xl shadow-gray-200/50"}`}
              >
                <div
                  className={`hidden md:block p-3 border-b shrink-0 ${darkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-gray-50"}`}
                >
                  <h2 className="text-lg font-bold">Métricas do Sistema</h2>
                </div>

                <div
                  className={`flex-1 grid grid-cols-2 lg:grid-cols-5 w-full h-full gap-[1px] ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}
                >
                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      Tensão
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-light tracking-tight tabular-nums ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                      >
                        {tensaoReal}
                      </span>
                      <span
                        className={`text-xs lg:text-2xl font-medium ml-1.5 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                      >
                        V
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      POTÊNCIA BATERIA
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-light tracking-tight tabular-nums ${darkMode ? "text-teal-400" : "text-teal-600"}`}
                      >
                        {currentPower.toFixed(3)}
                      </span>
                      <span
                        className={`text-xs lg:text-2xl font-medium ml-1.5 ${darkMode ? "text-teal-400" : "text-teal-600"}`}
                      >
                        {/* km/h */}
                        W
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      POTÊNCIA MOTOR
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-light tracking-tight tabular-nums ${darkMode ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {rpm.toFixed(3)}
                      </span>
                      <span
                        className={`text-xs lg:text-2xl font-medium ml-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {/* RPM */}
                        W
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      {/* Temp. BMS */}
                      Potência geração
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-light tracking-tight tabular-nums ${darkMode ? "text-red-400" : "text-red-600"}`}
                      >
                        {S1_power.toFixed(3)}
                      </span>
                      <span
                        className={`text-xs lg:text-2xl font-medium ml-1.5 ${darkMode ? "text-red-400" : "text-red-600"}`}
                      >
                        °C
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      Bateria
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-bold tracking-tight tabular-nums ${battery > 20 ? "text-green-500" : "text-red-500"}`}
                      >
                        {battery}%
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      VELOCIDADE
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-xl lg:text-5xl font-light tracking-tight tabular-nums ${darkMode ? "text-yellow-300" : "text-yellow-500"}`}
                      >
                        {speed}
                      </span>
                      <span
                        className={`text-xs lg:text-2xl font-medium ml-1.5 ${darkMode ? "text-yellow-300" : "text-yellow-500"}`}
                      >
                        W
                      </span>
                    </div>
                  </div>

                  {/* Correntes Mesclado */}
                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full col-span-2 lg:col-span-2 ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-2 w-full text-center">
                      Correntes
                    </span>
                    <div className="flex flex-row w-full items-stretch">
                      <div
                        className={`flex flex-col items-center justify-center w-1/2 text-center border-r ${darkMode ? "border-gray-700" : "border-gray-300"}`}
                      >
                        <div className="flex items-baseline justify-center">
                          <span
                            className={`text-2xl lg:text-5xl font-light tracking-tight tabular-nums text-orange-500`}
                          >
                            {correnteRealBateria.toFixed(3)}
                          </span>
                          <span
                            className={`text-xs lg:text-2xl font-medium ml-1 text-orange-500`}
                          >
                            A
                          </span>
                        </div>
                        <span className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase mt-1">
                          Bateria
                        </span>
                      </div>

                      <div className="flex flex-col items-center justify-center w-1/2 text-center">
                        <div className="flex items-baseline justify-center">
                          <span
                            className={`text-2xl lg:text-5xl font-light tracking-tight tabular-nums text-amber-500`}
                          >
                            {correnteMotor.toFixed(3)}
                          </span>
                          <span
                            className={`text-xs lg:text-2xl font-medium ml-1 text-amber-500`}
                          >
                            A
                          </span>
                        </div>
                        <span className="text-[8px] lg:text-[10px] font-bold text-gray-400 uppercase mt-1">
                          Motor
                        </span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      S1 Status
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-base lg:text-4xl font-bold ${darkMode ? "text-green-400" : "text-green-600"}`}
                      >
                        {string_1.toFixed(3)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2 lg:p-6 flex flex-col items-center justify-center w-full h-full ${darkMode ? "bg-gray-800" : "bg-white"}`}
                  >
                    <span className="text-[10px] lg:text-[13px] font-black uppercase tracking-wider text-gray-500 mb-1 text-center w-full">
                      S2 Status
                    </span>
                    <div className="flex items-baseline justify-center">
                      <span
                        className={`text-base lg:text-4xl font-bold ${darkMode ? "text-rose-400" : "text-rose-600"}`}
                      >
                        {string_2.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  );
}
