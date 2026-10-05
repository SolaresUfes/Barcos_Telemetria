// const express = require("express");
// const router = express.Router();

// const supabase = require("../supabase")
// const buffer = require("../buffer/telemetria");

// // Rota pra envio dos dados dos alertas pro Supabase.
// // Os dados da tabela de alertas seguem o padrão codigo | mensagem | risco
// // POST > "/api/alertas"
// router.post("/", async (req, res) => {
//   // Define a variavel 'dados' como a receptora dos dados vindos do cliente (ESP) (req.body sao os dados que estao no json que o esp esta enviando).
//   const dados = req.body;

//   // validar se há dados no documento que foi enviado. Provavelmente nao sera usado, mas é bom pra evitar dar ruim no banco depois.
//   if (!dados.alerta_ativo) {
//     // Se não houver dados de alerta, retorna erro do cliente de envio de nada.
//     return res.status(400).json({ erro: "Não há alertas" });
//   }

//   await buffer.atualizar_ult_Alertas(dados);

//   // salvar no banco. O json precisa estar configurado com os nomes certos das colunas e com os valores corretos.
//   const dados_supabase = {
//       mensagem: dados.mensagem,
//       risco: dados.risco,
//       codigos: dados.codigos
//   };

// const { error } = await supabase
//     .from("alertas")
//     .insert(dados_supabase);
//   if (error) {
//     console.error(error);
//     return res.status(500).json({ erro: error.message });
//   }

//   // responder
//   res.status(200).json({ status: "ok" });
// });


// // Rota para a coleta dos dados de alertas
// // GET > "/api/alertas"
// router.get("/", async (req, res) => {
  
//   const { data, error } = await supabase  
//     .from("alertas")
//     .select("*");

//   if (error) {
//     return res.status(500).json({erro: error.message})
//   }

//   res.json(data);
// });

// // Rota para a coleta do dado do ultimo alerta
// // GET > "/api/alertas/ultimo"
// router.get("/ultimo", async (req, res) => {
//     try {
//         const dados = await buffer.coletar_ult_Alertas();

//         res.json(dados);

//     } catch (erro) {
//         console.error(erro);

//         res.status(500).json({
//             erro: "Erro ao obter últimos alertas"
//         });
//     }
// });


// module.exports = router


const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const buffer = require("../buffer/telemetria");


// ============================================================
// POST /api/alertas
// Recebe os dados do ESP
// Atualiza o buffer e grava no Supabase
// ============================================================

router.post("/", async (req, res) => {

    // Define a variavel 'dados' como a receptora
    // dos dados vindos do cliente (ESP)
    const dados = req.body;


    // Validar se há dados de alerta
    if (!dados.alerta_ativo) {

        return res.status(400).json({
            erro: "Não há alertas"
        });

    }


    // Atualiza o buffer
    await buffer.atualizar_ult_Alertas(dados);


    // Dados destinados ao Supabase
    const dados_supabase = {

        mensagem: dados.mensagem,

        risco: dados.risco,

        codigos: dados.codigos

    };


    // Salvar no banco
    const { error } = await supabase
        .from("alertas")
        .insert(dados_supabase);


    if (error) {

        console.error(error);

        return res.status(500).json({
            erro: error.message
        });

    }


    // Responder
    res.status(200).json({
        status: "ok"
    });

});


// ============================================================
// GET /api/alertas/todos
// Retorna todos os alertas do Supabase
// ============================================================

router.get("/todos", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("alertas")
            .select("*");


        if (error) {

            return res.status(500).json({
                erro: error.message
            });

        }


        res.json(data);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao consultar alertas"
        });

    }

});


// ============================================================
// GET /api/alertas/ultimo
// Retorna o último alerta armazenado no buffer
// ============================================================

router.get("/ultimo", async (req, res) => {

    try {

        const dados =
            await buffer.coletar_ult_Alertas();


        res.json(dados);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro ao obter últimos alertas"
        });

    }

});


// ============================================================
// GET /api/alertas
// Página visual de diagnóstico
// ============================================================

