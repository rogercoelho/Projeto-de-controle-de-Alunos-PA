const express = require("express");
const router = express.Router();
const Agendamento_Aulas = require("../models/Agendamento_Aulas");
const Horarios_Aulas = require("../models/Horarios_Aulas");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");
const { Op } = require("sequelize");

// Agendar aluno em horário
router.post("/create", async (req, res) => {
  try {
    const { horarioId, alunoCodigo } = req.body;

    // Validações básicas
    if (!horarioId || !alunoCodigo) {
      return res.status(400).json({
        Erro: "Horário e código do aluno são obrigatórios.",
      });
    }

    // Verifica se o horário existe
    const horario = await Horarios_Aulas.findOne({
      where: { Horario_Id: horarioId },
    });

    if (!horario) {
      return res.status(404).json({
        Erro: "Horário não encontrado.",
      });
    }

    // Verifica se o aluno existe
    const aluno = await Alunos_Cadastros.findOne({
      where: { Alunos_Codigo: alunoCodigo },
    });

    if (!aluno) {
      return res.status(404).json({
        Erro: "Aluno não encontrado.",
      });
    }

    // Verifica se já existe agendamento para este aluno neste horário
    const agendamentoExistente = await Agendamento_Aulas.findOne({
      where: {
        Horario_Id: horarioId,
        Aluno_Codigo: alunoCodigo,
      },
    });

    if (agendamentoExistente) {
      return res.status(400).json({
        Erro: "Este aluno já está agendado neste horário.",
      });
    }

    // Verifica capacidade do horário
    const agendamentosAtivos = await Agendamento_Aulas.count({
      where: { Horario_Id: horarioId },
    });

    if (agendamentosAtivos >= horario.Horario_Capacidade) {
      return res.status(400).json({
        Erro: "Este horário já atingiu a capacidade máxima de alunos.",
      });
    }

    // Cria o agendamento
    const novoAgendamento = await Agendamento_Aulas.create({
      Horario_Id: horarioId,
      Aluno_Codigo: alunoCodigo,
    });

    // Registra log de criação
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "CREATE",
      "Agendamento_Aulas",
      novoAgendamento.Agendamento_Id.toString(),
      `Aluno ${aluno.Alunos_Nome} agendado no horário ${horario.Horario_Inicio} - ${horario.Horario_Fim} (${horario.Horario_Dia_Semana})`,
      null,
      novoAgendamento.toJSON(),
    );

    res.status(201).json({
      Mensagem: "Aluno agendado com sucesso!",
      Agendamento: novoAgendamento,
    });
  } catch (error) {
    console.error("Erro ao agendar aluno:", error);
    res.status(500).json({
      Erro: "Erro ao agendar aluno.",
      Detalhes: error.message,
    });
  }
});

