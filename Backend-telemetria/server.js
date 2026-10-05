// // Coloca o 'express' como framework (base) a ser usado
// // Cria o backend usando o express e o nomeia 'app'
// const express = require("express");
// const cors = require("cors");
// const app = express();

// const rotas_alertas  = require("./routes/alertas");
// const rotas_celulas  = require("./routes/celulas");
// const rotas_sensores = require("./routes/sensores");
// const supabase = require("./supabase");

// app.use(express.json());
// app.use(cors());

// app.use("/api/alertas", rotas_alertas);
// app.use("/api/celulas", rotas_celulas);
// app.use("/api/sensores", rotas_sensores);

// // Link: https://barcos-backendtelemetria.vercel.app/ 

// /*
// As funções GET e POST são as principais usadas neste código.

// GET: usada para buscar/obter informações do servidor.
// POST: usada para enviar dados para o servidor.

// Rotas são "caminhos" (endereços) do backend. Elas funcionam como pontos de entrada:
// qualquer cliente (ESP, site, aplicativo) usa essas rotas para se comunicar com o servidor.

// Quando usamos app.POST('/api/...') ou app.GET('/api/...'), estamos definindo:

// 1. o tipo da requisição (POST ou GET).
// 2. o caminho que, ao ser acessado, executará uma determinada lógica no backend ('/api/...').

// Por exemplo, se quisermos enviar dados de sensores:
// o ESP fará uma requisição POST para '/api/dados_sensores'.
// Quando essa rota for chamada, o backend executará o código definido nela,
// como por exemplo salvar os dados em um banco de dados.

// Da mesma forma, podemos criar outras rotas para diferentes responsabilidades,
// como '/api/alertas' ou '/api/mensagens', mantendo o sistema organizado.
// */
// /*
// Uma função que faz controle de rotas tem alguns parametros: req, res.

// req: o que chegou da requisição - cliente falando
// res: o que será devolvido       - servidor respondendo

// req.body -> mostra os dados que compoem o json enviado pelo cliente

// res.send("parametro") -> Envia uma mensagem simples (string, html, texto simples)
// res.json("parametro") -> Envia um JSON
// res.status("status")  -> define o status (404 - nao enconrtado, 401 - nao autorizado, 200 - tudo certo, 400 - erro do cliente...)

// Normalmente, o res.status é feito em conjunto do res.json:

// res.status(404).json({erro: 'nao encontrado'});
// */

// // Dashboard de diagnóstico
// app.get("/", async (req, res) => {
//   const inicio = Date.now();

//   // Faz consultas simples somente para diagnosticar o estado do backend.
//   // Nenhuma outra rota do servidor é alterada.
//   const resultados = await Promise.allSettled([
//     supabase.from("medicoes").select("*", { count: "exact", head: true }),
//     supabase.from("alertas").select("*", { count: "exact", head: true }),
//     supabase.from("celulas").select("*", { count: "exact", head: true }),
//     supabase
//       .from("medicoes")
//       .select("*")
//       .order("id", { ascending: false })
//       .limit(1),
//     supabase
//       .from("alertas")
//       .select("*")
//       .order("id", { ascending: false })
//       .limit(1),
//     supabase
//       .from("celulas")
//       .select("*")
//       .order("id", { ascending: false })
//       .limit(1)
//   ]);

//   const [medicoesCount, alertasCount, celulasCount, ultimaMedicao, ultimoAlerta, ultimasCelulas] =
//     resultados.map((resultado) =>
//       resultado.status === "fulfilled" ? resultado.value : { error: resultado.reason }
//     );

//   const supabaseOk = resultados.every(
//     (resultado) =>
//       resultado.status === "fulfilled" &&
//       !resultado.value?.error
//   );

//   const status = supabaseOk ? "ONLINE" : "ATENÇÃO";
//   const statusClass = supabaseOk ? "online" : "warning";

//   const quantidadeMedicoes =
//     medicoesCount?.count ?? "—";

//   const quantidadeAlertas =
//     alertasCount?.count ?? "—";

//   const quantidadeCelulas =
//     celulasCount?.count ?? "—";

//   const medicao = ultimaMedicao?.data?.[0] || null;
//   const alerta = ultimoAlerta?.data?.[0] || null;
//   const celulas = ultimasCelulas?.data?.[0] || null;

