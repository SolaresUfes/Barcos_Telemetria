// const express = require("express");
// const router = express.Router();

// const supabase = require("../supabase")
// const buffer = require("../buffer/telemetria")

// // Rota pra envio dos dados dos sensores pro supabase.
// // Os dados da tabela de medições do supabase são: tensao | corrente
// // POST > "/api/sensores/"
// router.post("/", async (req, res) => {
//     try {
//         const dados = req.body;

//         if (dados.tensao == null || dados.corrente == null) {
//             return res.status(400).json({
//                 erro: "Dados de sensores incompletos"
//             });
//         }

//         await buffer.atualizar_ult_Sensores(dados);

//         const { error } = await supabase
//             .from("medicoes")
//             .insert(dados);

//         if (error) {
//             return res.status(500).json({
//                 erro: error.message
//             });
//         }

//         res.json({
//             status: "ok"
//         });

//     } catch (erro) {
//         console.error(erro);

//         res.status(500).json({
//             erro: "Erro interno"
//         });
//     }
// });

// // Rota para a coleta dos dados das medicoes
// // GET > "/api/sensores/"
// router.get("/", async (req, res) => {

//   const { data, error } = await supabase
//     .from("medicoes")
//     .select("*");
//   if (error) {
//     return res.status(500).json({erro: error.message})
//   }

//   res.json(data)
// });


// // Rota para coleta dos dados da ultima medição
// // GET > "/api/sensores/ultimo/"
// router.get("/ultimo", async (req, res) => {
//     try {
//         const dados = await buffer.coletar_ult_Sensores();

//         res.json(dados);

//     } catch (erro) {
//         console.error(erro);

//         res.status(500).json({
//             erro: "Erro ao obter últimos dados dos sensores"
//         });
//     }
// });


// module.exports = router;

const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const buffer = require("../buffer/telemetria");

// Rota pra envio dos dados dos sensores pro supabase.
// Os dados da tabela de medições do supabase são: tensao | corrente
// POST > "/api/sensores/"
router.post("/", async (req, res) => {
    try {
        const dados = req.body;

        if (dados.tensao == null || dados.corrente == null) {
            return res.status(400).json({
                erro: "Dados de sensores incompletos"
            });
        }

        await buffer.atualizar_ult_Sensores(dados);

        const { error } = await supabase
            .from("medicoes")
            .insert(dados);

        if (error) {
            return res.status(500).json({
                erro: error.message
            });
        }

        res.json({
            status: "ok"
        });

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro interno"
        });
    }
});

// Rota para a coleta dos dados das medicoes
// GET > "/api/sensores/todos"
router.get("/todos", async (req, res) => {

  const { data, error } = await supabase
    .from("medicoes")
    .select("*");

  if (error) {
    return res.status(500).json({ erro: error.message });
  }

  res.json(data);
});

// Rota para coleta dos dados da ultima medição
// GET > "/api/sensores/ultimo/"
router.get("/ultimo", async (req, res) => {
    try {
        const dados = await buffer.coletar_ult_Sensores();

        res.json(dados);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao obter últimos dados dos sensores"
        });
    }
});


// ============================================================
// PAINEL DE TESTE — SENSORES
//
// URL:
// /api/sensores/teste
//
// Esta página NÃO altera a lógica das três rotas acima.
// Ela apenas chama essas rotas pelo navegador para diagnóstico.
// ============================================================

