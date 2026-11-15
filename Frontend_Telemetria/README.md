# Frontend de Telemetria — Painel Solares

Site que mostra, em tempo real, os dados do barco solar da equipe Solares (UFES): bateria, células, potências, velocidade e posição GPS. Também grava provas, guarda o histórico e permite que a equipe analise o desempenho depois.

O código do site está na pasta [`painel/`](./painel). Este README explica **o que o site faz e como ele se encaixa no sistema**. Para detalhes de código (estrutura de pastas, hooks, como criar uma aba nova), veja o [README do painel](./painel/README.md).

---

## Para que serve

Durante uma prova, o barco envia medições continuamente. O painel permite à equipe:

- **acompanhar** bateria, potência, corrente, velocidade e temperatura das células ao vivo;
- **gravar** o trecho de uma prova (início → fim), dar um nome e consultar depois;
- **analisar** gráficos da prova, sobrepor séries e imprimir;
- **organizar** a equipe (quem acessa, quem é piloto, quem é moderador) e ver quem está online;
- **pilotar** com uma tela simplificada, grande e legível, com alerta de bateria baixa.

---

## Como os dados chegam ao site

```
ESP32 no barco ──HTTP POST──▶ Backend (Vercel) ──┬─▶ Redis (Upstash): última leitura
 (BMS + sensores)             Backend_Telemetria  └─▶ Supabase: histórico (medicoes, celulas, alertas)
                                      ▲
                                      │ GET /api/sensores/ultimo  e  /api/celulas/ultimo
                                      │ (consulta a cada 500 ms)
                                 Este painel ◀──── Supabase: login Google, equipe, provas gravadas, presença online
```

- **Dados ao vivo:** o painel consulta o [backend](../Backend_Telemetria) duas vezes por segundo e atualiza a tela.
- **Login, equipe e provas:** ficam no Supabase (login com Google, tabelas `usuarios_autorizados` e `estado_prova`, canal de presença em tempo real).
- **Mapa:** é um site separado (`dsb-rastreio`) embutido por iframe.

---

## O que tem no site

### Abas do painel de engenharia

| Aba | O que mostra |
|---|---|
| **Resumo** | Visão geral: potência atual, % da bateria, maior/menor tensão de célula e desbalanceamento, correntes, strings solares e eficiências estimadas (painel, motor, bateria). |
| **Baterias** | As 16 células: tensão (barra de 3,0 V a 4,2 V) e temperatura de cada uma, desbalanceamento e temperatura média (fica vermelha acima de 45 °C). |
| **Mapa** | Rastreamento GPS (embutido), com tela cheia. |
| **Análise** | Gráficos de tensão, potências, correntes, velocidade e bateria; cartões de potência (painéis, bateria, motor), taxa de carga/descarga no último minuto, tempo estimado para 100 %, sobreposição de séries, gráfico ampliado e impressão. |
| **Potência** | Consumo, velocidade, bateria e tempo estimado de autonomia. |
| **Logs de Dados** | Iniciar/finalizar gravação de prova, rascunhos, lista de gravações salvas (renomear, apagar, baixar CSV, imprimir gráficos). |
| **Diário de Bordo** | Anotações da equipe (título, texto, autor e data). |
| **Configurações** | Cadastro e permissões da equipe (apenas moderadores editam). |

No menu lateral há ainda atalhos para o **Backend** (painel de diagnóstico) e para o **Cronômetro** (outro site da equipe).

### Recursos extras

- **Modo Piloto:** tela simplificada em tela cheia, com opção de mapa e aviso piscando quando a bateria fica abaixo de 15 %.
- **Gravação de provas:** continua após recarregar a página (o início fica salvo no navegador). Ao finalizar, a prova pode ser salva com nome, virar rascunho ou ser descartada.
- **Exportação:** CSV da gravação atual e CSV de provas antigas (busca no Supabase pelo intervalo da prova).
- **Autonomia da bateria:** estimada pela energia restante (referência de 1996,8 Wh = 2 × 12,8 V × 78 Ah) dividida pela potência média das últimas 60 leituras (cerca de 30 s, com a consulta a cada 500 ms).
- **Equipe online:** lista de quem está com o painel aberto e botão **Cutucar**, que envia um aviso sonoro a um colega.
- **Modo escuro/claro** e manifest para adicionar o site à tela inicial do celular.

### Permissões

O acesso é por e-mail do Google. Só entra quem estiver cadastrado em `usuarios_autorizados`.

