import { Moon, Sun, Activity, ArrowLeft, AlertTriangle, Map, Clock, Maximize, Minimize } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "battery" | "brasiliaTime" | "darkMode" | "isPilotMapFullscreen" | "isTelemetryActive" | "setDarkMode" | "setIsPilotMapFullscreen" | "setPilotMode" | "setShowPilotMap" | "showPilotMap" | "speed">;

export function PilotMode(props: Props) {
  const {
    battery,
    brasiliaTime,
    darkMode,
    isPilotMapFullscreen,
    isTelemetryActive,
    setDarkMode,
    setIsPilotMapFullscreen,
    setPilotMode,
    setShowPilotMap,
    showPilotMap,
    speed,
  } = props;
  let batteryFill = "bg-emerald-500";
  let batteryBorder = "border-emerald-600";
  let batteryNub = "bg-emerald-700";

  if (battery <= 50 && battery >= 20) {
    batteryFill = "bg-yellow-500";
    batteryBorder = "border-yellow-600";
    batteryNub = "bg-yellow-700";
  } else if (battery < 20) {
    batteryFill = "bg-red-600";
    batteryBorder = "border-red-700";
    batteryNub = "bg-red-800";
  }
    return (
      <div
        className={`h-[100dvh] w-full flex flex-col p-4 md:p-6 font-sans select-none overflow-hidden relative transition-colors duration-300 ${darkMode ? "bg-black text-white" : "bg-gray-100 text-gray-900"}`}
      >
        
        <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button
              onClick={() => {
                setPilotMode(false);
                setShowPilotMap(false);
              }}
              className={`flex items-center space-x-2 transition-colors p-2 rounded-lg ${darkMode ? "text-gray-500 hover:text-white hover:bg-gray-900" : "text-gray-600 hover:text-black hover:bg-gray-200"}`}
            >
              <ArrowLeft size={32} />
              <span className="text-xl font-bold uppercase tracking-widest hidden sm:block">
                Voltar
              </span>
            </button>

            <button
              onClick={() => setShowPilotMap(!showPilotMap)}
              className={`flex items-center space-x-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold transition-all shadow-md border ${
                showPilotMap
                  ? darkMode
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-emerald-500/20"
                    : "bg-emerald-100 text-emerald-600 border-emerald-500"
                  : darkMode
                    ? "bg-gray-800/50 text-gray-400 border-gray-700 hover:bg-gray-800 hover:text-white"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >

              {showPilotMap ? <Activity size={20} /> : <Map size={20} />}
              <span className="hidden sm:block text-sm uppercase tracking-wider">
                {showPilotMap ? "Instrumentos" : "Navegação"}
              </span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 flex-shrink-0 rounded-full transition-all shadow-md border ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
              title="Alternar Modo de Visualização"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          {/* Status da Telemetria */}
          <div
            className={`flex items-center space-x-2 md:space-x-3 px-3 py-1.5 md:px-4 md:py-2 rounded-full border transition-colors shrink-0 ${
              isTelemetryActive
                ? darkMode ? "bg-red-950/50 border-red-900" : "bg-red-100 border-red-300"
                : darkMode ? "bg-gray-800 border-gray-600" : "bg-gray-200 border-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${
                isTelemetryActive
                  ? `bg-red-500 animate-pulse ${darkMode ? "shadow-[0_0_10px_rgba(239,68,68,0.8)]" : ""}`
                  : "bg-gray-500"
              }`}
            ></div>

            <span className={`font-bold tracking-widest text-[10px] md:text-sm whitespace-nowrap ${isTelemetryActive ? "text-red-500" : "text-gray-500"}`}>
              {isTelemetryActive ? "TELEMETRIA ATIVA" : "SISTEMA OFFLINE"}
            </span>
          </div>
        </div>
        
        {/* Modo Piloto: Mapa ou Instrumentos*/}
        {showPilotMap ? (
          <div className="flex-1 w-full h-full flex flex-col min-h-0 relative overflow-hidden">
            <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
              {/* Botão flutuante no meio da tela, colado na direita */}
              <button
                onClick={() => {
                  const nextState = !isPilotMapFullscreen;
                  setIsPilotMapFullscreen(nextState);
                  if (nextState && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else if (!nextState && document.exitFullscreen) {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className={`absolute top-1/2 -translate-y-1/2 right-4 md:right-6 z-[60] p-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  darkMode || isPilotMapFullscreen
                    ? "bg-gray-900/80 border-gray-700 text-gray-200 hover:text-white" 
                    : "bg-white/90 border-gray-300 text-gray-700 hover:text-black"
                }`}
                title={isPilotMapFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
              >
                {isPilotMapFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
              </button>

              <iframe 
                src="https://dsb-rastreio.vercel.app/" 
                title="DSB Rastreio Map Pilot"
                className="w-full h-full border-0"
              />
            </div>
          </div>

        ) : (
          <div className="flex-1 grid grid-rows-3 gap-4 md:gap-6 w-full max-w-4xl mx-auto pb-4 md:pb-8 min-h-0 animate-in fade-in duration-300">
            <div
              className={`flex items-center justify-between w-full border-2 rounded-3xl p-4 md:p-8 shadow-2xl relative h-full min-h-0 transition-colors ${darkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-300"}`}
            >
              <div className="flex items-center w-full max-w-[70%]">
                <div
                  className={`relative w-full h-16 md:h-24 border-4 md:border-8 ${batteryBorder} rounded-2xl md:rounded-3xl p-1 md:p-1.5 flex transition-colors duration-500 ${darkMode ? "bg-gray-900" : "bg-gray-200"}`}
                >
                  <div
                    className={`h-full ${batteryFill} rounded-md md:rounded-xl transition-all duration-1000 ease-out`}
                    style={{ width: `${battery}%` }}
                  ></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-baseline -translate-y-[2px] md:-translate-y-[4px]">
                      <span className="text-5xl md:text-7xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-tighter leading-none">
                        {battery}
                      </span>
                      <span className="text-2xl md:text-4xl font-bold text-gray-200 drop-shadow-[0_4px_4px_rgba(0,0,0,1)] ml-1 leading-none">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`w-3 h-8 md:w-4 md:h-10 ${batteryNub} rounded-r-lg -ml-1 transition-colors duration-500`}
                ></div>
              </div>

              <div
                className={`text-5xl md:text-7xl font-black ml-4 ${darkMode ? "text-gray-700" : "text-gray-300"}`}
              >
                B
              </div>

              {battery < 15 && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-3/4 bg-red-600 text-white font-black text-lg md:text-2xl text-center py-2 md:py-3 rounded-full animate-pulse shadow-[0_0_30px_rgba(220,38,38,1)] border-2 border-red-400 tracking-widest uppercase flex items-center justify-center space-x-3 z-10">
                  <AlertTriangle size={24} className="md:w-7 md:h-7" />
                  <span>Bateria Muito Baixa</span>
                </div>
              )}
            </div>

            <div
              className={`flex items-center justify-between w-full border-2 rounded-3xl p-4 md:p-8 shadow-2xl relative h-full min-h-0 transition-colors ${darkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-300"}`}
            >
              <div className="flex items-baseline px-4 w-2/3">
                <span className="text-6xl md:text-8xl font-black text-blue-400 tracking-tighter w-full">
                  {speed}
                </span>
              </div>
              <div
                className={`text-5xl md:text-7xl font-black ml-4 ${darkMode ? "text-gray-700" : "text-gray-300"}`}
              >
                V
              </div>
            </div>

            <div
              className={`flex items-center justify-between w-full border-2 rounded-3xl p-4 md:p-8 shadow-2xl relative h-full min-h-0 transition-colors ${darkMode ? "bg-[#0a0a0a] border-gray-800" : "bg-white border-gray-300"}`}
            >
              <div className="flex items-baseline px-4">
                <span className="text-5xl md:text-7xl font-black text-orange-400 tracking-tighter">
                  {brasiliaTime}
                </span>
              </div>
              <div
                className={`ml-4 ${darkMode ? "text-gray-700" : "text-gray-300"}`}
              >
                <Clock
                  className="w-12 h-12 md:w-16 md:h-16"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
