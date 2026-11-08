import { Map, Maximize, Minimize } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "darkMode" | "isMapFullscreen" | "setIsMapFullscreen">;

export function MapView(props: Props) {
  const {
    darkMode,
    isMapFullscreen,
    setIsMapFullscreen,
  } = props;
  return (

            <div className={`transition-all duration-300 ${isMapFullscreen ? "fixed inset-0 z-[100] bg-black flex flex-col" : "h-full w-full flex flex-col animate-in fade-in duration-300 min-h-0"}`}>
              {/* #region Aba Mapa */}
              {!isMapFullscreen && (
                <div className="flex items-center space-x-3 mb-4 shrink-0 px-2 md:px-0">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl">
                    <Map className="text-emerald-500" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Rastreamento GPS</h2>
                    <p
                      className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Posicionamento do barco em tempo real
                    </p>
                  </div>
                </div>
              )}

              
              <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
                {/* Botão flutuante no meio da tela, colado na direita */}
                <button
                  onClick={() => {
                    const nextState = !isMapFullscreen;
                    setIsMapFullscreen(nextState);
                    if (nextState && document.documentElement.requestFullscreen) {
                      document.documentElement.requestFullscreen().catch(() => {});
                    } else if (!nextState && document.exitFullscreen) {
                      document.exitFullscreen().catch(() => {});
                    }
                  }}
                  className={`absolute top-1/2 -translate-y-1/2 right-4 md:right-6 z-[60] p-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                    darkMode || isMapFullscreen
                      ? "bg-gray-900/80 border-gray-700 text-gray-200 hover:text-white" 
                      : "bg-white/90 border-gray-300 text-gray-700 hover:text-black"
                  }`}
                  title={isMapFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
                >
                  {isMapFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                </button>

                {/* Iframe carregando o dsb-rastreio */}
                <iframe 
                  src="https://dsb-rastreio.vercel.app/" 
                  title="DSB Rastreio Map"
                  className="w-full h-full border-0"
                />
              </div>
              {/* #endregion */}
            </div>
  );
}
