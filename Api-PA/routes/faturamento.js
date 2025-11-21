const express = require("express");
const router = express.Router();
const Alunos_Faturamento = require("../models/Alunos_Faturamento");
const Planos_Cadastro = require("../models/Planos_Cadastro");

// POST: Registrar faturamento
router.post("/registrar-faturamento", async (req, res) => {
  try {
    const { Aluno_Codigo, Plano_Codigo, Faturamento_Inicio } = req.body;
    if (!Aluno_Codigo || !Plano_Codigo || !Faturamento_Inicio) {
      return res
        .status(400)
        .json({ Erro: "Dados obrigatórios não informados." });
    }

    // Busca o plano para saber o tipo
    const plano = await Planos_Cadastro.findOne({ where: { Plano_Codigo } });
    if (!plano) {
      return res.status(404).json({ Erro: "Plano não encontrado." });
    }

    // Calcula a data de fim conforme o tipo do plano
    const inicio = new Date(Faturamento_Inicio);
    let meses = 1;
    if (plano.Plano_Pagamento === "Trimestral") meses = 3;
    else if (plano.Plano_Pagamento === "Semestral") meses = 6;
    else if (plano.Plano_Pagamento === "Anual") meses = 12;
    // Mensal é 1 mês
    const fim = new Date(inicio);
    fim.setMonth(fim.getMonth() + meses);

    // Grava no banco
    const novoFaturamento = await Alunos_Faturamento.create({
      Aluno_Codigo,
      Plano_Codigo,
      Faturamento_Inicio,
      Faturamento_Fim: fim.toISOString().slice(0, 10),
    });

    res
      .status(201)
      .json({
        Mensagem: "Faturamento registrado com sucesso!",
        Faturamento: novoFaturamento,
      });
  } catch (error) {
    console.error("Erro ao registrar faturamento:", error);
    res
      .status(500)
      .json({
        Erro: "Erro ao registrar faturamento.",
        Detalhes: error.message,
      });
  }
});

module.exports = router;
