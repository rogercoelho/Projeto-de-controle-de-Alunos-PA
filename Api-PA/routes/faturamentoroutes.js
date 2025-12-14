const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Planos_Cadastro = require("../models/Planos_Cadastro");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Alunos_Faturamento = require("../models/Alunos_Faturamento");

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
        "Apenas arquivos PDF ou imagens são permitidos para comprovante!"
      ),
      false
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

// GET /faturamento/extrato/:Aluno_Codigo/:ano
// Retorna o extrato do aluno: informações do aluno, planos e pagamentos do ano
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

    // Busca faturamentos do aluno que tenham meses no ano selecionado
    // Inclui faturamentos onde:
    // - Faturamento_Inicio está no ano selecionado, OU
    // - Faturamento_Fim está no ano selecionado, OU
    // - O período atravessa o ano (inicio antes e fim depois)
    const faturamentos = await Alunos_Faturamento.findAll({
      where: {
        Aluno_Codigo,
        [Op.or]: [
          // Faturamento começa no ano selecionado
          {
            Faturamento_Inicio: {
              [Op.between]: [`${ano}-01-01`, `${ano}-12-31`],
            },
          },
          // Faturamento termina no ano selecionado
          {
            Faturamento_Fim: {
              [Op.between]: [`${ano}-01-01`, `${ano}-12-31`],
            },
          },
          // Faturamento atravessa o ano (começa antes e termina depois)
          {
            [Op.and]: [
              {
                Faturamento_Inicio: {
                  [Op.lt]: `${ano}-01-01`,
                },
              },
              {
                Faturamento_Fim: {
                  [Op.gt]: `${ano}-12-31`,
                },
              },
            ],
          },
        ],
      },
      raw: true,
    });

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

    res.json({ aluno, planos });
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
            `Mapeando arquivo ${req.files[i].filename} para faturamento ${fatId}`
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
          Faturamento_Motivo,
        } = pag;
        if (!id) continue;

        const updateData = {
          Faturamento_Data_Pagamento: Faturamento_Data_Pagamento || null,
          Faturamento_Desconto: Faturamento_Desconto || null,
          Faturamento_Motivo: Faturamento_Motivo || null,
        };

        // Se existe comprovante para esse faturamento
        if (arquivosMap[id]) {
          updateData.Faturamento_Comprovante = arquivosMap[id];
          console.log(
            `Salvando comprovante ${arquivosMap[id]} para faturamento ${id}`
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
      }
      res.json({ Mensagem: "Pagamentos registrados.", resultados });
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      res.status(500).json({
        Erro: "Erro ao registrar pagamento.",
        Detalhes: error.message,
      });
    }
  }
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
      ultimoDiaDate.getDate()
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

    // Retorna os dados com o mês/ano selecionado para o frontend calcular a parcela correta
    res.json({
      pagamentos: faturamentos,
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

module.exports = router;