//   const formatarJson = (obj) => {
//     if (!obj) return "Nenhum dado encontrado";
//     return JSON.stringify(obj, null, 2);
//   };

//   const formatarHorario = () =>
//     new Date().toLocaleString("pt-BR", {
//       dateStyle: "short",
//       timeStyle: "medium"
//     });

//   const erroSupabase = resultados.find(
//     (resultado) =>
//       resultado.status === "rejected" ||
//       resultado.value?.error
//   );

//   res.status(supabaseOk ? 200 : 503).send(`<!DOCTYPE html>
// <html lang="pt-BR">
// <head>
//   <meta charset="UTF-8">
//   <meta name="viewport" content="width=device-width, initial-scale=1.0">
//   <meta name="color-scheme" content="dark">
//   <title>Telemetria • Backend Status</title>

//   <style>
//     * {
//       box-sizing: border-box;
//     }

//     body {
//       margin: 0;
//       min-height: 100vh;
//       font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
//       color: #e8eef7;
//       background:
//         radial-gradient(circle at 10% 0%, rgba(30, 136, 229, .20), transparent 30%),
//         radial-gradient(circle at 90% 10%, rgba(0, 188, 212, .13), transparent 28%),
//         #080d14;
//     }

//     .container {
//       width: min(1180px, calc(100% - 32px));
//       margin: 0 auto;
//       padding: 42px 0 50px;
//     }

//     .header {
//       display: flex;
//       justify-content: space-between;
//       align-items: flex-start;
//       gap: 24px;
//       margin-bottom: 30px;
//     }

//     .brand {
//       display: flex;
//       align-items: center;
//       gap: 15px;
//     }

//     .logo {
//       width: 54px;
//       height: 54px;
//       display: grid;
//       place-items: center;
//       border-radius: 16px;
//       background: linear-gradient(135deg, #1683ff, #00bcd4);
//       box-shadow: 0 12px 35px rgba(0, 150, 255, .25);
//       font-size: 27px;
//     }

//     h1 {
//       margin: 0;
//       font-size: clamp(25px, 4vw, 36px);
//       letter-spacing: -.8px;
//     }

//     .subtitle {
//       margin: 5px 0 0;
//       color: #8fa0b6;
//       font-size: 14px;
//     }

//     .status {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//       padding: 11px 16px;
//       border: 1px solid rgba(255,255,255,.08);
//       border-radius: 999px;
//       background: rgba(255,255,255,.04);
//       font-size: 13px;
//       font-weight: 700;
//       letter-spacing: .5px;
//     }

//     .dot {
//       width: 9px;
//       height: 9px;
//       border-radius: 50%;
//       background: currentColor;
//       box-shadow: 0 0 14px currentColor;
//     }

//     .online { color: #35e58b; }
//     .warning { color: #ffbd45; }

//     .grid {
//       display: grid;
//       grid-template-columns: repeat(3, 1fr);
//       gap: 16px;
//     }

//     .card {
//       border: 1px solid rgba(255,255,255,.075);
//       border-radius: 18px;
//       background: rgba(15, 23, 34, .78);
//       box-shadow: 0 18px 50px rgba(0,0,0,.18);
//       backdrop-filter: blur(12px);
//       overflow: hidden;
//     }

//     .card-header {
//       padding: 18px 20px;
//       border-bottom: 1px solid rgba(255,255,255,.06);
//       display: flex;
//       justify-content: space-between;
//       align-items: center;
//     }

//     .card-header h2 {
//       margin: 0;
//       font-size: 15px;
//       letter-spacing: .2px;
//     }

//     .card-body {
//       padding: 20px;
//     }

//     .metric {
//       font-size: 32px;
//       font-weight: 800;
//       letter-spacing: -1px;
//     }

//     .muted {
//       color: #7f90a6;
//       font-size: 12px;
//     }

//     .ok-badge {
//       color: #35e58b;
//       background: rgba(53,229,139,.10);
//       border: 1px solid rgba(53,229,139,.18);
//       padding: 5px 9px;
//       border-radius: 8px;
//       font-size: 11px;
//       font-weight: 800;
//     }

