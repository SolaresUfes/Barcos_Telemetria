# `components/overlays/` — janelas e avisos

Elementos que aparecem **por cima** da tela atual. Todos são montados no final do `App.tsx` e só aparecem quando o estado correspondente está ativo.

| Arquivo | O que é |
|---|---|
| `FinalizeModal.tsx` | Janela ao finalizar uma gravação: dar nome à prova e salvar, deixar como rascunho ou descartar (com confirmação) |
| `SavedRunsModal.tsx` | Lista das provas salvas no Supabase: renomear, apagar, baixar CSV e imprimir gráficos |
| `ExpandedGraphModal.tsx` | Gráfico ampliado em tela cheia, com as marcações da prova em andamento |
| `OverlayModal.tsx` | Sobreposição de séries: escolhe vários gráficos para ver juntos no mesmo eixo |
| `InfoModal.tsx` | Janela de explicação sobre uma métrica (título, descrição e cor) |
| `OnlineMenu.tsx` | Menu de quem está online, com o botão **Cutucar** |
| `PokeNotice.tsx` | Aviso que aparece para quem recebeu um cutucão (acompanhado de um som) |
| `Toast.tsx` | Mensagens rápidas de sucesso, aviso e erro |
