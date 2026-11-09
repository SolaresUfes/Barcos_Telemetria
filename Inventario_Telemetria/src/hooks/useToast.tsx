import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type TipoToast = "sucesso" | "aviso" | "erro";

interface ToastCtx {
  toast: (mensagem: string, tipo?: TipoToast) => void;
}

const Ctx = createContext<ToastCtx>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [atual, setAtual] = useState<{ mensagem: string; tipo: TipoToast } | null>(null);
  const [saindo, setSaindo] = useState(false);
  const timers = useRef<number[]>([]);

  const toast = useCallback((mensagem: string, tipo: TipoToast = "sucesso") => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setSaindo(false);
    setAtual({ mensagem, tipo });
    timers.current.push(
      window.setTimeout(() => setSaindo(true), 3500),
      window.setTimeout(() => setAtual(null), 4000),
    );
  }, []);

  const estilos: Record<TipoToast, string> = {
    sucesso: "bg-green-950/90 border-green-500/50 text-green-200 shadow-green-950/50",
    aviso: "bg-yellow-950/90 border-yellow-500/50 text-yellow-200 shadow-yellow-950/50",
    erro: "bg-red-950/90 border-red-500/50 text-red-200 shadow-red-950/50",
  };
  const bolinha: Record<TipoToast, string> = {
    sucesso: "bg-green-400 animate-ping",
    aviso: "bg-yellow-400",
    erro: "bg-red-400",
  };

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      {atual && (
        <div
          className={`fixed bottom-6 right-6 z-[10000] transition-all duration-500 ${
            saindo ? "translate-y-2 scale-95 opacity-0" : "translate-y-0 scale-100 opacity-100 animate-fade-in"
          }`}
        >
          <div
            className={`flex max-w-sm items-center space-x-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl backdrop-blur-xl ${estilos[atual.tipo]}`}
          >
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${bolinha[atual.tipo]}`} />
            <span>{atual.mensagem}</span>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
