# `components/views/` — abas do painel

Cada arquivo é uma aba do menu lateral. O mapa "nome da aba → componente" fica em `VIEWS`, no `App.tsx`.

| Arquivo | Aba | O que mostra |
|---|---|---|
| `SummaryView.tsx` | **Resumo** | Visão geral: potência atual, % da bateria, maior/menor tensão de célula e desbalanceamento, correntes, strings solares e eficiências estimadas |
| `BatteriesView.tsx` | **Baterias** | As 16 células com tensão (barra de 3,0 V a 4,2 V) e temperatura, desbalanceamento e temperatura média |
| `MapView.tsx` | **Mapa** | Rastreamento GPS (site `dsb-rastreio` embutido), com tela cheia |
| `AnalysisView.tsx` | **Análise** | Gráficos de tensão, potências, correntes, velocidade e bateria; cartões de potência, taxa de carga/descarga e tempo para 100 %; sobreposição de séries; impressão |
| `PowerView.tsx` | **Potência** | Consumo, velocidade, bateria e tempo estimado de autonomia |
| `LogsView.tsx` | **Logs de Dados** | Iniciar e finalizar a gravação de uma prova, retomar rascunho e abrir a lista de gravações salvas |
| `DiaryView.tsx` | **Diário de Bordo** | Anotações da equipe (título, texto, autor, data). Ficam salvas só no navegador |
| `SettingsView.tsx` | **Configurações** | Lista da equipe, quem está online e, para moderadores, adicionar, remover e alterar cargos |

Os itens **Backend** e **Cronômetro** do menu não são abas: abrem outros sites em uma nova guia (definidos no `Sidebar.tsx`).

## Adicionando uma aba

1. Crie o arquivo aqui, com `type Props = Pick<AppContext, ...>`.
2. Registre-o em `VIEWS` no `App.tsx`.
3. Adicione o item em `layout/Sidebar.tsx`, com o mesmo nome usado em `VIEWS`.
