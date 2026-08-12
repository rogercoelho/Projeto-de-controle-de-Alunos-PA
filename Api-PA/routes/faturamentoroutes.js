const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Planos_Cadastro = require("../models/Planos_Cadastro");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Alunos_Faturamento = require("../models/Alunos_Faturamento");
const Alunos_Faturamento_Reajustes = require("../models/Alunos_Faturamento_Reajustes");
const Faturamentos_Cancelados = require("../models/Faturamentos_Cancelados");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");
const {
  getArquivoRelativoSalvo,
  getPastaAlunoRelativa,
  getUploadsBaseDir,
  sanitizarCodigoUpload,
} = require("../utils/uploadPaths");

function getContextoUploadAluno(req) {
  const codigo =
    req.body.alunoCodigo ||
    req.body.Aluno_Codigo ||
    req.body.Alunos_Codigo ||
    "0";
  const nome =
    req.body.alunoNome ||
    req.body.Aluno_Nome ||
    req.body.Alunos_Nome ||
    "aluno";

  return {
    codigo: sanitizarCodigoUpload(codigo, "0"),
    pastaRelativa: getPastaAlunoRelativa(codigo, nome),
  };
}

// Configuracao do multer para upload de comprovantes
const storageComprovante = multer.diskStorage({
  destination: function (req, file, cb) {
    const contextoAluno = getContextoUploadAluno(req);
    req._alunoUploadCodigo = contextoAluno.codigo;
    const uploadDir = path.join(getUploadsBaseDir(), contextoAluno.pastaRelativa);

    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        console.error("Erro ao criar pasta de comprovantes:", error);
        return cb(error);
      }
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const alunoCodigo =
      req._alunoUploadCodigo || sanitizarCodigoUpload(req.body.alunoCodigo);
    const tipoArquivo =
      file.fieldname === "comprovanteEstorno"
        ? "comprovante_estorno"
        : file.fieldname === "comprovante"
          ? "comprovante_reajuste"
          : "comprovante";
    let fatId = req.params.id || "";
    if (req.body && req.body.faturamentoIds) {
      let faturamentoIds = req.body.faturamentoIds;
      if (typeof faturamentoIds === "string") {
        try {
          faturamentoIds = JSON.parse(faturamentoIds);
        } catch {
          faturamentoIds = [];
        }
      }
      if (Array.isArray(faturamentoIds)) {
        fatId = faturamentoIds[req._fileIndex || 0] || "";
      }
    }
    const now = new Date();
    const data = now.toISOString().slice(0, 10).replace(/-/g, "");
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    const filename = fatId
      ? `${tipoArquivo}_id_${alunoCodigo}_fatid_${fatId}_${data}_${ms}${ext}`
      : `${tipoArquivo}_id_${alunoCodigo}_${data}_${ms}${ext}`;
    req._fileIndex = (req._fileIndex || 0) + 1;
    cb(null, filename);
  },
});

const fileFilterComprovante = (req, file, cb) => {
  // Aceita PDF e imagens
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype.startsWith("image/")
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Apenas arquivos PDF ou imagens são permitidos para comprovante!",
      ),
      false,
    );
  }
};

const uploadComprovante = multer({
  storage: storageComprovante,
  fileFilter: fileFilterComprovante,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
});

