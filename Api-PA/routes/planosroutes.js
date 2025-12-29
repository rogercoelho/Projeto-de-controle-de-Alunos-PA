const express = require("express");
const router = express.Router();
const Planos_Cadastro = require("../models/Planos_Cadastro");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");

// Cadastrar novo plano
router.post("/create", async (req, res) => {
  try {
    const {
      codigo,
      nome,
      quantidadeSemana,
      tipoPagamento,
      valor,
      contador_habilitado,
      contador_limite,
      wet_value,
    } = req.body;

    // Validações básicas
    if (!codigo || !nome || !quantidadeSemana || !tipoPagamento || !valor) {
      return res.status(400).json({
        Erro: "Todos os campos são obrigatórios.",
      });
    }

    // Se contador habilitado, obrigar limite e valor
    const contadorHabilitadoBool = !!contador_habilitado;
    if (contadorHabilitadoBool) {
      if (!contador_limite || !wet_value) {
        return res.status(400).json({
          Erro: "Quando o contador está habilitado, informe 'contador_limite' e 'wet_value'.",
        });
      }
    }

    // Verifica se o código já existe
    const planoExistente = await Planos_Cadastro.findOne({
      where: { Plano_Codigo: codigo },
    });

    if (planoExistente) {
      return res.status(400).json({
        Erro: "Já existe um plano com este código.",
      });
    }

    // Cria o plano
    const novoPlano = await Planos_Cadastro.create({
      Plano_Codigo: codigo,
      Plano_Nome: nome,
      Plano_Quantidade_Semana: quantidadeSemana,
      Plano_Pagamento: tipoPagamento,
      Plano_Valor: valor,
      Plano_Contador_Habilitado: contadorHabilitadoBool,
      Plano_Contador_Limite: contador_limite || null,
      Plano_Wet_Valor: wet_value || null,
      Plano_Ativo: "Ativo",
    });

    // Registra log de criação do plano
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "CREATE",
      "Planos_Cadastro",
      codigo,
      `Plano ${nome} cadastrado`,
      null,
      novoPlano.toJSON()
    );

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
      order: [["Plano_Codigo", "ASC"]],
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
      where.Plano_Codigo = { [require("sequelize").Op.like]: `%${codigo}%` };
    }
    if (nome) {
      where.Plano_Nome = { [require("sequelize").Op.like]: `%${nome}%` };
    }

    const planos = await Planos_Cadastro.findAll({
      where,
      order: [["Plano_Codigo", "ASC"]],
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
      where: { Plano_Codigo: req.params.codigo },
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
    const {
      nome,
      quantidadeSemana,
      tipoPagamento,
      valor,
      ativo,
      contador_habilitado,
      contador_limite,
      wet_value,
    } = req.body;

    const plano = await Planos_Cadastro.findOne({
      where: { Plano_Codigo: req.params.codigo },
    });

    if (!plano) {
      return res.status(404).json({
        Erro: "Plano não encontrado.",
      });
    }

    const dadosAntigos = plano.toJSON();

    await plano.update({
      ...(nome && { Plano_Nome: nome }),
      ...(quantidadeSemana && { Plano_Quantidade_Semana: quantidadeSemana }),
      ...(tipoPagamento && { Plano_Pagamento: tipoPagamento }),
      ...(valor && { Plano_Valor: valor }),
      ...(ativo && { Plano_Ativo: ativo }),
      ...(contador_habilitado !== undefined && {
        Plano_Contador_Habilitado: !!contador_habilitado,
      }),
      ...(contador_limite !== undefined && {
        Plano_Contador_Limite: contador_limite,
      }),
      ...(wet_value !== undefined && { Plano_Wet_Valor: wet_value }),
    });

    // Registra log de atualização do plano
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "UPDATE",
      "Planos_Cadastro",
      plano.Plano_Codigo,
      `Plano ${plano.Plano_Codigo} atualizado`,
      dadosAntigos,
      plano.toJSON()
    );

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
      where: { Plano_Codigo: req.params.codigo },
    });

    if (!plano) {
      return res.status(404).json({
        Erro: "Plano não encontrado.",
      });
    }

    const dadosApagados = plano.toJSON();
    await plano.destroy();

    // Registra log de exclusão do plano
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "DELETE",
      "Planos_Cadastro",
      plano.Plano_Codigo,
      `Plano ${plano.Plano_Codigo} excluído`,
      dadosApagados,
      null
    );

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
