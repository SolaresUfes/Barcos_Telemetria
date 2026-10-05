// const express = require("express");
// const router = express.Router();

// const supabase = require("../supabase")
// const buffer = require("../buffer/telemetria")


// // Rota para envio de dados individuais das celulas do barco (32)
// // POST > "/api/celulas"
// router.post("/", async (req, res) => {
//   // req.body receberá { "tensoes": [3.21, 5.49, 1.92, ...] }
//   const dados = req.body; 

//   // Verifica se a chave "cells" existe e se tem 16 valores
//   if (!dados.cells || dados.cells.length !== 16) {
//     return res.status(400).json({ erro: "Pacote incompleto ou inválido!" });
//   }

//   // Valida se algum valor dentro do array é nulo ou indefinido
//   for (let i = 0; i < dados.cells.length; i++) {
//     if (dados.cells[i] === undefined || dados.cells[i] === null) {
//       console.log(`Erro célula: ${i + 1}`);
//       return res.status(400).json({ erro: `élula ${i + 1} incompleta!` });
//     }
//   }

//   // Se tudo estiver certo, insere os dados no buffer correspondente
//   await buffer.atualizar_ult_Celulas(dados);

//   // Insere o array inteiro de uma só vez em uma única linha no Supabase
//   const { error } = await supabase.from("celulas").insert({
//     celula: dados.cells // Associa o array do JS à coluna do banco
//   });

//   if (error) {
//     console.error(error);
//     return res.status(500).json({ erro: error.message });
//   }

//   return res.status(200).json({ sucesso: true });
// });


// // Rota para a coleta dos dados de tensao nas celulas individuais
// // GET > "/api/celulas"
// router.get("/", async(req, res) => {
  
//   const { data, error } = await supabase
//     .from("celulas")
//     .select("*")

//   if (error) return res.status(500).json({erro: error.message});

//   res.json(data);
// });

// // Rota para a coleta do ultimo dado das medicoes individuais das celulas
// // GET > "/api/celulas/ultimo"
// router.get("/ultimo", async (req, res) => {
//     try {
//         const dados = await buffer.coletar_ult_Celulas();

//         res.json(dados);

//     } catch (erro) {
//         console.error(erro);

//         res.status(500).json({
//             erro: "Erro ao obter últimas células"
//         });
//     }
// });

// module.exports = router


const express = require("express");
const router = express.Router();

const supabase = require("../supabase");
const buffer = require("../buffer/telemetria");


// ============================================================
// POST /api/celulas
// Recebe os dados das 16 células
// ============================================================

router.post("/", async (req, res) => {
  // req.body receberá { "cells": [3.21, 5.49, 1.92, ...] }
  const dados = req.body;

  // Verifica se a chave "cells" existe e se tem 16 valores
  if (!dados.cells || dados.cells.length !== 16) {
    return res.status(400).json({
      erro: "Pacote incompleto ou inválido!"
    });
  }

  // Valida se algum valor dentro do array é nulo ou indefinido
  for (let i = 0; i < dados.cells.length; i++) {
    if (dados.cells[i] === undefined || dados.cells[i] === null) {
      console.log(`Erro célula: ${i + 1}`);

      return res.status(400).json({
        erro: `Célula ${i + 1} incompleta!`
      });
    }
  }

  // Se tudo estiver certo, insere os dados no buffer correspondente
  await buffer.atualizar_ult_Celulas(dados);

  // Insere o array inteiro de uma só vez em uma única linha no Supabase
  const { error } = await supabase
    .from("celulas")
    .insert({
      celula: dados.cells
    });

  if (error) {
    console.error(error);

    return res.status(500).json({
      erro: error.message
    });
  }

  return res.status(200).json({
    sucesso: true
  });
});


// ============================================================
// GET /api/celulas/todos
// Coleta todos os dados das células no Supabase
// ============================================================

router.get("/todos", async (req, res) => {

  const { data, error } = await supabase
    .from("celulas")
    .select("*");

  if (error) {
    return res.status(500).json({
      erro: error.message
    });
  }

  res.json(data);
});


