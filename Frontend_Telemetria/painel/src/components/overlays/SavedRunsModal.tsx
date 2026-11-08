/* eslint-disable @typescript-eslint/no-explicit-any */
import { Database } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "baixarCSVHistorico" | "carregandoProvas" | "darkMode" | "deletarProvaBanco" | "dispararToast" | "formatarDataHora" | "idEditando" | "listaProvas" | "novoNomeEditado" | "salvarEdicaoNome" | "setActiveTab" | "setIdEditando" | "setNovoNomeEditado" | "setRecordingData" | "setShowModalAnalise" | "showModalAnalise">;

export function SavedRunsModal(props: Props) {
  const {
    baixarCSVHistorico,
    carregandoProvas,
    darkMode,
    deletarProvaBanco,
    dispararToast,
    formatarDataHora,
    idEditando,
    listaProvas,
    novoNomeEditado,
    salvarEdicaoNome,
    setActiveTab,
    setIdEditando,
    setNovoNomeEditado,
    setRecordingData,
    setShowModalAnalise,
    showModalAnalise,
  } = props;
  if (!showModalAnalise) return null;
  return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`max-w-2xl w-full max-h-[85vh] p-5 md:p-8 rounded-3xl shadow-2xl border flex flex-col ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-700/50 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2.5 md:p-3 bg-orange-500/10 rounded-2xl text-orange-500 shrink-0">
                  <Database size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg md:text-xl font-bold truncate">Gravações Salvas</h3>
                  <p className="text-xs text-gray-400 truncate">Consulte, edite ou elimine registos anteriores.</p>
                </div>
              </div>
              <button
                onClick={() => setShowModalAnalise(false)}
                className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded-xl font-bold text-sm transition-all shrink-0 ml-2"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px] pr-1">
              {carregandoProvas ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-400">A carregar registos do Supabase...</p>
                </div>
              ) : listaProvas.length === 0 ? (
                <div className="text-center py-20 text-gray-500 font-medium">
                  Nenhuma gravação encontrada na base de dados.
                </div>
              ) : (
                <div className="space-y-3">
                  {listaProvas.map((prova) => (
                    <div 
                      key={prova.id} 
                      className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${
                        darkMode ? "bg-gray-900/60 border-gray-700/60 hover:border-gray-600" : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {/* Cabeçalho do Cartão: ID, Nome / Input de Edição e Ações */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                          <span className="font-mono font-bold text-orange-500 bg-orange-500/10 px-2.5 py-1 rounded-lg text-xs shrink-0">
                            #{prova.id}
                          </span>
                          
                          {idEditando === prova.id ? (
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <input
                                type="text"
                                value={novoNomeEditado}
                                onChange={(e) => setNovoNomeEditado(e.target.value)}
                                className={`w-full px-3 py-1 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500 ${darkMode ? "bg-gray-900 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                                autoFocus
                              />
                              <button
                                onClick={() => salvarEdicaoNome(prova.id)}
                                className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-all shrink-0"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setIdEditando(null)}
                                className="px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-lg transition-all shrink-0"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <span className="font-bold text-sm truncate">{prova.nome}</span>
                          )}
                        </div>

                        {/* Botões de Ação */}
                        {/* Botões de Ação */}
                        {idEditando !== prova.id && (
                          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
                            
                            <button
                              onClick={() => baixarCSVHistorico(prova)}
                              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-xs rounded-xl transition-all border border-indigo-500/20"
                            >
                              Baixar CSV
                            </button>

                            <button
                              onClick={async () => {
                                dispararToast("A carregar gráficos para impressão...", "aviso");
                                
                                try {
                                  // sixseven
                                  const res = await fetch(`https://telemetria-be.vercel.app/api/sensores/historico?inicio=${prova.inicio}&fim=${prova.fim}`); // exemplo aleatório, n sei mexer nisso
                                  const dadosHistoricos = await res.json();

                                  // 2. Transforma a resposta da API nos arrays que a aba de Análise exige
                                  setRecordingData({
                                    tensao: dadosHistoricos.map((d: any) => d.tensao ?? 0),
                                    potenciaBateria: dadosHistoricos.map((d: any) => d.potencia ?? 0),
                                    potenciaMotor: dadosHistoricos.map((d: any) => (d.tensao ?? 0) * (d.corrente_2 ?? 0)),
                                    potenciaGeracao: dadosHistoricos.map((d: any) => (d.tensao ?? 0) * (d.string_1 ?? 0)),
                                    bateria: dadosHistoricos.map((d: any) => d.porcentagem ?? 0),
                                    velocidade: dadosHistoricos.map((d: any) => d.velocidade ?? 0),
                                    correnteBateria: dadosHistoricos.map((d: any) => d.corrente ?? 0),
                                    correnteMotor: dadosHistoricos.map((d: any) => d.corrente_2 ?? 0),
                                    s1: dadosHistoricos.map((d: any) => d.string_1 ?? 0),
                                    s2: dadosHistoricos.map((d: any) => d.string_2 ?? 0)
                                  });

                                  // 3. Muda a aba e manda imprimir com um atraso para o React renderizar os SVG
                                  setActiveTab("Análise");
                                  setShowModalAnalise(false);
                                  setTimeout(() => window.print(), 1000); 

                                } catch (error) {
                                  console.error("Erro ao carregar histórico:", error);
                                  dispararToast("Erro ao carregar dados para impressão.", "erro");
                                }
                              }}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl transition-all border border-emerald-500/20"
                            >
                              Imprimir Gráficos
                            </button>

                            <button
                              onClick={() => {
                                setIdEditando(prova.id);
                                setNovoNomeEditado(prova.nome);
                              }}
                              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs rounded-xl transition-all border border-blue-500/20"
                            >
                              Editar Nome
                            </button>

                            <button
                              onClick={() => deletarProvaBanco(prova.id)}
                              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs rounded-xl transition-all border border-red-500/20"
                            >
                              Apagar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Informações de Início e Fim */}
                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2.5 border-t ${darkMode ? "border-gray-800 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        <div>
                          <span className="font-semibold uppercase text-[10px] opacity-70">Início: </span>
                          <span className="font-medium">{formatarDataHora(prova.inicio)}</span>
                        </div>
                        <div>
                          <span className="font-semibold uppercase text-[10px] opacity-70">Fim: </span>
                          <span className="font-medium">{formatarDataHora(prova.fim)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
  );
}
