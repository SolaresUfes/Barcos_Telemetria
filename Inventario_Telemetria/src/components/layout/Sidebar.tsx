import { ArrowLeft, Menu } from "lucide-react";
import { TABS, type TabId } from "../../config/tabs";

interface Props {
  aberta: boolean;
  setAberta: (v: boolean) => void;
  abaAtiva: TabId;
  onTrocar: (aba: TabId) => void;
  /** número vermelho ao lado do nome da aba */
  badges: Partial<Record<TabId, number>>;
}

export default function Sidebar({ aberta, setAberta, abaAtiva, onTrocar, badges }: Props) {
  return (
    <>
      {aberta && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setAberta(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 md:relative md:translate-x-0 md:shadow-none ${
          aberta ? "w-64 translate-x-0 md:w-64" : "w-64 -translate-x-full md:w-20"
        }`}
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-inherit ${
            aberta ? "justify-between px-4" : "justify-between px-4 md:justify-center md:px-0"
          }`}
        >
          <span className={`flex items-center text-xl font-bold tracking-wider text-orange-500 ${!aberta ? "md:hidden" : ""}`}>
            <img src="/favicon.svg" alt="" className="mr-2 h-8 w-8" />
            INVENTÁRIO
          </span>
          <button
            onClick={() => setAberta(!aberta)}
            className="shrink-0 rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Menu size={24} className="hidden md:block" />
            <ArrowLeft size={24} className="md:hidden" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            {TABS.map(({ id, icon: Icone }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    onTrocar(id);
                    if (window.innerWidth < 768) setAberta(false);
                  }}
                  className={`relative flex w-full items-center rounded-xl py-3 transition-all ${
                    aberta ? "justify-start px-4" : "px-4 md:justify-center md:px-0"
                  } ${
                    abaAtiva === id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  }`}
                >
                  <Icone size={20} className={aberta ? "mr-4 shrink-0" : "mr-4 shrink-0 md:mr-0"} />
                  <span className={`whitespace-nowrap font-medium ${!aberta ? "md:hidden" : ""}`}>{id}</span>

                  {(badges[id] ?? 0) > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-black text-white ${
                        id === "Alertas" ? "bg-red-500" : "bg-blue-500"
                      } ${aberta ? "ml-auto" : "ml-auto md:absolute md:right-2 md:top-1.5 md:ml-0"}`}
                    >
                      {badges[id]}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}
