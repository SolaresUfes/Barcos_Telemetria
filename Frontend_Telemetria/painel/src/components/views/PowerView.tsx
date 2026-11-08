import { Zap } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "battery" | "currentPower" | "darkMode" | "estHours" | "estMinutes" | "speed">;

export function PowerView(props: Props) {
  const {
    battery,
    currentPower,
    darkMode,
    estHours,
    estMinutes,
    speed,
  } = props;
  return (
            <div className="h-full w-full max-w-5xl mx-auto flex flex-col animate-in fade-in duration-300 min-h-0">
              {/* #region Aba Potência */}
              <div className="flex items-center space-x-3 mb-4 shrink-0">
                <div className="p-3 bg-blue-500/10 rounded-2xl">
                  <Zap className="text-blue-500" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Área de Potência</h2>
                  <p className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Umas continhas aí
                  </p>
                </div>
              </div>

              <div className={`flex-1 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-sm border mb-4 transition-colors duration-300 relative overflow-y-auto overflow-x-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-xl shadow-gray-200/50"}`}>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

                <div className="flex flex-col md:flex-row items-center justify-center md:justify-between relative z-10 min-h-full gap-8 md:gap-0 py-4 md:py-0">
                  <div className="flex-1 mb-6 md:mb-0 md:pr-4 flex flex-col items-center md:items-start text-center md:text-left w-full justify-center">
                    <h3 className="text-lg font-bold mb-2 flex items-center justify-center md:justify-start">
                      <Zap className="mr-2 text-blue-500" size={20} />
                      Tempo de Bateria Remanescente
                    </h3>
                    <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Calculado dinamicamente relacionando o nível de carga com o consumo (W) atual.
                    </p>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                      <div className={`px-4 py-2 rounded-xl border flex flex-col items-center text-center ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Consumo</p>
                        <p className="text-xl font-bold text-orange-500 tabular-nums">{currentPower.toFixed(1)} W</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border flex flex-col items-center text-center ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Velocidade</p>
                        <p className="text-xl font-bold text-blue-500 tabular-nums">{speed}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border flex flex-col items-center text-center ${darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Bateria</p>
                        <p className={`text-xl font-bold tabular-nums ${battery > 20 ? "text-emerald-500" : "text-red-500"}`}>{battery}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg shadow-blue-500/30 text-white min-w-[200px] md:min-w-[250px]">
                    <span className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Tempo Estimado</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-6xl font-black tracking-tighter tabular-nums">{estHours}</span>
                      <span className="text-2xl font-bold opacity-80">h</span>
                      <span className="text-6xl font-black tracking-tighter tabular-nums">{estMinutes.toString().padStart(2, "0")}</span>
                      <span className="text-2xl font-bold opacity-80">m</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* #endregion */}
            </div>
  );
}
