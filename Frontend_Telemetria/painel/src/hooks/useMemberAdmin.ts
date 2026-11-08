import type { Dispatch, SetStateAction } from "react";
import React, { useState } from "react";
import { generateNameFromEmail } from "../utils/format";
import { supabase } from "../lib/supabase";
import type { Member } from "../types/member";

export function useMemberAdmin(members: Member[], setMembers: Dispatch<SetStateAction<Member[]>>) {
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberIsMod, setNewMemberIsMod] = useState(false);


  // Função para a adição de membros usando a pagina
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    // 1. Salva o novo usuário no Supabase
    const { data, error } = await supabase
      .from("usuarios_autorizados")
      .insert([
        {
          email: newMemberEmail,
          tipo_acesso: newMemberRole,
          eh_moderador: newMemberIsMod,
        },
      ])
      .select() // Retorna a linha criada (importante para pegar o ID gerado pelo banco)
      .single();

    if (error) {
      alert("Erro ao adicionar membro: " + error.message);
      return;
    }

    // 2. Atualiza a tela imediatamente usando o ID real que veio do banco
    if (data) {
      const generatedName = generateNameFromEmail(data.email);

      setMembers([
        ...members,
        {
          id: data.id,
          email: data.email,
          name: generatedName,
          mainRole: data.tipo_acesso || "",
          isModerador: data.eh_moderador || false,
          photo: `https://ui-avatars.com/api/?name=${encodeURIComponent(generatedName)}&background=random&color=fff`,
          isOnline: false,
          lastSeen: "nunca",
        },
      ]);
    }

    // 3. Limpa os campos
    setNewMemberEmail("");
    setNewMemberRole("");
    setNewMemberIsMod(false);
  };

  // Função para remoção de membros usando a pagina
  const handleRemoveMember = async (email: string) => {
    const { error } = await supabase
      .from("usuarios_autorizados")
      .delete()
      .eq("email", email);

    if (error) {
      alert("Erro ao remover membro: " + error.message);
      return;
    }

    setMembers(members.filter((m) => m.email !== email));
  };

  // Função para a alteração do "tipo" de membro usando a pagina
  const handleUpdateMemberRole = async (
    email: string,
    field: keyof Member,
    value: string | boolean,
  ) => {
    // 1. Descobre qual coluna do Supabase precisa ser alterada
    const colunaSupabase =
      field === "mainRole" ? "tipo_acesso" : "eh_moderador";

    // 2. Manda o Supabase atualizar a linha correspondente a este e-mail
    const { error } = await supabase
      .from("usuarios_autorizados")
      .update({ [colunaSupabase]: value })
      .eq("email", email);

    if (error) {
      alert("Erro ao atualizar cargo: " + error.message);
      return;
    }

    // 3. Se o banco atualizou com sucesso, muda na tela
    setMembers(
      members.map((m) => (m.email === email ? { ...m, [field]: value } : m)),
    );
  };
  return {
    newMemberEmail,
    setNewMemberEmail,
    newMemberRole,
    setNewMemberRole,
    newMemberIsMod,
    setNewMemberIsMod,
    handleAddMember,
    handleRemoveMember,
    handleUpdateMemberRole,

  };
}

export type UseMemberAdmin = ReturnType<typeof useMemberAdmin>;
