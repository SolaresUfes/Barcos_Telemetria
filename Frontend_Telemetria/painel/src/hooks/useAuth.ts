import { useState, useEffect } from "react";
import { generateNameFromEmail } from "../utils/format";
import { supabase } from "../lib/supabase";
import type { Member } from "../types/member";

export function useAuth() {
  const [isLogged, setisLogged] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [members, setMembers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);

  const [showUnlockAnim, setShowUnlockAnim] = useState(false);

  // Verifica a sessão automaticamente assim que o app carrega
  useEffect(() => {
    async function checkInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Se já tem sessão, roda a lógica de verificação e libera o acesso
          await verificarLogin();
        }
        else {
          // Se NÃO tem sessão, encerra o carregamento imediatamente para mostrar a tela de login
          setIsLoadingSession(false);
        }

      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
      } finally {
        // Terminou de checar (com ou sem sessão), então tira a tela de "carregando"
        setIsLoadingSession(false);
      }
    }

    checkInitialSession();
  }, []);

  async function loginGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      alert("Deu ruim!");
    }

    verificarLogin();
  }

  async function verificarLogin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoadingSession(false);
        return;
      }

      // 1. Busca o acesso e as permissões no banco de dados
      // Importante: 'tipo_acesso' - admin ou nao; 'eh_moderador' - moderador ou nao
      const { data, error } = await supabase
        .from("usuarios_autorizados")
        .select("id, email, eh_moderador, tipo_acesso")
        .eq("email", user.email)
        .single();

      if (error || !data) {
        alert("Você não possui acesso a essa aplicação!");
        await supabase.auth.signOut();
        setIsLoadingSession(false);
        return;
      }

      setIsLoggingIn(true);

      // 2. Coleta os dados do perfil diretamente do Google
      const googleName =
        user.user_metadata.full_name || generateNameFromEmail(user.email || "");
      const googlePhoto = user.user_metadata.avatar_url || "";

      // 3. Monta o objeto usando a interface Member
      const loggedMember: Member = {
        id: data.id,
        email: user.email!,
        name: googleName,
        mainRole: data.tipo_acesso || "",
        isModerador: data.eh_moderador || false,
        photo: googlePhoto,
        isOnline: true,
        lastSeen: "agora",
      };

      // 4. Aplica o usuário no sistema e libera a tela
      setCurrentUser(loggedMember);
      setShowUnlockAnim(true);
      setIsLoggingIn(false);
      setisLogged(true);

      // Atrasa a liberação do painel em 1.5 segundos para a animação brilhar
      setTimeout(() => {
        setisLogged(true);
      }, 1500);

      // Carrega a equipe em segundo plano ou aguarda
      await buscarEquipe();
    } catch (err) {
      console.error("Erro ao verificar login:", err);
    } finally {
      // GARANTE que a tela de loading vai sumir independentemente do que aconteça
      setIsLoadingSession(false);
    }
  }

  async function logoutGoogle() {
    await supabase.auth.signOut();
    setisLogged(false);
    window.location.reload();
    alert("Log Out concluido!");
  }

async function buscarEquipe() {
    const { data, error } = await supabase
      .from("usuarios_autorizados")
      .select("id, email, tipo_acesso, eh_moderador");

    if (error) {
      console.error("Erro ao carregar a equipa:", error);
      return;
    }

    if (data) {
      const equipeDoBanco: Member[] = data.map((m) => {
        const nome = generateNameFromEmail(m.email);
        
        // Se for o teu utilizador atual, mantém a tua foto real do Google. 
        // Para os restantes, gera um avatar ilustrado único baseado no e-mail deles.
        const fotoFinal = (currentUser && m.email === currentUser.email && currentUser.photo)
          ? currentUser.photo
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.email)}`;

        return {
          id: m.id,
          email: m.email,
          name: nome,
          mainRole: m.tipo_acesso || "",
          isModerador: m.eh_moderador || false,
          photo: fotoFinal,
          isOnline: false,
          lastSeen: "offline",
        };
      });

      setMembers(equipeDoBanco);
    }
  }
  
  return {
    isLogged,
    setisLogged,
    isLoggingIn,
    setIsLoggingIn,
    isLoadingSession,
    setIsLoadingSession,
    members,
    setMembers,
    currentUser,
    setCurrentUser,
    showUnlockAnim,
    setShowUnlockAnim,
    loginGoogle,
    verificarLogin,
    logoutGoogle,
    buscarEquipe,

  };
}

export type UseAuth = ReturnType<typeof useAuth>;
