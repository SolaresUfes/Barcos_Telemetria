# `components/screens/` — telas inteiras

Telas que ocupam a janela toda, sem menu lateral nem cabeçalho. O `App.tsx` escolhe qual mostrar nesta ordem:

| Arquivo | Quando aparece | O que faz |
|---|---|---|
| `LoadingScreen.tsx` | Enquanto o app verifica se já existe sessão aberta | Tela de carregamento |
| `LoginScreen.tsx` | Usuário não está logado | Botão "Entrar com Google" e animação de desbloqueio |
| `AccessDeniedScreen.tsx` | Logou, mas não tem cargo e não é moderador | Avisa "Acesso Negado" e oferece sair |
| `PilotMode.tsx` | Usuário ativou o Modo Piloto no cabeçalho | Tela grande e simples para pilotar: bateria, velocidade e potência, mapa opcional e alerta piscando quando a bateria fica abaixo de 15 % |

Se nenhuma dessas condições se aplica, o app mostra o painel normal (menu lateral + aba ativa).
