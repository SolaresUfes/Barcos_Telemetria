// Coloca o 'express' como framework (base) a ser usado
// Cria o backend usando o express e o nomeia 'app'
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());

const supabase = require("./supabase");

app.use(cors());

// Link: https://barcos-backendtelemetria.vercel.app/ 

/*
As funções GET e POST são as principais usadas neste código.

GET: usada para buscar/obter informações do servidor.
POST: usada para enviar dados para o servidor.

Rotas são "caminhos" (endereços) do backend. Elas funcionam como pontos de entrada:
qualquer cliente (ESP, site, aplicativo) usa essas rotas para se comunicar com o servidor.

Quando usamos app.POST('/api/...') ou app.GET('/api/...'), estamos definindo:

1. o tipo da requisição (POST ou GET).
2. o caminho que, ao ser acessado, executará uma determinada lógica no backend ('/api/...').

Por exemplo, se quisermos enviar dados de sensores:
o ESP fará uma requisição POST para '/api/dados_sensores'.
Quando essa rota for chamada, o backend executará o código definido nela,
como por exemplo salvar os dados em um banco de dados.

Da mesma forma, podemos criar outras rotas para diferentes responsabilidades,
como '/api/alertas' ou '/api/mensagens', mantendo o sistema organizado.
*/
/*
Uma função que faz controle de rotas tem alguns parametros: req, res.

req: o que chegou da requisição - cliente falando
res: o que será devolvido       - servidor respondendo

req.body -> mostra os dados que compoem o json enviado pelo cliente

res.send("parametro") -> Envia uma mensagem simples (string, html, texto simples)
res.json("parametro") -> Envia um JSON
res.status("status")  -> define o status (404 - nao enconrtado, 401 - nao autorizado, 200 - tudo certo, 400 - erro do cliente...)

Normalmente, o res.status é feito em conjunto do res.json:

res.status(404).json({erro: 'nao encontrado'});
*/

