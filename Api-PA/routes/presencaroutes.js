const express = require("express");
const { Op } = require("sequelize");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Alunos_Presenca = require("../models/Alunos_Presenca");

const router = express.Router();

const STATUS_VALIDOS = [
  "Presente",
  "Ausente",
  "Reposicao",
  "Aula Realizada",
  "Dobradinha",
];

function ehDataISO(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));
}

function intervaloMes(ano, mes) {
  const dataInicial = `${ano}-${String(mes).padStart(2, "0")}-01`;
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dataFinal = `${ano}-${String(mes).padStart(2, "0")}-${String(
    ultimoDia
  ).padStart(2, "0")}`;
  return { dataInicial, dataFinal };
}

async function salvarPresencasAluno({
  alunoCodigoNum,
  anoNum,
  mesNum,
  presencas,
  transaction,
}) {
  if (!Array.isArray(presencas)) {
    const err = new Error("Presencas invalidas.");
    err.httpStatus = 400;
    throw err;
  }

  const aluno = await Alunos_Cadastros.findByPk(alunoCodigoNum, {
    transaction,
  });
  if (!aluno) {
    const err = new Error("Aluno nao encontrado.");
    err.httpStatus = 404;
    throw err;
  }

  const processados = [];
  const datasEnviadas = new Set();
  const statusPorDataNoLote = new Map();
  for (const item of presencas) {
    if (ehDataISO(item?.data) && STATUS_VALIDOS.includes(item?.status)) {
      statusPorDataNoLote.set(item.data, item.status);
      datasEnviadas.add(item.data);
    }
  }

  for (const item of presencas) {
    const data = item?.data;
    const status = item?.status;
    const dataReposicaoReferencia = item?.dataReposicaoReferencia || null;
    const dataReposicaoReferencia2 = item?.dataReposicaoReferencia2 || null;
    const observacao =
      item?.observacao && String(item.observacao).trim() !== ""
        ? String(item.observacao).trim()
        : null;

    if (!ehDataISO(data) || !STATUS_VALIDOS.includes(status)) {
      const err = new Error("Registro de presenca invalido.");
      err.httpStatus = 400;
      throw err;
    }

    const anoData = parseInt(data.slice(0, 4), 10);
    const mesData = parseInt(data.slice(5, 7), 10);
    if (anoData !== anoNum || mesData !== mesNum) {
      const err = new Error(`A data ${data} nao pertence ao mes/ano informado.`);
      err.httpStatus = 400;
      throw err;
    }

    if (
      (status === "Reposicao" || status === "Dobradinha") &&
      !ehDataISO(dataReposicaoReferencia)
    ) {
      const err = new Error(
        `Reposicao exige data de referencia valida (${data}).`
      );
      err.httpStatus = 400;
      throw err;
    }
    const validarReferenciaFalta = async (referenciaData) => {
      const statusReferenciaNoLote = statusPorDataNoLote.get(referenciaData);

      if (statusReferenciaNoLote === "Aula Realizada") {
        const err = new Error(
          "Nao e possivel marcar reposicao para aulas realizadas."
        );
        err.httpStatus = 400;
        throw err;
      }

      if (!statusReferenciaNoLote) {
        const aulaRealizadaJaRegistrada = await Alunos_Presenca.findOne({
          where: {
            Aluno_Codigo: alunoCodigoNum,
            Presenca_Data: referenciaData,
            Presenca_Status: "Aula Realizada",
          },
          transaction,
        });

        if (aulaRealizadaJaRegistrada) {
          const err = new Error(
            "Nao e possivel marcar reposicao para aulas realizadas."
          );
          err.httpStatus = 400;
          throw err;
        }
      }

      if (statusReferenciaNoLote !== "Ausente") {
        const faltaJaRegistrada = await Alunos_Presenca.findOne({
          where: {
            Aluno_Codigo: alunoCodigoNum,
            Presenca_Data: referenciaData,
            Presenca_Status: "Ausente",
          },
          transaction,
        });

        if (!faltaJaRegistrada) {
          const err = new Error(
            "O dia marcado na reposicao como falta nao esta marcado no calendario como falta."
          );
          err.httpStatus = 400;
          throw err;
        }
      }
    };

    if (status === "Reposicao") {
      await validarReferenciaFalta(dataReposicaoReferencia);
    }

    if (status === "Dobradinha") {
      if (!ehDataISO(dataReposicaoReferencia2)) {
        const err = new Error(
          `Dobradinha exige a segunda data de referencia valida (${data}).`
        );
        err.httpStatus = 400;
        throw err;
      }
      if (dataReposicaoReferencia2 === dataReposicaoReferencia) {
        const err = new Error(
          "Dobradinha exige duas faltas diferentes para reposicao."
        );
        err.httpStatus = 400;
        throw err;
      }

      await validarReferenciaFalta(dataReposicaoReferencia);
      await validarReferenciaFalta(dataReposicaoReferencia2);
    }

    const payload = {
      Presenca_Status: status,
      Presenca_Data_Reposicao_Referencia:
        status === "Reposicao" || status === "Dobradinha"
          ? dataReposicaoReferencia
          : null,
      Presenca_Data_Reposicao_Referencia_2:
        status === "Dobradinha" ? dataReposicaoReferencia2 : null,
      Presenca_Observacao: observacao,
    };

    const existente = await Alunos_Presenca.findOne({
      where: { Aluno_Codigo: alunoCodigoNum, Presenca_Data: data },
      transaction,
    });

    if (existente) {
      await existente.update(payload, { transaction });
      processados.push({ data, acao: "update" });
    } else {
      await Alunos_Presenca.create(
        {
          Aluno_Codigo: alunoCodigoNum,
          Presenca_Data: data,
          ...payload,
        },
        { transaction }
      );
      processados.push({ data, acao: "create" });
    }
  }

  // Sincroniza o mês: remove do banco os dias que foram limpos na interface
  const { dataInicial, dataFinal } = intervaloMes(anoNum, mesNum);
  const whereBase = {
    Aluno_Codigo: alunoCodigoNum,
    Presenca_Data: {
      [Op.between]: [dataInicial, dataFinal],
    },
  };

  const whereDelete =
    datasEnviadas.size === 0
      ? whereBase
      : {
          ...whereBase,
          Presenca_Data: {
            [Op.between]: [dataInicial, dataFinal],
            [Op.notIn]: Array.from(datasEnviadas),
          },
        };

  const registrosParaExcluir = await Alunos_Presenca.findAll({
    where: whereDelete,
    attributes: ["Presenca_Data"],
    transaction,
    raw: true,
  });

  if (registrosParaExcluir.length > 0) {
    await Alunos_Presenca.destroy({
      where: whereDelete,
      transaction,
    });
    for (const reg of registrosParaExcluir) {
      processados.push({
        data: reg.Presenca_Data,
        acao: "delete",
      });
    }
  }

  return processados;
}

