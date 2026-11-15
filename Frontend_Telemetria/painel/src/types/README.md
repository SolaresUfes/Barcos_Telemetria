# `types/` — tipos TypeScript

Definições compartilhadas entre hooks, utilitários e componentes.

| Arquivo | O que define |
|---|---|
| `member.ts` | `Member`: membro da equipe (e-mail, nome, cargo, se é moderador, foto, se está online) |
| `telemetry.ts` | `SeriesData`: as 10 séries de dados dos gráficos (tensão, potências, bateria, velocidade, correntes, strings 1 e 2) |
| `ui.ts` | Tipos dos avisos rápidos: `ToastTipo`, `ToastFn` e `ToastState` |
| `appContext.ts` | `AppContext`: junção do que todos os hooks devolvem, mais as métricas derivadas. É o tipo que os componentes usam com `Pick<AppContext, ...>` |

Ao criar um hook novo, inclua o tipo dele em `appContext.ts` para que os componentes possam usá-lo.