router.get("/", (req, res) => {

    res.status(200).send(`<!DOCTYPE html>
<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <meta
        name="color-scheme"
        content="dark"
    >

    <title>Telemetria / Alertas</title>


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

            font-family:
                Inter,
                ui-sans-serif,
                system-ui,
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;

            background:

                radial-gradient(
                    circle at 8% 0%,
                    rgba(49,140,255,.12),
                    transparent 28%
                ),

                radial-gradient(
                    circle at 92% 8%,
                    rgba(39,199,232,.07),
                    transparent 25%
                ),

                var(--bg);
        }


        body::before {

            content: "";

            position: fixed;

            inset: 0;

            pointer-events: none;

            background-image:

                linear-gradient(
                    rgba(255,255,255,.018) 1px,
                    transparent 1px
                ),

                linear-gradient(
                    90deg,
                    rgba(255,255,255,.018) 1px,
                    transparent 1px
                );

            background-size: 42px 42px;

            mask-image:
                linear-gradient(
                    to bottom,
                    black,
                    transparent 85%
                );
        }


        .container {

            width:
                min(
                    1380px,
                    calc(100% - 40px)
                );

            margin: 0 auto;

            padding: 28px 0 38px;
        }


        .header {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 24px;

            padding-bottom: 24px;

            border-bottom:
                1px solid var(--line);

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

            border:
                1px solid rgba(49,140,255,.35);

            border-radius: 12px;

            background:
                linear-gradient(
                    145deg,
                    rgba(49,140,255,.18),
                    rgba(39,199,232,.07)
                );

            color: var(--cyan);

            font-size: 20px;

            box-shadow:
                0 0 28px rgba(49,140,255,.08);
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

            border:
                1px solid var(--line);

            padding: 8px 11px;

            border-radius: 8px;

            background:
                rgba(255,255,255,.025);
        }


        .back:hover {

            color: var(--text);

            border-color:
                rgba(49,140,255,.4);
        }


        .grid {

            display: grid;

            grid-template-columns:
                repeat(12, 1fr);

            gap: 14px;
        }


        .card {

            min-width: 0;

            border:
                1px solid var(--line);

            border-radius: 13px;

            background:
                linear-gradient(
                    145deg,
                    rgba(16,25,35,.94),
                    rgba(11,18,27,.94)
                );

            box-shadow:
                0 12px 34px rgba(0,0,0,.14);

            overflow: hidden;
        }


        .span-4 {
            grid-column: span 4;
        }


        .span-6 {
            grid-column: span 6;
        }


        .span-8 {
            grid-column: span 8;
        }


        .span-12 {
            grid-column: span 12;
        }


        .card-header {

            min-height: 48px;

            padding: 13px 16px;

            border-bottom:
                1px solid var(--line);

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

            background:
                rgba(53,223,139,.08);

            border:
                1px solid rgba(53,223,139,.15);
        }


        .warning {

            color: var(--orange);

            background:
                rgba(255,157,50,.08);

            border:
                1px solid rgba(255,157,50,.15);
        }


        .error {

            color: var(--red);

            background:
                rgba(255,82,100,.08);

            border:
                1px solid rgba(255,82,100,.15);
        }


        .big-status {

            display: flex;

            align-items: center;

            gap: 9px;

            font-size: 24px;

            font-weight: 800;

            letter-spacing: -.6px;
        }


        .dot {

            width: 7px;

            height: 7px;

            border-radius: 50%;

            background: currentColor;

            box-shadow:
                0 0 9px currentColor;
        }


        .green {
            color: var(--green);
        }


        .red {
            color: var(--red);
        }


        .orange {
            color: var(--orange);
        }


        .blue {
            color: #58a6ff;
        }


        .cyan {
            color: var(--cyan);
        }


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

            border-top:
                1px solid var(--line);

            color: var(--muted2);

            font:
                10px
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
        }


        .metrics {

            display: grid;

            grid-template-columns:
                repeat(3, 1fr);

            gap: 9px;
        }


        .metric {

            padding: 13px;

            border:
                1px solid var(--line);

            border-radius: 9px;

            background:
                rgba(255,255,255,.018);
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


        .alert-panel {

            border:
                1px solid var(--line);

            border-radius: 11px;

            padding: 16px;

            background:
                rgba(255,255,255,.018);
        }


        .alert-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 12px;

            margin-bottom: 12px;
        }


        .alert-title {

            font-size: 18px;

            font-weight: 800;

            letter-spacing: -.3px;
        }


        .risk {

            display: inline-flex;

            align-items: center;

            padding: 5px 8px;

            border-radius: 6px;

            font-size: 9px;

            font-weight: 850;

            letter-spacing: .5px;

            text-transform: uppercase;
        }


        .risk-low {

            color: var(--green);

            background:
                rgba(53,223,139,.08);

            border:
                1px solid rgba(53,223,139,.15);
        }


        .risk-medium {

            color: var(--orange);

            background:
                rgba(255,157,50,.08);

            border:
                1px solid rgba(255,157,50,.15);
        }


        .risk-high {

            color: var(--red);

            background:
                rgba(255,82,100,.08);

            border:
                1px solid rgba(255,82,100,.15);
        }


        .risk-unknown {

            color: var(--muted);

            background:
                rgba(255,255,255,.04);

            border:
                1px solid var(--line);
        }


        .alert-message {

            color: #cbd8e7;

            font-size: 13px;

            line-height: 1.6;

            padding: 13px;

            border:
                1px solid var(--line);

            border-radius: 9px;

            background: #070b11;
        }


        .codes {

            display: grid;

            grid-template-columns:
                repeat(6, 1fr);

            gap: 8px;

            margin-top: 12px;
        }


        .code {

            padding: 10px;

            text-align: center;

            border:
                1px solid var(--line);

            border-radius: 8px;

            background:
                rgba(255,255,255,.018);

            font:
                12px
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
        }


        .code-label {

            display: block;

            color: var(--muted2);

            font-size: 8px;

            margin-bottom: 4px;

            letter-spacing: .5px;
        }


        .code-value {

            color: #cbd8e7;

            font-weight: 800;
        }


        .button-row {

            display: flex;

            flex-wrap: wrap;

            gap: 9px;
        }


        button {

            border:
                1px solid rgba(49,140,255,.3);

            border-radius: 8px;

            padding: 9px 13px;

            color: #dcecff;

            background:
                rgba(49,140,255,.10);

            cursor: pointer;

            font:
                700
                10px
                Inter,
                sans-serif;

            letter-spacing: .2px;
        }


        button:hover {

            background:
                rgba(49,140,255,.18);

            border-color:
                rgba(49,140,255,.55);
        }


        button:disabled {

            opacity: .5;

            cursor: wait;
        }


        button.primary {

            color: white;

            background:
                linear-gradient(
                    135deg,
                    #1e74d8,
                    #167fbd
                );

            border-color:
                rgba(80,170,255,.5);
        }


        .request-info {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 9px;

            margin-top: 13px;
        }


        .request-box {

            padding: 10px;

            border:
                1px solid var(--line);

            border-radius: 8px;

            background:
                rgba(255,255,255,.018);
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

            font:
                11px
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;

            color: #c8d5e4;
        }


        textarea {

            width: 100%;

            min-height: 210px;

            resize: vertical;

            border:
                1px solid var(--line);

            border-radius: 9px;

            outline: none;

            padding: 13px;

            color: #cbd8e7;

            background: #070b11;

            font:
                11px/1.5
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
        }


        textarea:focus {

            border-color:
                rgba(49,140,255,.5);

            box-shadow:
                0 0 0 2px
                rgba(49,140,255,.08);
        }


        pre {

            margin: 0;

            max-height: 330px;

            overflow: auto;

            padding: 13px;

            border:
                1px solid var(--line);

            border-radius: 9px;

            color: #aebed0;

            background: #070b11;

            font:
                11px/1.5
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;

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

            font:
                800
                12px
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
        }


        .response-time {

            color: var(--muted);

            font:
                10px
                ui-monospace,
                SFMono-Regular,
                Menlo,
                monospace;
        }


        .notice {

            padding: 10px 12px;

            border:
                1px solid rgba(255,157,50,.16);

            border-radius: 8px;

            background:
                rgba(255,157,50,.045);

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


        @media (max-width: 1000px) {

            .codes {

                grid-template-columns:
                    repeat(4, 1fr);
            }


            .span-4,
            .span-6,
            .span-8 {

                grid-column: span 12;
            }

        }


        @media (max-width: 650px) {

            .container {

                width:
                    min(
                        100% - 22px,
                        1380px
                    );

                padding-top: 18px;
            }


            .header {

                align-items: flex-start;

                flex-direction: column;
            }


            .metrics,
            .request-info,
            .codes {

                grid-template-columns: 1fr;
            }

        }

    </style>

</head>


<body>


<main class="container">


    <header class="header">

        <div class="brand">

            <div class="logo">!</div>

            <div>

                <h1>

                    Telemetria
                    <span class="cyan">/</span>
                    Alertas

                </h1>


                <p class="subtitle">

                    Diagnóstico das rotas de entrada,
                    consulta e buffer dos alertas

                </p>

            </div>

        </div>


        <a
            class="back"
            href="/"
        >

            ← Painel principal

        </a>

    </header>



    <section class="grid">


        <!-- ================================================= -->
        <!-- ESTADO DA ROTA -->
        <!-- ================================================= -->

        <article class="card span-4">


            <div class="card-header">

                <h2>
                    ESTADO DA ROTA
                </h2>


                <span
                    id="routeBadge"
                    class="badge warning"
                >

                    AGUARDANDO

                </span>

            </div>


            <div class="card-body">


                <div
                    id="routeStatus"
                    class="big-status orange"
                >

                    <span class="dot"></span>

                    AGUARDANDO

                </div>


                <div class="meta">

                    <span>
                        GET /api/alertas/ultimo
                    </span>


                    <span id="lastCall">
                        —
                    </span>

                </div>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- RESUMO -->
        <!-- ================================================= -->

        <article class="card span-8">


            <div class="card-header">

                <h2>
                    ÚLTIMO ALERTA DO BUFFER
                </h2>


                <span
                    id="alertBadge"
                    class="badge warning"
                >

                    AGUARDANDO

                </span>

            </div>


            <div class="card-body">


                <div class="metrics">


                    <div class="metric">

                        <div class="metric-label">
                            Estado
                        </div>


                        <div
                            id="alertState"
                            class="metric-value orange"
                        >

                            —

                        </div>

                    </div>


                    <div class="metric">

                        <div class="metric-label">
                            Risco
                        </div>


                        <div
                            id="riskValue"
                            class="metric-value red"
                        >

                            —

                        </div>

                    </div>


                    <div class="metric">

                        <div class="metric-label">
                            Códigos
                        </div>


                        <div
                            id="codeCount"
                            class="metric-value cyan"
                        >

                            —

                        </div>

                    </div>

                </div>


                <div class="meta">

                    <span>
                        ORIGEM: buffer/telemetria
                    </span>


                    <span id="bufferInfo">
                        aguardando chamada
                    </span>

                </div>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- ALERTA -->
        <!-- ================================================= -->

        <article class="card span-12">


            <div class="card-header">

                <h2>
                    DETALHES DO ALERTA
                </h2>


                <span class="badge ok">
                    BUFFER
                </span>

            </div>


            <div class="card-body">


                <div class="alert-panel">


                    <div class="alert-header">


                        <div
                            id="alertTitle"
                            class="alert-title"
                        >

                            Nenhum alerta carregado

                        </div>


                        <span
                            id="riskBadge"
                            class="risk risk-unknown"
                        >

                            SEM DADOS

                        </span>

                    </div>


                    <div
                        id="alertMessage"
                        class="alert-message"
                    >

                        Faça uma consulta ao último
                        alerta para visualizar os dados
                        armazenados no buffer.

                    </div>


                    <div
                        id="codes"
                        class="codes"
                    >

                    </div>

                </div>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- GET -->
        <!-- ================================================= -->

        <article class="card span-6">


            <div class="card-header">

                <h2>
                    CHAMADAS GET
                </h2>


                <span class="badge ok">
                    SEM ALTERAÇÃO DE DADOS
                </span>

            </div>


            <div class="card-body">


                <div class="button-row">


                    <button
                        class="primary"
                        onclick="chamarUltimo()"
                    >

                        GET ÚLTIMO

                    </button>


                    <button
                        onclick="chamarTodos()"
                    >

                        GET TODOS

                    </button>

                </div>


                <div class="request-info">


                    <div class="request-box">

                        <label>
                            Último
                        </label>


                        <span>
                            /api/alertas/ultimo
                        </span>

                    </div>


                    <div class="request-box">

                        <label>
                            Todos
                        </label>


                        <span>
                            /api/alertas/todos
                        </span>

                    </div>

                </div>


                <div class="meta">


                    <span id="getMethod">
                        Nenhuma chamada
                    </span>


                    <span id="getTime">
                        —
                    </span>

                </div>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- POST -->
        <!-- ================================================= -->

        <article class="card span-6">


            <div class="card-header">

                <h2>
                    CHAMADA POST
                </h2>


                <span class="badge warning">
                    GRAVA NO SUPABASE
                </span>

            </div>


            <div class="card-body">


                <div class="notice">

                    Esta chamada executa a rota real
                    <b>POST /api/alertas</b>.

                    Ela atualiza o buffer e tenta inserir
                    o alerta na tabela <b>alertas</b>.

                    Use somente quando quiser fazer
                    um teste real.

                </div>


                <textarea id="postBody">{
  "alerta_ativo": true,
  "mensagem": "Teste de alerta",
  "risco": 1,
  "codigos": [
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ]
}</textarea>


                <div
                    class="button-row"
                    style="margin-top:10px"
                >


                    <button
                        class="primary"
                        onclick="enviarPost()"
                    >

                        ENVIAR POST

                    </button>


                    <button
                        onclick="formatarBody()"
                    >

                        FORMATAR JSON

                    </button>

                </div>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- RESPOSTA -->
        <!-- ================================================= -->

        <article class="card span-8">


            <div class="card-header">

                <h2>
                    RESPOSTA DA ÚLTIMA CHAMADA
                </h2>


                <span
                    id="responseBadge"
                    class="badge warning"
                >

                    SEM CHAMADA

                </span>

            </div>


            <div class="card-body">


                <div class="response-status">


                    <span
                        id="responseCode"
                        class="response-code"
                    >

                        —

                    </span>


                    <span
                        id="responseTime"
                        class="response-time"
                    >

                        —

                    </span>

                </div>


                <pre id="response">Nenhuma requisição realizada.</pre>

            </div>

        </article>



        <!-- ================================================= -->
        <!-- ROTAS -->
        <!-- ================================================= -->

        <article class="card span-4">


            <div class="card-header">

                <h2>
                    ROTAS RELACIONADAS
                </h2>


                <span class="badge ok">
                    API
                </span>

            </div>


            <div class="card-body">


                <div
                    class="meta"
                    style="margin-top:0"
                >

                    <span>
                        POST
                    </span>


                    <span>
                        /api/alertas
                    </span>

                </div>


                <div class="meta">

                    <span>
                        GET
                    </span>


                    <span>
                        /api/alertas/todos
                    </span>

                </div>


                <div class="meta">

                    <span>
                        GET
                    </span>


                    <span>
                        /api/alertas/ultimo
                    </span>

                </div>


                <div class="meta">

                    <span>
                        DIAGNÓSTICO
                    </span>


                    <span>
                        /api/alertas
                    </span>

                </div>

            </div>

        </article>


    </section>



    <footer class="footer">

        <span>
            Barcos Telemetria • Alert Route Diagnostic
        </span>


        <span id="footerTime">
            —
        </span>

    </footer>


</main>



<script>


// ============================================================
// UTILITÁRIOS
// ============================================================

const $ = (id) =>
    document.getElementById(id);


function agora() {

    return new Date()
        .toLocaleTimeString("pt-BR");

}


// ============================================================
// RESPOSTA
// ============================================================

function mostrarResposta(
    status,
    tempo,
    dados
) {

    $("responseCode").textContent =
        status
            ? String(status)
            : "ERRO";


    $("responseTime").textContent =
        tempo + " ms";


    $("response").textContent =
        typeof dados === "string"
            ? dados
            : JSON.stringify(
                dados,
                null,
                2
            );


    const badge =
        $("responseBadge");


    if (
        status >= 200 &&
        status < 300
    ) {

        badge.textContent =
            "SUCESSO";

        badge.className =
            "badge ok";

    } else {

        badge.textContent =
            "ERRO";

        badge.className =
            "badge error";

    }

}


// ============================================================
// STATUS DA ROTA
// ============================================================

function atualizarStatus(
    ok,
    texto,
    badgeTexto
) {

    const status =
        $("routeStatus");

    const badge =
        $("routeBadge");


    status.className =
        "big-status " +
        (ok ? "green" : "red");


    status.innerHTML =
        '<span class="dot"></span>' +
        texto;


    badge.textContent =
        badgeTexto;


    badge.className =
        "badge " +
        (ok ? "ok" : "error");

}


// ============================================================
// RISCO
// ============================================================

function atualizarRisco(risco) {

    const valor =
        Number(risco);


    const badge =
        $("riskBadge");

    const resumo =
        $("riskValue");


    badge.className =
        "risk";


    resumo.className =
        "metric-value";


    if (
        risco === null ||
        risco === undefined ||
        Number.isNaN(valor) ||
        valor === -2
    ) {

        badge.textContent =
            "SEM DADOS";

        badge.classList.add(
            "risk-unknown"
        );

        resumo.textContent =
            "—";

        resumo.classList.add(
            "orange"
        );

        return;

    }


    if (valor === 0) {

        badge.textContent =
            "BAIXO";

        badge.classList.add(
            "risk-low"
        );

        resumo.textContent =
            "BAIXO";

        resumo.classList.add(
            "green"
        );

        return;

    }


    if (valor === 1) {

        badge.textContent =
            "MÉDIO";

        badge.classList.add(
            "risk-medium"
        );

        resumo.textContent =
            "MÉDIO";

        resumo.classList.add(
            "orange"
        );

        return;

    }


    if (valor >= 2) {

        badge.textContent =
            "ALTO";

        badge.classList.add(
            "risk-high"
        );

        resumo.textContent =
            "ALTO";

        resumo.classList.add(
            "red"
        );

        return;

    }


    badge.textContent =
        String(risco);

    badge.classList.add(
        "risk-unknown"
    );

    resumo.textContent =
        String(risco);

    resumo.classList.add(
        "blue"
    );

}


// ============================================================
// ATUALIZAR ALERTA
// ============================================================

function atualizarAlerta(dados) {

    let ultimo = dados;


    /*
     * O buffer de alertas retorna o objeto
     * diretamente.
     *
     * Esta verificação também permite trabalhar
     * caso a resposta venha dentro de um array.
     */

    if (Array.isArray(dados)) {

        ultimo = dados[0];

    }


    if (!ultimo) {

        return;

    }


    const ativo =
        ultimo.alerta_ativo;


    const mensagem =
        ultimo.mensagem;


    const risco =
        ultimo.risco;


    const codigos =
        Array.isArray(ultimo.codigos)
            ? ultimo.codigos
            : [];


    // Estado

    if (ativo) {

        $("alertState").textContent =
            "ATIVO";

        $("alertState").className =
            "metric-value red";


        $("alertBadge").textContent =
            "ALERTA ATIVO";

        $("alertBadge").className =
            "badge error";


        $("alertTitle").textContent =
            "Alerta detectado";

    } else {

        $("alertState").textContent =
            "INATIVO";

        $("alertState").className =
            "metric-value green";


        $("alertBadge").textContent =
            "SEM ALERTA";

        $("alertBadge").className =
            "badge ok";


        $("alertTitle").textContent =
            "Nenhum alerta ativo";

    }


    // Mensagem

    $("alertMessage").textContent =
        mensagem !== null &&
        mensagem !== undefined
            ? String(mensagem)
            : "Sem mensagem";


    // Risco

    atualizarRisco(risco);


    // Códigos

    const container =
        $("codes");


    container.innerHTML =
        "";


    if (codigos.length === 0) {

        const vazio =
            document.createElement("div");

        vazio.className =
            "code";

        vazio.textContent =
            "Sem códigos";

        container.appendChild(
            vazio
        );

    } else {

        codigos.forEach(
            function(codigo, indice) {

                const card =
                    document.createElement("div");

                card.className =
                    "code";


                const label =
                    document.createElement("span");

                label.className =
                    "code-label";

                label.textContent =
                    "CÓDIGO " +
                    String(indice + 1)
                        .padStart(2, "0");


                const valor =
                    document.createElement("span");

                valor.className =
                    "code-value";

                valor.textContent =
                    codigo !== null &&
                    codigo !== undefined
                        ? String(codigo)
                        : "—";


                card.appendChild(
                    label
                );

                card.appendChild(
                    valor
                );


                container.appendChild(
                    card
                );

            }
        );

    }


    $("codeCount").textContent =
        codigos.length;


    $("bufferInfo").textContent =
        "última leitura: " +
        agora();

}


// ============================================================
// GET ÚLTIMO
// ============================================================

async function chamarUltimo() {

    const inicio =
        performance.now();


    $("getMethod").textContent =
        "GET /api/alertas/ultimo";


    $("getTime").textContent =
        "consultando...";


    try {

        const resposta =
            await fetch(
                "/api/alertas/ultimo"
            );


        const texto =
            await resposta.text();


        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        let dados;


        try {

            dados =
                JSON.parse(texto);

        } catch {

            dados =
                texto;

        }


        mostrarResposta(
            resposta.status,
            tempo,
            dados
        );


        if (resposta.ok) {

            atualizarStatus(
                true,
                "ONLINE",
                "200 OK"
            );


            atualizarAlerta(
                dados
            );

        } else {

            atualizarStatus(
                false,
                "ERRO",
                String(resposta.status)
            );

        }


        $("lastCall").textContent =
            agora();


        $("getTime").textContent =
            tempo + " ms";


    } catch (erro) {

        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        mostrarResposta(
            null,
            tempo,
            {
                erro: erro.message
            }
        );


        atualizarStatus(
            false,
            "SEM RESPOSTA",
            "FETCH ERROR"
        );


        $("getTime").textContent =
            tempo + " ms";

    }

}


// ============================================================
// GET TODOS
// ============================================================

async function chamarTodos() {

    const inicio =
        performance.now();


    $("getMethod").textContent =
        "GET /api/alertas/todos";


    $("getTime").textContent =
        "consultando...";


    try {

        const resposta =
            await fetch(
                "/api/alertas/todos"
            );


        const texto =
            await resposta.text();


        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        let dados;


        try {

            dados =
                JSON.parse(texto);

        } catch {

            dados =
                texto;

        }


        mostrarResposta(
            resposta.status,
            tempo,
            dados
        );


        if (resposta.ok) {

            atualizarStatus(
                true,
                "ONLINE",
                "200 OK"
            );


            $("bufferInfo").textContent =
                Array.isArray(dados)
                    ? dados.length +
                      " registros retornados"
                    : "resposta recebida";

        } else {

            atualizarStatus(
                false,
                "ERRO",
                String(resposta.status)
            );

        }


        $("lastCall").textContent =
            agora();


        $("getTime").textContent =
            tempo + " ms";


    } catch (erro) {

        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        mostrarResposta(
            null,
            tempo,
            {
                erro: erro.message
            }
        );


        atualizarStatus(
            false,
            "SEM RESPOSTA",
            "FETCH ERROR"
        );


        $("getTime").textContent =
            tempo + " ms";

    }

}


// ============================================================
// POST
// ============================================================

async function enviarPost() {

    let dados;


    try {

        dados =
            JSON.parse(
                $("postBody").value
            );

    } catch {

        mostrarResposta(
            400,
            0,
            {
                erro:
                    "JSON inválido no campo de teste"
            }
        );

        return;

    }


    const inicio =
        performance.now();


    try {

        const resposta =
            await fetch(
                "/api/alertas",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(dados)
                }
            );


        const texto =
            await resposta.text();


        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        let retorno;


        try {

            retorno =
                JSON.parse(texto);

        } catch {

            retorno =
                texto;

        }


        mostrarResposta(
            resposta.status,
            tempo,
            retorno
        );


        if (resposta.ok) {

            atualizarStatus(
                true,
                "ONLINE",
                "POST OK"
            );


            $("bufferInfo").textContent =
                "POST executado às " +
                agora();

        } else {

            atualizarStatus(
                false,
                "ERRO",
                String(resposta.status)
            );

        }


        $("lastCall").textContent =
            agora();


    } catch (erro) {

        const tempo =
            Math.round(
                performance.now() -
                inicio
            );


        mostrarResposta(
            null,
            tempo,
            {
                erro: erro.message
            }
        );


        atualizarStatus(
            false,
            "SEM RESPOSTA",
            "FETCH ERROR"
        );

    }

}


// ============================================================
// FORMATAR JSON
// ============================================================

function formatarBody() {

    try {

        const objeto =
            JSON.parse(
                $("postBody").value
            );


        $("postBody").value =
            JSON.stringify(
                objeto,
                null,
                2
            );

    } catch {

        alert(
            "O conteúdo atual não é um JSON válido."
        );

    }

}


// ============================================================
// INICIALIZAÇÃO
// ============================================================

$("footerTime").textContent =
    "Página aberta em " +
    agora();


</script>


</body>

</html>`);

});


module.exports = router;