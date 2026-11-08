import { Plus, BookOpen } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "darkMode" | "diarioLogs" | "salvarDiario" | "setTextoDiario" | "setTituloDiario" | "textoDiario" | "tituloDiario">;

export function DiaryView(props: Props) {
  const {
    darkMode,
    diarioLogs,
    salvarDiario,
    setTextoDiario,
    setTituloDiario,
    textoDiario,
    tituloDiario,
  } = props;
  return (
            <div className="h-full w-full max-w-6xl mx-auto flex flex-col animate-in fade-in duration-300 min-h-0">
              <div className="flex items-center space-x-3 mb-4 shrink-0 px-2 md:px-0">
                <div className="p-3 bg-purple-500/10 rounded-2xl">
                  <BookOpen className="text-purple-500" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Diário de Bordo</h2>
                  <p className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Anotações de ocorrências, manutenções e observações do barco durante a competição.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 overflow-hidden">
                {/* Lado Esquerdo: Formulário */}
                <div className={`md:w-1/3 flex flex-col rounded-3xl shadow-sm border p-5 shrink-0 transition-colors overflow-y-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Plus size={18} className="mr-2 text-purple-500" />
                    Nova Anotação
                  </h3>
                  
                  <input
                    type="text"
                    placeholder="Título da anotação..."
                    value={tituloDiario}
                    onChange={(e) => setTituloDiario(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border mb-3 outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                  />
                  
                  <textarea
                    placeholder="Descreva o que aconteceu (ex: Ajuste no painel solar, clima mudou, hélice trocada...)"
                    value={textoDiario}
                    onChange={(e) => setTextoDiario(e.target.value)}
                    rows={6}
                    className={`w-full flex-1 px-4 py-3 rounded-xl border mb-4 outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors resize-none ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                  />
                  
                  <button
                    onClick={salvarDiario}
                    className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center mt-auto hover:scale-[1.02] active:scale-95"
                  >
                    <BookOpen size={18} className="mr-2" /> Salvar Registo
                  </button>
                </div>

                {/* Lado Direito: Feed de Anotações */}
                <div className={`flex-1 flex flex-col rounded-3xl shadow-sm border p-5 transition-colors overflow-hidden ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                  <h3 className="text-lg font-bold mb-4">Histórico do Barco</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {diarioLogs.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                        <BookOpen size={48} className="mb-3 opacity-20" />
                        <p>Nenhuma anotação no diário ainda.</p>
                      </div>
                    ) : (
                      diarioLogs.map(log => (
                        <div key={log.id} className={`p-4 rounded-2xl border transition-all ${darkMode ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-md text-purple-500 dark:text-purple-400">{log.titulo}</h4>
                            <span className="text-[10px] md:text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{log.data}</span>
                          </div>
                          
                          <p className={`text-sm whitespace-pre-wrap leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {log.texto}
                          </p>
                          
                          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                            <img src={log.fotoAutor} alt={log.autor} className="w-5 h-5 rounded-full border border-gray-400" />
                            <span className={`text-xs font-bold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{log.autor}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
  );
}
