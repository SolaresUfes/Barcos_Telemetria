// Coloca o 'express' como framework (base) a ser usado
// Cria o backend usando o express e o nomeia 'app'
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());

// Link: https://painel-f8r7.vercel.app/ 

// Cria a conexão com o supabase
const { createClient } = require("@supabase/supabase-js");

// Faz o backend usar json como formato de arquivo
app.use(express.json());

const supabase_url = "https://lnlvfdpkkmneypmdwqta.supabase.co";
const supabase_key =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubHZmZHBra21uZXlwbWR3cXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDMxMzIsImV4cCI6MjA4ODcxOTEzMn0.jaqG2b6eBeSAwlwiDsCZnikoBtX3BOWNTVyppigVqBU";

// Cria o cliente (objeto que referencia ao cliente 'Supabase').
const supabase = createClient(supabase_url, supabase_key);

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

// Rota para teste
app.get("/", (req, res) => {
  res.send("Backend minimamente funcional 👍 (na minha máquina ta rodando)");
});


// Rota pra envio dos dados dos sensores pro supabase.
// Os dados da tabela de medições do supabase são: tensao | corrente
app.post("/api/sensores", async (req, res) => {
  // Define a variavel 'dados' como a receptora dos dados vindos do cliente (ESP) (req.body sao os dados que estao no json que o esp esta enviando).
  const dados = req.body;

  // 1. validar se há dados no documento que foi enviado. Provavelmente nao sera usado, mas é bom pra evitar dar ruim no banco depois.
  if (dados.tensao == null || dados.corrente == null) {
    // Se não houver dados de temperatura, retorna erro do cliente de envio de nada.
    return res
      .status(400)
      .json({ erro: "faltando algum dado: tensao ou corrente" });
  }

  // 2. salvar no banco. O json precisa estar configurado com os nomes certos das colunas e com os valores corretos.
  await supabase.from("medicoes").insert(dados);

  // 3. responder
  res.status(200).json({ status: "ok" });
});

// Rota pra envio dos dados dos alertas pro Supabase.
// Os dados da tabela de alertas seguem o padrão codigo | mensagem | risco
app.post("/api/alertas", async (req, res) => {
  // Define a variavel 'dados' como a receptora dos dados vindos do cliente (ESP) (req.body sao os dados que estao no json que o esp esta enviando).
  const dados = req.body;

  // validar se há dados no documento que foi enviado. Provavelmente nao sera usado, mas é bom pra evitar dar ruim no banco depois.
  if (!dados.alerta_ativo) {
    // Se não houver dados de alerta, retorna erro do cliente de envio de nada.
    return res.status(400).json({ erro: "Não há alertas" });
  }

  // salvar no banco. O json precisa estar configurado com os nomes certos das colunas e com os valores corretos.
  await supabase.from("alertas").insert(dados);

  // responder
  res.status(200).json({ status: "ok" });
});

// Rota para envio de dados individuais das celulas do barco (32)
app.post("/api/celulas", async (req, res) => {
    // req.body receberá { "tensoes": [3.21, 5.49, 1.92, ...] }
    const dados = req.body; 

    // Verifica se a chave "cells" existe e se tem 16 valores
    if (!dados.cells || dados.cells.length !== 16) {
        return res.status(400).json({ erro: "Pacote incompleto ou inválido!" });
    }

    // Valida se algum valor dentro do array é nulo ou indefinido
    for (let i = 0; i < dados.cells.length; i++) {
        if (dados.cells[i] === undefined || dados.cells[i] === null) {
            console.log(`Erro célula: ${i + 1}`);
            return res.status(400).json({ erro: `élula ${i + 1} incompleta!` });
        }
    }

    // Insere o array inteiro de uma só vez em uma única linha no Supabase
    const { error } = await supabase.from("celulas").insert({
        celula: dados.cells // Associa o array do JS à coluna do banco
    });

    if (error) {
        console.error(error);
        return res.status(500).json({ erro: error.message });
    }

    return res.status(200).json({ sucesso: true });
});


// Rota para a coleta dos dados das medicoes
app.get("/api/sensores", async (req, res) => {

  const { data, error } = await supabase
    .from("medicoes")
    .select("*");
    
  if (error) {
    return res.status(500).json({erro: error.message})
  }

  res.json(data)
});

// Rota para coleta dos dados da ultima medição
app.get("/api/sensores/ultimo", async (req, res) => {
  
  const { data, error } = await supabase
    .from("medicoes")
    .select("*")
    .order("id", {ascending:false})
    .limit(1);

  if (error) {
    return res.status(500).json({erro: error.message});
  }

  res.json(data);
});

// Rota para a coleta dos dados de alertas
app.get("/api/alertas", async (req, res) => {
  
  const { data, error } = await supabase  
    .from("alertas")
    .select("*");

  if (error) {
    return res.status(500).json({erro: error.message})
  }

  res.json(data);
});

// Rota para a coleta do dado do ultimo alerta
app.get("/api/alertas/ultimo", async (req, res) => {
  
  const { data, error } = await supabase
    .from("alertas")
    .select("*")
    .order("id", {ascending: false})
    .limit(1);

  if (error) return res.status(500).json({erro: error.message});
  
  res.json(data);
});

// Rota para a coleta dos dados de tensao nas celulas individuais
app.get("/api/celulas", async(req, res) => {
  
  const { data, error } = await supabase
    .from("celulas")
    .select("*")

  if (error) return res.status(500).json({erro: error.message});

  res.json(data);
});

// // Rota para a coleta do ultimo dado das medicoes individuais das celulas
app.get("/api/celulas/ultimo", async(req, res) => {
  
  const { data, error } = await supabase
    .from("celulas")
    .select("*")
    .order("id", {ascending: false})
    .limit(1);

  if (error) return res.status(500).json({erro: error.message});

  res.json(data);
});

// Para fazer o vercel funcionar
module.exports = app