//     .error-badge {
//       color: #ffbd45;
//       background: rgba(255,189,69,.10);
//       border: 1px solid rgba(255,189,69,.18);
//       padding: 5px 9px;
//       border-radius: 8px;
//       font-size: 11px;
//       font-weight: 800;
//     }

//     .wide {
//       grid-column: span 2;
//     }

//     .full {
//       grid-column: 1 / -1;
//     }

//     .route-list {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: 9px;
//     }

//     .route {
//       display: flex;
//       align-items: center;
//       gap: 10px;
//       padding: 11px 13px;
//       border-radius: 10px;
//       background: rgba(255,255,255,.035);
//       font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
//       font-size: 12px;
//       color: #c6d1df;
//     }

//     .route-dot {
//       width: 7px;
//       height: 7px;
//       border-radius: 50%;
//       background: #35e58b;
//       box-shadow: 0 0 9px #35e58b;
//       flex: 0 0 auto;
//     }

//     pre {
//       margin: 0;
//       max-height: 250px;
//       overflow: auto;
//       padding: 15px;
//       border-radius: 12px;
//       background: #070b11;
//       color: #b8c7d9;
//       font: 12px/1.55 ui-monospace, SFMono-Regular, Menlo, monospace;
//       white-space: pre-wrap;
//       word-break: break-word;
//     }

//     .info {
//       display: grid;
//       grid-template-columns: repeat(2, 1fr);
//       gap: 10px 25px;
//     }

//     .info-item {
//       display: flex;
//       justify-content: space-between;
//       gap: 15px;
//       padding: 10px 0;
//       border-bottom: 1px solid rgba(255,255,255,.05);
//       font-size: 13px;
//     }

//     .info-item span:first-child {
//       color: #8191a6;
//     }

//     .info-item span:last-child {
//       color: #dce6f2;
//       text-align: right;
//     }

//     .footer {
//       margin-top: 25px;
//       text-align: center;
//       color: #63748a;
//       font-size: 12px;
//     }

//     @media (max-width: 800px) {
//       .header {
//         flex-direction: column;
//       }

//       .grid {
//         grid-template-columns: 1fr;
//       }

//       .wide,
//       .full {
//         grid-column: auto;
//       }

//       .route-list,
//       .info {
//         grid-template-columns: 1fr;
//       }
//     }
//   </style>
// </head>

// <body>
//   <main class="container">
//     <header class="header">
//       <div class="brand">
//         <div class="logo">🚤</div>
//         <div>
//           <h1>Telemetria • Backend</h1>
//           <p class="subtitle">Painel de diagnóstico do Barcos Telemetria</p>
//         </div>
//       </div>

//       <div class="status ${statusClass}">
//         <span class="dot"></span>
//         ${status}
//       </div>
//     </header>

//     <section class="grid">

//       <article class="card">
//         <div class="card-header">
//           <h2>Banco de medições</h2>
//           <span class="${medicoesCount?.error ? "error-badge" : "ok-badge"}">
//             ${medicoesCount?.error ? "ERRO" : "OK"}
//           </span>
//         </div>
//         <div class="card-body">
//           <div class="metric">${quantidadeMedicoes}</div>
//           <div class="muted">registros encontrados</div>
//         </div>
//       </article>

//       <article class="card">
//         <div class="card-header">
//           <h2>Alertas</h2>
//           <span class="${alertasCount?.error ? "error-badge" : "ok-badge"}">
//             ${alertasCount?.error ? "ERRO" : "OK"}
//           </span>
//         </div>
//         <div class="card-body">
//           <div class="metric">${quantidadeAlertas}</div>
//           <div class="muted">registros encontrados</div>
//         </div>
//       </article>

//       <article class="card">
//         <div class="card-header">
//           <h2>Células</h2>
//           <span class="${celulasCount?.error ? "error-badge" : "ok-badge"}">
//             ${celulasCount?.error ? "ERRO" : "OK"}
//           </span>
//         </div>
//         <div class="card-body">
//           <div class="metric">${quantidadeCelulas}</div>
//           <div class="muted">registros encontrados</div>
//         </div>
//       </article>

