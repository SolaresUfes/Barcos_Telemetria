import { Activity } from "lucide-react";
import { generateFixedPolyline, generateFullPolyline } from "../../utils/chartGeometry";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "darkMode" | "expandedGraph" | "provaAtiva" | "provaFlags" | "setExpandedGraph">;

export function ExpandedGraphModal(props: Props) {
  const {
    darkMode,
    expandedGraph,
    provaAtiva,
    provaFlags,
    setExpandedGraph,
  } = props;
  if (!expandedGraph) return null;
  return (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setExpandedGraph(null)}
        >
          <div 
            className={`relative w-full max-w-7xl h-[70vh] md:h-[80vh] p-6 md:p-10 rounded-3xl shadow-2xl border flex flex-col ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl md:text-3xl font-black flex items-center gap-3">
                <Activity style={{ color: expandedGraph.color }} size={32} />
                {expandedGraph.label}
              </h3>
              
              <div className="flex items-center space-x-5 md:space-x-8">
                {/* Exibe o último valor lido em destaque */}
                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">Último Valor</span>
                  <span className="text-3xl font-black tabular-nums leading-none mt-1 drop-shadow-sm" style={{ color: expandedGraph.color }}>
                    {expandedGraph.data.length > 0 
                      ? expandedGraph.data[expandedGraph.data.length - 1].toFixed(2) 
                      : "0.00"}
                  </span>
                </div>

                <button
                  onClick={() => setExpandedGraph(null)}
                  className="px-5 py-3 bg-gray-500/10 hover:bg-gray-500/20 rounded-xl font-bold transition-all text-sm md:text-base border border-transparent hover:border-gray-500/30"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 w-full flex relative min-h-0 mt-4">
              
              {/* ESCALA LATERAL: APARECE EM GRÁFICOS DE POTÊNCIA E BATERIA */}
              {(expandedGraph.id.startsWith("pot") || expandedGraph.id === "bateria") && (
                <div className="relative w-12 shrink-0 h-full">
                  {expandedGraph.id.startsWith("pot") 
                    ? [5000, 4000, 3000, 2000, 1000, 0, -1000, -2000, -3000, -4000, -5000].map((val) => {
                        const percent = ((5000 - val) / 10000) * 100;
                        return (
                          <span
                            key={`scale-pot-${val}`}
                            className="absolute right-2 text-[10px] md:text-[11px] font-bold text-gray-500 leading-none"
                            style={{ top: `${percent}%`, transform: percent === 100 ? 'translateY(-100%)' : percent === 0 ? 'translateY(0)' : 'translateY(-50%)' }}
                          >
                            {val}
                          </span>
                        );
                      })
                    : [100, 75, 50, 25, 0].map((val) => {
                        const percent = 100 - val;
                        return (
                          <span
                            key={`scale-bat-${val}`}
                            className="absolute right-2 text-[10px] md:text-[11px] font-bold text-gray-500 leading-none"
                            style={{ top: `${percent}%`, transform: percent === 100 ? 'translateY(-100%)' : percent === 0 ? 'translateY(0)' : 'translateY(-50%)' }}
                          >
                            {val}%
                          </span>
                        );
                      })
                  }
                </div>
              )}

              {/* GRÁFICO SVG PRINCIPAL */}
              <div className="flex-1 relative h-full">
<svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="expandedGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={expandedGraph.color} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={expandedGraph.color} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Linhas de Grade de Fundo */}
                  {(expandedGraph.id.startsWith("pot") ? [0, 25, 50, 75, 100, 125, 150, 175, 200] : [0, 50, 100, 150, 200]).map((y) => (
                    <line key={`grid-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke={darkMode ? "#374151" : "#f3f4f6"} strokeWidth="1" strokeDasharray="5,5" />
                  ))}

                  {/* LINHA DE ZERO DESTACADA PARA POTÊNCIA */}
                  {expandedGraph.id.startsWith("pot") && (
                    <line x1="0" y1="100" x2="1000" y2="100" stroke={darkMode ? "#ef4444" : "#f97316"} strokeWidth="1.5" strokeDasharray="4,4" />
                  )}

                  {/* Renderização baseada no tipo de gráfico (com o !provaAtiva) */}
                  <polygon
                    points={`0,${expandedGraph.id.startsWith("pot") ? 100 : 200} ${
                      expandedGraph.id.startsWith("pot")
                        ? generateFixedPolyline(expandedGraph.data, 1000, 200, -5000, 5000, !provaAtiva)
                        : expandedGraph.id === "bateria"
                        ? generateFixedPolyline(expandedGraph.data, 1000, 200, 0, 100, !provaAtiva)
                        : generateFullPolyline(expandedGraph.data, 1000, 200, !provaAtiva)
                    } 1000,${expandedGraph.id.startsWith("pot") ? 100 : 200}`}
                    fill="url(#expandedGradient)"
                  />
                  
                  <polyline
                    points={
                      expandedGraph.id.startsWith("pot")
                        ? generateFixedPolyline(expandedGraph.data, 1000, 200, -5000, 5000, !provaAtiva)
                        : expandedGraph.id === "bateria"
                        ? generateFixedPolyline(expandedGraph.data, 1000, 200, 0, 100, !provaAtiva)
                        : generateFullPolyline(expandedGraph.data, 1000, 200, !provaAtiva)
                    }
                    fill="none" stroke={expandedGraph.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"
                  />
                  
                  {/* === FLAGS (MARCAÇÕES VERTICAIS DE EVENTOS) === */}
                  {provaAtiva && provaFlags.map((flagIdx, i) => {
                    if (flagIdx >= expandedGraph.data.length || expandedGraph.data.length <= 1) return null;
                    const stepX = 1000 / (expandedGraph.data.length - 1);
                    const x = flagIdx * stepX;
                    return <line key={`flag-${i}`} x1={x} y1="0" x2={x} y2="200" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,4" className="drop-shadow-lg" />;
                  })}
                  
                  <line x1="0" y1="200" x2="1000" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                  <line x1="0" y1="0" x2="0" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                </svg>
              </div>
            </div>

          </div>
        </div>
  );
}
