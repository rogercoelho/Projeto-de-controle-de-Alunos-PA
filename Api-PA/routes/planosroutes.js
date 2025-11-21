const express = require("express");
const router = express.Router();
const Planos_Cadastro = require("../models/Planos_Cadastro");

// Cadastrar novo plano
router.post("/create", async (req, res) => {
  try {
    const { codigo, nome, quantidadeSemana, tipoPagamento, valor } = req.body;

    // Validações
    if (!codigo || !nome || !quantidadeSemana || !tipoPagamento || !valor) {
      return res.status(400).json({
        Erro: "Todos os campos são obrigatórios.",
      });
    }

    // Verifica se o código já existe
    const planoExistente = await Planos_Cadastro.findOne({
      where: { Plano_Cod: codigo },
    });

    if (planoExistente) {
      return res.status(400).json({
        Erro: "Já existe um plano com este código.",
      });
    }

    // Cria o plano
    const novoPlano = await Planos_Cadastro.create({
      Plano_Cod: codigo,
      Plano_Nome: nome,
      Plano_Quantidade_Semana: quantidadeSemana,
      Plano_Pagamento: tipoPagamento,
      Plano_Valor: valor,
      Plano_Ativo: "Ativo",
    });

    res.status(201).json({
      Mensagem: "Plano cadastrado com sucesso!",
      Plano: novoPlano,
    });
  } catch (error) {
    console.error("Erro ao cadastrar plano:", error);
    res.status(500).json({
      Erro: "Erro ao cadastrar plano.",
      Detalhes: error.message,
    });
  }
});

// Listar todos os planos
router.get("/", async (req, res) => {
  try {
    const planos = await Planos_Cadastro.findAll({
      order: [["Plano_Cod", "ASC"]],
    });

    res.status(200).json({
      Mensagem: "Planos listados com sucesso!",
      Planos: planos,
    });
  } catch (error) {
    console.error("Erro ao listar planos:", error);
    res.status(500).json({
      Erro: "Erro ao listar planos.",
      Detalhes: error.message,
    });
  }
});

// Pesquisar planos
router.get("/search", async (req, res) => {
  try {
    const { codigo, nome } = req.query;
    const where = {};

    if (codigo) {
      where.Plano_Cod = { [require("sequelize").Op.like]: `%${codigo}%` };
    }
    if (nome) {
      where.Plano_Nome = { [require("sequelize").Op.like]: `%${nome}%` };
    }

    const planos = await Planos_Cadastro.findAll({
      where,
      order: [["Plano_Cod", "ASC"]],
    });

    res.status(200).json({
      Mensagem: "Pesquisa realizada com sucesso!",
      Planos: planos,
    });
  } catch (error) {
    console.error("Erro ao pesquisar planos:", error);
    res.status(500).json({
      Erro: "Erro ao pesquisar planos.",
      Detalhes: error.message,
    });
  }
});

// Buscar plano por código
router.get("/:codigo", async (req, res) => {
  try {
    const plano = await Planos_Cadastro.findOne({
      where: { Plano_Cod: req.params.codigo },
    });

    if (!plano) {
      return res.status(404).json({
        Erro: "Plano não encontrado.",
      });
    }

    res.status(200).json({
      Mensagem: "Plano encontrado!",
      Plano: plano,
    });
  } catch (error) {
    console.error("Erro ao buscar plano:", error);
    res.status(500).json({
      Erro: "Erro ao buscar plano.",
      Detalhes: error.message,
    });
  }
});

// Atualizar plano
router.patch("/update/:codigo", async (req, res) => {
  try {
    const { nome, quantidadeSemana, tipoPagamento, valor, ativo } = req.body;

    const plano = await Planos_Cadastro.findOne({
      where: { Plano_Cod: req.params.codigo },
    });

    if (!plano) {
      return res.status(404).json({
        Erro: "Plano não encontrado.",
      });
    }

    await plano.update({
      ...(nome && { Plano_Nome: nome }),
      ...(quantidadeSemana && { Plano_Quantidade_Semana: quantidadeSemana }),
      ...(tipoPagamento && { Plano_Pagamento: tipoPagamento }),
      ...(valor && { Plano_Valor: valor }),
      ...(ativo && { Plano_Ativo: ativo }),
    });

    res.status(200).json({
      Mensagem: "Plano atualizado com sucesso!",
      Plano: plano,
    });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    res.status(500).json({
      Erro: "Erro ao atualizar plano.",
      Detalhes: error.message,
    });
  }
});

// Deletar plano
router.delete("/delete/:codigo", async (req, res) => {
  try {
    const plano = await Planos_Cadastro.findOne({
      where: { Plano_Cod: req.params.codigo },
    });

    if (!plano) {
      return res.status(404).json({
        Erro: "Plano não encontrado.",
      });
    }

    await plano.destroy();

    res.status(200).json({
      Mensagem: "Plano deletado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao deletar plano:", error);
    res.status(500).json({
      Erro: "Erro ao deletar plano.",
      Detalhes: error.message,
    });
  }
});

module.exports = router;