// Rota para buscar todos os alunos com faturamentos pendentes
router.get("/pendentes", async (req, res) => {
  try {
    const pendentes = await Alunos_Faturamento.findAll({
      where: { Faturamento_Data_Pagamento: null },
      attributes: ["id", "Aluno_Codigo", "Plano_Codigo", "Faturamento_Fim"],
      raw: true,
    });

    // Deduplica por Aluno_Codigo + Plano_Codigo, mantendo o Faturamento_Fim mais recente
    const deduped = {};
    for (const p of pendentes) {
      const key = `${p.Aluno_Codigo}|${p.Plano_Codigo}`;
      if (!deduped[key] || p.Faturamento_Fim > deduped[key].Faturamento_Fim) {
        deduped[key] = p;
      }
    }
    const unicos = Object.values(deduped);

    const codigosPendentes = [...new Set(unicos.map((p) => p.Aluno_Codigo))];
    const todosFaturamentosPendentes = codigosPendentes.length
      ? await Alunos_Faturamento.findAll({
          where: { Aluno_Codigo: codigosPendentes },
          attributes: ["id", "Aluno_Codigo", "Faturamento_Fim"],
          raw: true,
        })
      : [];

    const pendentesAtuais = unicos.filter((fat) => {
      const fatId = fat.id || fat.Faturamento_ID;
      return !todosFaturamentosPendentes.some((outro) => {
        const outroId = outro.id || outro.Faturamento_ID;
        return (
          outro.Aluno_Codigo === fat.Aluno_Codigo &&
          outroId !== fatId &&
          String(outro.Faturamento_Fim || "") > String(fat.Faturamento_Fim || "")
        );
      });
    });

    // Busca apenas alunos Ativos
    const codigos = [...new Set(pendentesAtuais.map((p) => p.Aluno_Codigo))];
    let alunosInfo = [];
    if (codigos.length > 0) {
      alunosInfo = await Alunos_Cadastros.findAll({
        where: { Alunos_Codigo: codigos, Alunos_Situacao: "Ativo" },
        attributes: [
          "Alunos_Codigo",
          "Alunos_Nome",
          "Alunos_CPF",
          "Alunos_Telefone",
        ],
        raw: true,
      });
    }

    // Filtra apenas os registros cujo aluno é Ativo
    const alunosAtivos = new Set(alunosInfo.map((a) => a.Alunos_Codigo));
    const resultado = pendentesAtuais
      .filter((fat) => alunosAtivos.has(fat.Aluno_Codigo))
      .map((fat) => {
        const aluno = alunosInfo.find(
          (a) => a.Alunos_Codigo === fat.Aluno_Codigo,
        );
        return {
          Alunos_Codigo: fat.Aluno_Codigo,
          Alunos_Nome: aluno.Alunos_Nome || null,
          Alunos_CPF: aluno.Alunos_CPF || null,
          Alunos_Telefone: aluno.Alunos_Telefone || null,
          Plano_Codigo: fat.Plano_Codigo,
          Faturamento_Fim: fat.Faturamento_Fim,
        };
      });

    res.json({ alunos: resultado });
  } catch (error) {
    res.status(500).json({ Erro: "Erro ao buscar alunos com pendências." });
  }
});

