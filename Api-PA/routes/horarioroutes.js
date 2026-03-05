const express = require("express");
const router = express.Router();
const Horarios_Aulas = require("../models/Horarios_Aulas");
const Agendamento_Aulas = require("../models/Agendamento_Aulas");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");

// Cadastrar novo horário
router.post("/create", async (req, res) => {
  try {
    const { horarioInicio, horarioFim, capacidade, diaSemana } = req.body;

    // Validações básicas
    if (!horarioInicio || !horarioFim || !capacidade || !diaSemana) {
      return res.status(400).json({
        Erro: "Todos os campos são obrigatórios.",
      });
    }

    // Valida se capacidade é maior que 0
    if (capacidade < 1) {
      return res.status(400).json({
        Erro: "A capacidade deve ser maior que 0.",
      });
    }

    // Verifica se já existe um horário igual no mesmo dia
    const horarioExistente = await Horarios_Aulas.findOne({
      where: {
        Horario_Inicio: horarioInicio,
        Horario_Fim: horarioFim,
        Horario_Dia_Semana: diaSemana,
      },
    });

    if (horarioExistente) {
      return res.status(400).json({
        Erro: "Já existe um horário cadastrado com esses dados.",
      });
    }

    // Cria o horário
    const novoHorario = await Horarios_Aulas.create({
      Horario_Inicio: horarioInicio,
      Horario_Fim: horarioFim,
      Horario_Capacidade: capacidade,
      Horario_Dia_Semana: diaSemana,
    });

    // Registra log de criação
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "CREATE",
      "Horarios_Aulas",
      novoHorario.Horario_Id.toString(),
      `Horário ${horarioInicio} - ${horarioFim} (${diaSemana}) cadastrado`,
      null,
      novoHorario.toJSON(),
    );

    res.status(201).json({
      Mensagem: "Horário cadastrado com sucesso!",
      Horario: novoHorario,
    });
  } catch (error) {
    console.error("Erro ao cadastrar horário:", error);
    res.status(500).json({
      Erro: "Erro ao cadastrar horário.",
      Detalhes: error.message,
    });
  }
});

// Listar todos os horários ativos
router.get("/", async (req, res) => {
  try {
    const horarios = await Horarios_Aulas.findAll({
      order: [
        ["Horario_Dia_Semana", "ASC"],
        ["Horario_Inicio", "ASC"],
      ],
    });

    res.status(200).json({
      Mensagem: "Horários listados com sucesso!",
      Horarios: horarios,
    });
  } catch (error) {
    console.error("Erro ao listar horários:", error);
    res.status(500).json({
      Erro: "Erro ao listar horários.",
      Detalhes: error.message,
    });
  }
});

// Listar horários com contagem de vagas ocupadas
router.get("/com-vagas", async (req, res) => {
  try {
    const horarios = await Horarios_Aulas.findAll({
      include: [
        {
          model: Agendamento_Aulas,
          as: "Agendamentos",
          required: false,
        },
      ],
      order: [
        ["Horario_Dia_Semana", "ASC"],
        ["Horario_Inicio", "ASC"],
      ],
    });

    // Mapeia para incluir contagem de vagas ocupadas
    const horariosComVagas = horarios.map((h) => ({
      ...h.toJSON(),
      vagasOcupadas: h.Agendamentos ? h.Agendamentos.length : 0,
      vagasDisponiveis:
        h.Horario_Capacidade - (h.Agendamentos ? h.Agendamentos.length : 0),
    }));

    res.status(200).json({
      Mensagem: "Horários com vagas listados com sucesso!",
      Horarios: horariosComVagas,
    });
  } catch (error) {
    console.error("Erro ao listar horários com vagas:", error);
    res.status(500).json({
      Erro: "Erro ao listar horários com vagas.",
      Detalhes: error.message,
    });
  }
});

// Buscar horário por ID
router.get("/:id", async (req, res) => {
  try {
    const horario = await Horarios_Aulas.findOne({
      where: { Horario_Id: req.params.id },
    });

    if (!horario) {
      return res.status(404).json({
        Erro: "Horário não encontrado.",
      });
    }

    res.status(200).json({
      Mensagem: "Horário encontrado!",
      Horario: horario,
    });
  } catch (error) {
    console.error("Erro ao buscar horário:", error);
    res.status(500).json({
      Erro: "Erro ao buscar horário.",
      Detalhes: error.message,
    });
  }
});

// Atualizar horário
router.patch("/:id", async (req, res) => {
  try {
    const { horarioInicio, horarioFim, capacidade, diaSemana } = req.body;

    const horario = await Horarios_Aulas.findOne({
      where: { Horario_Id: req.params.id },
    });

    if (!horario) {
      return res.status(404).json({
        Erro: "Horário não encontrado.",
      });
    }

    const dadosAntigos = horario.toJSON();

    // Verifica se a nova capacidade é válida (não menor que alunos já agendados)
    if (capacidade) {
      const agendamentosAtivos = await Agendamento_Aulas.count({
        where: { Horario_Id: req.params.id },
      });

      if (capacidade < agendamentosAtivos) {
        return res.status(400).json({
          Erro: `Não é possível reduzir a capacidade para ${capacidade}. Existem ${agendamentosAtivos} alunos agendados.`,
        });
      }
    }

    // Atualiza os campos
    await horario.update({
      Horario_Inicio: horarioInicio || horario.Horario_Inicio,
      Horario_Fim: horarioFim || horario.Horario_Fim,
      Horario_Capacidade: capacidade || horario.Horario_Capacidade,
      Horario_Dia_Semana: diaSemana || horario.Horario_Dia_Semana,
    });

    // Registra log de alteração
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "UPDATE",
      "Horarios_Aulas",
      horario.Horario_Id.toString(),
      `Horário atualizado`,
      dadosAntigos,
      horario.toJSON(),
    );

    res.status(200).json({
      Mensagem: "Horário atualizado com sucesso!",
      Horario: horario,
    });
  } catch (error) {
    console.error("Erro ao atualizar horário:", error);
    res.status(500).json({
      Erro: "Erro ao atualizar horário.",
      Detalhes: error.message,
    });
  }
});

// Inativar horário (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const horario = await Horarios_Aulas.findOne({
      where: { Horario_Id: req.params.id },
    });

    if (!horario) {
      return res.status(404).json({
        Erro: "Horário não encontrado.",
      });
    }

    const dadosAntigos = horario.toJSON();

    // Exclui todos os agendamentos vinculados ao horário
    await Agendamento_Aulas.destroy({
      where: { Horario_Id: req.params.id },
    });

    // Exclui o horário
    await horario.destroy();

    // Registra log de exclusão
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "DELETE",
      "Horarios_Aulas",
      dadosAntigos.Horario_Id.toString(),
      `Horário excluído`,
      dadosAntigos,
      null,
    );

    res.status(200).json({
      Mensagem: "Horário excluído com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao excluir horário:", error);
    res.status(500).json({
      Erro: "Erro ao excluir horário.",
      Detalhes: error.message,
    });
  }
});

module.exports = router;
