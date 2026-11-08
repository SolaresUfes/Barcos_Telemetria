import { Menu, Activity, BarChart2, Zap, Settings, Database, ArrowLeft, Map, Battery, Server, Timer, BookOpen } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "activeTab" | "darkMode" | "setActiveTab" | "setSidebarOpen" | "sidebarOpen">;

export function Sidebar(props: Props) {
  const {
    activeTab,
    darkMode,
    setActiveTab,
    setSidebarOpen,
    sidebarOpen,
  } = props;
  return (
<>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"} 
        md:relative md:translate-x-0 ${sidebarOpen ? "md:w-64" : "md:w-20"}
        flex flex-col border-r shadow-2xl md:shadow-none
        ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}
      `}
      >
        <div
          className={`h-16 flex items-center border-b border-inherit shrink-0 ${sidebarOpen ? "justify-between px-4" : "justify-between px-4 md:justify-center md:px-0"}`}
        >
          <span
            className={`font-bold text-xl tracking-wider text-orange-500 ${!sidebarOpen ? "md:hidden" : ""}`}
          >
            TELEMETRIA
          </span>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors shrink-0"
          >
            <Menu size={24} className="hidden md:block" />
            <ArrowLeft size={24} className="md:hidden" />
          </button>
        </div>

<nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {[
              { icon: Activity, label: "Resumo" },
              { icon: Battery, label: "Baterias" },
              { icon: Map, label: "Mapa" },
              { icon: BarChart2, label: "Análise" },
              { icon: Zap, label: "Potência" },
              { icon: Database, label: "Logs de Dados" },
              { icon: BookOpen, label: "Diário de Bordo" },
              { icon: Server, label: "Backend", url: "https://barcos-backendtelemetria.vercel.app" },
              { icon: Timer, label: "Cronômetro", url: "https://cronometro-smoky-nine.vercel.app/" },
              { icon: Settings, label: "Configurações" },
            ].map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={() => {
                    // Se o item tiver um URL definido, abre numa nova aba
                    if (item.url) {
                      window.open(item.url, '_blank');
                    } else {
                      // Se for um separador interno, muda o separador ativo normalmente
                      setActiveTab(item.label);
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }
                  }}
                  className={`w-full flex items-center py-3 rounded-xl transition-all ${
                    sidebarOpen
                      ? "px-4 justify-start"
                      : "px-4 md:px-0 md:justify-center"
                  } ${
                    activeTab === item.label
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <item.icon
                    size={20}
                    className={
                      sidebarOpen ? "mr-4 shrink-0" : "mr-4 md:mr-0 shrink-0"
                    }
                  />
                  <span
                    className={`font-medium whitespace-nowrap ${!sidebarOpen ? "md:hidden" : ""}`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
</>
  );
}
