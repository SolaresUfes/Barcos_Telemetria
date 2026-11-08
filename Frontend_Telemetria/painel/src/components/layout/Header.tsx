import { Menu, Moon, Sun, LogOut, Shield } from "lucide-react";
import { SteeringWheelIcon } from "../icons";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "currentUser" | "darkMode" | "isTelemetryActive" | "logoutGoogle" | "onlineCount" | "pilotMode" | "provaAtiva" | "setDarkMode" | "setPilotMode" | "setShowOnlineMenu" | "setSidebarOpen" | "showOnlineMenu" | "userProfileSubtitle">;

export function Header(props: Props) {
  const {
    currentUser,
    darkMode,
    isTelemetryActive,
    logoutGoogle,
    onlineCount,
    pilotMode,
    provaAtiva,
    setDarkMode,
    setPilotMode,
    setShowOnlineMenu,
    setSidebarOpen,
    showOnlineMenu,
    userProfileSubtitle,
  } = props;
  return (
        <header
          className={`h-16 flex items-center justify-between px-4 md:px-8 border-b transition-colors duration-300 shrink-0 ${darkMode ? "bg-gray-800/50 border-gray-700" : "bg-white/50 border-gray-200"} backdrop-blur-md`}
        >
          <div className="flex items-center min-w-0 mr-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mr-3 p-2 -ml-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
            >
              <Menu size={24} />
            </button>

            <h1 className="text-xl md:text-2xl font-bold truncate">
              Painel de Controle
            </h1>

            {/* Indicador de Gravação Sutil */}
            {provaAtiva && !pilotMode && (
              <div
                className="ml-3 flex items-center justify-center"
                title="Gravação de dados em andamento"
              >
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,1)]"></div>
              </div>
            )}

            {/* Bloco de Status (Telemetria + Online) */}
            <div className="flex items-center ml-2 md:ml-4 space-x-2">
              
              {/* Badge de Telemetria (Escondido no telemóvel com 'hidden md:flex') */}
              <span className={`hidden md:flex px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold ring-1 ring-inset rounded-full items-center whitespace-nowrap shadow-sm transition-colors ${
                isTelemetryActive 
                  ? "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20" 
                  : "bg-gray-50 text-gray-600 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20"
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 md:mr-2 ${
                  isTelemetryActive 
                    ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                    : "bg-gray-500"
                }`}></span>
                {isTelemetryActive ? "ESP Online" : "ESP Offline"}
              </span>

              {/* Badge de Utilizadores Online com Portal Fixado na Janela */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setShowOnlineMenu(
                      showOnlineMenu
                        ? null
                        : {
                            top: rect.bottom + 10,
                            left: rect.left - 120, // Ajuste se necessário para alinhar melhor
                          }
                    );
                  }}
                  className="hidden md:flex px-3 py-1 text-xs font-bold bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20 rounded-full items-center whitespace-nowrap shadow-sm cursor-pointer select-none transition-all hover:scale-105"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                  {onlineCount} Online
                </button>

              </div>

            </div>


          </div>

          <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 flex-shrink-0 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center justify-center ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm"
              }`}
              title="Alternar Modo Noturno"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={() => {
                setDarkMode(true);
                setPilotMode(true);
              }}
              className="flex items-center space-x-2 px-4 md:px-5 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full font-bold shadow-lg shadow-orange-500/40 hover:scale-105 hover:shadow-orange-500/60 transition-all active:scale-95 whitespace-nowrap"
            >
              <SteeringWheelIcon size={18} />
              <span className="hidden sm:inline tracking-wide">
                Modo Piloto
              </span>
            </button>

            <div className="flex items-center gap-3 group relative pl-3 md:pl-6 border-l border-gray-300 dark:border-gray-700">
              <div className="text-right hidden lg:block">
                <p className="text-sm font-bold leading-none">
                  {currentUser?.name.split(" ")[0]}
                </p>
                <p
                  className={`text-[11px] mt-1 font-medium tracking-wide flex items-center justify-end ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                >
                  {currentUser?.isModerador && (
                    <Shield size={10} className="mr-1 text-orange-500" />
                  )}
                  {userProfileSubtitle}
                </p>
              </div>

              <div className="relative h-10 w-10 flex-shrink-0">
                <img
                  src={currentUser?.photo}
                  alt="Foto de Perfil"
                  className={`w-full h-full rounded-full object-cover shadow-md group-hover:scale-105 transition-transform ${currentUser?.isModerador ? "border-[3px] border-orange-500" : "border-2 border-gray-400"}`}
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>

              <button
                onClick={() => logoutGoogle()}
                className="absolute -bottom-8 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow-lg flex items-center space-x-1 whitespace-nowrap z-50"
              >
                <LogOut size={12} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </header>
  );
}
