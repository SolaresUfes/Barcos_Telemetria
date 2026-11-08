import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "currentUser" | "enviarCutucao" | "members" | "onlineCount" | "setShowOnlineMenu" | "showOnlineMenu">;

export function OnlineMenu(props: Props) {
  const {
    currentUser,
    enviarCutucao,
    members,
    onlineCount,
    setShowOnlineMenu,
    showOnlineMenu,
  } = props;
  if (!showOnlineMenu) return null;
  return (
        <>
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setShowOnlineMenu(null)}
          ></div>

          <div
            style={{
              top: `${showOnlineMenu.top}px`,
              left: `${showOnlineMenu.left}px`,
            }}
            className="fixed w-64 p-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] border z-[999999] animate-in fade-in zoom-in-95 duration-200 bg-gray-900 border-gray-600 text-white"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 border-b border-gray-700 pb-1">
              Membros Online ({onlineCount})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members
                .filter((m) => m.isOnline)
                .map((membro) => (
                  <div
                    key={membro.id}
                    className="flex items-center justify-between gap-2 py-1"
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <img
                        src={membro.photo}
                        alt={membro.name}
                        className="w-6 h-6 rounded-full object-cover shrink-0 bg-gray-800"
                      />
                      <span className="text-xs font-bold truncate">
                        {membro.name.split(" ")[0]}
                      </span>
                    </div>

                    {membro.email !== currentUser?.email && (
                      <button
                        type="button"
                        /* Trocado para onClick padrão */
                        onClick={(e) => {
                          e.preventDefault(); 
                          e.stopPropagation();
                          enviarCutucao(membro.email, membro.name);
                          setShowOnlineMenu(null);
                        }}
                        className="px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white text-[10px] font-bold rounded-lg transition-all border border-orange-500/30 flex items-center space-x-1 shrink-0 cursor-pointer relative z-[1000000]"
                      >
                        <span>👋</span>
                        <span>Cutucar</span>
                      </button>
                    )}
                  </div>
                ))}
              {onlineCount === 0 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  Ninguém online de momento.
                </p>
              )}
            </div>
          </div>
        </>
  );
}