// ============================================================
// GET /api/celulas/ultimo
// Coleta o último dado das células no buffer
// ============================================================

router.get("/ultimo", async (req, res) => {
  try {
    const dados = await buffer.coletar_ult_Celulas();

    res.json(dados);

  } catch (erro) {
    console.error(erro);

    res.status(500).json({
      erro: "Erro ao obter últimas células"
    });
  }
});


// ============================================================
// GET /api/celulas
// Página visual de diagnóstico
// ============================================================

router.get("/", (req, res) => {

  res.status(200).send(`<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Telemetria / Células</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #111315;
  color: #e8edf2;
  font-family: Arial, Helvetica, sans-serif;
}

button,
textarea {
  font-family: inherit;
}

.container {
  width: min(1250px, 94%);
  margin: 0 auto;
  padding: 28px 0 40px;
}

/* =========================================================
   CABEÇALHO
   ========================================================= */

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  background: #191c20;
  border: 1px solid #292e34;
  border-radius: 12px;

  padding: 20px 22px;
  margin-bottom: 18px;
}

.header-left h1 {
  margin: 0;
  font-size: 23px;
  letter-spacing: 0.5px;
}

.header-left p {
  margin: 6px 0 0;
  color: #89939d;
  font-size: 13px;
}

.route {
  color: #58b9ff;
  font-family: monospace;
}

.status-area {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #777;
}

.status-dot.online {
  background: #39d98a;
  box-shadow: 0 0 10px rgba(57, 217, 138, 0.5);
}

.status-dot.error {
  background: #ff5f56;
  box-shadow: 0 0 10px rgba(255, 95, 86, 0.45);
}

.status-text {
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 0.8px;
}

.status-code {
  color: #7d8791;
  font-family: monospace;
  font-size: 11px;
}


/* =========================================================
   GRID PRINCIPAL
   ========================================================= */

.grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px;
}

.card {
  background: #191c20;
  border: 1px solid #292e34;
  border-radius: 12px;
  padding: 18px;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 16px;

  color: #dfe6ec;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.card-title span:last-child {
  color: #69747f;
  font-family: monospace;
  font-size: 11px;
  font-weight: normal;
}


/* =========================================================
   CELULAS
   ========================================================= */

.cells-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 9px;
}

.cell {
  background: #131619;
  border: 1px solid #292e34;
  border-radius: 8px;

  padding: 12px 10px;

  min-height: 76px;

  transition:
    border-color 0.15s,
    background 0.15s;
}

.cell:hover {
  border-color: #367da8;
  background: #151a1e;
}

.cell-number {
  color: #6f7b85;
  font-size: 10px;
  font-family: monospace;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.cell-value {
  color: #55bdff;
  font-family: monospace;
  font-size: 17px;
  font-weight: bold;
}

.cell-temp {
  margin-top: 5px;
  color: #7e8993;
  font-family: monospace;
  font-size: 10px;
}


/* =========================================================
   RESUMO
   ========================================================= */

.metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.metric {
  background: #131619;
  border: 1px solid #292e34;
  border-radius: 8px;
  padding: 14px;
}

.metric-label {
  color: #717c86;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.metric-value {
  margin-top: 7px;

  color: #e8edf2;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
}


/* =========================================================
   BOTÕES
   ========================================================= */

.actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

button {
  border: 1px solid #30373e;
  border-radius: 7px;

  padding: 9px 13px;

  background: #20252a;
  color: #dbe4eb;

  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;

  cursor: pointer;

  transition:
    background 0.15s,
    border-color 0.15s;
}

button:hover {
  background: #293138;
  border-color: #4388b1;
}

button.primary {
  background: #173b50;
  border-color: #2b7198;
  color: #6cc8ff;
}

button.primary:hover {
  background: #1b4a63;
}


/* =========================================================
   POST
   ========================================================= */

textarea {
  width: 100%;
  min-height: 180px;

  resize: vertical;

  background: #101214;
  border: 1px solid #2b3036;
  border-radius: 8px;

  padding: 13px;

  color: #bcdfff;

  font-family: Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;

  outline: none;
}

textarea:focus {
  border-color: #367da8;
}

.post-info {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-top: 10px;

  color: #68737d;
  font-family: monospace;
  font-size: 10px;
}


/* =========================================================
   RESPOSTA
   ========================================================= */

.response {
  margin-top: 18px;
}

.response-head {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 8px;
}

.response-status {
  font-family: monospace;
  font-size: 11px;
}

.response-time {
  color: #6f7b85;
  font-family: monospace;
  font-size: 10px;
}

pre {
  margin: 0;

  max-height: 400px;
  overflow: auto;

  padding: 15px;

  background: #101214;
  border: 1px solid #292e34;
  border-radius: 8px;

  color: #b9c7d3;

  font-family: Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
}


/* =========================================================
   ROTAS
   ========================================================= */

.routes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;

  margin-top: 18px;
}

.route-item {
  background: #15181b;
  border: 1px solid #292e34;
  border-radius: 8px;

  padding: 11px;
}

.route-method {
  color: #58b9ff;
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
}

.route-path {
  margin-top: 5px;

  color: #dce3e9;
  font-family: monospace;
  font-size: 11px;
}

.route-desc {
  margin-top: 5px;

  color: #68737d;
  font-size: 10px;
}


/* =========================================================
   RESPONSIVO
   ========================================================= */

@media (max-width: 850px) {

  .grid {
    grid-template-columns: 1fr;
  }

  .cells-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .routes {
    grid-template-columns: 1fr;
  }

}

@media (max-width: 520px) {

  .header {
    align-items: flex-start;
    flex-direction: column;
    gap: 15px;
  }

  .cells-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .metrics {
    grid-template-columns: 1fr;
  }

}

</style>

</head>


<body>

<div class="container">


  <!-- =====================================================
       CABEÇALHO
       ===================================================== -->

  <div class="header">

    <div class="header-left">

      <h1>Telemetria / Células</h1>

      <p>
        Diagnóstico da rota
        <span class="route">/api/celulas</span>
      </p>

    </div>

    <div class="status-area">

      <div id="statusDot" class="status-dot"></div>

      <div>
        <div id="statusText" class="status-text">
          AGUARDANDO
        </div>

        <div id="statusCode" class="status-code">
          —
        </div>
      </div>

    </div>

  </div>


  <!-- =====================================================
       CONTEÚDO PRINCIPAL
       ===================================================== -->

  <div class="grid">


    <!-- ===================================================
         CÉLULAS
         =================================================== -->

    <div class="card">

      <div class="card-title">

        <span>Última leitura</span>

        <span id="bufferInfo">
          aguardando consulta
        </span>

      </div>


      <div class="cells-grid" id="cellsGrid">

        <!-- preenchido pelo JavaScript -->

      </div>


      <div class="actions">

        <button
          class="primary"
          onclick="chamarUltimo()"
        >
          ÚLTIMO
        </button>

        <button
          onclick="chamarTodos()"
        >
          TODOS
        </button>

      </div>

    </div>


    <!-- ===================================================
         RESUMO
         =================================================== -->

    <div class="card">

      <div class="card-title">

        <span>Resumo</span>

        <span>BUFFER</span>

      </div>


      <div class="metrics">

        <div class="metric">

          <div class="metric-label">
            Células
          </div>

          <div
            id="cellCount"
            class="metric-value"
          >
            —
          </div>

        </div>


        <div class="metric">

          <div class="metric-label">
            Temperaturas
          </div>

          <div
            id="tempCount"
            class="metric-value"
          >
            —
          </div>

        </div>


        <div class="metric">

          <div class="metric-label">
            Última chamada
          </div>

          <div
            id="lastCall"
            class="metric-value"
          >
            —
          </div>

        </div>


        <div class="metric">

          <div class="metric-label">
            Tempo
          </div>

          <div
            id="getTime"
            class="metric-value"
          >
            —
          </div>

        </div>

      </div>

    </div>

  </div>


  <!-- =====================================================
       POST
       ===================================================== -->

  <div class="card" style="margin-top:18px;">

    <div class="card-title">

      <span>Enviar dados</span>

      <span>POST /api/celulas</span>

    </div>


    <textarea id="postBody">{
  "cells": [
    3.21,
    3.22,
    3.20,
    3.21,
    3.22,
    3.20,
    3.21,
    3.22,
    3.20,
    3.21,
    3.22,
    3.20,
    3.21,
    3.22,
    3.20,
    3.21
  ]
}</textarea>


    <div class="post-info">

      <span>
        Corpo JSON enviado diretamente para a rota
      </span>

      <button
        class="primary"
        onclick="enviarPost()"
      >
        ENVIAR POST
      </button>

    </div>

  </div>


  <!-- =====================================================
       RESPOSTA
       ===================================================== -->

  <div class="card response">

    <div class="response-head">

      <div
        id="getMethod"
        class="response-status"
      >
        Nenhuma requisição realizada
      </div>

      <div
        id="responseTime"
        class="response-time"
      >
        —
      </div>

    </div>


    <pre id="response">
A resposta da API aparecerá aqui.
    </pre>

  </div>


  <!-- =====================================================
       ROTAS RELACIONADAS
       ===================================================== -->

  <div class="routes">

    <div class="route-item">

      <div class="route-method">
        DIAGNÓSTICO
      </div>

      <div class="route-path">
        /api/celulas
      </div>

      <div class="route-desc">
        Esta página
      </div>

    </div>


    <div class="route-item">

      <div class="route-method">
        GET
      </div>

      <div class="route-path">
        /api/celulas/ultimo
      </div>

      <div class="route-desc">
        Último pacote do buffer
      </div>

    </div>


    <div class="route-item">

      <div class="route-method">
        GET
      </div>

      <div class="route-path">
        /api/celulas/todos
      </div>

      <div class="route-desc">
        Histórico completo
      </div>

    </div>

  </div>


</div>


<script>

// ============================================================
// ELEMENTOS
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// DATA / HORA
// ============================================================

function agora() {

  return new Date().toLocaleTimeString("pt-BR");

}


// ============================================================
// STATUS
// ============================================================

function atualizarStatus(online, texto, codigo) {

  const dot = $("statusDot");

  dot.classList.remove("online", "error");

  if (online) {
    dot.classList.add("online");
  } else {
    dot.classList.add("error");
  }

  $("statusText").textContent = texto;

  $("statusCode").textContent = codigo;

}


// ============================================================
// RESPOSTA
// ============================================================

function mostrarResposta(status, tempo, dados) {

  $("responseTime").textContent =
    tempo + " ms";

  if (status === null) {

    $("getMethod").textContent =
      "FETCH ERROR";

  } else {

    $("getMethod").textContent =
      "HTTP " + status;

  }


  if (typeof dados === "string") {

    $("response").textContent = dados;

  } else {

    $("response").textContent =
      JSON.stringify(dados, null, 2);

  }

}


// ============================================================
// INICIALIZA CÉLULAS
// ============================================================

function inicializarCelulas() {

  const grid = $("cellsGrid");

  grid.innerHTML = "";

  for (let i = 0; i < 16; i++) {

    const div = document.createElement("div");

    div.className = "cell";

    div.innerHTML = \`
      <div class="cell-number">
        CÉLULA \${i + 1}
      </div>

      <div
        id="cell-\${i}"
        class="cell-value"
      >
        —
      </div>

      <div
        id="temp-\${i}"
        class="cell-temp"
      >
        TEMP: —
      </div>
    \`;

    grid.appendChild(div);

  }

}


// ============================================================
// ATUALIZA CÉLULAS
// ============================================================

function atualizarCelulas(dados) {

  const ultimo =
    Array.isArray(dados)
      ? dados[0]
      : dados;

  const celulas =
    ultimo?.celula;

  const temperaturas =
    ultimo?.temperatura;


  if (!Array.isArray(celulas)) {

    $("cellCount").textContent = "0";

    return;

  }


  $("cellCount").textContent =
    celulas.length;


  let temperaturasValidas = 0;


  for (let i = 0; i < 16; i++) {

    const valor = celulas[i];

    const temp =
      Array.isArray(temperaturas)
        ? temperaturas[i]
        : null;


    $("cell-" + i).textContent =
      valor != null && valor !== -2
        ? Number(valor).toFixed(3) + " V"
        : "—";


    if (
      temp != null &&
      temp !== -2
    ) {

      $("temp-" + i).textContent =
        "TEMP: " +
        Number(temp).toFixed(1) +
        " °C";

      temperaturasValidas++;

    } else {

      $("temp-" + i).textContent =
        "TEMP: —";

    }

  }


  $("tempCount").textContent =
    temperaturasValidas + "/16";

}


// ============================================================
// GET /api/celulas/ultimo
// ============================================================

async function chamarUltimo() {

  const inicio =
    performance.now();


  $("getMethod").textContent =
    "GET /api/celulas/ultimo";

  $("getTime").textContent =
    "consultando...";


  try {

    const resposta =
      await fetch("/api/celulas/ultimo");


    const texto =
      await resposta.text();


    const tempo =
      Math.round(
        performance.now() - inicio
      );


    let dados;


    try {

      dados =
        JSON.parse(texto);

    } catch {

      dados = texto;

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


      atualizarCelulas(dados);


      $("bufferInfo").textContent =
        "última leitura: " + agora();

    } else {

      atualizarStatus(
        false,
        "ERRO",
        resposta.status
      );

    }


    $("lastCall").textContent =
      agora();

    $("getTime").textContent =
      tempo + " ms";


  } catch (erro) {

    const tempo =
      Math.round(
        performance.now() - inicio
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
// GET /api/celulas/todos
// ============================================================

async function chamarTodos() {

  const inicio =
    performance.now();


  $("getMethod").textContent =
    "GET /api/celulas/todos";

  $("getTime").textContent =
    "consultando...";


  try {

    const resposta =
      await fetch("/api/celulas/todos");


    const dados =
      await resposta.json();


    const tempo =
      Math.round(
        performance.now() - inicio
      );


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
        resposta.status
      );

    }


    $("lastCall").textContent =
      agora();

    $("getTime").textContent =
      tempo + " ms";


  } catch (erro) {

    const tempo =
      Math.round(
        performance.now() - inicio
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
// POST /api/celulas
// ============================================================

async function enviarPost() {

  const inicio =
    performance.now();


  $("getMethod").textContent =
    "POST /api/celulas";

  $("responseTime").textContent =
    "enviando...";


  let body;


  try {

    body =
      JSON.parse(
        $("postBody").value
      );

  } catch (erro) {

    mostrarResposta(
      null,
      0,
      {
        erro: "JSON inválido",
        detalhe: erro.message
      }
    );

    atualizarStatus(
      false,
      "JSON INVÁLIDO",
      "CLIENT"
    );

    return;

  }


  try {

    const resposta =
      await fetch("/api/celulas", {

        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body:
          JSON.stringify(body)

      });


    const texto =
      await resposta.text();


    const tempo =
      Math.round(
        performance.now() - inicio
      );


    let dados;


    try {

      dados =
        JSON.parse(texto);

    } catch {

      dados = texto;

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
        resposta.status + " OK"
      );

    } else {

      atualizarStatus(
        false,
        "ERRO",
        resposta.status
      );

    }


    $("lastCall").textContent =
      agora();

    $("getTime").textContent =
      tempo + " ms";


  } catch (erro) {

    const tempo =
      Math.round(
        performance.now() - inicio
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
// INICIALIZAÇÃO
// ============================================================

inicializarCelulas();

</script>

</body>

</html>`);

});


module.exports = router;