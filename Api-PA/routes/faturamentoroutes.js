const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Planos_Cadastro = require("../models/Planos_Cadastro");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Alunos_Faturamento = require("../models/Alunos_Faturamento");
const Alunos_Faturamento_Reajustes = require("../models/Alunos_Faturamento_Reajustes");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");

// Configuração do multer para upload de comprovantes
const storageComprovante = multer.diskStorage({
  destination: function (req, file, cb) {
    const baseDir =
      process.env.NODE_ENV === "production"
        ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
        : path.join(__dirname, "../uploads");

    const uploadDir = path.join(baseDir, "comprovantes");

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
    // Obtém o código do aluno
    const alunoCodigo = req.body.alunoCodigo || "0";
    // Tenta obter o ID do faturamento correspondente a este arquivo
    let fatId = "";
    if (req.body && req.body.faturamentoIds) {
      let faturamentoIds = req.body.faturamentoIds;
      if (typeof faturamentoIds === "string") {
        try {
          faturamentoIds = JSON.parse(faturamentoIds);
        } catch {
          faturamentoIds = [];
        }
      }
      // O campo fieldname é sempre "comprovantes" (array), então usamos o índice do arquivo
      if (Array.isArray(faturamentoIds) && req.files) {
        // req.files ainda não está populado neste momento, mas podemos usar req._fileIndex
        fatId = faturamentoIds[req._fileIndex || 0] || "";
      }
    }
    // Formato: comprovante_id_ALUNO_fatid_FATURAMENTO_AAAAMMDD_ms
    const now = new Date();
    const data = now.toISOString().slice(0, 10).replace(/-/g, ""); // AAAAMMDD
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    // Monta o nome com id do aluno e fatid do faturamento
    const filename = fatId
      ? `comprovante_id_${alunoCodigo}_fatid_${fatId}_${data}_${ms}${ext}`
      : `comprovante_id_${alunoCodigo}_${data}_${ms}${ext}`;
    // Atualiza índice para o próximo arquivo
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
      attributes: ["Aluno_Codigo", "Plano_Codigo", "Faturamento_Fim"],
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

    // Busca apenas alunos Ativos
    const codigos = [...new Set(unicos.map((p) => p.Aluno_Codigo))];
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
    const resultado = unicos
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
          arquivosMap[fatId] = req.files[i].filename;
          console.log(
            `Mapeando arquivo ${req.files[i].filename} para faturamento ${fatId}`,
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

// PATCH /faturamento/cancelar-plano/:id
// Marca o faturamento como cancelado a partir do mês atual
router.patch("/cancelar-plano/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const motivoCancelamento = String(req.body?.motivo || "").trim();

    if (!motivoCancelamento) {
      return res
        .status(400)
        .json({ Erro: "O motivo do cancelamento é obrigatório." });
    }

    const faturamento = await Alunos_Faturamento.findByPk(id);
    if (!faturamento) {
      return res.status(404).json({ Erro: "Faturamento não encontrado." });
    }

    if (faturamento.Faturamento_Cancelado) {
      return res
        .status(400)
        .json({ Erro: "Este faturamento já está cancelado." });
    }

    const hoje = new Date();
    const dataCancelamento = hoje.toISOString().split("T")[0];

    await Alunos_Faturamento.update(
      {
        Faturamento_Cancelado: true,
        Faturamento_Cancelado_Em: dataCancelamento,
        Faturamento_Cancelado_Motivo: motivoCancelamento,
      },
      { where: { id } },
    );

    const usuarioLog = getUsuarioFromReq(req);
    await registrarLog(
      usuarioLog,
      "UPDATE",
      "Alunos_Faturamento",
      id,
      `Cancelamento de plano para faturamento ${id} do aluno ${faturamento.Aluno_Codigo}. Motivo: ${motivoCancelamento}`,
      {
        Faturamento_Cancelado: false,
        Faturamento_Cancelado_Motivo: faturamento.Faturamento_Cancelado_Motivo,
      },
      {
        Faturamento_Cancelado: true,
        Faturamento_Cancelado_Em: dataCancelamento,
        Faturamento_Cancelado_Motivo: motivoCancelamento,
      },
    );

    res.json({
      Mensagem: "Plano cancelado com sucesso.",
      dataCancelamento,
      motivo: motivoCancelamento,
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
    const { novoValor, apartirDe, motivo } = req.body;

    if (
      !novoValor ||
      !apartirDe ||
      !String(motivo || "").trim() ||
      !req.file
    ) {
      return res.status(400).json({
        Erro:
          "Os campos novoValor, apartirDe, motivo e comprovante são obrigatórios.",
      });
    }

    const valorParsed = parseFloat(novoValor);
    if (isNaN(valorParsed) || valorParsed < 0) {
      return res.status(400).json({ Erro: "Valor de reajuste inválido." });
    }

    const motivoAjustado = String(motivo).trim();

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
          faturamento.Faturamento_Reajuste_Comprovante || req.file.filename,
      });
    }

    const novoReajuste = await Alunos_Faturamento_Reajustes.create({
      Faturamento_ID: id,
      Faturamento_Reajuste: valorParsed,
      Faturamento_Reajuste_Partir_De: apartirDe,
      Faturamento_Reajuste_Motivo: motivoAjustado,
      Faturamento_Reajuste_Comprovante: req.file.filename,
    });

    await Alunos_Faturamento.update(
      {
        Faturamento_Reajuste: valorParsed,
        Faturamento_Reajuste_Partir_De: apartirDe,
        Faturamento_Reajuste_Motivo: motivoAjustado,
        Faturamento_Reajuste_Comprovante: req.file.filename,
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
        Faturamento_Reajuste_Comprovante: req.file.filename,
      },
    );

    res.json({
      Mensagem: "Reajuste aplicado com sucesso.",
      apartirDe,
      novoValor: valorParsed,
      motivo: motivoAjustado,
      comprovante: req.file.filename,
    });
  } catch (error) {
    console.error("Erro ao aplicar reajuste:", error);
    res
      .status(500)
      .json({ Erro: "Erro ao aplicar reajuste.", Detalhes: error.message });
  }
});

module.exports = router;

// Rota para buscar alunos com renovação pendente
// Lógica: planos cujo Faturamento_Fim já passou (até fim do mês atual) e não foram renovados
router.get("/expirando", async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;

    // Fim do mês atual
    const ultimoDiaDate = new Date(ano, mes, 0);
    const fimMesAtual = `${ano}-${String(mes).padStart(2, "0")}-${String(ultimoDiaDate.getDate()).padStart(2, "0")}`;

    // Lookback de 6 meses para não trazer registros muito antigos
    const lookbackDate = new Date(ano, mes - 1 - 6, 1);
    const lookbackISO = `${lookbackDate.getFullYear()}-${String(lookbackDate.getMonth() + 1).padStart(2, "0")}-01`;

    // Busca todos os faturamentos dentro da janela de lookback até fim do mês atual
    const faturamentos = await Alunos_Faturamento.findAll({
      where: {
        Faturamento_Fim: {
          [Op.between]: [lookbackISO, fimMesAtual],
        },
      },
      raw: true,
    });

    if (faturamentos.length === 0) {
      return res.json({ alunos: [] });
    }

    // Agrupa por Aluno_Codigo + Plano_Codigo, mantendo o Faturamento_Fim mais recente
    const mapLatest = {};
    for (const f of faturamentos) {
      const key = `${f.Aluno_Codigo}|${f.Plano_Codigo}`;
      if (
        !mapLatest[key] ||
        f.Faturamento_Fim > mapLatest[key].Faturamento_Fim
      ) {
        mapLatest[key] = f;
      }
    }
    const candidates = Object.values(mapLatest);

    // Para cada candidato, verifica se existe registro mais novo (Faturamento_Inicio > Faturamento_Fim)
    // indicando que o plano já foi renovado
    const alunosCodigos = [...new Set(candidates.map((c) => c.Aluno_Codigo))];
    const todosFaturamentos = await Alunos_Faturamento.findAll({
      where: { Aluno_Codigo: alunosCodigos },
      attributes: [
        "Aluno_Codigo",
        "Plano_Codigo",
        "Faturamento_Inicio",
        "Faturamento_Fim",
      ],
      raw: true,
    });

    const semRenovacao = candidates.filter((fat) => {
      // Se o aluno tem QUALQUER plano (mesmo código diferente) com início igual ou após
      // o fim deste plano, considera que renovou
      return !todosFaturamentos.some(
        (f) =>
          f.Aluno_Codigo === fat.Aluno_Codigo &&
          f.Faturamento_Inicio >= fat.Faturamento_Fim,
      );
    });

    if (semRenovacao.length === 0) {
      return res.json({ alunos: [] });
    }

    // Exclui alunos que já possuem pagamento pendente (eles aparecem apenas na seção "pendentes")
    const codigosComPendencia = new Set(
      (
        await Alunos_Faturamento.findAll({
          where: {
            Aluno_Codigo: [...new Set(semRenovacao.map((f) => f.Aluno_Codigo))],
            Faturamento_Data_Pagamento: null,
          },
          attributes: ["Aluno_Codigo"],
          raw: true,
        })
      ).map((f) => f.Aluno_Codigo),
    );
    const semRenovacaoSemPendencia = semRenovacao.filter(
      (fat) => !codigosComPendencia.has(fat.Aluno_Codigo),
    );

    if (semRenovacaoSemPendencia.length === 0) {
      return res.json({ alunos: [] });
    }

    // Busca apenas alunos Ativos
    const codigosFinais = [
      ...new Set(semRenovacaoSemPendencia.map((f) => f.Aluno_Codigo)),
    ];
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

    // Filtra apenas os registros cujo aluno é Ativo
    const alunosAtivos = new Set(alunos.map((a) => a.Alunos_Codigo));
    const resultado = semRenovacaoSemPendencia
      .filter((fat) => alunosAtivos.has(fat.Aluno_Codigo))
      .map((fat) => {
        const aluno = alunos.find((a) => a.Alunos_Codigo === fat.Aluno_Codigo);
        return {
          Alunos_Codigo: fat.Aluno_Codigo,
          Alunos_Nome: aluno.Alunos_Nome || null,
          Alunos_CPF: aluno.Alunos_CPF || null,
          Alunos_Telefone: aluno.Alunos_Telefone || null,
          Plano_Codigo: fat.Plano_Codigo,
          Faturamento_Fim: fat.Faturamento_Fim,
          Faturamento_ID: fat.id || fat.Faturamento_ID,
        };
      });

    res.json({ alunos: resultado });
  } catch (error) {
    console.error("Erro ao buscar faturamentos expirando:", error);
    res.status(500).json({ Erro: "Erro ao buscar faturamentos expirando." });
  }
});
