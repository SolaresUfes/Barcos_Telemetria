const express = require("express");
const router = express.Router();

const supabase = require("../supabase")

const buffer = require("../buffer/telemetria");

// Rota pra envio dos dados dos alertas pro Supabase.
// Os dados da tabela de alertas seguem o padrão codigo | mensagem | risco
// POST > "/api/alertas"
router.post("/", async (req, res) => {
  // Define a variavel 'dados' como a receptora dos dados vindos do cliente (ESP) (req.body sao os dados que estao no json que o esp esta enviando).
  const dados = req.body;

  // validar se há dados no documento que foi enviado. Provavelmente nao sera usado, mas é bom pra evitar dar ruim no banco depois.
  if (!dados.alerta_ativo) {
    // Se não houver dados de alerta, retorna erro do cliente de envio de nada.
    return res.status(400).json({ erro: "Não há alertas" });
  }

  await buffer.atualizar_ult_Alertas(dados);

  // salvar no banco. O json precisa estar configurado com os nomes certos das colunas e com os valores corretos.
  const dados_supabase = {
      mensagem: dados.mensagem,
      risco: dados.risco,
      codigos: dados.codigos
  };

const { error } = await supabase
    .from("alertas")
    .insert(dados_supabase);
  if (error) {
    console.error(error);
    return res.status(500).json({ erro: error.message });
  }

  // responder
  res.status(200).json({ status: "ok" });
});


// Rota para a coleta dos dados de alertas
// GET > "/api/alertas"
router.get("/", async (req, res) => {
  
  const { data, error } = await supabase  
    .from("alertas")
    .select("*");

  if (error) {
    return res.status(500).json({erro: error.message})
  }

  res.json(data);
});

// Rota para a coleta do dado do ultimo alerta
// GET > "/api/alertas/ultimo"
// router.get("/ultimo", async (req, res) => {
//   res.json(buffer.coletar_ult_Alertas());
// });

router.get("/ultimo", async (req, res) => {
    try {
        const dados = await buffer.coletar_ult_Alertas();

        res.json(dados);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: "Erro ao obter últimos alertas"
        });
    }
});


module.exports = router