router.get("/alunos-ativos", async (req, res) => {
  try {
    const alunos = await Alunos_Cadastros.findAll({
      where: { Alunos_Situacao: "Ativo" },
      attributes: ["Alunos_Codigo", "Alunos_Nome"],
      order: [["Alunos_Nome", "ASC"]],
      raw: true,
    });

    return res.json({ alunos });
  } catch (error) {
    return res.status(500).json({
      Erro: "Erro ao buscar alunos ativos.",
      Detalhes: error.message,
    });
  }
});

router.get("/grade/:ano/:mes", async (req, res) => {
  try {
    const ano = parseInt(req.params.ano, 10);
    const mes = parseInt(req.params.mes, 10);
    if (Number.isNaN(ano) || Number.isNaN(mes) || mes < 1 || mes > 12) {
      return res.status(400).json({ Erro: "Parametros invalidos." });
    }

    const { dataInicial, dataFinal } = intervaloMes(ano, mes);

    const alunos = await Alunos_Cadastros.findAll({
      where: { Alunos_Situacao: "Ativo" },
      attributes: ["Alunos_Codigo", "Alunos_Nome"],
      order: [["Alunos_Nome", "ASC"]],
      raw: true,
    });

    const codigos = alunos.map((a) => a.Alunos_Codigo);
    let presencas = [];
    if (codigos.length > 0) {
      presencas = await Alunos_Presenca.findAll({
        where: {
          Aluno_Codigo: codigos,
          Presenca_Data: {
            [Op.between]: [dataInicial, dataFinal],
          },
        },
        order: [
          ["Aluno_Codigo", "ASC"],
          ["Presenca_Data", "ASC"],
        ],
        raw: true,
      });
    }

    const presencasPorAluno = {};
    for (const p of presencas) {
      if (!presencasPorAluno[p.Aluno_Codigo]) {
        presencasPorAluno[p.Aluno_Codigo] = [];
      }
      presencasPorAluno[p.Aluno_Codigo].push(p);
    }

    return res.json({ alunos, presencasPorAluno });
  } catch (error) {
    return res.status(500).json({
      Erro: "Erro ao carregar grade de presencas.",
      Detalhes: error.message,
    });
  }
});

router.get("/relatorio/:Aluno_Codigo", async (req, res) => {
  try {
    const Aluno_Codigo = parseInt(req.params.Aluno_Codigo, 10);
    const inicio = String(req.query?.inicio || "");
    const fim = String(req.query?.fim || "");

    if (Number.isNaN(Aluno_Codigo) || !ehDataISO(inicio) || !ehDataISO(fim)) {
      return res.status(400).json({ Erro: "Parametros invalidos." });
    }
    if (inicio > fim) {
      return res
        .status(400)
        .json({ Erro: "Periodo invalido: inicio maior que fim." });
    }

    const aluno = await Alunos_Cadastros.findByPk(Aluno_Codigo, {
      attributes: ["Alunos_Codigo", "Alunos_Nome"],
      raw: true,
    });
    if (!aluno) {
      return res.status(404).json({ Erro: "Aluno nao encontrado." });
    }

    const presencas = await Alunos_Presenca.findAll({
      where: {
        Aluno_Codigo,
        Presenca_Data: {
          [Op.between]: [inicio, fim],
        },
      },
      order: [["Presenca_Data", "ASC"]],
      raw: true,
    });

    const totais = {
      P: 0,
      F: 0,
      R: 0,
      AR: 0,
      D: 0,
      totalGeral: 0,
      aulasFeitas: 0,
    };

    for (const p of presencas) {
      if (p.Presenca_Status === "Presente") totais.P += 1;
      else if (p.Presenca_Status === "Ausente") totais.F += 1;
      else if (p.Presenca_Status === "Reposicao") totais.R += 1;
      else if (p.Presenca_Status === "Aula Realizada") totais.AR += 1;
      else if (p.Presenca_Status === "Dobradinha") totais.D += 1;
    }

    totais.totalGeral = totais.P + totais.F + totais.R + totais.AR + totais.D;
    totais.aulasFeitas = totais.P + totais.R + totais.AR + totais.D * 2;

    return res.json({
      aluno,
      periodo: { inicio, fim },
      totais,
      presencas,
    });
  } catch (error) {
    return res.status(500).json({
      Erro: "Erro ao gerar relatorio de presencas.",
      Detalhes: error.message,
    });
  }
});