//       <article class="card wide">
//         <div class="card-header">
//           <h2>Rotas disponíveis</h2>
//           <span class="ok-badge">BACKEND</span>
//         </div>
//         <div class="card-body">
//           <div class="route-list">
//             <div class="route"><span class="route-dot"></span>POST /api/sensores</div>
//             <div class="route"><span class="route-dot"></span>GET /api/sensores</div>
//             <div class="route"><span class="route-dot"></span>POST /api/alertas</div>
//             <div class="route"><span class="route-dot"></span>GET /api/alertas</div>
//             <div class="route"><span class="route-dot"></span>POST /api/celulas</div>
//             <div class="route"><span class="route-dot"></span>GET /api/celulas</div>
//             <div class="route"><span class="route-dot"></span>GET /api/sensores/ultimo</div>
//             <div class="route"><span class="route-dot"></span>GET /api/alertas/ultimo</div>
//             <div class="route"><span class="route-dot"></span>GET /api/celulas/ultimo</div>
//           </div>
//         </div>
//       </article>

//       <article class="card">
//         <div class="card-header">
//           <h2>Supabase</h2>
//           <span class="${supabaseOk ? "ok-badge" : "error-badge"}">
//             ${supabaseOk ? "CONECTADO" : "FALHA"}
//           </span>
//         </div>
//         <div class="card-body">
//           <div class="muted">Tempo das consultas</div>
//           <div class="metric">${Date.now() - inicio}<span style="font-size:16px"> ms</span></div>
//         </div>
//       </article>

//       <article class="card wide">
//         <div class="card-header">
//           <h2>Última medição</h2>
//           <span class="ok-badge">SUPABASE</span>
//         </div>
//         <div class="card-body">
//           <pre>${formatarJson(medicao)}</pre>
//         </div>
//       </article>

//       <article class="card wide">
//         <div class="card-header">
//           <h2>Último alerta</h2>
//           <span class="ok-badge">SUPABASE</span>
//         </div>
//         <div class="card-body">
//           <pre>${formatarJson(alerta)}</pre>
//         </div>
//       </article>

//       <article class="card full">
//         <div class="card-header">
//           <h2>Último pacote de células</h2>
//           <span class="ok-badge">SUPABASE</span>
//         </div>
//         <div class="card-body">
//           <pre>${formatarJson(celulas)}</pre>
//         </div>
//       </article>

//       <article class="card full">
//         <div class="card-header">
//           <h2>Informações do servidor</h2>
//         </div>
//         <div class="card-body">
//           <div class="info">
//             <div class="info-item">
//               <span>Ambiente</span>
//               <span>${process.env.VERCEL_ENV || process.env.NODE_ENV || "não informado"}</span>
//             </div>
//             <div class="info-item">
//               <span>Plataforma</span>
//               <span>${process.env.VERCEL ? "Vercel" : "Servidor local"}</span>
//             </div>
//             <div class="info-item">
//               <span>Node.js</span>
//               <span>${process.version}</span>
//             </div>
//             <div class="info-item">
//               <span>Verificação</span>
//               <span>${formatarHorario()}</span>
//             </div>
//           </div>

//           ${
//             erroSupabase
//               ? `<div style="margin-top:18px">
//                   <div class="error-badge" style="display:inline-block;margin-bottom:10px">
//                     ERRO DETECTADO NO SUPABASE
//                   </div>
//                   <pre>${formatarJson(
//                     erroSupabase.status === "fulfilled"
//                       ? erroSupabase.value.error
//                       : erroSupabase.reason
//                   )}</pre>
//                 </div>`
//               : ""
//           }
//         </div>
//       </article>

//     </section>

//     <div class="footer">
//       Dashboard gerado pelo próprio backend • ${formatarHorario()}
//     </div>
//   </main>
// </body>
// </html>`);
// });

// if (!process.env.VERCEL) {
//     app.listen(3000, () => {
//         console.log("Backend rodando em http://localhost:3000");
//     });
// }

// // Para fazer o vercel funcionar
// module.exports = app


// Coloca o 'express' como framework (base) a ser usado
// Cria o backend usando o express e o nomeia 'app'
const express = require("express");
const cors = require("cors");
const app = express();

const rotas_alertas  = require("./routes/alertas");
const rotas_celulas  = require("./routes/celulas");
const rotas_sensores = require("./routes/sensores");
const supabase = require("./supabase");

app.use(express.json());
app.use(cors());