// Listar todos os agendamentos de um horário
router.get("/horario/:horarioId", async (req, res) => {
  try {
    const agendamentos = await Agendamento_Aulas.findAll({
      where: {
        Horario_Id: req.params.horarioId,
      },
      include: [
        {
          model: Alunos_Cadastros,
          as: "Aluno",
          attributes: ["Alunos_Codigo", "Alunos_Nome", "Alunos_Foto"],
        },
        {
          model: Horarios_Aulas,
          as: "Horario",
        },
      ],
      order: [["Data_Criacao", "ASC"]],
    });

    res.status(200).json({
      Mensagem: "Agendamentos listados com sucesso!",
      Agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({
      Erro: "Erro ao listar agendamentos.",
      Detalhes: error.message,
    });
  }
});

// Listar todos os agendamentos de um aluno
router.get("/aluno/:alunoCodigo", async (req, res) => {
  try {
    const agendamentos = await Agendamento_Aulas.findAll({
      where: {
        Aluno_Codigo: req.params.alunoCodigo,
      },
      include: [
        {
          model: Horarios_Aulas,
          as: "Horario",
        },
      ],
      order: [
        [{ model: Horarios_Aulas, as: "Horario" }, "Horario_Dia_Semana", "ASC"],
      ],
    });

    res.status(200).json({
      Mensagem: "Agendamentos do aluno listados com sucesso!",
      Agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao listar agendamentos do aluno:", error);
    res.status(500).json({
      Erro: "Erro ao listar agendamentos do aluno.",
      Detalhes: error.message,
    });
  }
});

// Listar todos os agendamentos ativos
router.get("/", async (req, res) => {
  try {
    const agendamentos = await Agendamento_Aulas.findAll({
      include: [
        {
          model: Alunos_Cadastros,
          as: "Aluno",
          attributes: ["Alunos_Codigo", "Alunos_Nome", "Alunos_Foto"],
        },
        {
          model: Horarios_Aulas,
          as: "Horario",
        },
      ],
      order: [
        [{ model: Horarios_Aulas, as: "Horario" }, "Horario_Dia_Semana", "ASC"],
        [{ model: Horarios_Aulas, as: "Horario" }, "Horario_Inicio", "ASC"],
      ],
    });

    res.status(200).json({
      Mensagem: "Agendamentos listados com sucesso!",
      Agendamentos: agendamentos,
    });
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({
      Erro: "Erro ao listar agendamentos.",
      Detalhes: error.message,
    });
  }
});

// Buscar alunos para agendamento (pesquisa por nome ou código)
router.get("/buscar-alunos", async (req, res) => {
  try {
    const { termo } = req.query;

    if (!termo) {
      return res.status(400).json({
        Erro: "Informe um termo de pesquisa.",
      });
    }

    const where = {
      [Op.or]: [{ Alunos_Nome: { [Op.like]: `%${termo}%` } }],
    };

    // Se o termo for número, busca também por código
    if (!isNaN(termo)) {
      where[Op.or].push({ Alunos_Codigo: parseInt(termo) });
    }

    const alunos = await Alunos_Cadastros.findAll({
      where,
      attributes: ["Alunos_Codigo", "Alunos_Nome", "Alunos_Foto"],
      limit: 20,
      order: [["Alunos_Nome", "ASC"]],
    });

    res.status(200).json({
      Mensagem: "Alunos encontrados!",
      Alunos: alunos,
    });
  } catch (error) {
    console.error("Erro ao buscar alunos:", error);
    res.status(500).json({
      Erro: "Erro ao buscar alunos.",
      Detalhes: error.message,
    });
  }
});

// Cancelar agendamento (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const agendamento = await Agendamento_Aulas.findOne({
      where: { Agendamento_Id: req.params.id },
      include: [
        {
          model: Alunos_Cadastros,
          as: "Aluno",
          attributes: ["Alunos_Nome"],
        },
        {
          model: Horarios_Aulas,
          as: "Horario",
        },
      ],
    });

    if (!agendamento) {
      return res.status(404).json({
        Erro: "Agendamento não encontrado.",
      });
    }

    const dadosAntigos = agendamento.toJSON();

    // Exclui o agendamento do banco
    await agendamento.destroy();

    // Registra log de exclusão
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "DELETE",
      "Agendamento_Aulas",
      dadosAntigos.Agendamento_Id.toString(),
      `Agendamento do aluno ${agendamento.Aluno?.Alunos_Nome || "N/A"} removido`,
      dadosAntigos,
      null,
    );

    res.status(200).json({
      Mensagem: "Agendamento cancelado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    res.status(500).json({
      Erro: "Erro ao cancelar agendamento.",
      Detalhes: error.message,
    });
  }
});

// Atualizar agendamento (trocar horário)
router.patch("/:id", async (req, res) => {
  try {
    const { novoHorarioId } = req.body;

    if (!novoHorarioId) {
      return res.status(400).json({
        Erro: "Novo horário é obrigatório.",
      });
    }

    const agendamento = await Agendamento_Aulas.findOne({
      where: { Agendamento_Id: req.params.id },
    });

    if (!agendamento) {
      return res.status(404).json({
        Erro: "Agendamento não encontrado.",
      });
    }

    // Verifica se o novo horário existe
    const novoHorario = await Horarios_Aulas.findOne({
      where: { Horario_Id: novoHorarioId },
    });

    if (!novoHorario) {
      return res.status(404).json({
        Erro: "Novo horário não encontrado.",
      });
    }

    // Verifica se já existe agendamento para este aluno no novo horário
    const agendamentoExistente = await Agendamento_Aulas.findOne({
      where: {
        Horario_Id: novoHorarioId,
        Aluno_Codigo: agendamento.Aluno_Codigo,
        Agendamento_Id: { [Op.ne]: agendamento.Agendamento_Id },
      },
    });

    if (agendamentoExistente) {
      return res.status(400).json({
        Erro: "Este aluno já está agendado no novo horário.",
      });
    }

    // Verifica capacidade do novo horário
    const agendamentosAtivos = await Agendamento_Aulas.count({
      where: { Horario_Id: novoHorarioId },
    });

    if (agendamentosAtivos >= novoHorario.Horario_Capacidade) {
      return res.status(400).json({
        Erro: "O novo horário já atingiu a capacidade máxima de alunos.",
      });
    }

    const dadosAntigos = agendamento.toJSON();

    // Atualiza o horário
    await agendamento.update({ Horario_Id: novoHorarioId });

    // Registra log de alteração
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "UPDATE",
      "Agendamento_Aulas",
      agendamento.Agendamento_Id.toString(),
      `Agendamento alterado para horário ${novoHorario.Horario_Inicio} - ${novoHorario.Horario_Fim}`,
      dadosAntigos,
      agendamento.toJSON(),
    );

    res.status(200).json({
      Mensagem: "Agendamento atualizado com sucesso!",
      Agendamento: agendamento,
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({
      Erro: "Erro ao atualizar agendamento.",
      Detalhes: error.message,
    });
  }
});

module.exports = router;
