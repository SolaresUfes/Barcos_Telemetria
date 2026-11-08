import { useState, useEffect } from "react";
import { generateNameFromEmail } from "../utils/format";
import { supabase } from "../lib/supabase";
import type { Member } from "../types/member";

export function useAuth() {
    //  ================================ 
    //  1. ESTADOS INICIAIS
    //  ================================
        // #region Estados Iniciais
        // Estados de Login
        const [isLogged,                 setisLogged] = useState(false);                      // Indica se usuário está logado ou não
        const [isLoggingIn,           setIsLoggingIn] = useState(false);                      // Indica se está em modo de fazer login ou não
        const [isLoadingSession, setIsLoadingSession] = useState(true);                       // Indica se a tela de carregamento está ativa ou não
        // Estados de membro
        const [members,                   setMembers] = useState<Member[]>([]);               // Inicia a lista de usuários do site vazia
        const [currentUser,           setCurrentUser] = useState<Member | null>(null);        // Inicia sem um membro específico
        // Estado de animação
        const [showUnlockAnim,     setShowUnlockAnim] = useState(false);                      // Controla a animação de cadeado abrindo (não tem funcionado, tenho que consertar)
        // #endregion

    //  ================================
    //  2. VERIFICAÇÃO DE SESSÃO
    //  ================================
        // #region Verificação de Sessão
        useEffect(() => {
            // Função pra verificar se o usuário já estava logado antes quando entrou no site
            async function checkInitialSession() {
                // Tenta verificar a sessão  
                try {
                    // Faz uma requisição ao supabase pedindo o valor do atributo "session" contido em "data" no objeto retornado pela função
                    const { data: { session } } = await supabase.auth.getSession();
                    
                    // Se retornar alguma coisa, verifica a sessão pra extrair os dados do login
                    if (session) {
                        await verificarLogin();
                    }

                    // Se não retornar nada, encerra a tela de carregamento
                    else {
                        setIsLoadingSession(false);
                    }
                } 
                
                // Se houver erro durante o try, ele é salvo em "err" e o erro é mostrado no console
                catch (err) {
                    console.error("Erro ao verificar sessão:", err);
                } 
                
                // Depois de checar o login e tratar os erros que houverem, encerra a tela de carregamento
                finally {
                    setIsLoadingSession(false);
                }
            } 
            
            checkInitialSession();
        }, []);
        // #endregion

    //  ================================
    //  3. AUTENTICAÇÃO
    //  ================================
        // #region Autenticação
        // 1. Inicia o processo de autenticação (abre a janelinha pra escolhar a conta e executa o login com a função debaixo)
        async function loginGoogle() {

            // Extrai a propriedade error dentro do objeto que a função retorna
            const { error } = await supabase.auth.signInWithOAuth({provider: "google"});

            // Se houver erros, error != null e imprime uma caixa de aviso na tela
            if (error) {
                alert("Deu ruim!");
            }

            // Com erros ou não, executa a próxima rotina
            verificarLogin();
        }

        // 2. Da conta de login escolhida no passo anterior, se tudo der certo, cria o objeto usuário e concede o login
        async function verificarLogin() {
            // 1. Tenta fazer o processo 
            try {
                // 1. Da conta de login escolhida no passo anterior, extraimos o usuário
                const { data: { user } } = await supabase.auth.getUser();

                // 2. Se o usuário extraído retornar um valor inválido, encerra a tela de login
                if (!user) {
                    console.log("Erro no usuário")
                    setIsLoadingSession(false);
                    return;
                }

                // 3. Do banco de dados do supabase, procura na tabela usuarios_autorizados se há alguém com o email extraido pelo .getUser
                const { data, error } = await supabase
                    .from("usuarios_autorizados")
                    .select("id, email, eh_moderador, tipo_acesso")
                    .eq("email", user.email)
                    .single();
                    // 'tipo_acesso': admin ou nao
                    // 'eh_moderador': moderador ou nao

                // 4. Se houver erro ou se o objeto "data" retornado pelo await supabase estiver vazio, desfaz a tentativa de login, encerra a tela de carregamento e termina a função aqui
                if (error || !data) {
                    alert("Você não possui acesso a essa aplicação!");
                    await supabase.auth.signOut();
                    setIsLoadingSession(false);
                    return;
                }

                // 5. Se deu tudo certo até aqui, o estado de logando se torna verdadeiro
                setIsLoggingIn(true);

                // 6. Pega o nome e a foto da conta do google escolhida
                const googleName = user.user_metadata.full_name || generateNameFromEmail(user.email || "");
                const googlePhoto = user.user_metadata.avatar_url || "";

                // 7. Cria uma variável chamada loggedMember que tem o formato "Member" e recebe os dados que acabamos de ler do login do google
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

                // 8. Altera os useStates 
                setCurrentUser(loggedMember);   // O usuário atual se torna o loggedMember
                setShowUnlockAnim(true);        // Inicia a animação do cadeado (que não tá funfando)
                setIsLoggingIn(false);          // Como terminamos o processo de login, encerramos o estado de "logando"
                //Um micro atraso só pra aparecer a animação do cadeado
                setTimeout(() => {
                    setisLogged(true);          // Usuário finalmente logado
                }, 500);

                // 9. Carrega a equipe em segundo plano ou aguarda
                await buscarEquipe();
            }

            // 2. Se der erro, roda no console
            catch (err) {
                console.error("Erro ao verificar login:", err);
            } 
            
            // 3. Finaliza a tela de carregamento
            finally {
                setIsLoadingSession(false);
            }
        }

        // 3. Encerra a sessão e sai da conta
        async function logoutGoogle() {
            await supabase.auth.signOut();  // Encerra a sessão do usuario
            setisLogged(false);             // Torna o estado de "Logado" falso
            window.location.reload();       // Recarrega a página (F5) pra voltar pra tela de login
            alert("Log Out concluido!");    // Avisa que deslogou (tenho que trocar, esses alerts são muito feios)
        }
        // #endregion
    
    //  ================================
    //  4. GERAÇÃO DE EQUIPE
    //  ================================
        // #region Geração de Equipe
        // Monta a equipe
        async function buscarEquipe() {
            // 1. Extrai do banco de dados as informações dos usuários cadastrados
            const { data, error } = await supabase
                .from("usuarios_autorizados")
                .select("id, email, tipo_acesso, eh_moderador");

            // 2. Se o objeto erro não for nulo, avisa que deu merda
            if (error) {
                console.error("Erro ao carregar a equipa:", error);
                return;
            }

            // 3. Se o objeto data contiver valores válidos, cria a equipe de trabalho que tá sendo mostrada lá nas configurações
            if (data) {
                // "Para cada item dentro do array de membros, faça as seguintes definições e coloque em equipedDoBanco: "
                const equipeDoBanco: Member[] = data.map((m) => {
                    // nome vai receber o que tem à esquerda do @ picotado
                    const nome = generateNameFromEmail(m.email);
                    
                    // se existe um usuário logado, o e-mail do membro da lista é igual ao dele e ele tem uma foto...
                    const fotoFinal = (currentUser && m.email === currentUser.email && currentUser.photo)
                        ? currentUser.photo                                                                     // ...então use a foto dele.
                        : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(m.email)}`;        // ...se não use o deseinho

                    // retorna os dados do membro da equipe para dentro do Member[]
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

                // 4. Muda o useState para os membros encontrados
                setMembers(equipeDoBanco);
            }
        }
        // #endregion
    
    //  ================================
    //  5. RETORNO DO HOOK
    //  ================================
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

// Cria e exporta um tipo chamado UseAuth, que corresponde ao tipo de valor retornado pela função useAuth
export type UseAuth = ReturnType <typeof useAuth>;