import { AlertTriangle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Carregando() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        <p className="text-sm font-medium">Carregando inventário...</p>
      </div>
    </div>
  );
}

export function SemAcesso() {
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 p-4 text-white">
      <div className="flex w-full max-w-md flex-col items-center rounded-3xl border border-red-500/30 bg-gray-800 p-8 shadow-2xl">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-500/50 bg-red-500/10">
          <AlertTriangle size={40} className="text-red-500" />
        </div>
        <h2 className="mb-2 text-center text-2xl font-black text-red-400">Acesso Negado</h2>
        <p className="mb-8 text-center text-sm text-gray-400">
          Sua conta não possui uma função atribuída. Contate um moderador para liberar o acesso ao inventário.
        </p>
        <button
          onClick={() => void logout()}
          className="w-full rounded-xl bg-gray-700 py-3 font-bold text-white transition-all hover:bg-gray-600"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}

export function ConfigFaltando() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-900 p-4 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-yellow-500/30 bg-gray-800 p-8 shadow-2xl">
        <h2 className="mb-3 text-2xl font-black text-yellow-400">Configuração faltando</h2>
        <p className="mb-4 text-sm text-gray-300">
          As variáveis <code className="rounded bg-gray-700 px-1">VITE_SUPABASE_URL</code> e{" "}
          <code className="rounded bg-gray-700 px-1">VITE_SUPABASE_ANON_KEY</code> não foram encontradas.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-gray-400">
          <li>Local: crie o arquivo <b>.env</b> (copie o <b>.env.example</b>) e reinicie o <b>npm run dev</b>.</li>
          <li>Vercel: Settings → Environment Variables, depois faça um novo Deploy.</li>
        </ul>
      </div>
    </div>
  );
}
