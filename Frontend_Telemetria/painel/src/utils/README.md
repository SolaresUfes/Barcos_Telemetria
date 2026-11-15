# `utils/` — funções de apoio

Funções simples, sem estado e sem React: recebem valores e devolvem valores.

| Arquivo | O que faz |
|---|---|
| `deriveMetrics.ts` | Calcula tudo o que deriva da telemetria: taxa de carga/descarga da bateria, tempo para 100 %, desbalanceamento de células, temperatura média, eficiências estimadas (painel, motor, bateria), autonomia e nome do perfil do usuário. É chamada a cada renderização no `App.tsx` |
| `batteryAutonomy.ts` | Estimativa de autonomia: energia restante ÷ potência média recente. Guarda os parâmetros da bateria (capacidade de referência de 1996,8 Wh, janela de 60 leituras, potência mínima de 5 W) |
| `chartGeometry.ts` | Transforma listas de números em pontos de linha SVG para desenhar os gráficos (escala fixa, automática, e variação de 0 a 100 % para a bateria) |
| `format.ts` | `generateNameFromEmail` (transforma `nome.sobrenome@...` em "Nome Sobrenome") e `formatTimer` (segundos em `mm:ss` ou `hh:mm:ss`) |
| `sound.ts` | `tocarSomSuave`: toca um som curto quando chega um cutucão |

Para mudar os parâmetros físicos da bateria (capacidade, janela de média), edite `batteryAutonomy.ts`.
