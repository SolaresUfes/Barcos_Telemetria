const express = require("express");
const router = express.Router();

const supabase = require("../supabase")

const buffer = require("../buffer/telemetria")

// Rota pra envio dos dados dos sensores pro supabase.
// Os dados da tabela de medições do supabase são: tensao | corrente

// POST > "/api/sensores/"
// router.post("/", async (req, res) => {
//   // Define a variavel 'dados' como a receptora dos dados vindos do cliente (ESP) (req.body sao os dados que estao no json que o esp esta enviando).
//   const dados = req.body;

//   // validar se há dados no documento que foi enviado. Provavelmente nao sera usado, mas é bom pra evitar dar ruim no banco depois.
//   if (dados.tensao == null || dados.corrente == null) {
//     // Se não houver dados de temperatura, retorna erro do cliente de envio de nada.
//     return res
//         .status(400)
//         .json({ erro: "faltando algum dado: tensao ou corrente" });
//   }

//   buffer.atualizar_ult_Sensores(dados);

//   // salvar no banco. O json precisa estar configurado com os nomes certos das colunas e com os valores corretos.
//   await supabase.from("medicoes").insert(dados);

//   // responder
//   res.status(200).json({ status: "ok" });
// });

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
// GET > "/api/sensores/"
router.get("/", async (req, res) => {

  const { data, error } = await supabase
    .from("medicoes")
    .select("*");
  if (error) {
    return res.status(500).json({erro: error.message})
  }

  res.json(data)
});


// Rota para coleta dos dados da ultima medição
// GET > "/api/sensores/ultimo/"
// router.get("/ultimo", async (req, res) => {
//   console.log("BUFEER SENSORES: ", buffer.coletar_ult_Sensores())
//   res.json(buffer.coletar_ult_Sensores());
// });

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


module.exports = router;