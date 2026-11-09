import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Member } from "../types";
import { gerarNomeDoEmail } from "../utils/format";

interface AuthCtx {
  user: Member | null;
  loading: boolean;
  erro: string | null;
  podeEditar: boolean; // moderador ou "Membro"
  podeExcluir: boolean; // somente moderador
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarPerfil = useCallback(async (session: Session | null) => {
    if (!session?.user?.email) {
      setUser(null);
      setLoading(false);
      return;
    }
    const u = session.user;

    const { data, error } = await supabase
      .from("usuarios_autorizados")
      .select("id, email, eh_moderador, tipo_acesso")
      .eq("email", u.email)
      .maybeSingle();

    if (error || !data) {
      setErro("Você não possui acesso a essa aplicação! Contate um moderador.");
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      return;
    }

    setErro(null);
    setUser({
      id: data.id,
      email: u.email!,
      name: u.user_metadata?.full_name || gerarNomeDoEmail(u.email!),
      mainRole: data.tipo_acesso || "",
      isModerador: data.eh_moderador || false,
      photo: u.user_metadata?.avatar_url || "",
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // O evento INITIAL_SESSION já cobre a sessão existente ao carregar a página
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      if (evento === "TOKEN_REFRESHED") return;
      // setTimeout evita travar o cliente do Supabase ao fazer chamadas dentro do callback
      setTimeout(() => void carregarPerfil(session), 0);
    });
    return () => data.subscription.unsubscribe();
  }, [carregarPerfil]);

  const loginGoogle = async () => {
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setErro("Não foi possível iniciar o login com o Google.");
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const podeEditar = !!user && (user.isModerador || (user.mainRole !== "" && user.mainRole !== "Trainee"));
  const podeExcluir = !!user?.isModerador;

  return (
    <Ctx.Provider value={{ user, loading, erro, podeEditar, podeExcluir, loginGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