// Dashboard de diagnóstico
app.get("/", async (req, res) => {
  const inicio = Date.now();

  // Faz consultas simples somente para diagnosticar o estado do backend.
  // Nenhuma outra rota do servidor é alterada.
  const resultados = await Promise.allSettled([
    supabase.from("medicoes").select("*", { count: "exact", head: true }),
    supabase.from("alertas").select("*", { count: "exact", head: true }),
    supabase.from("celulas").select("*", { count: "exact", head: true }),
    supabase
      .from("medicoes")
      .select("*")
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("alertas")
      .select("*")
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("celulas")
      .select("*")
      .order("id", { ascending: false })
      .limit(1)
  ]);

  const [medicoesCount, alertasCount, celulasCount, ultimaMedicao, ultimoAlerta, ultimasCelulas] =
    resultados.map((resultado) =>
      resultado.status === "fulfilled" ? resultado.value : { error: resultado.reason }
    );

  const supabaseOk = resultados.every(
    (resultado) =>
      resultado.status === "fulfilled" &&
      !resultado.value?.error
  );

  const status = supabaseOk ? "ONLINE" : "ATENÇÃO";
  const statusClass = supabaseOk ? "online" : "warning";

  const quantidadeMedicoes =
    medicoesCount?.count ?? "—";

  const quantidadeAlertas =
    alertasCount?.count ?? "—";

  const quantidadeCelulas =
    celulasCount?.count ?? "—";

  const medicao = ultimaMedicao?.data?.[0] || null;
  const alerta = ultimoAlerta?.data?.[0] || null;
  const celulas = ultimasCelulas?.data?.[0] || null;

  const formatarJson = (obj) => {
    if (!obj) return "Nenhum dado encontrado";
    return JSON.stringify(obj, null, 2);
  };

  const formatarHorario = () =>
    new Date().toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium"
    });

  const erroSupabase = resultados.find(
    (resultado) =>
      resultado.status === "rejected" ||
      resultado.value?.error
  );

  res.status(supabaseOk ? 200 : 503).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Telemetria • Backend Status</title>

  <style>
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #e8eef7;
      background:
        radial-gradient(circle at 10% 0%, rgba(30, 136, 229, .20), transparent 30%),
        radial-gradient(circle at 90% 10%, rgba(0, 188, 212, .13), transparent 28%),
        #080d14;
    }

    .container {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 42px 0 50px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 30px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .logo {
      width: 54px;
      height: 54px;
      display: grid;
      place-items: center;
      border-radius: 16px;
      background: linear-gradient(135deg, #1683ff, #00bcd4);
      box-shadow: 0 12px 35px rgba(0, 150, 255, .25);
      font-size: 27px;
    }

    h1 {
      margin: 0;
      font-size: clamp(25px, 4vw, 36px);
      letter-spacing: -.8px;
    }

    .subtitle {
      margin: 5px 0 0;
      color: #8fa0b6;
      font-size: 14px;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 16px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 999px;
      background: rgba(255,255,255,.04);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .5px;
    }

    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 14px currentColor;
    }

    .online { color: #35e58b; }
    .warning { color: #ffbd45; }

    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .card {
      border: 1px solid rgba(255,255,255,.075);
      border-radius: 18px;
      background: rgba(15, 23, 34, .78);
      box-shadow: 0 18px 50px rgba(0,0,0,.18);
      backdrop-filter: blur(12px);
      overflow: hidden;
    }

    .card-header {
      padding: 18px 20px;
      border-bottom: 1px solid rgba(255,255,255,.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-header h2 {
      margin: 0;
      font-size: 15px;
      letter-spacing: .2px;
    }

    .card-body {
      padding: 20px;
    }

    .metric {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
    }

    .muted {
      color: #7f90a6;
      font-size: 12px;
    }

    .ok-badge {
      color: #35e58b;
      background: rgba(53,229,139,.10);
      border: 1px solid rgba(53,229,139,.18);
      padding: 5px 9px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
    }

    .error-badge {
      color: #ffbd45;
      background: rgba(255,189,69,.10);
      border: 1px solid rgba(255,189,69,.18);
      padding: 5px 9px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
    }

    .wide {
      grid-column: span 2;
    }

    .full {
      grid-column: 1 / -1;
    }

    .route-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 9px;
    }

    .route {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 11px 13px;
      border-radius: 10px;
      background: rgba(255,255,255,.035);
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      color: #c6d1df;
    }

    .route-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #35e58b;
      box-shadow: 0 0 9px #35e58b;
      flex: 0 0 auto;
    }

    pre {
      margin: 0;
      max-height: 250px;
      overflow: auto;
      padding: 15px;
      border-radius: 12px;
      background: #070b11;
      color: #b8c7d9;
      font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .info {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 25px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      gap: 15px;
      padding: 10px 0;
      border-bottom: 1px solid rgba(255,255,255,.05);
      font-size: 13px;
    }

    .info-item span:first-child {
      color: #8191a6;
    }

    .info-item span:last-child {
      color: #dce6f2;
      text-align: right;
    }

    .footer {
      margin-top: 25px;
      text-align: center;
      color: #63748a;
      font-size: 12px;
    }

    @media (max-width: 800px) {
      .header {
        flex-direction: column;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      .wide,
      .full {
        grid-column: auto;
      }

      .route-list,
      .info {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>

<body>
  <main class="container">
    <header class="header">
      <div class="brand">
        <div class="logo">🚤</div>
        <div>
          <h1>Telemetria • Backend</h1>
          <p class="subtitle">Painel de diagnóstico do Barcos Telemetria</p>
        </div>
      </div>

      <div class="status ${statusClass}">
        <span class="dot"></span>
        ${status}
      </div>
    </header>

    <section class="grid">

      <article class="card">
        <div class="card-header">
          <h2>Banco de medições</h2>
          <span class="${medicoesCount?.error ? "error-badge" : "ok-badge"}">
            ${medicoesCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="metric">${quantidadeMedicoes}</div>
          <div class="muted">registros encontrados</div>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2>Alertas</h2>
          <span class="${alertasCount?.error ? "error-badge" : "ok-badge"}">
            ${alertasCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="metric">${quantidadeAlertas}</div>
          <div class="muted">registros encontrados</div>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2>Células</h2>
          <span class="${celulasCount?.error ? "error-badge" : "ok-badge"}">
            ${celulasCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="metric">${quantidadeCelulas}</div>
          <div class="muted">registros encontrados</div>
        </div>
      </article>

      <article class="card wide">
        <div class="card-header">
          <h2>Rotas disponíveis</h2>
          <span class="ok-badge">BACKEND</span>
        </div>
        <div class="card-body">
          <div class="route-list">
            <div class="route"><span class="route-dot"></span>POST /api/sensores</div>
            <div class="route"><span class="route-dot"></span>GET /api/sensores</div>
            <div class="route"><span class="route-dot"></span>POST /api/alertas</div>
            <div class="route"><span class="route-dot"></span>GET /api/alertas</div>
            <div class="route"><span class="route-dot"></span>POST /api/celulas</div>
            <div class="route"><span class="route-dot"></span>GET /api/celulas</div>
            <div class="route"><span class="route-dot"></span>GET /api/sensores/ultimo</div>
            <div class="route"><span class="route-dot"></span>GET /api/alertas/ultimo</div>
            <div class="route"><span class="route-dot"></span>GET /api/celulas/ultimo</div>
          </div>
        </div>
      </article>

      <article class="card">
        <div class="card-header">
          <h2>Supabase</h2>
          <span class="${supabaseOk ? "ok-badge" : "error-badge"}">
            ${supabaseOk ? "CONECTADO" : "FALHA"}
          </span>
        </div>
        <div class="card-body">
          <div class="muted">Tempo das consultas</div>
          <div class="metric">${Date.now() - inicio}<span style="font-size:16px"> ms</span></div>
        </div>
      </article>

      <article class="card wide">
        <div class="card-header">
          <h2>Última medição</h2>
          <span class="ok-badge">SUPABASE</span>
        </div>
        <div class="card-body">
          <pre>${formatarJson(medicao)}</pre>
        </div>
      </article>

      <article class="card wide">
        <div class="card-header">
          <h2>Último alerta</h2>
          <span class="ok-badge">SUPABASE</span>
        </div>
        <div class="card-body">
          <pre>${formatarJson(alerta)}</pre>
        </div>
      </article>

      <article class="card full">
        <div class="card-header">
          <h2>Último pacote de células</h2>
          <span class="ok-badge">SUPABASE</span>
        </div>
        <div class="card-body">
          <pre>${formatarJson(celulas)}</pre>
        </div>
      </article>

      <article class="card full">
        <div class="card-header">
          <h2>Informações do servidor</h2>
        </div>
        <div class="card-body">
          <div class="info">
            <div class="info-item">
              <span>Ambiente</span>
              <span>${process.env.VERCEL_ENV || process.env.NODE_ENV || "não informado"}</span>
            </div>
            <div class="info-item">
              <span>Plataforma</span>
              <span>${process.env.VERCEL ? "Vercel" : "Servidor local"}</span>
            </div>
            <div class="info-item">
              <span>Node.js</span>
              <span>${process.version}</span>
            </div>
            <div class="info-item">
              <span>Verificação</span>
              <span>${formatarHorario()}</span>
            </div>
          </div>

          ${
            erroSupabase
              ? `<div style="margin-top:18px">
                  <div class="error-badge" style="display:inline-block;margin-bottom:10px">
                    ERRO DETECTADO NO SUPABASE
                  </div>
                  <pre>${formatarJson(
                    erroSupabase.status === "fulfilled"
                      ? erroSupabase.value.error
                      : erroSupabase.reason
                  )}</pre>
                </div>`
              : ""
          }
        </div>
      </article>

    </section>

    <div class="footer">
      Dashboard gerado pelo próprio backend • ${formatarHorario()}
    </div>
  </main>
</body>
</html>`);
});


const rotas_alertas  = require("./routes/alertas");
const rotas_celulas  = require("./routes/celulas");
const rotas_sensores = require("./routes/sensores");

app.use("/api/alertas", rotas_alertas);
app.use("/api/celulas", rotas_celulas);
app.use("/api/sensores", rotas_sensores);

if (!process.env.VERCEL) {
    app.listen(3000, () => {
        console.log("Backend rodando em http://localhost:3000");
    });
}

// Para fazer o vercel funcionar
module.exports = app