| Perfil | Como é definido | O que pode |
|---|---|---|
| Sem acesso | e-mail não cadastrado | Login é recusado. |
| Cadastrado sem função e sem ser moderador | `tipo_acesso` vazio | Vê a tela "Acesso Negado". |
| **Piloto** / **Engenheiro de Prova** | campo `tipo_acesso` | Usa o painel. |
| **Moderador** | `eh_moderador = true` | Tudo acima + adiciona, remove e altera cargos da equipe. |

---

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) 20.19+ (ou 22.12+), exigência do Vite 7.

```bash
cd Frontend_Telemetria/painel
npm install
cp .env.example .env.local   # Windows (PowerShell): copy .env.example .env.local
# edite o .env.local com as chaves do Supabase (veja abaixo)
npm run dev               # abre em http://localhost:5173
```

### Variáveis de ambiente

| Variável | Para que serve |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase (Project Settings → API) |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` do mesmo lugar |

> Use apenas a chave **anon**. Nunca coloque a `service_role` em variáveis `VITE_*`: elas vão para o navegador.

### Configuração do Supabase

1. **Authentication → Providers → Google:** ative e informe o Client ID/Secret do Google Cloud.
2. **Authentication → URL Configuration:** coloque `http://localhost:5173` como *Site URL* e adicione a URL de produção em *Redirect URLs*.
3. **Tabelas usadas pelo painel** (o schema ainda não está versionado no repositório; as colunas abaixo foram levantadas a partir do código):

| Tabela | Colunas usadas |
|---|---|
| `usuarios_autorizados` | `id`, `email`, `tipo_acesso`, `eh_moderador` |
| `estado_prova` | `id`, `nome`, `inicio`, `fim` |
| `medicoes` | `momento`, `tensao`, `corrente`, `corrente_2`, `string_1`, `string_2`, `porcentagem`, `velocidade` (preenchida pelo backend) |

4. Cadastre o primeiro moderador direto na tabela `usuarios_autorizados` (`eh_moderador = true`). Depois, o resto da equipe pode ser adicionado pela aba **Configurações**.

---

## Publicação

O site é um app estático (Vite). Na Vercel:

1. Importe o repositório e defina **Root Directory** como `Frontend_Telemetria/painel`.
2. Framework: Vite · Build: `npm run build` · Output: `dist`.
3. Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em *Environment Variables*.
4. Depois do deploy, adicione a URL final em *Redirect URLs* no Supabase.

Para testar o build localmente: `npm run build && npm run preview`.

---

## Problemas conhecidos

| Situação | Detalhe |
|---|---|
| **"Imprimir Gráficos" falha** | O botão chama `/api/sensores/historico`, rota que **não existe** no backend atual (ele só tem `/`, `/todos` e `/ultimo`). É preciso criar a rota ou trocar a chamada por consulta direta ao Supabase, como já faz o botão "Baixar CSV". |
| **URLs fixas no código** | O endereço do backend (`telemetria-be.vercel.app`) e os do mapa e do cronômetro estão escritos dentro dos componentes. Trocar de ambiente exige editar o código. Além disso, o firmware envia dados para outro endereço (`barcos-backendtelemetria.vercel.app`); confirme que os dois são o mesmo projeto. |
| **Diário de Bordo é local** | As anotações ficam no `localStorage` do navegador: não aparecem em outro aparelho nem para outros membros. |
| **Temperatura das células aparece como -2 °C** | O backend ainda não recebe temperaturas do firmware e devolve `-2` para todas. A média na aba Baterias fica errada até isso ser implementado. |
| **Alertas do BMS não aparecem** | O backend recebe e guarda alertas (`/api/alertas`), mas o painel ainda não os exibe. |
| **Intervalo de consulta** | O comentário no código diz 2 s, mas a consulta roda a cada 500 ms. |
| **Ajuste de fuso no CSV** | O download do histórico subtrai 3 h manualmente para compensar o fuso. |
| **Lint** | `npm run lint` hoje aponta 4 erros e 6 avisos (regras de hooks do React). O build funciona normalmente. |
| **Regras de segurança** | As permissões de moderador são checadas no front-end. Confirme no Supabase que as políticas RLS de `usuarios_autorizados` e `estado_prova` também as aplicam. |

---

## Tecnologias

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · Supabase (Auth, Postgres, Realtime) · lucide-react · deploy na Vercel.
