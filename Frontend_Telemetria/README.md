# Painel de Telemetria — guia do código

Código-fonte do site de telemetria. Para entender **o que o site faz**, permissões, configuração do Supabase e publicação, comece pelo [README do Frontend](../README.md). Este documento é para quem vai **mexer no código**.

## Comandos

```bash
npm install        # instala dependências
npm run dev        # servidor de desenvolvimento (http://localhost:5173)
npm run build      # gera a pasta dist/
npm run preview    # serve o build para teste
npm run lint       # ESLint
```

Crie o `.env.local` a partir do `.env.example` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## Estrutura

```
painel/
├─ index.html            título, manifest e cores do tema do celular
├─ public/               icon.svg e manifest.json (instalação como app)
└─ src/
   ├─ main.tsx           ponto de entrada
   ├─ App.tsx            monta todos os hooks, escolhe a tela e a aba ativa
   ├─ lib/supabase.ts    cliente do Supabase (lê as variáveis VITE_*)
   ├─ types/             Member, SeriesData, ToastFn e AppContext
   ├─ hooks/             um hook por área de responsabilidade (veja abaixo)
   ├─ utils/             funções puras: métricas, autonomia, formatação, geometria dos gráficos, som
   └─ components/
      ├─ screens/        telas inteiras: Login, Loading, AccessDenied, PilotMode
      ├─ views/          uma por aba: Summary, Batteries, Map, Analysis, Power, Logs, Diary, Settings
      ├─ layout/         Sidebar, Header, PrintStyles
      ├─ overlays/       modais e avisos: Finalize, SavedRuns, ExpandedGraph, Overlay, Info, OnlineMenu, Toast, PokeNotice
      └─ icons.tsx
```

## Como o app é organizado

O `App.tsx` não tem lógica própria: ele chama todos os hooks, junta o retorno de cada um num único objeto (`ctx`, do tipo `AppContext`) e o repassa por props às telas, abas e modais. Cada componente declara só o que precisa com `Pick<AppContext, ...>`.

| Hook | Responsabilidade |
|---|---|
| `useAuth` | Sessão Supabase, login Google, verificação em `usuarios_autorizados`, lista da equipe |
| `useTelemetry` | Consulta o backend a cada 500 ms e mantém os valores atuais e as séries para os gráficos |
| `useRecording` | Gravação de provas: iniciar, finalizar, rascunho, descarte, CSV; sobrevive a F5 via `localStorage` |
| `useSavedRuns` | Provas salvas em `estado_prova`: listar, renomear, apagar, baixar CSV do histórico |
| `useGraphs` | Escolhe a fonte dos gráficos (gravação ou tempo real) e controla sobreposição e ampliação |
| `usePresence` | Canal Realtime `sala_equipe`: quem está online e o "cutucão" |
| `useMemberAdmin` | Adicionar, remover e alterar cargo de membros (`usuarios_autorizados`) |
| `useDiary` | Diário de Bordo (salvo em `localStorage`) |
| `useNavigation`, `useTheme`, `useClock`, `useToast` | Aba ativa/menus, modo escuro, relógio, avisos |

`utils/deriveMetrics.ts` calcula, a cada renderização, tudo o que deriva da telemetria: taxa de carga/descarga, tempo para 100 %, desbalanceamento de células, eficiências estimadas e autonomia (`utils/batteryAutonomy.ts`).

### Fluxo de uma leitura

1. `useTelemetry` faz `GET /api/sensores/ultimo` e `GET /api/celulas/ultimo`.
2. Atualiza os valores atuais e acrescenta a leitura às séries de "tempo real" (últimos 40 pontos).
3. Se há prova em andamento, a mesma leitura também é acrescentada a `recordingData`, que alimenta a aba **Análise**.
4. `deriveMetrics` calcula os valores derivados e as telas apenas exibem.

### Formato dos dados do backend

`/api/sensores/ultimo` devolve uma lista com um objeto:

| Campo | Significado no painel |
|---|---|
| `tensao` | Tensão do pack (V) |
| `corrente` | Corrente da bateria (A) |
| `corrente_2` | Corrente do motor (A) |
| `potencia` | Potência da bateria, `tensao × corrente` (calculada no backend) |
| `string_1`, `string_2` | Correntes das strings solares |
| `porcentagem` | Carga da bateria (%) |
| `velocidade` | Velocidade (km/h) |

`/api/celulas/ultimo` devolve `{ celula: number[16], temperatura: number[16] }`.

O valor `-2` significa "sem dados" e `-1` é o estado inicial do painel; `isTelemetryActive` trata os dois.

> **Atenção aos nomes:** no código, `rpm` guarda a **potência do motor** (`tensao × corrente_2`) e `S1_power` guarda a **potência de geração** (`tensao × string_1`). O nome `rpm` é histórico.

## Como criar uma aba nova

1. Crie `src/components/views/MinhaView.tsx` recebendo as props de `AppContext` (use `Pick<AppContext, ...>`).
2. Registre em `VIEWS` no `App.tsx`: `"Minha Aba": MinhaView`.
3. Adicione o item (`{ icon, label: "Minha Aba" }`) na lista do `components/layout/Sidebar.tsx`. O `label` precisa ser **idêntico** à chave de `VIEWS`.

Se precisar de estado ou dados novos, crie um hook em `src/hooks/`, chame-o no `App.tsx`, inclua o tipo `UseMeuHook` em `types/appContext.ts` e espalhe o retorno em `ctx`.

## Pontos de atenção

- **URLs fixas:** o backend é chamado em `hooks/useTelemetry.ts` e `components/overlays/SavedRunsModal.tsx`; mapa e atalhos aparecem em `MapView.tsx`, `PilotMode.tsx` e `Sidebar.tsx`. O ideal é mover tudo para variáveis `VITE_*`.
- **Rota inexistente:** `SavedRunsModal.tsx` chama `/api/sensores/historico`, que o backend não implementa (afeta "Imprimir Gráficos").
- **Lint:** há erros de `react-hooks/set-state-in-effect` e dependências faltando em `useEffect` (ex.: `useTelemetry`).
- **Tipos soltos:** `useSavedRuns` e `SavedRunsModal` usam `any` para as provas; vale tipar `estado_prova`.
- **Bundle:** o build gera um JS único de ~536 kB. Se ficar lento no celular, considere `import()` dinâmico por aba.
