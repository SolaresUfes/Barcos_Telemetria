import { useState } from "react";
import { Info, Package } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// A tela de login é sempre escura, igual ao painel de telemetria
export default function LoginPage() {
  const { loginGoogle, erro } = useAuth();
  const [entrando, setEntrando] = useState(false);
  const [ajuda, setAjuda] = useState(false);

  const entrar = async () => {
    setEntrando(true);
    await loginGoogle();
    setEntrando(false);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gray-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black p-4 text-white">
      <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-red-500/10 blur-[100px]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-3xl border border-gray-700 bg-gray-800/40 p-8 shadow-2xl backdrop-blur-2xl">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-500 to-red-600 shadow-lg shadow-orange-500/40">
          <Package size={40} className="text-white" />
        </div>

        <h2 className="mb-2 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-center text-3xl font-black tracking-tight text-transparent">
          Inventário do Solares
        </h2>
        <p className="mb-8 text-center text-sm font-medium text-gray-400">
          Acesso restrito para a melhor área do solares.
        </p>

        {erro && (
          <div className="mb-4 w-full rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-center text-xs font-semibold text-red-300">
            {erro}
          </div>
        )}

        <button
          onClick={() => void entrar()}
          disabled={entrando}
          className="flex w-full items-center justify-center space-x-3 rounded-xl bg-white px-4 py-3.5 font-bold text-gray-800 shadow-xl shadow-white/5 transition-all hover:scale-[1.02] hover:bg-gray-100 disabled:scale-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {entrando ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          ) : (
            <GoogleIcon />
          )}
          <span className="text-[15px]">{entrando ? "Redirecionando..." : "Entrar com o Google"}</span>
        </button>

        <div className="mt-8 flex w-full flex-col items-center border-t border-gray-700/50 pt-4">
          <button
            onClick={() => setAjuda(!ajuda)}
            className="flex items-center space-x-2 text-xs text-gray-400 transition-colors hover:text-orange-400"
          >
            <Info size={16} />
            <span>Problemas com acesso?</span>
          </button>
          {ajuda && (
            <p className="mt-4 w-full rounded-xl border border-gray-700 bg-gray-900/80 p-4 text-center text-xs text-gray-400">
              Seu e-mail do Google precisa estar cadastrado pela equipe. Fale com um dos moderadores do projeto para
              liberar seu acesso.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
