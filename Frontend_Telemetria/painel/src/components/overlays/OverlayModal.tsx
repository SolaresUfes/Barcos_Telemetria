import { BarChart2 } from "lucide-react";
import { generateFixedPolyline, generateFullPolyline } from "../../utils/chartGeometry";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "availableGraphs" | "darkMode" | "overlaySelections" | "provaAtiva" | "provaFlags" | "setShowOverlayModal" | "showOverlayModal">;

export function OverlayModal(props: Props) {
  const {
    availableGraphs,
    darkMode,
    overlaySelections,
    provaAtiva,
    provaFlags,
    setShowOverlayModal,
    showOverlayModal,
  } = props;
  if (!showOverlayModal) return null;
  return (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
          onClick={() => setShowOverlayModal(false)}
        >
          <div 
            className={`relative w-full max-w-7xl h-[80vh] p-6 md:p-10 rounded-3xl shadow-2xl border flex flex-col ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex-1 pr-4">
                <h3 className="text-2xl md:text-3xl font-black mb-4 flex items-center">
                  <BarChart2 className="mr-3 text-orange-500" size={32} />
                  Análise Unificada de Dados
                </h3>
                
                {/* Legendas e Últimos Valores */}
                <div className="flex flex-wrap gap-4 md:gap-8">
                  {availableGraphs.filter(g => overlaySelections.includes(g.id)).map(g => (
                    <div key={g.id} className="flex flex-col">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: g.color}}></div>
                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest">{g.label}</span>
                      </div>
                      <span className="text-xl md:text-2xl font-black tabular-nums leading-none" style={{ color: g.color }}>
                        {g.data.length > 0 ? g.data[g.data.length - 1].toFixed(2) : "0.00"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowOverlayModal(false)}
                className="px-5 py-3 bg-gray-500/10 hover:bg-gray-500/20 rounded-xl font-bold transition-all text-sm md:text-base border border-transparent hover:border-gray-500/30 shrink-0"
              >
                Fechar
              </button>
            </div>

            {/* CAIXA DO GRÁFICO (Limpa, sem fundo cinza e com a mesma estrutura do Individual) */}
            <div className="flex-1 w-full flex relative min-h-0 mt-4">
              
              {/* LÓGICA CONDICIONAL: SE TODAS AS ESCOLHAS SÃO DE POTÊNCIA */}
              {(() => {
                const isOnlyPower = overlaySelections.length > 0 && overlaySelections.every(id => id.startsWith("pot"));
                
                return (
                  <>
                    {/* Renderiza a Escala Lateral de +-2000 só se for potência */}
                    {isOnlyPower && (
                      <div className="relative w-12 shrink-0 h-full">
                        {[5000, 4000, 3000, 2000, 1000, 0, -1000, -2000, -3000, -4000, -5000].map((val) => {
                          const percent = ((5000 - val) / 10000) * 100;
                          return (
                            <span
                              key={`scale-over-pot-${val}`}
                              className="absolute right-2 text-[10px] md:text-[11px] font-bold text-gray-500 leading-none"
                              style={{ top: `${percent}%`, transform: percent === 100 ? 'translateY(-100%)' : percent === 0 ? 'translateY(0)' : 'translateY(-50%)' }}
                            >
                              {val}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* SVG CONTAINER DIV */}
                    <div className="flex-1 relative h-full">
                      <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="w-full h-full overflow-hidden">
                        
                        {/* Linhas de Grade Adaptativas (Cores e traços idênticos ao Individual) */}
                        {(isOnlyPower ? [0, 25, 50, 75, 100, 125, 150, 175, 200] : [0, 50, 100, 150, 200]).map((y) => (
                          <line key={`over-grid-${y}`} x1="0" y1={y} x2="1000" y2={y} stroke={darkMode ? "#374151" : "#f3f4f6"} strokeWidth="1" strokeDasharray="5,5" />
                        ))}

                        {/* Linha do Zero destacada */}
                        {isOnlyPower && (
                          <line x1="0" y1="100" x2="1000" y2="100" stroke={darkMode ? "#ef4444" : "#f97316"} strokeWidth="1.5" strokeDasharray="4,4" />
                        )}

                        {/* Renderiza as Linhas (Sem polygon, garantindo que NÃO há degradê) */}
                        {availableGraphs.filter(g => overlaySelections.includes(g.id)).map(g => (
                          <polyline
                            key={`over-line-${g.id}`}
                            points={isOnlyPower ? generateFixedPolyline(g.data, 1000, 200, -5000, 5000, !provaAtiva) : generateFullPolyline(g.data, 1000, 200, !provaAtiva)}
                            fill="none"                            
                            stroke={g.color} 
                            strokeWidth="3" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className="drop-shadow-sm opacity-90 hover:opacity-100 transition-all"
                          />
                        ))}

                        {/* === FLAGS (MARCAÇÕES VERTICAIS DE EVENTOS NA SOBREPOSIÇÃO) === */}
                        {provaAtiva && overlaySelections.length > 0 && provaFlags.map((flagIdx, i) => {
                          const dataLen = availableGraphs.find(g => g.id === overlaySelections[0])?.data.length || 0;
                          if (flagIdx >= dataLen || dataLen <= 1) return null;
                          const stepX = 1000 / (dataLen - 1);
                          const x = flagIdx * stepX;
                          return <line key={`over-flag-${i}`} x1={x} y1="0" x2={x} y2="200" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6,4" />;
                        })}

                        {/* Bordas Superior e Inferior para fechar o gráfico visualmente */}
                        <line x1="0" y1="200" x2="1000" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                        <line x1="0" y1="0" x2="0" y2="200" stroke={darkMode ? "#4b5563" : "#d1d5db"} strokeWidth="2" />
                      </svg>
                    </div>
                  </>
                );
              })()}
              
            </div>
          </div>
        </div>
  );
}
