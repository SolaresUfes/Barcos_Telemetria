import React from "react";
import { User, Settings, Trash2, Plus, Shield, ChevronDown } from "lucide-react";
import type { AppContext } from "../../types/appContext";

type Props = Pick<AppContext, "currentUser" | "darkMode" | "handleAddMember" | "handleRemoveMember" | "handleUpdateMemberRole" | "members" | "newMemberEmail" | "newMemberIsMod" | "newMemberRole" | "setNewMemberEmail" | "setNewMemberIsMod" | "setNewMemberRole">;

export function SettingsView(props: Props) {
  const {
    currentUser,
    darkMode,
    handleAddMember,
    handleRemoveMember,
    handleUpdateMemberRole,
    members,
    newMemberEmail,
    newMemberIsMod,
    newMemberRole,
    setNewMemberEmail,
    setNewMemberIsMod,
    setNewMemberRole,
  } = props;
  return (
            <div className="h-full w-full max-w-5xl mx-auto flex flex-col animate-in fade-in duration-300 min-h-0">
              {/* #region Aba Configurações */}
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-orange-500/10 rounded-2xl">
                    <Settings className="text-orange-500" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Gerenciamento de Equipe
                    </h2>
                    <p
                      className={`text-[10px] md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      {currentUser?.isModerador
                        ? "Você tem acesso total para gerenciar membros."
                        : "Visualização da equipe (Apenas Moderadores podem editar)."}
                    </p>
                  </div>
                </div>
                {currentUser?.isModerador && (
                  <div className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold flex items-center">
                    <Shield size={14} className="mr-1 shrink-0" />{" "}
                    <span className="hidden sm:inline">Moderador Ativo</span>
                  </div>
                )}
              </div>

              {currentUser?.isModerador && (
                <div
                  className={`shrink-0 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border mb-4 transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
                >
                  <h3 className="text-sm md:text-lg font-bold mb-3 md:mb-4 flex items-center">
                    <Plus className="mr-2 text-green-500" size={20} /> Adicionar
                    Novo Membro
                  </h3>
                  <form
                    onSubmit={handleAddMember}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4"
                  >
                    <input
                      type="email"
                      placeholder="E-mail (Gera o nome automático)"
                      required
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className={`md:col-span-5 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border focus:ring-2 focus:ring-orange-500 outline-none transition-colors text-sm ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                    />
                    <div className="relative md:col-span-3">
                      <select
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className={`w-full text-sm appearance-none px-3 py-2 md:px-4 md:py-3 pr-10 rounded-lg md:rounded-xl border focus:ring-2 focus:ring-orange-500 outline-none transition-colors ${darkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300"}`}
                      >
                        <option value="">Sem Função Especial</option>
                        <option value="Piloto">Piloto</option>
                        <option value="Engenheiro de Prova">
                          Engenheiro de Prova
                        </option>
                      </select>
                      <ChevronDown
                        size={18}
                        className={`absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>

                    <label
                      className={`md:col-span-2 flex items-center justify-center space-x-2 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border cursor-pointer select-none transition-colors ${darkMode ? "bg-gray-900 border-gray-700 text-white hover:bg-gray-800" : "bg-gray-50 border-gray-300 hover:bg-gray-100"}`}
                    >
                      <input
                        type="checkbox"
                        checked={newMemberIsMod}
                        onChange={(e) => setNewMemberIsMod(e.target.checked)}
                        className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                      />
                      <span className="font-semibold text-sm">Moderador</span>
                    </label>

                    <button
                      type="submit"
                      className="md:col-span-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] active:scale-95 text-white font-bold py-2 md:py-3 px-4 rounded-lg md:rounded-xl transition-all shadow-lg shadow-green-500/30 flex items-center justify-center"
                    >
                      Cadastrar
                    </button>
                  </form>
                </div>
              )}

              <div
                className={`flex-1 flex flex-col min-h-0 rounded-2xl md:rounded-3xl shadow-sm border overflow-hidden transition-colors duration-300 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300 shadow-xl shadow-gray-200/50"}`}
              >
                <div
                  className={`p-3 md:p-5 border-b shrink-0 flex justify-between items-center ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-300 bg-gray-50"}`}
                >
                  <h3 className="text-sm md:text-lg font-bold flex items-center">
                    <User className="mr-2 text-blue-500" size={20} /> Membros
                    Cadastrados
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-bold ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-600"}`}
                  >
                    Total: {members.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y transition-colors duration-300">
                  <div className="min-w-[600px] md:min-w-0">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-4 md:p-5 transition-colors ${darkMode ? "border-gray-700 hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 w-1/2">
                          <img
                            src={member.photo}
                            alt={member.name}
                            onError={(e) => {
                              // Fallback automático caso o serviço principal falhe
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(member.name)}`;
                            }}
                            className={`w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full object-cover ${member.isModerador ? "border-[3px] border-orange-500" : darkMode ? "border-2 border-gray-600" : "border-2 border-gray-300"}`}
                          />
                          <div className="flex flex-col">
                            <p className="font-bold text-sm md:text-md flex items-center">
                              {member.name}
                              {member.isOnline && (
                                <span
                                  className="ml-2 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]"
                                  title="Online agora"
                                ></span>
                              )}
                              {member.isModerador && (
                                <Shield
                                  size={12}
                                  className="ml-2 text-orange-500"
                                />
                              )}
                            </p>
                            <div
                              className={`flex flex-col text-xs md:text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              <span>{member.email}</span>
                              <span className="text-[10px] md:text-[11px] font-medium opacity-80 mt-0.5">
                                {member.isOnline ? (
                                  <span className="text-green-600 dark:text-green-400">
                                    Ativo agora
                                  </span>
                                ) : (
                                  <span>
                                    Visto por último: {member.lastSeen}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4 md:space-x-6">
                          {currentUser?.isModerador ? (
                            <>
                              <div className="relative">
                                <select
                                  value={member.mainRole}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLSelectElement>,
                                  ) =>
                                    handleUpdateMemberRole(
                                      member.email,
                                      "mainRole",
                                      e.target.value,
                                    )
                                  }
                                  className={`appearance-none text-[10px] md:text-sm px-2 md:px-3 py-1 md:py-1.5 pr-6 md:pr-8 rounded-lg border focus:ring-2 focus:ring-orange-500 outline-none ${darkMode ? "bg-gray-900 border-gray-600 text-gray-200" : "bg-gray-50 border-gray-300"}`}
                                >
                                  <option value="">Sem Função Especial</option>
                                  <option value="Piloto">Piloto</option>
                                  <option value="Engenheiro de Prova">
                                    Engenheiro de Prova
                                  </option>
                                </select>
                                <ChevronDown
                                  size={14}
                                  className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? "text-gray-400" : "text-gray-500"}`}
                                />
                              </div>

                              <label className="flex items-center space-x-1.5 md:space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={member.isModerador}
                                  onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                  ) =>
                                    handleUpdateMemberRole(
                                      member.email,
                                      "isModerador",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500 rounded focus:ring-orange-500"
                                />
                                <span
                                  className={`text-[10px] md:text-sm font-semibold ${member.isModerador ? "text-orange-500" : darkMode ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Mod
                                </span>
                              </label>

                              <button
                                onClick={() => handleRemoveMember(member.email)}
                                disabled={member.email === currentUser.email}
                                className="p-1.5 md:p-2 text-red-500 hover:bg-red-500/10 hover:text-red-600 rounded-lg md:rounded-xl transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                title={
                                  member.email === currentUser.email
                                    ? "Você não pode remover a si mesmo"
                                    : "Remover Membro"
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center space-x-2 md:space-x-3">
                              {member.mainRole && (
                                <span
                                  className={`px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full ${darkMode ? "bg-blue-900/40 text-blue-400 border border-blue-800" : "bg-blue-100 text-blue-700 border border-blue-200"}`}
                                >
                                  {member.mainRole}
                                </span>
                              )}
                              {member.isModerador && (
                                <span
                                  className={`px-3 py-1 md:px-4 md:py-1.5 text-[10px] md:text-xs font-bold rounded-full ${darkMode ? "bg-orange-900/40 text-orange-400 border border-orange-800" : "bg-orange-100 text-orange-700 border border-orange-200"}`}
                                >
                                  Moderador
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {members.length === 0 && (
                    <div className="p-10 text-center text-gray-500 font-medium">
                      Nenhum membro cadastrado.
                    </div>
                  )}
                </div>
              </div>
              {/* #endregion */}
            </div>
  );
}
