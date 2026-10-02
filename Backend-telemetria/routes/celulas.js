const express = require("express");
const router = express.Router();

const supabase = require("../supabase")


// Rota para envio de dados individuais das celulas do barco (32)
// POST > "/api/celulas"
router.post("/", async (req, res) => {
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


// Rota para a coleta dos dados de tensao nas celulas individuais
// GET > "/api/celulas"
router.get("/", async(req, res) => {
  
  const { data, error } = await supabase
    .from("celulas")
    .select("*")

  if (error) return res.status(500).json({erro: error.message});

  res.json(data);
});

// Rota para a coleta do ultimo dado das medicoes individuais das celulas
// GET > "/api/celulas/ultimo"
router.get("/ultimo", async(req, res) => {
  
  const { data, error } = await supabase
    .from("celulas")
    .select("*")
    .order("id", {ascending: false})
    .limit(1);

  if (error) return res.status(500).json({erro: error.message});

  res.json(data);
});


module.exports = router


