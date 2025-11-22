const express = require("express");
const router = express.Router();
const Planos_Cadastro = require("../models/Planos_Cadastro");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Alunos_Faturamento = require("../models/Alunos_Faturamento");

// Rota para buscar todos os alunos com faturamentos pendentes
router.get("/pendentes", async (req, res) => {
  try {
    // Busca todos os Aluno_Codigo distintos com Faturamento_Data_Pagamento nulo
    const pendentes = await Alunos_Faturamento.findAll({
      where: { Faturamento_Data_Pagamento: null },
      attributes: ["Aluno_Codigo"],
      group: ["Aluno_Codigo"],
      raw: true,
    });

    // Busca os dados dos alunos na tabela Alunos_Cadastros
    const codigos = pendentes.map((p) => p.Aluno_Codigo);
    let alunos = [];
    if (codigos.length > 0) {
      alunos = await Alunos_Cadastros.findAll({
        where: { Alunos_Codigo: codigos },
        attributes: ["Alunos_Codigo", "Alunos_Nome"],
        raw: true,
      });
    }

    res.json({ alunos });
  } catch (error) {
    res.status(500).json({ Erro: "Erro ao buscar alunos com pendências." });
  }
});

// Rota para buscar faturamentos pendentes de um aluno
router.get("/pendentes/:Aluno_Codigo", async (req, res) => {
  try {
    const { Aluno_Codigo } = req.params;
    const faturamentos = await Alunos_Faturamento.findAll({
      where: {
        Aluno_Codigo,
        Faturamento_Data_Pagamento: null,
      },
    });
    res.json({ faturamentos });
  } catch (error) {
    res.status(500).json({ Erro: "Erro ao buscar faturamentos pendentes." });
  }
});

// POST /faturamento/registrar-faturamento
router.post("/registrar-faturamento", async (req, res) => {
  try {
    const {
      Aluno_Codigo,
      Plano_Codigo,
      Faturamento_Inicio,
      Faturamento_Fim,
      Faturamento_Valor_Total,
    } = req.body;
    if (
      !Aluno_Codigo ||
      !Plano_Codigo ||
      !Faturamento_Inicio ||
      !Faturamento_Fim
    ) {
      return res
        .status(400)
        .json({ Erro: "Todos os campos são obrigatórios." });
    }

    // Verifica se aluno existe
    const aluno = await Alunos_Cadastros.findOne({
      where: { Alunos_Codigo: Aluno_Codigo },
    });
    if (!aluno) {
      return res.status(404).json({ Erro: "Aluno não encontrado." });
    }

    // Verifica se plano existe
    const plano = await Planos_Cadastro.findOne({
      where: { Plano_Codigo: Plano_Codigo },
    });
    if (!plano) {
      return res.status(404).json({ Erro: "Plano não encontrado." });
    }

    // Cria o faturamento
    const novoFaturamento = await Alunos_Faturamento.create({
      Aluno_Codigo,
      Plano_Codigo,
      Faturamento_Inicio,
      Faturamento_Fim,
      Faturamento_Valor_Total: Faturamento_Valor_Total ?? null,
    });

    res.status(201).json({
      Mensagem: "Faturamento registrado com sucesso!",
      Faturamento: novoFaturamento,
    });
  } catch (error) {
    console.error("Erro ao registrar faturamento:", error);
    res.status(500).json({
      Erro: "Erro ao registrar faturamento.",
      Detalhes: error.message,
    });
  }
});

// PATCH /faturamento/registrar-pagamento
router.patch("/registrar-pagamento", async (req, res) => {
  try {
    const { pagamentos } = req.body; // [{ id, Faturamento_Data_Pagamento, Faturamento_Desconto, Faturamento_Motivo }]
    if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
      return res.status(400).json({ Erro: "Nenhum pagamento enviado." });
    }
    const resultados = [];
    for (const pag of pagamentos) {
      const {
        id,
        Faturamento_Data_Pagamento,
        Faturamento_Desconto,
        Faturamento_Motivo,
      } = pag;
      if (!id) continue;
      const [updated] = await Alunos_Faturamento.update(
        {
          Faturamento_Data_Pagamento: Faturamento_Data_Pagamento || null,
          Faturamento_Desconto: Faturamento_Desconto || null,
          Faturamento_Motivo: Faturamento_Motivo || null,
        },
        { where: { id } }
      );
      resultados.push({ id, atualizado: !!updated });
    }
    res.json({ Mensagem: "Pagamentos registrados.", resultados });
  } catch (error) {
    console.error("Erro ao registrar pagamento:", error);
    res
      .status(500)
      .json({ Erro: "Erro ao registrar pagamento.", Detalhes: error.message });
  }
});

module.exports = router;