app.use("/api/alertas", rotas_alertas);
app.use("/api/celulas", rotas_celulas);
app.use("/api/sensores", rotas_sensores);

// Dashboard de diagnóstico
app.get("/", async (req, res) => {
  const inicio = Date.now();

  // MESMA LOGICA ORIGINAL
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

  const [
    medicoesCount,
    alertasCount,
    celulasCount,
    ultimaMedicao,
    ultimoAlerta,
    ultimasCelulas
  ] = resultados.map((resultado) =>
    resultado.status === "fulfilled"
      ? resultado.value
      : { error: resultado.reason }
  );

  const supabaseOk = resultados.every(
    (resultado) =>
      resultado.status === "fulfilled" &&
      !resultado.value?.error
  );

  const status = supabaseOk ? "ONLINE" : "ATENÇÃO";
  const statusClass = supabaseOk ? "online" : "warning";

  const quantidadeMedicoes = medicoesCount?.count ?? "—";
  const quantidadeAlertas = alertasCount?.count ?? "—";
  const quantidadeCelulas = celulasCount?.count ?? "—";

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

  const tempoConsulta = Date.now() - inicio;

  res.status(supabaseOk ? 200 : 503).send(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Telemetria • Backend</title>

  <style>
    * {
      box-sizing: border-box;
    }

    :root {
      --bg: #080d14;
      --bg-soft: #0d141e;
      --card: #101923;
      --card-2: #0c141d;
      --line: rgba(148, 170, 195, .14);
      --line-strong: rgba(148, 170, 195, .22);
      --text: #e9f0f8;
      --muted: #8292a6;
      --muted-2: #5e6e81;
      --blue: #318cff;
      --cyan: #27c7e8;
      --green: #35df8b;
      --orange: #ff9d32;
      --red: #ff5264;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system,
        BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--text);
      background:
        radial-gradient(circle at 8% 0%, rgba(49, 140, 255, .12), transparent 28%),
        radial-gradient(circle at 92% 8%, rgba(39, 199, 232, .07), transparent 25%),
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

    /* HEADER */

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      padding: 0 0 24px;
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
      font-size: 21px;
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

    .header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .environment {
      padding: 8px 11px;
      border: 1px solid var(--line);
      border-radius: 9px;
      color: var(--muted);
      background: rgba(255,255,255,.025);
      font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 9px;
      border: 1px solid currentColor;
      background: rgba(255,255,255,.025);
      font-size: 11px;
      font-weight: 800;
      letter-spacing: .7px;
    }

    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      box-shadow: 0 0 10px currentColor;
    }

    .online { color: var(--green); }
    .warning { color: var(--orange); }

    /* MAIN GRID */

    .grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 14px;
    }

    .card {
      min-width: 0;
      border: 1px solid var(--line);
      border-radius: 13px;
      background: linear-gradient(
        145deg,
        rgba(16,25,35,.94),
        rgba(11,18,27,.94)
      );
      box-shadow: 0 12px 34px rgba(0,0,0,.14);
      overflow: hidden;
    }

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
      font-weight: 750;
      letter-spacing: .35px;
    }

    .card-body {
      padding: 15px 16px;
    }

    .span-3 { grid-column: span 3; }
    .span-4 { grid-column: span 4; }
    .span-5 { grid-column: span 5; }
    .span-7 { grid-column: span 7; }
    .span-8 { grid-column: span 8; }
    .span-12 { grid-column: span 12; }

    /* STATUS CARDS */

    .system-card {
      position: relative;
      min-height: 122px;
    }

    .system-card::after {
      content: "";
      position: absolute;
      right: 0;
      top: 0;
      width: 80px;
      height: 80px;
      background: radial-gradient(circle, rgba(49,140,255,.08), transparent 68%);
      pointer-events: none;
    }

    .system-value {
      font-size: 25px;
      font-weight: 800;
      letter-spacing: -.8px;
    }

    .system-description {
      margin-top: 5px;
      color: var(--muted);
      font-size: 11px;
    }

    .system-meta {
      margin-top: 13px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
      display: flex;
      justify-content: space-between;
      gap: 8px;
      color: var(--muted-2);
      font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .ok-badge,
    .error-badge {
      padding: 4px 7px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 850;
      letter-spacing: .5px;
    }

    .ok-badge {
      color: var(--green);
      background: rgba(53,223,139,.08);
      border: 1px solid rgba(53,223,139,.15);
    }

    .error-badge {
      color: var(--orange);
      background: rgba(255,157,50,.08);
      border: 1px solid rgba(255,157,50,.15);
    }

    /* LATEST DATA */

    .data-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .data-section + .data-section {
      border-left: 1px solid var(--line);
      padding-left: 20px;
    }

    .data-title {
      color: var(--muted);
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .metric-box {
      padding: 11px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: rgba(255,255,255,.018);
    }

    .metric-label {
      color: var(--muted-2);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .7px;
    }

    .metric-value {
      margin-top: 5px;
      font-size: 18px;
      font-weight: 750;
    }

    .metric-value.blue { color: #58a6ff; }
    .metric-value.cyan { color: var(--cyan); }
    .metric-value.orange { color: var(--orange); }

    .cell-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 6px;
    }

    .cell {
      padding: 8px 4px;
      text-align: center;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(255,255,255,.018);
    }

    .cell-label {
      display: block;
      color: var(--muted-2);
      font-size: 8px;
    }

    .cell-value {
      display: block;
      margin-top: 3px;
      font: 11px ui-monospace, SFMono-Regular, Menlo, monospace;
      color: #cbd8e7;
    }

    /* ROUTES */

    .route-group {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 9px;
    }

    .route {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      min-width: 0;
      padding: 9px 11px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255,255,255,.018);
    }

    .route-left {
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .route-method {
      color: var(--cyan);
      font: 9px ui-monospace, SFMono-Regular, Menlo, monospace;
      font-weight: 800;
    }

    .route-path {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #b9c7d8;
      font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .route-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px rgba(53,223,139,.7);
      flex: 0 0 auto;
    }

    /* JSON */

    pre {
      margin: 0;
      max-height: 235px;
      overflow: auto;
      padding: 13px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: #070b11;
      color: #aebed0;
      font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* INFO */

    .info {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0;
    }

    .info-item {
      padding: 7px 14px;
      border-right: 1px solid var(--line);
    }

    .info-item:last-child {
      border-right: 0;
    }

    .info-label {
      display: block;
      color: var(--muted-2);
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: .6px;
    }

    .info-value {
      display: block;
      margin-top: 4px;
      color: #cbd6e2;
      font: 10px ui-monospace, SFMono-Regular, Menlo, monospace;
    }

    .error-area {
      margin-top: 14px;
    }

    .footer {
      margin-top: 18px;
      display: flex;
      justify-content: space-between;
      color: var(--muted-2);
      font-size: 10px;
    }

    /* RESPONSIVE */

    @media (max-width: 1050px) {
      .span-3 { grid-column: span 6; }
      .span-4,
      .span-5,
      .span-7,
      .span-8 { grid-column: span 12; }

      .route-group {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 700px) {
      .container {
        width: min(100% - 22px, 1380px);
        padding-top: 18px;
      }

      .header,
      .header-right {
        align-items: flex-start;
        flex-direction: column;
      }

      .span-3 {
        grid-column: span 12;
      }

      .data-layout,
      .route-group,
      .metrics {
        grid-template-columns: 1fr;
      }

      .data-section + .data-section {
        border-left: 0;
        border-top: 1px solid var(--line);
        padding-left: 0;
        padding-top: 18px;
      }

      .cell-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .info {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-item:nth-child(2) {
        border-right: 0;
      }

      .info-item:nth-child(-n+2) {
        border-bottom: 1px solid var(--line);
        padding-bottom: 12px;
      }

      .info-item:nth-child(n+3) {
        padding-top: 12px;
      }

      .footer {
        flex-direction: column;
        gap: 4px;
      }
    }
  </style>
</head>

<body>
  <main class="container">

    <header class="header">
      <div class="brand">
        <div class="logo">⌘</div>
        <div>
          <h1>Telemetria <span style="color:var(--cyan)">/</span> Backend</h1>
          <p class="subtitle">Camada de diagnóstico e comunicação do Barcos Telemetria</p>
        </div>
      </div>

      <div class="header-right">
        <div class="environment">
          ${process.env.VERCEL_ENV || process.env.NODE_ENV || "ambiente não informado"}
        </div>

        <div class="status ${statusClass}">
          <span class="dot"></span>
          BACKEND ${status}
        </div>
      </div>
    </header>

    <section class="grid">

      <!-- STATUS PRINCIPAL -->

      <article class="card span-3 system-card">
        <div class="card-header">
          <h2>SUPABASE</h2>
          <span class="${supabaseOk ? "ok-badge" : "error-badge"}">
            ${supabaseOk ? "CONECTADO" : "FALHA"}
          </span>
        </div>
        <div class="card-body">
          <div class="system-value">${tempoConsulta} ms</div>
          <div class="system-description">tempo das consultas de diagnóstico</div>
          <div class="system-meta">
            <span>DATABASE</span>
            <span>${supabaseOk ? "● OK" : "● ERRO"}</span>
          </div>
        </div>
      </article>

      <article class="card span-3 system-card">
        <div class="card-header">
          <h2>MEDIÇÕES</h2>
          <span class="${medicoesCount?.error ? "error-badge" : "ok-badge"}">
            ${medicoesCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="system-value">${quantidadeMedicoes}</div>
          <div class="system-description">registros armazenados</div>
          <div class="system-meta">
            <span>TABLE / medicoes</span>
            <span>SUPABASE</span>
          </div>
        </div>
      </article>

      <article class="card span-3 system-card">
        <div class="card-header">
          <h2>CÉLULAS</h2>
          <span class="${celulasCount?.error ? "error-badge" : "ok-badge"}">
            ${celulasCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="system-value">${quantidadeCelulas}</div>
          <div class="system-description">pacotes armazenados</div>
          <div class="system-meta">
            <span>TABLE / celulas</span>
            <span>SUPABASE</span>
          </div>
        </div>
      </article>

      <article class="card span-3 system-card">
        <div class="card-header">
          <h2>ALERTAS</h2>
          <span class="${alertasCount?.error ? "error-badge" : "ok-badge"}">
            ${alertasCount?.error ? "ERRO" : "OK"}
          </span>
        </div>
        <div class="card-body">
          <div class="system-value">${quantidadeAlertas}</div>
          <div class="system-description">registros armazenados</div>
          <div class="system-meta">
            <span>TABLE / alertas</span>
            <span>SUPABASE</span>
          </div>
        </div>
      </article>

      <!-- DADOS ATUAIS -->

      <article class="card span-8">
        <div class="card-header">
          <h2>ÚLTIMOS DADOS ARMAZENADOS</h2>
          <span class="ok-badge">SUPABASE</span>
        </div>

        <div class="card-body">
          <div class="data-layout">

            <div class="data-section">
              <div class="data-title">Última medição</div>

              ${
                medicao
                  ? `
                    <div class="metrics">
                      <div class="metric-box">
                        <div class="metric-label">Tensão</div>
                        <div class="metric-value blue">${medicao.tensao ?? "—"} V</div>
                      </div>

                      <div class="metric-box">
                        <div class="metric-label">Corrente</div>
                        <div class="metric-value orange">${medicao.corrente ?? "—"} A</div>
                      </div>

                      <div class="metric-box">
                        <div class="metric-label">Potência</div>
                        <div class="metric-value cyan">${medicao.potencia ?? "—"} W</div>
                      </div>
                    </div>

                    <div class="system-meta" style="margin-top:10px">
                      <span>ID ${medicao.id ?? "—"}</span>
                      <span>${medicao.momento ?? "horário não informado"}</span>
                    </div>
                  `
                  : `<div class="muted">Nenhuma medição encontrada.</div>`
              }
            </div>

            <div class="data-section">
              <div class="data-title">Último pacote de células</div>

              ${
                celulas
                  ? `
                    <div class="cell-grid">
                      ${
                        Array.isArray(celulas.celula)
                          ? celulas.celula.slice(0, 16).map((valor, i) => `
                              <div class="cell">
                                <span class="cell-label">S${i + 1}</span>
                                <span class="cell-value">${valor ?? "—"}</span>
                              </div>
                            `).join("")
                          : `<div class="muted">Formato de células não reconhecido.</div>`
                      }
                    </div>

                    <div class="system-meta" style="margin-top:10px">
                      <span>ID ${celulas.id ?? "—"}</span>
                      <span>${celulas.temperatura != null ? `TEMP ${celulas.temperatura} °C` : "TEMP —"}</span>
                    </div>
                  `
                  : `<div class="muted">Nenhum pacote de células encontrado.</div>`
              }
            </div>

          </div>
        </div>
      </article>

      <!-- CONEXOES -->

      <article class="card span-4">
        <div class="card-header">
          <h2>ESTADO DO SISTEMA</h2>
          <span class="ok-badge">DIAGNÓSTICO</span>
        </div>

        <div class="card-body">
          <div class="system-meta" style="margin-top:0">
            <span>BACKEND</span>
            <span class="${statusClass}">● ${status}</span>
          </div>

          <div class="system-meta">
            <span>SUPABASE</span>
            <span class="${supabaseOk ? "online" : "warning"}">● ${supabaseOk ? "CONECTADO" : "FALHA"}</span>
          </div>

          <div class="system-meta">
            <span>API</span>
            <span class="online">● ATIVA</span>
          </div>

          <div class="system-meta">
            <span>PLATAFORMA</span>
            <span>${process.env.VERCEL ? "VERCEL" : "LOCAL"}</span>
          </div>
        </div>
      </article>

      <!-- ROTAS -->

      <article class="card span-12">
        <div class="card-header">
          <h2>ROTAS DA API</h2>
          <span class="ok-badge">REGISTRADAS</span>
        </div>

        <div class="card-body">
          <div class="route-group">

            <div class="route">
              <div class="route-left">
                <span class="route-method">POST</span>
                <span class="route-path">/api/sensores</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/sensores</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/sensores/ultimo</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">POST</span>
                <span class="route-path">/api/celulas</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/celulas</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/celulas/ultimo</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">POST</span>
                <span class="route-path">/api/alertas</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/alertas</span>
              </div>
              <span class="route-dot"></span>
            </div>

            <div class="route">
              <div class="route-left">
                <span class="route-method">GET</span>
                <span class="route-path">/api/alertas/ultimo</span>
              </div>
              <span class="route-dot"></span>
            </div>

          </div>
        </div>
      </article>

      <!-- JSON -->

      <article class="card span-7">
        <div class="card-header">
          <h2>ÚLTIMO OBJETO DE MEDIÇÃO</h2>
          <span class="ok-badge">RAW JSON</span>
        </div>
        <div class="card-body">
          <pre>${formatarJson(medicao)}</pre>
        </div>
      </article>

      <article class="card span-5">
        <div class="card-header">
          <h2>ÚLTIMO ALERTA</h2>
          <span class="ok-badge">RAW JSON</span>
        </div>
        <div class="card-body">
          <pre>${formatarJson(alerta)}</pre>
        </div>
      </article>

      <!-- INFORMACOES -->

      <article class="card span-12">
        <div class="card-header">
          <h2>INFORMAÇÕES DO SERVIDOR</h2>
        </div>

        <div class="card-body">
          <div class="info">

            <div class="info-item">
              <span class="info-label">Ambiente</span>
              <span class="info-value">
                ${process.env.VERCEL_ENV || process.env.NODE_ENV || "não informado"}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Plataforma</span>
              <span class="info-value">
                ${process.env.VERCEL ? "Vercel" : "Servidor local"}
              </span>
            </div>

            <div class="info-item">
              <span class="info-label">Node.js</span>
              <span class="info-value">${process.version}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Verificação</span>
              <span class="info-value">${formatarHorario()}</span>
            </div>

          </div>

          ${
            erroSupabase
              ? `
                <div class="error-area">
                  <div class="error-badge" style="display:inline-block;margin-bottom:8px">
                    ERRO DETECTADO NO SUPABASE
                  </div>
                  <pre>${formatarJson(
                    erroSupabase.status === "fulfilled"
                      ? erroSupabase.value.error
                      : erroSupabase.reason
                  )}</pre>
                </div>
              `
              : ""
          }
        </div>
      </article>

    </section>

    <footer class="footer">
      <span>Barcos Telemetria • Backend Diagnostic Interface</span>
      <span>Verificado em ${formatarHorario()}</span>
    </footer>

  </main>
</body>
</html>`); 
});

if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log("Backend rodando em http://localhost:3000");
  });
}

// Para fazer o Vercel funcionar
module.exports = app;