import { useState } from "react";
import { Activity, Unlock, Info } from "lucide-react";
import { GoogleIcon } from "../icons";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "currentUser" | "isLoggingIn" | "loginGoogle" | "members" | "showUnlockAnim">;

export function LoginScreen(props: Props) {
  const {
    currentUser,
    isLoggingIn,
    loginGoogle,
    members,
    showUnlockAnim,
  } = props;
  const [showModInfo, setShowModInfo] = useState(false);
    const moderatorsList = members.filter((m) => m.isModerador);

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black text-white font-sans p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 blur-[100px] rounded-full"></div>

        <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-2xl border border-gray-700 rounded-3xl p-8 shadow-2xl flex flex-col items-center relative z-10 transition-all duration-500">
          <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/40">
            <Activity size={40} className="text-white" />
          </div>

          <h2 className="text-3xl font-black mb-2 text-center tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            Telemetria do Solares
          </h2>
          <p className="text-gray-400 text-center mb-8 text-sm font-medium">
            Acesso restrito para a melhor área do solares.
          </p>

          {showUnlockAnim ? (
            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(34,197,94,0.4)] relative">
                <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-ping opacity-20"></div>
                <Unlock size={32} className="text-green-500" />
              </div>
              <span className="text-green-400 font-bold tracking-widest text-sm uppercase">
                Acesso Liberado
              </span>
              <span className="text-gray-300 mt-2 text-sm font-medium animate-pulse">
                Seja bem-vindo,{" "}
                {currentUser?.name ? currentUser.name.split(" ")[0] : "Equipe"}!
              </span>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <button
                onClick={() => loginGoogle()}
                disabled={isLoggingIn}
                className="w-full bg-white text-gray-800 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-3 hover:bg-gray-100 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:scale-100 disabled:cursor-not-allowed shadow-xl shadow-white/5"
              >
                {isLoggingIn ? (
                  <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                ) : (
                  <GoogleIcon size={24} />
                )}
                <span className="text-[15px]">
                  {isLoggingIn
                    ? "Verificando credenciais..."
                    : "Entrar com o Google"}
                </span>
              </button>
            </div>
          )}

          {!showUnlockAnim && (
            <div className="mt-8 w-full border-t border-gray-700/50 pt-4 flex flex-col items-center">
              <button
                onClick={() => setShowModInfo(!showModInfo)}
                className="flex items-center space-x-2 text-xs text-gray-400 hover:text-orange-400 transition-colors"
              >
                <Info size={16} />
                <span>Problemas com acesso?</span>
              </button>

              {showModInfo && (
                <div className="mt-4 w-full bg-gray-900/80 border border-gray-700 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs text-gray-400 mb-3 text-center">
                    Contate um de nossos moderadores:
                  </p>
                  <ul className="space-y-3">
                    {moderatorsList.map((mod) => (
                      <li key={mod.id} className="flex items-center space-x-3">
                        <img
                          src={mod.photo}
                          alt={mod.name}
                          className="w-8 h-8 rounded-full border border-gray-600"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-200">
                            {mod.name}
                          </span>
                          <a
                            href={`mailto:${mod.email}`}
                            className="text-[11px] text-blue-400 hover:underline"
                          >
                            {mod.email}
                          </a>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
}
