import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "isExiting" | "toast">;

export function Toast(props: Props) {
  const {
    isExiting,
    toast,
  } = props;
  if (!toast) return null;
  return (
        <div className={`fixed bottom-6 right-6 z-[10000] transition-all duration-500 transform ${
          isExiting ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5'
        }`}>
          <div className={`px-5 py-4 rounded-2xl shadow-2xl border flex items-center space-x-3 text-sm font-semibold backdrop-blur-xl ${
            toast.tipo === 'sucesso' 
              ? "bg-green-950/90 border-green-500/50 text-green-200 shadow-green-950/50" 
              : toast.tipo === 'aviso'
              ? "bg-yellow-950/90 border-yellow-500/50 text-yellow-200 shadow-yellow-950/50"
              : "bg-red-950/90 border-red-500/50 text-red-200 shadow-red-950/50"
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              toast.tipo === 'sucesso' ? "bg-green-400 animate-ping" : toast.tipo === 'aviso' ? "bg-yellow-400" : "bg-red-400"
            }`}></span>
            <span>{toast.mensagem}</span>
          </div>
        </div>
  );
}
