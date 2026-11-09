import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Member } from "../types";
import { avatarPorEmail, gerarNomeDoEmail } from "../utils/format";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

export function useMembros() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [membros, setMembros] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    const { data, error } = await supabase
      .from("usuarios_autorizados")
      .select("id, email, tipo_acesso, eh_moderador")
      .order("email");
    if (error) {
      toast("Erro ao carregar a equipe: " + error.message, "erro");
      setLoading(false);
      return;
    }
    setMembros(
      (data ?? []).map((m) => ({
        id: m.id,
        email: m.email,
        name: gerarNomeDoEmail(m.email),
        mainRole: m.tipo_acesso || "",
        isModerador: m.eh_moderador || false,
        // Sua foto real do Google; para os demais, um avatar gerado a partir do e-mail
        photo: user && m.email === user.email && user.photo ? user.photo : avatarPorEmail(m.email),
      })),
    );
    setLoading(false);
  }, [toast, user]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const adicionar = async (email: string, cargo: string, ehModerador: boolean) => {
    const { error } = await supabase
      .from("usuarios_autorizados")
      .insert([{ email: email.trim().toLowerCase(), tipo_acesso: cargo, eh_moderador: ehModerador }]);
    if (error) {
      toast("Erro ao adicionar membro: " + error.message, "erro");
      return false;
    }
    toast("Membro cadastrado!");
    await carregar();
    return true;
  };

  const atualizar = async (email: string, campos: { tipo_acesso?: string; eh_moderador?: boolean }) => {
    const { error } = await supabase.from("usuarios_autorizados").update(campos).eq("email", email);
    if (error) {
      toast("Erro ao atualizar: " + error.message, "erro");
      return;
    }
    await carregar();
  };

  const remover = async (email: string) => {
    const { error } = await supabase.from("usuarios_autorizados").delete().eq("email", email);
    if (error) {
      toast("Erro ao remover: " + error.message, "erro");
      return;
    }
    toast("Membro removido.", "aviso");
    await carregar();
  };

  return { membros, loading, adicionar, atualizar, remover };
}
