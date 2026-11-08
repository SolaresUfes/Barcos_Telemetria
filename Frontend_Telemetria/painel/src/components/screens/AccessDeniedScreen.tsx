import { AlertTriangle } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "logoutGoogle">;

export function AccessDeniedScreen(props: Props) {
  const {
    logoutGoogle,
  } = props;
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 text-white font-sans p-4 relative overflow-hidden">
        <div className="max-w-md w-full bg-gray-800 border border-red-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative z-10">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <AlertTriangle size={40} className="text-red-500" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-center text-red-400">
            Acesso Negado
          </h2>
          <p className="text-gray-400 text-center mb-8 text-sm">
            Sua conta não possui uma função especial atribuída. Você perdeu o
            acesso aos dados do site. Contate um moderador.
          </p>
          <button
            onClick={() => logoutGoogle()}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
}
