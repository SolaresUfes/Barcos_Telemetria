import { Sun, Activity, BarChart2, Zap, Settings, Battery, BatteryCharging, Play, Square } from "lucide-react";
import { generateFixedPolyline, generateFullPolyline, generateBatteryPath } from "../../utils/chartGeometry";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "S1_power" | "availableGraphs" | "battery" | "batteryRate" | "batteryStatus" | "currentPower" | "darkMode" | "dispararToast" | "eficienciaBateria" | "eficienciaMotor" | "eficienciaPainel" | "idleBatteryData" | "lidarComCliqueFim" | "overlaySelections" | "provaAtiva" | "prova_iniciar" | "recordingData" | "rpm" | "setExpandedGraph" | "setInfoModalOpen" | "setOverlaySelections" | "setProvaFlags" | "setShowOverlayModal" | "tempoCargaH" | "tempoCargaM" | "toggleOverlay">;

export function AnalysisView(props: Props) {
  const {
    S1_power,
    availableGraphs,
    battery,
    batteryRate,
    batteryStatus,
    currentPower,
    darkMode,
    dispararToast,
    eficienciaBateria,
    eficienciaMotor,
    eficienciaPainel,
    idleBatteryData,
    lidarComCliqueFim,
    overlaySelections,
    provaAtiva,
    prova_iniciar,
    recordingData,
    rpm,
    setExpandedGraph,
    setInfoModalOpen,
    setOverlaySelections,
    setProvaFlags,
    setShowOverlayModal,
    tempoCargaH,
    tempoCargaM,
    toggleOverlay,
  } = props;
  return (
            <div className="h-full w-full max-w-[1400px] mx-auto flex flex-col animate-in fade-in duration-300 min-h-0 overflow-hidden">
              <div className="flex items-center space-x-3 mb-2 md:mb-4 shrink-0 px-2 md:px-0">
                <div className="p-2 md:p-3 bg-blue-500/10 rounded-2xl">
                  <BarChart2 className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-bold">Análise de Desempenho e Bateria</h2>
                  <p className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Taxa da Bateria e Gráficos Finais (Ativos durante a gravação).
                  </p>
                </div>
              </div>

              {/* CONTAINER LADO A LADO */}
              <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">

              {/* LADO ESQUERDO: BARRA DE EFICIÊNCIAS */}
                <div className={`hidden xl:flex w-64 flex-col rounded-3xl shadow-sm border p-4 shrink-0 transition-colors ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="shrink-0 mb-4">
                    <h3 className="text-lg font-bold flex items-center">
                      <Zap className="mr-2 text-yellow-500" size={20} />
                      Eficiência
                    </h3>
                    <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Métricas de rendimento do sistema. Clique nos cartões para ver os detalhes do cálculo.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {/* Eficiência do Painel Solar */}
                    <div 
                      onClick={() => setInfoModalOpen({
                        titulo: "Capacidade de Fornecimento (Painéis)",
                        descricao: "calcular melhor",
                        cor: "text-yellow-500"
                      })}
                      className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center ${darkMode ? "bg-gray-900 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}
                    >
                      <Sun className="text-yellow-500 mb-2" size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Painéis Solares</span>
                      <span className="text-2xl font-black tabular-nums text-yellow-500 drop-shadow-sm">{eficienciaPainel.toFixed(1)}%</span>
                    </div>

                    {/* Eficiência da Bateria */}
                    <div 
                      onClick={() => setInfoModalOpen({
                        titulo: "Eficiência de Transferência (Bateria)",
                        descricao: "tenho que calcular melhor isso, não entendi o suficiente ainda",
                        cor: "text-emerald-500"
                      })}
                      className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center ${darkMode ? "bg-gray-900 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}
                    >
                      <Battery className="text-emerald-500 mb-2" size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pack Baterias</span>
                      <span className="text-2xl font-black tabular-nums text-emerald-500 drop-shadow-sm">{eficienciaBateria.toFixed(1)}%</span>
                    </div>

                    {/* Eficiência do Motor */}
                    <div 
                      onClick={() => setInfoModalOpen({
                        titulo: "Eficiência de Consumo (Motor)",
                        descricao: "tenho que calcular melhor isso, não entendi o suficiente ainda",
                        cor: "text-blue-500"
                      })}
                      className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center ${darkMode ? "bg-gray-900 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}
                    >
                      <Activity className="text-blue-500 mb-2" size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Motor Elétrico</span>
                      <span className="text-2xl font-black tabular-nums text-blue-500 drop-shadow-sm">{eficienciaMotor.toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* Tempo Estimado de Carga */}
                    <div 
                      onClick={() => setInfoModalOpen({
                        titulo: "Tempo Estimado de Carga",
                        descricao: "tá até certinho",
                        cor: "text-emerald-500"
                      })}
                      className={`p-3 rounded-2xl border cursor-pointer hover:scale-[1.02] transition-all flex flex-col items-center justify-center text-center mt-6 ${darkMode ? "bg-gray-900 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-200 hover:border-gray-400"}`}
                    >
                      <BatteryCharging className={`${batteryRate > 0.1 ? "text-emerald-500 animate-pulse" : "text-gray-500"} mb-2`} size={24} />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Tempo p/ 100%</span>
                      <span className={`text-2xl font-black tabular-nums drop-shadow-sm ${batteryRate > 0.1 ? "text-emerald-500" : "text-gray-500"}`}>
                        {batteryRate > 0.1 && battery < 100 
                          ? `${tempoCargaH}h ${tempoCargaM.toString().padStart(2, "0")}m` 
                          : "--"}
                      </span>
                    </div>
                </div>
                
                {/* LADO ESQUERDO: GRÁFICOS (Esmaga para não ter rolagem) */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden pr-1">
                  
                  {/* CAIXA 1: DADOS DA BATERIA E POTÊNCIAS */}
                  <div className={`p-3 md:p-4 rounded-3xl shadow-sm border mb-2 md:mb-3 flex flex-col shrink-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <h3 className="text-sm md:text-lg font-bold mb-2 md:mb-3 flex items-center shrink-0">
                      <Battery className="mr-2 text-green-500 w-4 h-4 md:w-5 md:h-5" /> 
                      Bateria em Tempo Real
                    </h3>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Carga Atual</p>
                        <p className={`text-sm md:text-base font-bold tabular-nums ${battery > 20 ? "text-green-500" : "text-red-500"}`}>{battery}%</p>
                      </div>
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Taxa (1 min)</p>
                        <p className={`text-sm md:text-base font-bold tabular-nums ${batteryRate > 0 ? "text-green-500" : batteryRate < 0 ? "text-red-500" : "text-gray-500"}`}>
                          {batteryRate > 0 ? "+" : ""}{batteryRate.toFixed(2)} %/min
                        </p>
                      </div>
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Status</p>
                        <p className={`text-[10px] md:text-xs font-black uppercase tracking-widest mt-0.5 ${batteryStatus === "Carregando" ? "text-green-500" : batteryStatus === "Descarregando" ? "text-red-500" : "text-gray-500"}`}>
                          {batteryStatus}
                        </p>
                      </div>
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Pot. Bateria</p>
                        <p className={`text-sm md:text-base font-bold tabular-nums ${darkMode ? "text-teal-400" : "text-teal-600"}`}>{(currentPower || 0).toFixed(1)} W</p>
                      </div>
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Pot. Motor</p>
                        <p className={`text-sm md:text-base font-bold tabular-nums ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{(rpm || 0).toFixed(1)} W</p>
                      </div>
                      <div className={`px-2 py-1.5 md:px-3 md:py-2 rounded-xl border flex flex-col items-center flex-1 min-w-[90px] ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[8px] md:text-[9px] text-gray-500 font-bold uppercase mb-0.5">Pot. Geração</p>
                        <p className={`text-sm md:text-base font-bold tabular-nums ${darkMode ? "text-red-400" : "text-red-600"}`}>{(S1_power || 0).toFixed(1)} W</p>
                      </div>
                    </div>
                  </div>

                  {/* CAIXA 2: GRÁFICO DA BATERIA COM DEGRADÊ */}
                  <div className={`p-3 md:p-4 rounded-3xl shadow-sm border mb-2 md:mb-3 flex flex-col shrink-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="flex justify-between items-center mb-1 md:mb-2 ml-10">
                      <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest block">
                          {provaAtiva ? "Histórico Completo (Gravando Estático)" : "Variação Dinâmica (Tempo Real)"}
                      </span>
                    </div>
                    
                    <div className="w-full h-24 md:h-32 flex relative shrink-0 mt-1">
                      <div className="relative w-10 shrink-0 h-full">
                        {[100, 75, 50, 25, 0].map((val) => (
                          <span 
                            key={`html-text-${val}`} 
                            className="absolute right-2 text-[10px] md:text-[11px] font-bold text-gray-500 leading-none"
                            style={{ top: `${100 - val}%`, transform: val === 100 ? 'translateY(0)' : val === 0 ? 'translateY(-100%)' : 'translateY(-50%)' }}
                          >
                            {val}%
                          </span>
                        ))}
                      </div>

                      <div className="flex-1 relative h-full cursor-pointer" onClick={() => setExpandedGraph(availableGraphs.find(g => g.id === "bateria") || null)}>
                        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            <defs>
                              <linearGradient id="batGradient" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            <line x1="0" y1="200" x2="1000" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                            <line x1="0" y1="0" x2="0" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                            {[25, 50, 75].map((val) => {
                              const y = 200 - (val / 100) * 200;
                              return <line key={`bat-grid-${val}`} x1="0" y1={y} x2="1000" y2={y} stroke={darkMode ? "#374151" : "#f3f4f6"} strokeWidth="1" strokeDasharray="5,5" />;
                            })}
                            <polygon points={`${!provaAtiva && idleBatteryData.length > 0 ? 1000 - ((idleBatteryData.length - 1) * (1000 / 39)) : 0},200 ${generateBatteryPath(provaAtiva ? recordingData.bateria : idleBatteryData, 1000, 200, !provaAtiva)} 1000,200`} fill="url(#batGradient)" />
                            <polyline points={generateBatteryPath(provaAtiva ? recordingData.bateria : idleBatteryData, 1000, 200, !provaAtiva)} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* ÁREA DOS 9 GRÁFICOS (flex-1 para encolher no ecrã) */}
                  <div id="area-graficos" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 flex-1 min-h-0 pb-2">
                    {availableGraphs.filter(g => g.id !== "bateria").map((graph) => (
                      <div 
                        key={graph.id} 
                        onClick={() => setExpandedGraph(graph)}
                        className={`p-2 md:p-3 rounded-2xl border flex flex-col cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all min-h-0 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                      >
                        <h4 className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 shrink-0">{graph.label}</h4>
                        <div className="w-full flex-1 min-h-0 pointer-events-none mt-1">
                          <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                            <polyline 
                              points={graph.id.startsWith("pot") ? generateFixedPolyline(graph.data, 1000, 200, -5000, 5000, !provaAtiva) : generateFullPolyline(graph.data, 1000, 200, !provaAtiva)} 
                              fill="none" stroke={graph.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                            />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

{/* LADO DIREITO: BARRA DE CONFIGURAÇÕES DE SOBREPOSIÇÃO */}
                <div className={`hidden md:flex w-72 flex-col rounded-3xl shadow-sm border p-4 shrink-0 transition-colors ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <div className="shrink-0 mb-4">
                    <h3 className="text-lg font-bold flex items-center">
                      <Settings className="mr-2 text-gray-400" size={20} />
                      Sobreposição
                    </h3>
                    <p className={`text-[10px] mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Selecione múltiplas variáveis para visualizar no mesmo eixo unificado.
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {availableGraphs.map(g => (
                      <label 
                        key={g.id} 
                        className={`flex items-center p-2.5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all select-none ${darkMode ? "bg-gray-900 border-gray-700 hover:border-gray-500" : "bg-gray-50 border-gray-200 hover:border-gray-300"} ${overlaySelections.includes(g.id) ? (darkMode ? "ring-1 ring-gray-400" : "ring-1 ring-gray-300") : ""}`}
                      >
                        <input 
                          type="checkbox" 
                          checked={overlaySelections.includes(g.id)} 
                          onChange={() => toggleOverlay(g.id)} 
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 mr-3 cursor-pointer" 
                        />
                        <div className="w-3 h-3 rounded-full mr-2 shrink-0 shadow-sm" style={{backgroundColor: g.color}}></div>
                        <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{g.label}</span>
                      </label>
                    ))}
                  </div>

                  {/* NOVO: BOTÃO RÁPIDO DE GRAVAÇÃO */}
                  <div className="shrink-0 mt-3">
                    <button
                      onClick={() => provaAtiva ? lidarComCliqueFim() : prova_iniciar()}
                      className={`w-full py-3.5 rounded-xl font-black uppercase tracking-wider flex items-center justify-center transition-all shadow-lg hover:scale-[1.02] active:scale-95 ${
                        provaAtiva 
                          ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
                          : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                      }`}
                    >
                      {provaAtiva ? (
                        <>
                          <Square size={20} className="mr-2 fill-current animate-pulse" /> Parar Gravação
                        </>
                      ) : (
                        <>
                          <Play size={20} className="mr-2 fill-current" /> Iniciar Gravação
                        </>
                      )}
                    </button>
                  </div>

                  <div className="shrink-0 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                    <button
                      onClick={() => setShowOverlayModal(true)}
                      disabled={overlaySelections.length === 0}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                    >
                      Abrir Gráfico Unificado
                    </button>
                    {overlaySelections.length > 0 && (
                      <button
                        onClick={() => setOverlaySelections([])}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all border ${darkMode ? "border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white" : "border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-800"}`}
                      >
                        Desmarcar todos
                      </button>
                    )}
                    {provaAtiva && (
                      <button
                        onClick={() => {
                          setProvaFlags(prev => [...prev, recordingData.tensao.length - 1]);
                          dispararToast("Marcação registada no gráfico!", "sucesso");
                        }}
                        className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-all border border-red-500/20 flex items-center justify-center mt-2"
                      >
                        🚩 Inserir Marcação (Flag)
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
  );
}
