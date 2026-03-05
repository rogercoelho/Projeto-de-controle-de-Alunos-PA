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
];

function ehDataISO(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""));
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

    if (!Array.isArray(presencas) || presencas.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ Erro: "Nenhuma presenca enviada." });
    }

    const aluno = await Alunos_Cadastros.findByPk(alunoCodigoNum, {
      transaction,
    });
    if (!aluno) {
      await transaction.rollback();
      return res.status(404).json({ Erro: "Aluno nao encontrado." });
    }

    const processados = [];
    const statusPorDataNoLote = new Map();
    for (const item of presencas) {
      if (ehDataISO(item?.data) && STATUS_VALIDOS.includes(item?.status)) {
        statusPorDataNoLote.set(item.data, item.status);
      }
    }

    for (const item of presencas) {
      const data = item?.data;
      const status = item?.status;
      const dataReposicaoReferencia = item?.dataReposicaoReferencia || null;

      if (!ehDataISO(data) || !STATUS_VALIDOS.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ Erro: "Registro de presenca invalido." });
      }

      const anoData = parseInt(data.slice(0, 4), 10);
      const mesData = parseInt(data.slice(5, 7), 10);
      if (anoData !== anoNum || mesData !== mesNum) {
        await transaction.rollback();
        return res.status(400).json({
          Erro: `A data ${data} nao pertence ao mes/ano informado.`,
        });
      }

      if (status === "Reposicao" && !ehDataISO(dataReposicaoReferencia)) {
        await transaction.rollback();
        return res.status(400).json({
          Erro: `Reposicao exige data de referencia valida (${data}).`,
        });
      }

      if (status === "Reposicao") {
        const statusReferenciaNoLote =
          statusPorDataNoLote.get(dataReposicaoReferencia);

        if (statusReferenciaNoLote === "Aula Realizada") {
          await transaction.rollback();
          return res.status(400).json({
            Erro:
              "Nao e possivel marcar reposicao para aulas realizadas.",
          });
        }

        if (!statusReferenciaNoLote) {
          const aulaRealizadaJaRegistrada = await Alunos_Presenca.findOne({
            where: {
              Aluno_Codigo: alunoCodigoNum,
              Presenca_Data: dataReposicaoReferencia,
              Presenca_Status: "Aula Realizada",
            },
            transaction,
          });

          if (aulaRealizadaJaRegistrada) {
            await transaction.rollback();
            return res.status(400).json({
              Erro:
                "Nao e possivel marcar reposicao para aulas realizadas.",
            });
          }
        }

        if (statusReferenciaNoLote !== "Ausente") {
          const ausenciaJaRegistrada = await Alunos_Presenca.findOne({
            where: {
              Aluno_Codigo: alunoCodigoNum,
              Presenca_Data: dataReposicaoReferencia,
              Presenca_Status: "Ausente",
            },
            transaction,
          });

          if (!ausenciaJaRegistrada) {
            await transaction.rollback();
            return res.status(400).json({
              Erro:
                "O dia marcado na reposicao como ausencia nao esta marcado no calendario como ausente.",
            });
          }
        }
      }

      const payload = {
        Presenca_Status: status,
        Presenca_Data_Reposicao_Referencia:
          status === "Reposicao" ? dataReposicaoReferencia : null,
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

    await transaction.commit();
    return res.status(201).json({
      Mensagem: "Presencas salvas com sucesso.",
      processados,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      Erro: "Erro ao salvar presencas.",
      Detalhes: error.message,
    });
  }
});

module.exports = router;
