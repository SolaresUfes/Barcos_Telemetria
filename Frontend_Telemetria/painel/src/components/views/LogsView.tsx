import { Activity, Database, DownloadCloud, Play, Square } from "lucide-react";
import { formatTimer } from "../../utils/format";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "abrirAnaliseDeDados" | "carregarRascunhoSalvo" | "darkMode" | "idProvaAtual" | "lidarComCliqueFim" | "provaAtiva" | "prova_iniciar" | "rascunhoAtivo" | "recordingTime">;

export function LogsView(props: Props) {
  const {
    abrirAnaliseDeDados,
    carregarRascunhoSalvo,
    darkMode,
    idProvaAtual,
    lidarComCliqueFim,
    provaAtiva,
    prova_iniciar,
    rascunhoAtivo,
    recordingTime,
  } = props;
  return (
            <div className="h-full w-full max-w-5xl mx-auto flex flex-col animate-in fade-in duration-300 min-h-0 relative">
              <div className="flex items-center space-x-3 mb-6 shrink-0">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                  <Database className="text-indigo-500" size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Logs de Dados da Prova</h2>
                  <p
                    className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Controle da gravação da telemetria e exportação externa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0 overflow-y-auto pb-4">
                {/* Card 1: Controle de Prova */}
                <div
                  className={`p-6 md:p-8 rounded-3xl shadow-lg border flex flex-col justify-center transition-colors ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="text-center mb-8 flex flex-col items-center justify-center">
                    <div
                      className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 border-4 transition-all duration-500 ${provaAtiva ? "bg-green-500/20 border-green-500 animate-pulse" : darkMode ? "bg-gray-900 border-gray-700" : "bg-gray-100 border-gray-300"}`}
                    >
                      {provaAtiva ? (
                        <Activity size={32} className="text-green-500" />
                      ) : (
                        <Square size={32} className="text-gray-500" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold">Estado da Gravação</h3>
                    <p
                      className={`text-sm mt-2 font-medium ${provaAtiva ? "text-green-500" : "text-gray-500"}`}
                    >
                      {provaAtiva
                        ? "GRAVANDO DADOS AO VIVO..."
                        : "SISTEMA EM ESPERA"}
                    </p>

                    {/* Temporizador da Gravação */}
                    {provaAtiva && (
                      <div className="mt-4 font-mono text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 animate-in fade-in zoom-in duration-300 drop-shadow-sm tabular-nums">
                        {formatTimer(recordingTime)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
                    <button
                      onClick={() => prova_iniciar()}
                      disabled={provaAtiva}
                      className="flex-1 py-4 px-6 rounded-2xl font-bold text-white uppercase tracking-wider flex items-center justify-center transition-all bg-green-500 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-green-500/20 hover:scale-[1.02]"
                    >
                      <Play size={20} className="mr-2" /> Início
                    </button>
                    <button
                      onClick={() => lidarComCliqueFim()}
                      disabled={!provaAtiva && idProvaAtual === -1}
                      className="flex-1 py-4 px-6 rounded-2xl font-bold text-white uppercase tracking-wider flex items-center justify-center transition-all bg-red-500 hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 hover:scale-[1.02]"
                    >
                      <Square size={20} className="mr-2 fill-current" /> Fim
                    </button>
                  </div>

                  {/* Acesso ao Rascunho */}
                  <div className="mt-4 pt-4 border-t border-gray-700/50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {rascunhoAtivo ? `Rascunho pendente (ID: ${rascunhoAtivo.id})` : "Nenhum rascunho ativo"}
                    </span>
                    <button
                      onClick={carregarRascunhoSalvo}
                      className="text-xs px-3 py-1.5 bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30 rounded-xl font-bold transition-all border border-yellow-500/30"
                    >
                      Aceder Rascunho
                    </button>
                  </div>
                </div>

                {/* Card 2: Exportação e Planilha */}
                <div
                  className={`p-6 md:p-8 rounded-3xl shadow-lg border flex flex-col justify-center transition-colors ${darkMode ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200"}`}
                >
                  <div className="text-center mb-8">
                    <div
                      className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}
                    >
                      <DownloadCloud size={32} className="text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold">Gerenciamento de Gravações</h3>
                    <p
                      className={`text-sm mt-2 px-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Consulte o histórico, exporte CSVs de provas passadas e imprima os relatórios gráficos oficiais.
                    </p>
                  </div>

                  <button 
                    onClick={abrirAnaliseDeDados}
                    className="w-full mt-auto py-4 md:py-5 px-6 rounded-2xl font-bold text-white uppercase tracking-wider flex items-center justify-center transition-all bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-xl shadow-orange-500/20 hover:scale-[1.02]"
                  >
                    <Database size={20} className="mr-2" />
                    Abrir Gravações Salvas
                  </button>
                </div>
              </div>
              
            </div>
  );
}
