import { Activity, AlertTriangle } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "darkMode" | "deixarComoRascunho" | "executarDescarte" | "fimTimestamp" | "formatarDataHora" | "idProvaAtual" | "inicioTimestamp" | "nomeDefinitivoProva" | "pedirConfirmacaoDescarte" | "salvarProvaComNome" | "setNomeDefinitivoProva" | "setPedirConfirmacaoDescarte" | "showModalFinalizacao">;

export function FinalizeModal(props: Props) {
  const {
    darkMode,
    deixarComoRascunho,
    executarDescarte,
    fimTimestamp,
    formatarDataHora,
    idProvaAtual,
    inicioTimestamp,
    nomeDefinitivoProva,
    pedirConfirmacaoDescarte,
    salvarProvaComNome,
    setNomeDefinitivoProva,
    setPedirConfirmacaoDescarte,
    showModalFinalizacao,
  } = props;
  if (!showModalFinalizacao) return null;
  return (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`max-w-md w-full p-6 md:p-8 rounded-3xl shadow-2xl border ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}>
            
            {!pedirConfirmacaoDescarte ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                  <Activity size={24} />
                </div>

                <h3 className="text-xl font-bold mb-1">Finalizar Gravação</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Reveja os dados abaixo e escolha como deseja proceder com a prova.
                </p>

                  <div className={`p-4 rounded-2xl border mb-5 text-xs flex flex-col gap-2 ${darkMode ? "bg-gray-900/60 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-500">Status:</span>
                    <span className="font-mono font-bold text-orange-500">Pronto para Gravar ID Sequencial</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-500">Início:</span>
                    <span className="font-medium">{formatarDataHora(inicioTimestamp)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-500">Fim:</span>
                    <span className="font-medium">{formatarDataHora(fimTimestamp)}</span>
                  </div>
                </div>

                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nome Definitivo da Prova</label>
                <input
                  type="text"
                  placeholder="Ex: Prova Regata Solares 2026"
                  value={nomeDefinitivoProva}
                  onChange={(e) => setNomeDefinitivoProva(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border mb-6 outline-none focus:ring-2 focus:ring-orange-500 text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                  autoFocus
                />

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={salvarProvaComNome}
                    className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center"
                  >
                    Salvar Definitivo
                  </button>
                  <button
                    onClick={deixarComoRascunho}
                    className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center"
                  >
                    Salvar como Rascunho
                  </button>
                  <button
                    onClick={() => setPedirConfirmacaoDescarte(true)}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all border border-red-500/20 flex items-center justify-center"
                  >
                    Descartar Gravação
                  </button>
                </div>
              </>
            ) : (
              /* TELA DE DUPLA CONFIRMAÇÃO PARA DESCARTAR */
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500 border border-red-500/30 animate-pulse">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">Tem certeza absoluta?</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Esta ação irá apagar permanentemente os dados da gravação #{idProvaAtual} do banco de dados.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={executarDescarte}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-600/20"
                  >
                    Sim, Descartar Permanentemente
                  </button>
                  <button
                    onClick={() => setPedirConfirmacaoDescarte(false)}
                    className={`w-full py-3 rounded-xl font-bold transition-all border ${darkMode ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600" : "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200"}`}
                  >
                    Cancelar / Voltar
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
  );
}
