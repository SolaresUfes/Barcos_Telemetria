import { LogOut, Menu, Moon, Shield, Sun } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export default function Header({ onAbrirMenu }: { onAbrirMenu: () => void }) {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const subtitulo = user?.isModerador
    ? user.mainRole
      ? `${user.mainRole} | Mod`
      : "Moderador"
    : user?.mainRole || "Membro";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white/50 px-4 backdrop-blur-md transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800/50 md:px-8">
      <div className="flex min-w-0 items-center">
        <button
          onClick={onAbrirMenu}
          className="-ml-2 mr-3 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="truncate text-xl font-bold md:text-2xl">Inventário do Galpão</h1>
      </div>

      <div className="flex shrink-0 items-center gap-3 md:gap-6">
        <button
          onClick={toggleTheme}
          title="Alternar modo escuro"
          className="flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:border-transparent dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="group relative flex items-center gap-3 border-l border-gray-300 pl-3 dark:border-gray-700 md:pl-6">
          <div className="hidden text-right lg:block">
            <p className="text-sm font-bold leading-none">{user?.name.split(" ")[0]}</p>
            <p className="mt-1 flex items-center justify-end text-[11px] font-medium tracking-wide text-gray-500 dark:text-gray-400">
              {user?.isModerador && <Shield size={10} className="mr-1 text-orange-500" />}
              {subtitulo}
            </p>
          </div>

          <div className="relative h-10 w-10 shrink-0">
            {user?.photo ? (
              <img
                src={user.photo}
                alt="Foto de perfil"
                referrerPolicy="no-referrer"
                className={`h-full w-full rounded-full object-cover shadow-md transition-transform group-hover:scale-105 ${
                  user.isModerador ? "border-[3px] border-orange-500" : "border-2 border-gray-400"
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-orange-500 font-bold text-white">
                {user?.name.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
          </div>

          <button
            onClick={() => void logout()}
            className="absolute -bottom-8 right-0 z-50 flex items-center space-x-1 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
          >
            <LogOut size={12} />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
