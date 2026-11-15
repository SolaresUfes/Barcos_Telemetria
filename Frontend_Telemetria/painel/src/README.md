# `src/` — código do painel

Tudo o que é código do site está aqui. Cada pasta tem seu próprio README explicando os arquivos.

| Pasta / arquivo | O que tem | Detalhes |
|---|---|---|
| [`components/`](./components) | Telas, abas, menus e janelas (a parte visual) | [README](./components/README.md) |
| [`hooks/`](./hooks) | A lógica do app: login, telemetria, gravação, equipe... | [README](./hooks/README.md) |
| [`utils/`](./utils) | Funções de cálculo e formatação, sem React | [README](./utils/README.md) |
| [`types/`](./types) | Tipos TypeScript compartilhados | [README](./types/README.md) |
| [`lib/`](./lib) | Cliente do Supabase | [README](./lib/README.md) |
| [`assets/`](./assets) | Imagens usadas pelo código | [README](./assets/README.md) |
| `App.tsx` | Junta todos os hooks, decide qual tela mostrar e qual aba está ativa | |
| `main.tsx` | Ponto de entrada: monta o `App` na página | |
| `index.css` | Importa o Tailwind CSS | |
| `App.css` | Sobra do template do Vite, não é importado por ninguém | |
| `vite-env.d.ts` | Tipos do Vite (inclui `import.meta.env`) | |

## Como as peças se conectam

```
main.tsx ─▶ App.tsx ─┬─▶ hooks/        guardam o estado e falam com o backend e o Supabase
                     ├─▶ utils/        calculam as métricas derivadas
                     └─▶ components/   recebem tudo pronto por props e só exibem
```

O `App.tsx` chama todos os hooks, junta os resultados num único objeto (`AppContext`, definido em `types/appContext.ts`) e entrega às telas. Os componentes não buscam dados por conta própria: pedem o que precisam via `Pick<AppContext, ...>`.

Para ver o que o site faz, leia o [README do Frontend](../../README.md). Para criar uma aba nova, veja o [guia do painel](../README.md#como-criar-uma-aba-nova).