// GET /faturamento/extrato/:Aluno_Codigo/:ano
// Retorna o extrato do aluno: informações do aluno, planos e pagamentos
// Quando ano === "all", retorna todos os faturamentos sem filtro de ano
router.get("/extrato/:Aluno_Codigo/:ano", async (req, res) => {
  try {
    const { Aluno_Codigo, ano } = req.params;
    const { Op } = require("sequelize");

    // Busca informações do aluno
    const aluno = await Alunos_Cadastros.findOne({
      where: { Alunos_Codigo: Aluno_Codigo },
      raw: true,
    });

    if (!aluno) {
      return res.status(404).json({ Erro: "Aluno não encontrado." });
    }

    // Quando ano === "all", busca todos os faturamentos sem filtro de ano
    const whereClause =
      ano === "all"
        ? { Aluno_Codigo }
        : {
            Aluno_Codigo,
            [Op.or]: [
              {
                Faturamento_Inicio: {
                  [Op.between]: [`${ano}-01-01`, `${ano}-12-31`],
                },
              },
              {
                Faturamento_Fim: {
                  [Op.between]: [`${ano}-01-01`, `${ano}-12-31`],
                },
              },
              {
                [Op.and]: [
                  { Faturamento_Inicio: { [Op.lt]: `${ano}-01-01` } },
                  { Faturamento_Fim: { [Op.gt]: `${ano}-12-31` } },
                ],
              },
            ],
          };

    const faturamentos = await Alunos_Faturamento.findAll({
      where: whereClause,
      order: [["Faturamento_Inicio", "ASC"]],
      raw: true,
    });

    const faturamentoIds = faturamentos.map((fat) => fat.id).filter(Boolean);
    const reajustesPorFaturamento = {};
    if (faturamentoIds.length > 0) {
      const reajustes = await Alunos_Faturamento_Reajustes.findAll({
        where: { Faturamento_ID: faturamentoIds },
        order: [
          ["Faturamento_Reajuste_Partir_De", "ASC"],
          ["id", "ASC"],
        ],
        raw: true,
      });

      for (const reajuste of reajustes) {
        const fatId = reajuste.Faturamento_ID;
        if (!reajustesPorFaturamento[fatId]) {
          reajustesPorFaturamento[fatId] = [];
        }
        reajustesPorFaturamento[fatId].push(reajuste);
      }
    }

    for (const fat of faturamentos) {
      fat.reajustes = reajustesPorFaturamento[fat.id] || [];
      if (
        fat.reajustes.length === 0 &&
        fat.Faturamento_Reajuste &&
        fat.Faturamento_Reajuste_Partir_De
      ) {
        fat.reajustes = [
          {
            Faturamento_ID: fat.id,
            Faturamento_Reajuste: fat.Faturamento_Reajuste,
            Faturamento_Reajuste_Partir_De: fat.Faturamento_Reajuste_Partir_De,
            Faturamento_Reajuste_Motivo: fat.Faturamento_Reajuste_Motivo,
            Faturamento_Reajuste_Comprovante:
              fat.Faturamento_Reajuste_Comprovante,
          },
        ];
      }
    }

    // Agrupa faturamentos por plano
    const planosMap = {};
    for (const fat of faturamentos) {
      const codigo = fat.Plano_Codigo;
      if (!planosMap[codigo]) {
        planosMap[codigo] = {
          Plano_Codigo: codigo,
          faturamentos: [],
        };
      }
      planosMap[codigo].faturamentos.push(fat);
    }

    // Busca informações dos planos
    const codigosPlanos = Object.keys(planosMap);
    const planosInfo = await Planos_Cadastro.findAll({
      where: { Plano_Codigo: codigosPlanos },
      raw: true,
    });

    // Monta array de planos com informações completas
    const planos = codigosPlanos.map((codigo) => {
      const info = planosInfo.find((p) => p.Plano_Codigo === codigo) || {};
      return {
        ...planosMap[codigo],
        Plano_Nome: info.Plano_Nome || "",
        Plano_Pagamento: info.Plano_Pagamento || "",
        Plano_Quantidade_Semana: info.Plano_Quantidade_Semana || "",
      };
    });

    // Busca faturamentos pendentes (não pagos) do aluno
    const faturamentosPendentes = await Alunos_Faturamento.findAll({
      where: { Aluno_Codigo, Faturamento_Data_Pagamento: null },
      raw: true,
    });

    // Monta lista de planos que possuem parcelas pendentes
    let planosPendentes = [];
    if (faturamentosPendentes.length > 0) {
      const codigosPlanosPendentes = [
        ...new Set(faturamentosPendentes.map((f) => f.Plano_Codigo)),
      ];
      const planosInfoPendentes = await Planos_Cadastro.findAll({
        where: { Plano_Codigo: codigosPlanosPendentes },
        raw: true,
      });

      planosPendentes = codigosPlanosPendentes.map((codigo) => {
        const info =
          planosInfoPendentes.find((p) => p.Plano_Codigo === codigo) || {};
        return {
          Plano_Codigo: codigo,
          Plano_Nome: info.Plano_Nome || "",
          Plano_Valor: info.Plano_Valor || null,
          faturamentos: faturamentosPendentes.filter(
            (f) => f.Plano_Codigo === codigo,
          ),
        };
      });
    }

    res.json({ aluno, planos, faturamentosPendentes, planosPendentes });
  } catch (error) {
    console.error("Erro ao buscar extrato:", error);
    res.status(500).json({
      Erro: "Erro ao buscar extrato do aluno.",
      Detalhes: error.message,
    });
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

    // Registra log de criação do faturamento
    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "CREATE",
      "Alunos_Faturamento",
      novoFaturamento.id || novoFaturamento.Faturamento_ID,
      `Faturamento registrado para aluno ${Aluno_Codigo}`,
      null,
      novoFaturamento.toJSON(),
    );

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
router.patch(
  "/registrar-pagamento",
  uploadComprovante.array("comprovantes"),
  async (req, res) => {
    try {
      // Parse pagamentos se vier como string (FormData)
      let pagamentos = req.body.pagamentos;
      if (typeof pagamentos === "string") {
        pagamentos = JSON.parse(pagamentos);
      }

      if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
        return res.status(400).json({ Erro: "Nenhum pagamento enviado." });
      }

      // Parse faturamentoIds se existir (lista dos IDs que têm comprovante)
      let faturamentoIds = req.body.faturamentoIds;
      if (typeof faturamentoIds === "string") {
        faturamentoIds = JSON.parse(faturamentoIds);
      }

      // Log para debug
      console.log("Arquivos recebidos:", req.files?.length || 0);
      console.log("FaturamentoIds:", faturamentoIds);
      console.log("Pagamentos:", pagamentos);

      // Mapeia os arquivos enviados pelos faturamentoIds
      const arquivosMap = {};
      if (req.files && req.files.length > 0 && Array.isArray(faturamentoIds)) {
        for (
          let i = 0;
          i < req.files.length && i < faturamentoIds.length;
          i++
        ) {
          const fatId = faturamentoIds[i];
          const arquivoRelativo = getArquivoRelativoSalvo(req.files[i]);
          arquivosMap[fatId] = arquivoRelativo;
          console.log(
            `Mapeando arquivo ${arquivoRelativo} para faturamento ${fatId}`,
          );
        }
      }

      console.log("Mapa de arquivos:", arquivosMap);

      const resultados = [];
      for (const pag of pagamentos) {
        const {
          id,
          Faturamento_Data_Pagamento,
          Faturamento_Desconto,
          Faturamento_Desconto_Motivo,
        } = pag;
        if (!id) continue;

        // captura estado antes do update para fins de log
        const faturamentoAntes = await Alunos_Faturamento.findByPk(id);

        const updateData = {
          Faturamento_Data_Pagamento: Faturamento_Data_Pagamento || null,
          Faturamento_Desconto: Faturamento_Desconto || null,
          Faturamento_Desconto_Motivo: Faturamento_Desconto_Motivo || null,
        };

        // Se existe comprovante para esse faturamento
        if (arquivosMap[id]) {
          updateData.Faturamento_Comprovante = arquivosMap[id];
          console.log(
            `Salvando comprovante ${arquivosMap[id]} para faturamento ${id}`,
          );
        }

        const [updated] = await Alunos_Faturamento.update(updateData, {
          where: { id },
        });
        resultados.push({
          id,
          atualizado: !!updated,
          comprovante: arquivosMap[id] || null,
        });

        if (updated) {
          const faturamentoDepois = await Alunos_Faturamento.findByPk(id);

          // Lógica do contador/repasse: utilizar códigos (Aluno_Codigo e Plano_Codigo),
          // não usar ID para a verificação do contador.
          try {
            if (faturamentoDepois) {
              const alunoCodigo = faturamentoDepois.Aluno_Codigo;
              const planoCodigo = faturamentoDepois.Plano_Codigo;

              // Busca configuração do plano
              const planoConfig = await Planos_Cadastro.findOne({
                where: { Plano_Codigo: planoCodigo },
                raw: true,
              });

              if (planoConfig && !!planoConfig.Plano_Contador_Habilitado) {
                // Buscar último registro de faturamento do mesmo aluno+plano com inicio anterior
                const { Op } = require("sequelize");

                const registroAnterior = await Alunos_Faturamento.findOne({
                  where: {
                    Aluno_Codigo: alunoCodigo,
                    Plano_Codigo: planoCodigo,
                    id: { [Op.ne]: faturamentoDepois.id },
                  },
                  order: [
                    ["Faturamento_Inicio", "DESC"],
                    ["id", "DESC"],
                  ],
                });

                const limite =
                  planoConfig.Plano_Contador_Limite != null
                    ? parseInt(planoConfig.Plano_Contador_Limite, 10)
                    : null;

                const prevContador =
                  registroAnterior &&
                  registroAnterior.Faturamento_Contador != null
                    ? parseInt(registroAnterior.Faturamento_Contador, 10)
                    : 0;

                // Se o ciclo anterior fechou (prevContador >= limite), reinicia do zero.
                // Caso contrário, continua a partir do contador anterior.
                const baseContador =
                  limite !== null && prevContador >= limite ? 0 : prevContador;

                const novoContador = baseContador + 1;

                // Lógica:
                // - contador vai de 1 até o limite
                // - ao atingir o limite, grava o repasse neste registro (que será exibido
                //   no relatório WET do mês seguinte) e o ciclo estará encerrado
                // - no próximo pagamento o baseContador volta a 0 → inicia novo ciclo
                const atingiuLimite = limite !== null && novoContador >= limite;

                const updatePayload = { Faturamento_Contador: novoContador };
                if (atingiuLimite) {
                  updatePayload.Faturamento_Repasse =
                    planoConfig.Plano_Wet_Valor != null
                      ? planoConfig.Plano_Wet_Valor
                      : null;
                }

                await faturamentoDepois.update(updatePayload);

                console.log(
                  `[contador] aluno ${alunoCodigo} plano ${planoCodigo}: prev=${prevContador} base=${baseContador} novo=${novoContador} limite=${limite} repasse=${atingiuLimite}`,
                );
              }
            }
          } catch (contadorErr) {
            console.error("Erro na lógica de contador/repasse:", contadorErr);
          }

          const usuarioLog = getUsuarioFromReq(req);
          await registrarLog(
            usuarioLog,
            "UPDATE",
            "Alunos_Faturamento",
            id,
            `Pagamento registrado para faturamento ${id}`,
            faturamentoAntes ? faturamentoAntes.toJSON() : null,
            faturamentoDepois ? faturamentoDepois.toJSON() : null,
          );
        }
      }
      res.json({ Mensagem: "Pagamentos registrados.", resultados });
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      res.status(500).json({
        Erro: "Erro ao registrar pagamento.",
        Detalhes: error.message,
      });
    }
  },
);

// GET /faturamento/relatorio-mensal/:mes/:ano
// Retorna as parcelas que competem ao mês/ano informado (baseado no período do plano)
// Só retorna faturamentos que já foram pagos
router.get("/relatorio-mensal/:mes/:ano", async (req, res) => {
  try {
    const { mes, ano } = req.params;
    const { Op } = require("sequelize");

    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    // Calcula o primeiro e último dia do mês corretamente
    const primeiroDia = `${anoNum}-${String(mesNum).padStart(2, "0")}-01`;
    // Último dia do mês: cria data do próximo mês dia 1 e subtrai 1 dia
    const ultimoDiaDate = new Date(anoNum, mesNum, 0); // dia 0 do próximo mês = último dia do mês atual
    const ultimoDia = `${anoNum}-${String(mesNum).padStart(2, "0")}-${String(
      ultimoDiaDate.getDate(),
    ).padStart(2, "0")}`;

    // Busca faturamentos PAGOS que tenham parcelas no mês selecionado
    // Similar ao extrato do aluno - busca por período do plano, não por data de pagamento
    const faturamentos = await Alunos_Faturamento.findAll({
      where: {
        // Deve estar pago
        Faturamento_Data_Pagamento: {
          [Op.ne]: null,
        },
        // E ter parcelas que cubram o mês selecionado
        [Op.or]: [
          // Faturamento começa no ano/mês selecionado
          {
            [Op.and]: [
              {
                Faturamento_Inicio: {
                  [Op.gte]: primeiroDia,
                },
              },
              {
                Faturamento_Inicio: {
                  [Op.lte]: ultimoDia,
                },
              },
            ],
          },
          // Faturamento termina no ano/mês selecionado
          {
            [Op.and]: [
              {
                Faturamento_Fim: {
                  [Op.gte]: primeiroDia,
                },
              },
              {
                Faturamento_Fim: {
                  [Op.lte]: ultimoDia,
                },
              },
            ],
          },
          // Faturamento atravessa o mês (começa antes e termina depois)
          {
            [Op.and]: [
              {
                Faturamento_Inicio: {
                  [Op.lt]: primeiroDia,
                },
              },
              {
                Faturamento_Fim: {
                  [Op.gt]: ultimoDia,
                },
              },
            ],
          },
        ],
      },
      raw: true,
    });

    if (faturamentos.length === 0) {
      return res.json({ pagamentos: [], alunos: [], planos: [] });
    }

    // Busca informações dos alunos
    const codigosAlunos = [...new Set(faturamentos.map((f) => f.Aluno_Codigo))];
    const alunos = await Alunos_Cadastros.findAll({
      where: { Alunos_Codigo: codigosAlunos },
      attributes: ["Alunos_Codigo", "Alunos_Nome"],
      raw: true,
    });

    // Busca informações dos planos
    const codigosPlanos = [...new Set(faturamentos.map((f) => f.Plano_Codigo))];
    const planos = await Planos_Cadastro.findAll({
      where: { Plano_Codigo: codigosPlanos },
      attributes: [
        "Plano_Codigo",
        "Plano_Nome",
        "Plano_Pagamento",
        "Plano_Valor",
      ],
      raw: true,
    });

    // Para planos mensais, o mês "mandante" é o do Faturamento_Inicio
    // Filtra faturamentos mensais que não pertencem ao mês selecionado
    const faturamentosFiltrados = faturamentos.filter((fat) => {
      const plano = planos.find((p) => p.Plano_Codigo === fat.Plano_Codigo);
      const tipoPagamento = (plano?.Plano_Pagamento || "").toLowerCase();

      // Se for plano mensal, só inclui se Faturamento_Inicio está no mês/ano selecionado
      if (
        tipoPagamento.includes("mensal") ||
        tipoPagamento.includes("unitário") ||
        tipoPagamento.includes("unitario")
      ) {
        // Parse da data de forma segura para evitar problemas de timezone
        // Formato esperado: "YYYY-MM-DD"
        const partes = String(fat.Faturamento_Inicio).split("-");
        const anoInicio = parseInt(partes[0], 10);
        const mesInicio = parseInt(partes[1], 10);
        return mesInicio === mesNum && anoInicio === anoNum;
      }

      // Para outros planos (trimestral, semestral, anual), mantém o comportamento atual
      return true;
    });

    // Retorna os dados com o mês/ano selecionado para o frontend calcular a parcela correta
    res.json({
      pagamentos: faturamentosFiltrados,
      alunos,
      planos,
      mesSelecionado: mesNum,
      anoSelecionado: anoNum,
    });
  } catch (error) {
    console.error("Erro ao buscar relatório mensal:", error);
    res.status(500).json({
      Erro: "Erro ao buscar relatório mensal.",
      Detalhes: error.message,
    });
  }
});


// GET /faturamento/relatorio-cancelados/:mes/:ano
router.get("/relatorio-cancelados/:mes/:ano", async (req, res) => {
  try {
    const { mes, ano } = req.params;
    const { Op } = require("sequelize");
    const mesNum = Number(mes);
    const anoNum = Number(ano);

    if (!mesNum || !anoNum || mesNum < 1 || mesNum > 12) {
      return res.status(400).json({ Erro: "Mês ou ano inválido." });
    }

    const primeiroDia = new Date(anoNum, mesNum - 1, 1).toISOString().slice(0, 10);
    const ultimoDia = new Date(anoNum, mesNum, 0).toISOString().slice(0, 10);

    await Faturamentos_Cancelados.sync({ alter: true });
    const cancelados = await Faturamentos_Cancelados.findAll({
      where: {
        Faturamento_Cancelado_Em: {
          [Op.between]: [primeiroDia, ultimoDia],
        },
      },
      order: [["Faturamento_Cancelado_Em", "DESC"], ["id", "DESC"]],
      raw: true,
    });

    if (cancelados.length === 0) {
      return res.json({ cancelados: [], alunos: [], planos: [], mesSelecionado: mesNum, anoSelecionado: anoNum });
    }

    const codigosAlunos = [...new Set(cancelados.map((f) => f.Aluno_Codigo))];
    const alunos = await Alunos_Cadastros.findAll({
      where: { Alunos_Codigo: codigosAlunos },
      attributes: ["Alunos_Codigo", "Alunos_Nome", "Alunos_CPF"],
      raw: true,
    });

    const codigosPlanos = [...new Set(cancelados.map((f) => f.Plano_Codigo))];
    const planos = await Planos_Cadastro.findAll({
      where: { Plano_Codigo: codigosPlanos },
      attributes: ["Plano_Codigo", "Plano_Nome", "Plano_Pagamento", "Plano_Valor"],
      raw: true,
    });

    res.json({ cancelados, alunos, planos, mesSelecionado: mesNum, anoSelecionado: anoNum });
  } catch (error) {
    console.error("Erro ao buscar relatório de faturamentos cancelados:", error);
    res.status(500).json({
      Erro: "Erro ao buscar relatório de faturamentos cancelados.",
      Detalhes: error.message,
    });
  }
});

// PATCH /faturamento/cancelar-plano/:id
// Exclui o plano contratado quando o cancelamento esta dentro do prazo permitido
router.patch("/cancelar-plano/:id", uploadComprovante.single("comprovanteEstorno"), async (req, res) => {
  try {
    const { id } = req.params;
    const motivoCancelamento = String(req.body?.motivo || "").trim();

    if (!motivoCancelamento) {
      return res
        .status(400)
        .json({ Erro: "O motivo do cancelamento é obrigatório." });
    }

    if (!req.file) {
      return res.status(400).json({ Erro: "Informe o comprovante de estorno." });
    }

    const faturamento = await Alunos_Faturamento.findByPk(id);
    if (!faturamento) {
      return res.status(404).json({ Erro: "Faturamento nao encontrado." });
    }

    if (faturamento.Faturamento_Data_Pagamento) {
      const dataPagamento = new Date(faturamento.Faturamento_Data_Pagamento);
      const hoje = new Date();
      dataPagamento.setHours(0, 0, 0, 0);
      hoje.setHours(0, 0, 0, 0);
      const diasAposPagamento = Math.floor(
        (hoje.getTime() - dataPagamento.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diasAposPagamento > 7) {
        return res.status(400).json({
          Erro: "Cancelamento não permitido. Prazo de 7 dias após o pagamento expirado. Efetue o lançamento do reajuste",
        });
      }
    }


    const dadosExcluidos = faturamento.toJSON();
    const dataCancelamento = new Date().toISOString().slice(0, 10);
    const comprovanteEstornoRelativo = getArquivoRelativoSalvo(req.file);
    await Faturamentos_Cancelados.sync({ alter: true });
    const faturamentoCancelado = await Faturamentos_Cancelados.create({
      ...dadosExcluidos,
      id: undefined,
      Faturamento_Original_ID: dadosExcluidos.id,
      Faturamento_Cancelado: true,
      Faturamento_Cancelado_Em: dataCancelamento,
      Faturamento_Cancelado_Motivo: motivoCancelamento,
      Faturamento_Cancelado_Comprovante: comprovanteEstornoRelativo,
    });
    const reajustes = await Alunos_Faturamento_Reajustes.findAll({
      where: { Faturamento_ID: id },
    });

    for (const reajuste of reajustes) {
      await reajuste.destroy();
    }

    await faturamento.destroy();

    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "DELETE",
      "Alunos_Faturamento",
      id,
      `Cancelamento com exclusão do plano contratado para faturamento ${id} do aluno ${faturamento.Aluno_Codigo}. Motivo: ${motivoCancelamento}. Histórico: ${faturamentoCancelado.id}`,
      dadosExcluidos,
      null,
    );

    res.json({
      Mensagem: "Plano cancelado com sucesso.",
      reajustesExcluidos: reajustes.length,
      motivo: motivoCancelamento,
      comprovanteEstorno: comprovanteEstornoRelativo,
      canceladoId: faturamentoCancelado.id,
    });
  } catch (error) {
    console.error("Erro ao cancelar plano:", error);
    res
      .status(500)
      .json({ Erro: "Erro ao cancelar plano.", Detalhes: error.message });
  }
});
// PATCH /faturamento/reajuste-plano/:id
// Aplica um reajuste de valor mensal a partir de um determinado mês
router.patch(
  "/reajuste-plano/:id",
  uploadComprovante.single("comprovante"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { novoValor, apartirDe, motivo, tipoReajuste } = req.body;
      const comprovanteObrigatorio = tipoReajuste !== "desconto";

      if (
        !novoValor ||
        !apartirDe ||
        !String(motivo || "").trim() ||
        (comprovanteObrigatorio && !req.file)
      ) {
        return res.status(400).json({
          Erro: "Os campos novoValor, apartirDe e motivo são obrigatórios. O comprovante é obrigatório apenas para acréscimo.",
        });
      }

      const valorParsed = parseFloat(novoValor);
      if (isNaN(valorParsed) || valorParsed < 0) {
        return res.status(400).json({ Erro: "Valor de reajuste inválido." });
      }

      const motivoAjustado = String(motivo).trim();
      const comprovanteReajusteRelativo = req.file
        ? getArquivoRelativoSalvo(req.file)
        : null;

      const faturamento = await Alunos_Faturamento.findByPk(id);
      if (!faturamento) {
        return res.status(404).json({ Erro: "Faturamento não encontrado." });
      }

      const possuiReajusteAnterior =
        faturamento.Faturamento_Reajuste &&
        faturamento.Faturamento_Reajuste_Partir_De;
      const reajustesExistentes = await Alunos_Faturamento_Reajustes.count({
        where: { Faturamento_ID: id },
      });

      if (possuiReajusteAnterior && reajustesExistentes === 0) {
        await Alunos_Faturamento_Reajustes.create({
          Faturamento_ID: id,
          Faturamento_Reajuste: faturamento.Faturamento_Reajuste,
          Faturamento_Reajuste_Partir_De:
            faturamento.Faturamento_Reajuste_Partir_De,
          Faturamento_Reajuste_Motivo:
            faturamento.Faturamento_Reajuste_Motivo || "Reajuste anterior",
          Faturamento_Reajuste_Comprovante:
            faturamento.Faturamento_Reajuste_Comprovante || comprovanteReajusteRelativo,
        });
      }

      const novoReajuste = await Alunos_Faturamento_Reajustes.create({
        Faturamento_ID: id,
        Faturamento_Reajuste: valorParsed,
        Faturamento_Reajuste_Partir_De: apartirDe,
        Faturamento_Reajuste_Motivo: motivoAjustado,
        Faturamento_Reajuste_Comprovante: comprovanteReajusteRelativo,
      });

      await Alunos_Faturamento.update(
        {
          Faturamento_Reajuste: valorParsed,
          Faturamento_Reajuste_Partir_De: apartirDe,
          Faturamento_Reajuste_Motivo: motivoAjustado,
          Faturamento_Reajuste_Comprovante: comprovanteReajusteRelativo,
        },
        { where: { id } },
      );

      const usuarioLog = getUsuarioFromReq(req);
      await registrarLog(
        usuarioLog,
        "UPDATE",
        "Alunos_Faturamento_Reajustes",
        novoReajuste.id,
        `Reajuste de plano aplicado para faturamento ${id} do aluno ${faturamento.Aluno_Codigo} a partir de ${apartirDe}. Motivo: ${motivoAjustado}`,
        null,
        {
          Faturamento_ID: id,
          Faturamento_Reajuste: valorParsed,
          Faturamento_Reajuste_Partir_De: apartirDe,
          Faturamento_Reajuste_Motivo: motivoAjustado,
          Faturamento_Reajuste_Comprovante: comprovanteReajusteRelativo,
        },
      );

      res.json({
        Mensagem: "Reajuste aplicado com sucesso.",
        apartirDe,
        novoValor: valorParsed,
        motivo: motivoAjustado,
        comprovante: comprovanteReajusteRelativo,
      });
    } catch (error) {
      console.error("Erro ao aplicar reajuste:", error);
      res
        .status(500)
        .json({ Erro: "Erro ao aplicar reajuste.", Detalhes: error.message });
    }
  },
);