router.get("/", (req, res) => {
  res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Telemetria / Sensores</title>

  <style>
    * {
      box-sizing: border-box;
    }

    :root {
      --bg: #080d14;
      --card: #101923;
      --card2: #0c141d;
      --line: rgba(148,170,195,.14);
      --text: #e9f0f8;
      --muted: #8292a6;
      --muted2: #5e6e81;
      --blue: #318cff;
      --cyan: #27c7e8;
      --green: #35df8b;
      --orange: #ff9d32;
      --red: #ff5264;
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 8% 0%, rgba(49,140,255,.12), transparent 28%),
        radial-gradient(circle at 92% 8%, rgba(39,199,232,.07), transparent 25%),
        var(--bg);
    }

    body::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px);
      background-size: 42px 42px;
      mask-image: linear-gradient(to bottom, black, transparent 85%);
    }

    .container {
      width: min(1380px, calc(100% - 40px));
      margin: 0 auto;
      padding: 28px 0 38px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(49,140,255,.35);
      border-radius: 12px;
      background: linear-gradient(145deg, rgba(49,140,255,.18), rgba(39,199,232,.07));
      color: var(--cyan);
      font-size: 20px;
      box-shadow: 0 0 28px rgba(49,140,255,.08);
    }

    h1 {
      margin: 0;
      font-size: 23px;
      letter-spacing: -.5px;
    }

    .subtitle {
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 12px;
    }

    .back {
      color: var(--muted);
      text-decoration: none;
      font-size: 11px;
      border: 1px solid var(--line);
      padding: 8px 11px;
      border-radius: 8px;
      background: rgba(255,255,255,.025);
    }

    .back:hover {
      color: var(--text);
      border-color: rgba(49,140,255,.4);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 14px;
    }

    .card {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 13px;
      background: linear-gradient(145deg, rgba(16,25,35,.94), rgba(11,18,27,.94));
      box-shadow: 0 12px 34px rgba(0,0,0,.14);
      overflow: hidden;
    }

    .span-4 { grid-column: span 4; }
    .span-6 { grid-column: span 6; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }

    .card-header {
      min-height: 48px;
      padding: 13px 16px;
      border-bottom: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .card-header h2 {
      margin: 0;
      font-size: 12px;
      letter-spacing: .35px;
    }

    .card-body {
      padding: 16px;
    }

    .badge {
      padding: 4px 7px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 850;
      letter-spacing: .5px;
    }

    .ok {
      color: var(--green);
      background: rgba(53,223,139,.08);
      border: 1px solid rgba(53,223,139,.15);
    }

    .warning {
      color: var(--orange);
      background: rgba(255,157,50,.08);
      border: 1px solid rgba(255,157,50,.15);
    }

    .error {
      color: var(--red);
      background: rgba(255,82,100,.08);
      border: 1px solid rgba(255,82,100,.15);
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 9px;
      color: var(--muted);
      font-size: 11px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 9px currentColor;
    }

    .big-status {
      display: flex;
      align-items: center;
      gap: 9px;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -.6px;
    }

    .green { color: var(--green); }
    .red { color: var(--red); }
    .orange { color: var(--orange); }
    .blue { color: #58a6ff; }
    .cyan { color: var(--cyan); }

    .muted {
      color: var(--muted);
      font-size: 11px;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      padding-top: 10px;
      margin-top: 10px;
      border-top: 1px solid var(--line);
      color: var(--muted2);
      font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
    }

    .metric {
      padding: 13px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: rgba(255,255,255,.018);
    }

    .metric-label {
      color: var(--muted2);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    .metric-value {
      margin-top: 5px;
      font-size: 21px;
      font-weight: 800;
    }

    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 9px;
    }

    button {
      border: 1px solid rgba(49,140,255,.3);
      border-radius: 8px;
      padding: 9px 13px;
      color: #dcecff;
      background: rgba(49,140,255,.10);
      cursor: pointer;
      font: 700 10px Inter, sans-serif;
      letter-spacing: .2px;
    }

    button:hover {
      background: rgba(49,140,255,.18);
      border-color: rgba(49,140,255,.55);
    }

    button:disabled {
      opacity: .5;
      cursor: wait;
    }

    button.primary {
      color: white;
      background: linear-gradient(135deg, #1e74d8, #167fbd);
      border-color: rgba(80,170,255,.5);
    }

    button.danger {
      color: #ffdce0;
      background: rgba(255,82,100,.07);
      border-color: rgba(255,82,100,.25);
    }

    .request-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-top: 13px;
    }

    .request-box {
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.018);
    }

    .request-box label {
      display: block;
      color: var(--muted2);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .6px;
      margin-bottom: 4px;
    }

    .request-box span {
      font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #c8d5e4;
    }

    textarea {
      width: 100%;
      min-height: 170px;
      resize: vertical;
      border: 1px solid var(--line);
      border-radius: 9px;
      outline: none;
      padding: 13px;
      color: #cbd8e7;
      background: #070b11;
      font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    textarea:focus {
      border-color: rgba(49,140,255,.5);
      box-shadow: 0 0 0 2px rgba(49,140,255,.08);
    }

    pre {
      margin: 0;
      max-height: 330px;
      overflow: auto;
      padding: 13px;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: #aebed0;
      background: #070b11;
      font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .response-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
      min-height: 22px;
    }

    .response-code {
      font: 800 12px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .response-time {
      color: var(--muted);
      font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .notice {
      padding: 10px 12px;
      border: 1px solid rgba(255,157,50,.16);
      border-radius: 8px;
      background: rgba(255,157,50,.045);
      color: #bfa27f;
      font-size: 10px;
      line-height: 1.5;
      margin-bottom: 12px;
    }

    .footer {
      margin-top: 18px;
      color: var(--muted2);
      font-size: 10px;
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    @media (max-width: 900px) {
      .span-4,
      .span-6,
      .span-8 {
        grid-column: span 12;
      }
    }

    @media (max-width: 650px) {
      .container {
        width: min(100% - 22px, 1380px);
        padding-top: 18px;
      }

      .header {
        align-items: flex-start;
        flex-direction: column;
      }

      .metrics,
      .request-info {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <header class="header">
      <div class="brand">
        <div class="logo">≈</div>
        <div>
          <h1>Telemetria <span class="cyan">/</span> Sensores</h1>
          <p class="subtitle">Diagnóstico das rotas de entrada, consulta e buffer dos sensores</p>
        </div>
      </div>

      <a class="back" href="/">← Painel principal</a>
    </header>

    <section class="grid">

      <article class="card span-4">
        <div class="card-header">
          <h2>ESTADO DA ROTA</h2>
          <span id="routeBadge" class="badge warning">AGUARDANDO</span>
        </div>
        <div class="card-body">
          <div id="routeStatus" class="big-status orange">
            <span class="dot"></span>
            AGUARDANDO
          </div>

          <div class="meta">
            <span>GET /api/sensores/ultimo</span>
            <span id="lastCall">—</span>
          </div>
        </div>
      </article>

      <article class="card span-8">
        <div class="card-header">
          <h2>ÚLTIMOS DADOS DO BUFFER</h2>
          <span class="badge ok">BUFFER</span>
        </div>
        <div class="card-body">

          <div class="metrics">
            <div class="metric">
              <div class="metric-label">Tensão</div>
              <div id="tensao" class="metric-value blue">—</div>
            </div>

            <div class="metric">
              <div class="metric-label">Corrente</div>
              <div id="corrente" class="metric-value orange">—</div>
            </div>

            <div class="metric">
              <div class="metric-label">Potência</div>
              <div id="potencia" class="metric-value cyan">—</div>
            </div>
          </div>

          <div class="meta">
            <span>ORIGEM: buffer/telemetria</span>
            <span id="bufferInfo">aguardando chamada</span>
          </div>

        </div>
      </article>

      <article class="card span-6">
        <div class="card-header">
          <h2>CHAMADAS GET</h2>
          <span class="badge ok">SEM ALTERAÇÃO DE DADOS</span>
        </div>

        <div class="card-body">
          <div class="button-row">
            <button class="primary" onclick="chamarUltimo()">GET ÚLTIMO</button>
            <button onclick="chamarTodos()">GET TODOS</button>
          </div>

          <div class="request-info">
            <div class="request-box">
              <label>Último</label>
              <span>/api/sensores/ultimo</span>
            </div>
            <div class="request-box">
              <label>Todos</label>
              <span>/api/sensores/todos</span>
            </div>
          </div>

          <div class="meta">
            <span id="getMethod">Nenhuma chamada</span>
            <span id="getTime">—</span>
          </div>
        </div>
      </article>

      <article class="card span-6">
        <div class="card-header">
          <h2>CHAMADA POST</h2>
          <span class="badge warning">GRAVA NO SUPABASE</span>
        </div>

        <div class="card-body">

          <div class="notice">
            Esta chamada executa a rota real <b>POST /api/sensores</b>.
            Ela atualiza o buffer e tenta inserir o objeto na tabela
            <b>medicoes</b>. Use somente quando quiser fazer um teste real.
          </div>

          <textarea id="postBody">{
  "tensao": 52.6,
  "corrente": 0
}</textarea>

          <div class="button-row" style="margin-top:10px">
            <button class="primary" onclick="enviarPost()">ENVIAR POST</button>
            <button onclick="formatarBody()">FORMATAR JSON</button>
          </div>

        </div>
      </article>

      <article class="card span-8">
        <div class="card-header">
          <h2>RESPOSTA DA ÚLTIMA CHAMADA</h2>
          <span id="responseBadge" class="badge warning">SEM CHAMADA</span>
        </div>

        <div class="card-body">

          <div class="response-status">
            <span id="responseCode" class="response-code">—</span>
            <span id="responseTime" class="response-time">—</span>
          </div>

          <pre id="response">Nenhuma requisição realizada.</pre>

        </div>
      </article>

      <article class="card span-4">
        <div class="card-header">
          <h2>ROTAS RELACIONADAS</h2>
          <span class="badge ok">API</span>
        </div>

        <div class="card-body">

          <div class="meta" style="margin-top:0">
            <span>POST</span>
            <span>/api/sensores</span>
          </div>

          <div class="meta">
            <span>GET</span>
            <span>/api/sensores/todos</span>
          </div>

          <div class="meta">
            <span>GET</span>
            <span>/api/sensores/ultimo</span>
          </div>

          <div class="meta">
            <span>DIAGNÓSTICO</span>
            <span>/api/sensores</span>
          </div>

        </div>
      </article>

    </section>

    <footer class="footer">
      <span>Barcos Telemetria • Sensor Route Diagnostic</span>
      <span id="footerTime">—</span>
    </footer>

  </main>

<script>
  const $ = (id) => document.getElementById(id);

  function agora() {
    return new Date().toLocaleTimeString("pt-BR");
  }

  function mostrarResposta(status, tempo, dados) {
    $("responseCode").textContent = status ? String(status) : "ERRO";
    $("responseTime").textContent = tempo + " ms";

    $("response").textContent =
      typeof dados === "string"
        ? dados
        : JSON.stringify(dados, null, 2);

    const badge = $("responseBadge");

    if (status >= 200 && status < 300) {
      badge.textContent = "SUCESSO";
      badge.className = "badge ok";
    } else {
      badge.textContent = "ERRO";
      badge.className = "badge error";
    }
  }

  function atualizarStatus(ok, texto, badgeTexto) {
    const status = $("routeStatus");
    const badge = $("routeBadge");

    status.className = "big-status " + (ok ? "green" : "red");
    status.innerHTML =
      '<span class="dot"></span>' + texto;

    badge.textContent = badgeTexto;
    badge.className = "badge " + (ok ? "ok" : "error");
  }

  async function chamarUltimo() {
    const inicio = performance.now();

    $("getMethod").textContent = "GET /api/sensores/ultimo";
    $("getTime").textContent = "consultando...";

    try {
      const resposta = await fetch("/api/sensores/ultimo");
      const dados = await resposta.json();
      const tempo = Math.round(performance.now() - inicio);

      mostrarResposta(resposta.status, tempo, dados);

    if (resposta.ok) {
        atualizarStatus(true, "ONLINE", "200 OK");

        const ultimo = Array.isArray(dados) ? dados[0] : dados;

        $("tensao").textContent =
        ultimo?.tensao != null ? ultimo.tensao + " V" : "—";

        $("corrente").textContent =
        ultimo?.corrente != null ? ultimo.corrente + " A" : "—";

        $("potencia").textContent =
        ultimo?.potencia != null ? ultimo.potencia + " W" : "—";

        $("bufferInfo").textContent = "última leitura: " + agora();
    } else {
        atualizarStatus(false, "ERRO", resposta.status);
    }

      $("lastCall").textContent = agora();
      $("getTime").textContent = tempo + " ms";

    } catch (erro) {
      const tempo = Math.round(performance.now() - inicio);

      mostrarResposta(null, tempo, {
        erro: erro.message
      });

      atualizarStatus(false, "SEM RESPOSTA", "FETCH ERROR");
      $("getTime").textContent = tempo + " ms";
    }
  }

  async function chamarTodos() {
    const inicio = performance.now();

    $("getMethod").textContent = "GET /api/sensores/todos";
    $("getTime").textContent = "consultando...";

    try {
      const resposta = await fetch("/api/sensores/todos");
      const dados = await resposta.json();
      const tempo = Math.round(performance.now() - inicio);

      mostrarResposta(resposta.status, tempo, dados);

      if (resposta.ok) {
        atualizarStatus(true, "ONLINE", "200 OK");
        $("bufferInfo").textContent =
          Array.isArray(dados)
            ? dados.length + " registros retornados"
            : "resposta recebida";
      } else {
        atualizarStatus(false, "ERRO", resposta.status);
      }

      $("lastCall").textContent = agora();
      $("getTime").textContent = tempo + " ms";

    } catch (erro) {
      const tempo = Math.round(performance.now() - inicio);

      mostrarResposta(null, tempo, {
        erro: erro.message
      });

      atualizarStatus(false, "SEM RESPOSTA", "FETCH ERROR");
      $("getTime").textContent = tempo + " ms";
    }
  }

  async function enviarPost() {
    let dados;

    try {
      dados = JSON.parse($("postBody").value);
    } catch (erro) {
      mostrarResposta(400, 0, {
        erro: "JSON inválido no campo de teste"
      });
      return;
    }

    const inicio = performance.now();

    try {
      const resposta = await fetch("/api/sensores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
      });

      const texto = await resposta.text();
      const tempo = Math.round(performance.now() - inicio);

      let retorno;

      try {
        retorno = JSON.parse(texto);
      } catch {
        retorno = texto;
      }

      mostrarResposta(resposta.status, tempo, retorno);

      if (resposta.ok) {
        atualizarStatus(true, "ONLINE", "POST OK");
        $("bufferInfo").textContent = "POST executado às " + agora();
      } else {
        atualizarStatus(false, "ERRO", resposta.status);
      }

      $("lastCall").textContent = agora();

    } catch (erro) {
      const tempo = Math.round(performance.now() - inicio);

      mostrarResposta(null, tempo, {
        erro: erro.message
      });

      atualizarStatus(false, "SEM RESPOSTA", "FETCH ERROR");
    }
  }

  function formatarBody() {
    try {
      const objeto = JSON.parse($("postBody").value);
      $("postBody").value = JSON.stringify(objeto, null, 2);
    } catch {
      alert("O conteúdo atual não é um JSON válido.");
    }
  }

  $("footerTime").textContent =
    "Página aberta em " + agora();
</script>

</body>
</html>`);
});


module.exports = router;