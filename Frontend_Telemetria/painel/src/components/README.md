# `components/` — parte visual

Componentes React do painel, separados por função:

| Pasta | O que são | Exemplos |
|---|---|---|
| [`screens/`](./screens) | Telas que ocupam a janela inteira, sem menu | Login, carregando, acesso negado, Modo Piloto |
| [`views/`](./views) | Uma por aba do menu lateral | Resumo, Baterias, Mapa, Análise... |
| [`layout/`](./layout) | A moldura fixa do painel | Menu lateral, cabeçalho |
| [`overlays/`](./overlays) | Janelas e avisos que aparecem por cima da tela | Finalizar gravação, gravações salvas, avisos |

Também há o arquivo `icons.tsx`, com ícones próprios que a biblioteca `lucide-react` não tem: `SteeringWheelIcon` (volante, usado no Modo Piloto) e `GoogleIcon` (botão de login).

## Regras do projeto

- Os componentes **não têm lógica de dados**. Eles recebem tudo por props, vindas dos [hooks](../hooks/README.md) através do `App.tsx`.
- Cada componente declara só o que usa: `type Props = Pick<AppContext, "darkMode" | "battery" | ...>`. Isso mostra, olhando o topo do arquivo, de quais dados ele depende.
- O modo escuro é controlado pela prop `darkMode`; as classes do Tailwind trocam conforme o valor.
