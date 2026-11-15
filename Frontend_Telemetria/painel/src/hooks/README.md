# `hooks/` — a lógica do app

Cada hook cuida de **uma área** e devolve estado e funções. O `App.tsx` chama todos e entrega o resultado aos componentes.

## Dados e backend

| Hook | O que faz | Fala com |
|---|---|---|
| `useTelemetry.ts` | Consulta o backend a cada 500 ms (última medição e células) e mantém os valores atuais e as séries dos gráficos (últimos 40 pontos). Se há prova ativa, também alimenta a gravação | Backend (`/api/sensores/ultimo`, `/api/celulas/ultimo`) |
| `useRecording.ts` | Gravação de provas: iniciar, finalizar, salvar com nome, rascunho, descarte e CSV. A gravação sobrevive a F5 | Supabase (`estado_prova`) e `localStorage` |
| `useSavedRuns.ts` | Provas já salvas: listar, renomear, apagar e baixar CSV do histórico | Supabase (`estado_prova`, `medicoes`) |
| `useGraphs.ts` | Escolhe a fonte dos gráficos (gravação ou tempo real) e controla sobreposição e ampliação | — |

## Equipe e acesso

| Hook | O que faz | Fala com |
|---|---|---|
| `useAuth.ts` | Sessão, login com Google, verificação do e-mail em `usuarios_autorizados` e lista da equipe | Supabase (Auth e `usuarios_autorizados`) |
| `useMemberAdmin.ts` | Adicionar, remover e alterar cargo de membros (para moderadores) | Supabase (`usuarios_autorizados`) |
| `usePresence.ts` | Quem está online e o "cutucão" entre membros | Supabase Realtime (canal `sala_equipe`) |
| `useDiary.ts` | Anotações do Diário de Bordo | `localStorage` (só no navegador) |

## Interface

| Hook | O que faz |
|---|---|
| `useNavigation.ts` | Aba ativa, menu lateral aberto, Modo Piloto, telas cheias do mapa e menu de online |
| `useTheme.ts` | Modo escuro/claro e cor da barra do celular |
| `useClock.ts` | Relógio que atualiza a cada segundo |
| `useToast.ts` | Mensagens rápidas (`dispararToast`) |

## Convenções

- Todo hook exporta também seu tipo, no formato `UseNome = ReturnType<typeof useNome>`. Esses tipos são reunidos em `types/appContext.ts`.
- Hooks que precisam de outro recebem o que usam por parâmetro (ex.: `useDiary(currentUser, dispararToast)`), em vez de importá-lo.
- Para criar um hook novo: crie o arquivo aqui, chame-o no `App.tsx`, adicione o tipo em `types/appContext.ts` e espalhe o retorno em `ctx`.