router.get("/:Aluno_Codigo/:ano/:mes", async (req, res) => {
  try {
    const Aluno_Codigo = parseInt(req.params.Aluno_Codigo, 10);
    const ano = parseInt(req.params.ano, 10);
    const mes = parseInt(req.params.mes, 10);

    if (
      Number.isNaN(Aluno_Codigo) ||
      Number.isNaN(ano) ||
      Number.isNaN(mes) ||
      mes < 1 ||
      mes > 12
    ) {
      return res.status(400).json({ Erro: "Parametros invalidos." });
    }

    const dataInicial = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const dataFinal = `${ano}-${String(mes).padStart(2, "0")}-${String(
      ultimoDia
    ).padStart(2, "0")}`;

    const presencas = await Alunos_Presenca.findAll({
      where: {
        Aluno_Codigo,
        Presenca_Data: {
          [Op.between]: [dataInicial, dataFinal],
        },
      },
      order: [["Presenca_Data", "ASC"]],
      raw: true,
    });

    return res.json({ presencas });
  } catch (error) {
    return res.status(500).json({
      Erro: "Erro ao buscar presencas.",
      Detalhes: error.message,
    });
  }
});

router.post("/salvar-lote", async (req, res) => {
  const transaction = await Alunos_Presenca.sequelize.transaction();

  try {
    const { Aluno_Codigo, ano, mes, presencas } = req.body;
    const alunoCodigoNum = parseInt(Aluno_Codigo, 10);
    const anoNum = parseInt(ano, 10);
    const mesNum = parseInt(mes, 10);

    if (
      Number.isNaN(alunoCodigoNum) ||
      Number.isNaN(anoNum) ||
      Number.isNaN(mesNum) ||
      mesNum < 1 ||
      mesNum > 12
    ) {
      await transaction.rollback();
      return res.status(400).json({ Erro: "Dados principais invalidos." });
    }

    const processados = await salvarPresencasAluno({
      alunoCodigoNum,
      anoNum,
      mesNum,
      presencas,
      transaction,
    });

    await transaction.commit();
    return res.status(201).json({
      Mensagem: "Presencas salvas com sucesso.",
      processados,
    });
  } catch (error) {
    await transaction.rollback();
    const status = error.httpStatus || 500;
    return res.status(status).json({
      Erro: status === 500 ? "Erro ao salvar presencas." : error.message,
      Detalhes: error.message,
    });
  }
});

router.post("/salvar-matriz", async (req, res) => {
  const transaction = await Alunos_Presenca.sequelize.transaction();
  try {
    const { ano, mes, registros } = req.body;
    const anoNum = parseInt(ano, 10);
    const mesNum = parseInt(mes, 10);
    if (Number.isNaN(anoNum) || Number.isNaN(mesNum) || mesNum < 1 || mesNum > 12) {
      await transaction.rollback();
      return res.status(400).json({ Erro: "Dados principais invalidos." });
    }
    if (!Array.isArray(registros) || registros.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ Erro: "Nenhum registro enviado." });
    }

    const resultado = [];
    for (const reg of registros) {
      const alunoCodigoNum = parseInt(reg?.Aluno_Codigo, 10);
      if (Number.isNaN(alunoCodigoNum)) {
        const err = new Error("Aluno_Codigo invalido na matriz.");
        err.httpStatus = 400;
        throw err;
      }
      const processados = await salvarPresencasAluno({
        alunoCodigoNum,
        anoNum,
        mesNum,
        presencas: reg?.presencas || [],
        transaction,
      });
      resultado.push({ Aluno_Codigo: alunoCodigoNum, processados });
    }

    await transaction.commit();
    return res.status(201).json({
      Mensagem: "Grade de presencas salva com sucesso.",
      resultado,
    });
  } catch (error) {
    await transaction.rollback();
    const status = error.httpStatus || 500;
    return res.status(status).json({
      Erro:
        status === 500 ? "Erro ao salvar grade de presencas." : error.message,
      Detalhes: error.message,
    });
  }
});

module.exports = router;