module.exports = router;

// Rota para buscar alunos com renovação no mês vigente e no próximo mês.
router.get("/expirando", async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const montarPeriodoMes = (offsetMes) => {
      const inicio = new Date(ano, mesAtual + offsetMes, 1);
      const fim = new Date(ano, mesAtual + offsetMes + 1, 0);

      return {
        inicio: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, "0")}-01`,
        fim: `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`,
      };
    };

    const mesVigente = montarPeriodoMes(0);
    const proximoMes = montarPeriodoMes(1);

    const faturamentos = await Alunos_Faturamento.findAll({
      where: {
        Faturamento_Fim: {
          [Op.between]: [mesVigente.inicio, proximoMes.fim],
        },
        Faturamento_Data_Pagamento: { [Op.ne]: null },
        [Op.or]: [
          { Faturamento_Cancelado: null },
          { Faturamento_Cancelado: false },
        ],
      },
      raw: true,
    });

    if (faturamentos.length === 0) {
      return res.json({ alunos: [], mesVigente: [], proximoMes: [] });
    }

    const alunosCodigos = [...new Set(faturamentos.map((f) => f.Aluno_Codigo))];
    const todosFaturamentos = await Alunos_Faturamento.findAll({
      where: { Aluno_Codigo: alunosCodigos },
      attributes: ["id", "Aluno_Codigo", "Faturamento_Fim"],
      raw: true,
    });

    const ultimoPlanoVigente = faturamentos.filter((fat) => {
      const fatId = fat.id || fat.Faturamento_ID;
      return !todosFaturamentos.some((outro) => {
        const outroId = outro.id || outro.Faturamento_ID;
        return (
          outro.Aluno_Codigo === fat.Aluno_Codigo &&
          outroId !== fatId &&
          String(outro.Faturamento_Fim || "") > String(fat.Faturamento_Fim || "")
        );
      });
    });

    if (ultimoPlanoVigente.length === 0) {
      return res.json({ alunos: [], mesVigente: [], proximoMes: [] });
    }

    const codigosFinais = [...new Set(ultimoPlanoVigente.map((f) => f.Aluno_Codigo))];
    const alunos = await Alunos_Cadastros.findAll({
      where: { Alunos_Codigo: codigosFinais, Alunos_Situacao: "Ativo" },
      attributes: [
        "Alunos_Codigo",
        "Alunos_Nome",
        "Alunos_CPF",
        "Alunos_Telefone",
      ],
      raw: true,
    });

    const alunosAtivos = new Set(alunos.map((a) => a.Alunos_Codigo));
    const montarResultado = (fat, tipo) => {
      const aluno = alunos.find((a) => a.Alunos_Codigo === fat.Aluno_Codigo);
      return {
        Alunos_Codigo: fat.Aluno_Codigo,
        Alunos_Nome: aluno.Alunos_Nome || null,
        Alunos_CPF: aluno.Alunos_CPF || null,
        Alunos_Telefone: aluno.Alunos_Telefone || null,
        Plano_Codigo: fat.Plano_Codigo,
        Faturamento_Fim: fat.Faturamento_Fim,
        Faturamento_ID: fat.id || fat.Faturamento_ID,
        tipo,
      };
    };

    const mesVigenteResultado = ultimoPlanoVigente
      .filter(
        (fat) =>
          alunosAtivos.has(fat.Aluno_Codigo) &&
          String(fat.Faturamento_Fim || "") >= mesVigente.inicio &&
          String(fat.Faturamento_Fim || "") <= mesVigente.fim,
      )
      .map((fat) => montarResultado(fat, "renovacao_mes_vigente"));

    const proximoMesResultado = ultimoPlanoVigente
      .filter(
        (fat) =>
          alunosAtivos.has(fat.Aluno_Codigo) &&
          String(fat.Faturamento_Fim || "") >= proximoMes.inicio &&
          String(fat.Faturamento_Fim || "") <= proximoMes.fim,
      )
      .map((fat) => montarResultado(fat, "renovacao_proximo_mes"));

    res.json({
      alunos: [...mesVigenteResultado, ...proximoMesResultado],
      mesVigente: mesVigenteResultado,
      proximoMes: proximoMesResultado,
    });
  } catch (error) {
    console.error("Erro ao buscar faturamentos expirando:", error);
    res.status(500).json({ Erro: "Erro ao buscar faturamentos expirando." });
  }
});