import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "cutucaoRecebido">;

export function PokeNotice(props: Props) {
  const {
    cutucaoRecebido,
  } = props;
  if (!cutucaoRecebido) return null;
  return (
        <div className="fixed bottom-6 right-6 z-[10001] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="px-5 py-4 rounded-2xl shadow-2xl border bg-orange-950/90 border-orange-500/50 text-orange-200 shadow-orange-950/50 flex items-center space-x-3 text-sm font-semibold backdrop-blur-xl">
            <span className="text-2xl animate-bounce">👋</span>
            <div>
              <p className="font-bold">Recebeu um tchauzinho!</p>
              <p className="text-xs text-orange-300 font-normal">{cutucaoRecebido.remetente} cutucou-te na telemetria.</p>
            </div>
          </div>
        </div>
  );
}
