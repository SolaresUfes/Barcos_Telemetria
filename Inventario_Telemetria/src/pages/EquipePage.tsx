import { useState } from "react";
import { ChevronDown, Plus, Shield, Trash2, User, Users } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Spinner from "../components/ui/Spinner";
import { useAuth } from "../hooks/useAuth";
import { useMembros } from "../hooks/useMembros";
import { CARGOS } from "../utils/constants";

export default function EquipePage() {
  const { user } = useAuth();
  const { membros, loading, adicionar, atualizar, remover } = useMembros();
  const ehMod = !!user?.isModerador;

  const [email, setEmail] = useState("");
  const [cargo, setCargo] = useState<string>("Trainee");
  const [ehModerador, setEhModerador] = useState(false);

  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (await adicionar(email, cargo, ehModerador)) {
      setEmail("");
      setCargo("Trainee");
      setEhModerador(false);
    }
  };

  const excluir = async (emailMembro: string) => {
    if (window.confirm(`Remover o acesso de ${emailMembro}?`)) await remover(emailMembro);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl min-h-0 animate-fade-in flex-col">
      <PageHeader
        icone={Users}
        cor="orange"
        titulo="Gerenciamento de Equipe"
        subtitulo={
          ehMod
            ? "Você tem acesso total para gerenciar membros."
            : "Visualização da equipe (apenas moderadores podem editar)."
        }
        acao={
          ehMod && (
            <div className="flex items-center rounded-full bg-orange-500/20 px-3 py-1 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Shield size={14} className="mr-1" /> Moderador ativo
            </div>
          )
        }
      />

      {ehMod && (
        <div className="card mb-4 shrink-0 p-4 md:p-6">
          <h3 className="mb-3 flex items-center text-sm font-bold md:text-lg">
            <Plus className="mr-2 text-green-500" size={20} /> Adicionar novo membro
          </h3>
          <form onSubmit={cadastrar} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
            <input
              type="email"
              required
              placeholder="E-mail do Google (gera o nome automático)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input md:col-span-5"
            />
            <div className="relative md:col-span-3">
              <select value={cargo} onChange={(e) => setCargo(e.target.value)} className="input appearance-none pr-10">
                {CARGOS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
            <label className="flex cursor-pointer select-none items-center justify-center space-x-2 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 md:col-span-2">
              <input
                type="checkbox"
                checked={ehModerador}
                onChange={(e) => setEhModerador(e.target.checked)}
                className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500"
              />
              <span>Moderador</span>
            </label>
            <button type="submit" className="btn-success md:col-span-2">
              Cadastrar
            </button>
          </form>
          <p className="mt-3 text-[11px] text-gray-500">
            <b>Trainee</b>: só visualiza · <b>Membro</b>: cadastra e edita · <b>Moderador</b>: também apaga e gerencia a equipe.
          </p>
        </div>
      )}

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50 md:p-5">
          <h3 className="flex items-center text-sm font-bold md:text-lg">
            <User className="mr-2 text-blue-500" size={20} /> Membros cadastrados
          </h3>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Total: {membros.length}
          </span>
        </div>

        <div className="flex-1 divide-y divide-gray-200 overflow-auto dark:divide-gray-700">
          {loading ? (
            <Spinner />
          ) : (
            <div className="min-w-[600px] md:min-w-0">
              {membros.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 md:p-5">
                  <div className="flex w-1/2 items-center space-x-3 md:space-x-4">
                    <img
                      src={m.photo}
                      alt={m.name}
                      referrerPolicy="no-referrer"
                      className={`h-10 w-10 shrink-0 rounded-full object-cover md:h-12 md:w-12 ${
                        m.isModerador ? "border-[3px] border-orange-500" : "border-2 border-gray-300 dark:border-gray-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="flex items-center text-sm font-bold">
                        <span className="truncate">{m.name}</span>
                        {m.isModerador && <Shield size={12} className="ml-2 shrink-0 text-orange-500" />}
                      </p>
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">{m.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 md:space-x-6">
                    {ehMod ? (
                      <>
                        <div className="relative">
                          <select
                            value={m.mainRole}
                            onChange={(e) => void atualizar(m.email, { tipo_acesso: e.target.value })}
                            className="appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 pr-8 text-sm outline-none focus:ring-2 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                          >
                            <option value="">Sem acesso</option>
                            {CARGOS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500" />
                        </div>

                        <label className="flex cursor-pointer items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={m.isModerador}
                            disabled={m.email === user?.email}
                            onChange={(e) => void atualizar(m.email, { eh_moderador: e.target.checked })}
                            className="h-4 w-4 rounded text-orange-500 focus:ring-orange-500 disabled:opacity-40"
                          />
                          <span className={`text-sm font-semibold ${m.isModerador ? "text-orange-500" : "text-gray-600 dark:text-gray-400"}`}>
                            Mod
                          </span>
                        </label>

                        <button
                          onClick={() => void excluir(m.email)}
                          disabled={m.email === user?.email}
                          className="rounded-xl p-2 text-red-500 transition-all hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                          title={m.email === user?.email ? "Você não pode remover a si mesmo" : "Remover membro"}
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {m.mainRole && (
                          <span className="rounded-full border border-blue-200 bg-blue-100 px-4 py-1.5 text-xs font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-400">
                            {m.mainRole}
                          </span>
                        )}
                        {m.isModerador && (
                          <span className="rounded-full border border-orange-200 bg-orange-100 px-4 py-1.5 text-xs font-bold text-orange-700 dark:border-orange-800 dark:bg-orange-900/40 dark:text-orange-400">
                            Moderador
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {membros.length === 0 && <div className="p-10 text-center font-medium text-gray-500">Nenhum membro cadastrado.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
