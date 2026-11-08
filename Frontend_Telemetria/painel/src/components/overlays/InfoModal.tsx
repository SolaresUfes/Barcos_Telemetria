import { Info } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "darkMode" | "infoModalOpen" | "setInfoModalOpen">;

export function InfoModal(props: Props) {
  const {
    darkMode,
    infoModalOpen,
    setInfoModalOpen,
  } = props;
  if (!infoModalOpen) return null;
  return (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setInfoModalOpen(null)}
        >
          <div 
            className={`relative w-full max-w-sm p-6 rounded-3xl shadow-2xl border flex flex-col ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-gray-500/10 flex items-center justify-center mb-4 shrink-0">
              <Info className={infoModalOpen.cor} size={24} />
            </div>
            
            <h3 className="text-xl font-bold mb-2">{infoModalOpen.titulo}</h3>
            
            <p className={`text-sm leading-relaxed mb-6 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
              {infoModalOpen.descricao}
            </p>
            
            <button
              onClick={() => setInfoModalOpen(null)}
              className="w-full py-3 bg-gray-500/10 hover:bg-gray-500/20 rounded-xl font-bold transition-all text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
  );
}
