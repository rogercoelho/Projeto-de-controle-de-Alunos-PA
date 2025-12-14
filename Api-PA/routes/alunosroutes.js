const express = require("express"); // Importando o módulo express e o modelo Alunos_Cadastro
const Alunos_Cadastros = require("../models/Alunos_Cadastro"); // Importando o modelo Alunos_Cadastro para interagir com a tabela no banco de dados
const { Error, Op } = require("sequelize"); // Importando o objeto Error e Op do Sequelize para manipulação de erros e operadores
const multer = require("multer"); // Importando multer para upload de arquivos
const path = require("path"); // Importando path para manipular caminhos de arquivos
const fs = require("fs"); // Importando fs para manipular arquivos
const { registrarLog } = require("../utils/logger"); // Importando função para registrar logs
const router = express.Router(); //// Criando uma instância do roteador do Express

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Caminho absoluto do servidor de produção
    const baseDir =
      process.env.NODE_ENV === "production"
        ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
        : path.join(__dirname, "../uploads");

    // Define o diretório de destino baseado no tipo de arquivo
    const uploadDir =
      file.fieldname === "foto"
        ? path.join(baseDir, "fotos")
        : path.join(baseDir, "contratos");

    // Garante que o diretório existe
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (error) {
        console.error(`Erro ao criar pasta de upload:`, error);
        return cb(error);
      }
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gera nome do arquivo com formato: tipo_id_XXX_AAAAMMDD_ms
    const codigo = req.body.Alunos_Codigo || "novo";
    const ext = path.extname(file.originalname);
    const tipo = file.fieldname === "foto" ? "foto" : "contrato";
    const now = new Date();
    const data = now.toISOString().slice(0, 10).replace(/-/g, ""); // AAAAMMDD
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    const filename = `${tipo}_id_${codigo}_${data}_${ms}${ext}`;
    cb(null, filename);
  },
});

// Filtro para aceitar apenas certos tipos de arquivo
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "foto") {
    // Para fotos: aceita imagens
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(
        new Error("Apenas arquivos de imagem são permitidos para foto!"),
        false
      );
    }
  } else if (file.fieldname === "contrato") {
    // Para contratos: aceita PDF e imagens
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Apenas arquivos PDF ou imagens são permitidos para contrato!"
        ),
        false
      );
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por arquivo
});

// ✅ Inicio - Rota para obter todos os alunos.
router.get("/", async (req, res) => {
  // Definindo a rota GET para obter todos os alunos o "/" define que é na raiz dessa rota alunos "/alunos"
  try {
    // Iniciando o bloco try para capturar erros "tentar".
    const todosAlunos = await Alunos_Cadastros.findAll(); // Usando o método findAll do Sequelize para buscar todos os registros na tabela Alunos_Cadastro

    res.json({
      // Enviando a resposta (result) em formato JSON
      statusCode: res.statusCode || 200, // Retornando o statuscode ou 200
      Mensagem: "Estes são todos os alunos cadastrados.", // Mensagem de sucesso para o json
      Listagem_de_Alunos: todosAlunos, // Retornando os dados do novo aluno criado no json
    });
  } catch (error) {
    // Capturando erros que possam ocorrer durante a busca dos dados
    console.error("Erro ao buscar alunos:", error.message);

    res.json({
      // Enviando a resposta (result) em formato JSON
      statusCode: error.original?.code || 500, // Retornando o status de erro do banco de dados ou 500 se não houver
      Mensagem: "Erro ao buscar dados na Tabela de Alunos_Cadastro", // Mensagem de erro no cadastro para o json
      Erro: error.message, // Detalhes do erro para o json
    });
    console.log("Erro ao buscar dados na Tabela de Alunos_Cadastro: " + error); // Mensagem de erro no cadastro para o console
  }
});
// ✅ Fim - Rota para obter todos os alunos

// ✅ Inicio - Rota para criar um novo aluno
router.post(
  "/create/",
  upload.fields([
    { name: "foto", maxCount: 1 },
    { name: "contrato", maxCount: 1 },
  ]),
  async (req, res) => {
    // Definindo a rota POST para criar um novo aluno. ficando na raiz dessa rota alunos "/alunos/create"
    try {
      // Iniciando o bloco try para capturar erros "tentar".
      let {
        Alunos_Codigo,
        Alunos_Nome,
        Alunos_CPF,
        Alunos_Data_Nascimento,
        Alunos_Nome_Responsavel,
        Alunos_CPF_Responsavel,
        Alunos_Endereco_CEP,
        Alunos_Endereco,
        Alunos_Endereco_Complemento,
        Alunos_Endereco_Bairro,
        Alunos_Endereco_Localidade,
        Alunos_Endereco_Cidade,
        Alunos_Endereco_Estado,
        Alunos_Telefone,
        Alunos_Email,
        Alunos_Contato_Emergencia,
        Alunos_Telefone_Emergencia_1,
        Alunos_Telefone_Emergencia_2,
        Alunos_Situacao,
        Alunos_Data_Matricula,
        Alunos_Observacoes,
      } = req.body;
      // Se não vier preenchido, define como 'Aluno Maior de Idade'
      if (!Alunos_Nome_Responsavel || Alunos_Nome_Responsavel.trim() === "") {
        Alunos_Nome_Responsavel = "Aluno Maior de Idade";
      }

      // Captura os caminhos dos arquivos enviados
      const Alunos_Foto = req.files?.foto ? req.files.foto[0].filename : null;
      const Alunos_Contrato = req.files?.contrato
        ? req.files.contrato[0].filename
        : null;

      //usando o método create do Sequelize para inserir os dados na tabela Alunos_Cadastro
      const novoAluno = await Alunos_Cadastros.create({
        Alunos_Codigo,
        Alunos_Nome,
        Alunos_CPF,
        Alunos_Data_Nascimento,
        Alunos_Nome_Responsavel,
        Alunos_CPF_Responsavel,
        Alunos_Endereco_CEP,
        Alunos_Endereco,
        Alunos_Endereco_Complemento,
        Alunos_Endereco_Bairro,
        Alunos_Endereco_Localidade,
        Alunos_Endereco_Cidade,
        Alunos_Endereco_Estado,
        Alunos_Telefone,
        Alunos_Email,
        Alunos_Contato_Emergencia,
        Alunos_Telefone_Emergencia_1,
        Alunos_Telefone_Emergencia_2,
        Alunos_Situacao,
        Alunos_Data_Matricula,
        Alunos_Foto,
        Alunos_Contrato,
        Alunos_Observacoes,
      });

      // Registra log de criação
      await registrarLog(
        req.body.usuario || "Sistema",
        "CREATE",
        "Alunos_Cadastros",
        Alunos_Codigo,
        `Aluno ${Alunos_Nome} cadastrado`,
        null,
        novoAluno.toJSON()
      );

      res.json({
        // Enviando a resposta (res) em formato JSON
        statusCode: res.statusCode || 201, // Retornando o statuscode 201
        Mensagem: "Novo aluno cadastrado com sucesso!", // Mensagem de sucesso para o json
        Aluno_Cadastrado: novoAluno, // Retornando os dados do novo aluno criado no json
      });
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        // Pega o campo que causou o erro
        const campo = error.errors && error.errors[0].path;
        let mensagem = "Campo único já cadastrado.";
        let erro = "CAMPO_DUPLICADO";

        if (campo === "Alunos_Codigo") {
          mensagem = "Código do aluno já cadastrado.";
          erro = "CODIGO_DUPLICADO";
        } else if (campo === "Alunos_Nome") {
          mensagem = "Nome do aluno já cadastrado.";
          erro = "NOME_DUPLICADO";
        } else if (campo === "Alunos_CPF") {
          mensagem = "CPF já cadastrado.";
          erro = "CPF_DUPLICADO";
        }

        return res.status(400).json({
          Mensagem: mensagem,
          Erro: erro,
        });
      }

      if (error.name === "SequelizeValidationError") {
        return res.status(400).json({
          Mensagem:
            "Erro de validação: " +
            error.errors.map((e) => e.message).join(", "),
          Erro: "VALIDATION_ERROR",
        });
      }

      res.status(500).json({
        Mensagem: "Erro interno do servidor.",
        Erro: error.message,
      });
    }
  }
);
// ✅ Fim - Rota para criar um novo aluno

// ✅ Inicio - Rota para atualizar parcialmente um aluno
router.patch(
  "/update/:Alunos_Codigo",
  upload.fields([
    { name: "foto", maxCount: 1 },
    { name: "contrato", maxCount: 1 },
  ]),
  async (req, res) => {
    // Definindo a rota PATCH para atualizar parcialmente um aluno. O async indica que a função é assíncrona
    try {
      // Iniciando o bloco try para capturar erros "tentar".
      const codigo = parseInt(req.params.Alunos_Codigo, 10); // Criado uma constante que converte para número o valor do Alunos_Codigo
      const atualizaaluno = await Alunos_Cadastros.findByPk(codigo); // Buscando o aluno pelo ID fornecido na URL e armazenando na constante atualizaaluno.
      if (!atualizaaluno) {
        // Verificando se o aluno foi encontrado
        return res.json({
          // Retornando a resposta (res) em formato JSON
          statusCode: 404, // Retornando o statuscode 404 se o aluno não for encontrado
          Mensagem: "Aluno não encontrado", // Mensagem de erro se o aluno não for encontrado para o json
        });
        console.log("Aluno não encontrado: " + codigo); // Log de erro se o aluno não for encontrado para o console
      }

      // Prepara os dados para atualização
      const dadosAtualizacao = { ...req.body };

      // Se o nome do responsável estiver vazio, grava "Aluno Maior de Idade"
      if (
        dadosAtualizacao.Alunos_Nome_Responsavel !== undefined &&
        (!dadosAtualizacao.Alunos_Nome_Responsavel ||
          dadosAtualizacao.Alunos_Nome_Responsavel.trim() === "")
      ) {
        dadosAtualizacao.Alunos_Nome_Responsavel = "Aluno Maior de Idade";
      }

      // Guarda dados antigos para o log
      const dadosAntigos = atualizaaluno.toJSON();

      // Se novos arquivos foram enviados, atualiza os caminhos com nomes únicos
      if (req.files?.foto) {
        const baseDir =
          process.env.NODE_ENV === "production"
            ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
            : path.join(__dirname, "../uploads");
        const pastaFotos = path.join(baseDir, "fotos");
        const ext = path.extname(req.files.foto[0].originalname);
        // Formato: foto_id_XXX_AAAAMMDD_ms
        const now = new Date();
        const data = now.toISOString().slice(0, 10).replace(/-/g, ""); // AAAAMMDD
        const ms = now.getMilliseconds().toString().padStart(3, "0");
        const novoNomeFoto = `foto_id_${codigo}_${data}_${ms}${ext}`;
        const novoCaminhoFoto = path.join(pastaFotos, novoNomeFoto);
        // Renomeia o arquivo salvo pelo multer para o novo nome único
        fs.renameSync(req.files.foto[0].path, novoCaminhoFoto);
        // Remove foto antiga se existir e for diferente do novo nome
        const arquivosFotos = fs.readdirSync(pastaFotos);
        const fotoAntiga = arquivosFotos.find(
          (arquivo) =>
            (arquivo.startsWith(`foto_id_${codigo}_`) ||
              arquivo.startsWith(`${codigo}_foto`)) &&
            arquivo !== novoNomeFoto
        );
        if (fotoAntiga) {
          const caminhoFotoAntiga = path.join(pastaFotos, fotoAntiga);
          if (fs.existsSync(caminhoFotoAntiga)) {
            fs.unlinkSync(caminhoFotoAntiga);
          }
        }
        dadosAtualizacao.Alunos_Foto = novoNomeFoto;
      }

      if (req.files?.contrato) {
        const baseDir =
          process.env.NODE_ENV === "production"
            ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
            : path.join(__dirname, "../uploads");
        const pastaContratos = path.join(baseDir, "contratos");
        const ext = path.extname(req.files.contrato[0].originalname);
        // Formato: contrato_id_XXX_AAAAMMDD_ms
        const nowContrato = new Date();
        const dataContrato = nowContrato
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, ""); // AAAAMMDD
        const msContrato = nowContrato
          .getMilliseconds()
          .toString()
          .padStart(3, "0");
        const novoNomeContrato = `contrato_id_${codigo}_${dataContrato}_${msContrato}${ext}`;
        const novoCaminhoContrato = path.join(pastaContratos, novoNomeContrato);
        fs.renameSync(req.files.contrato[0].path, novoCaminhoContrato);
        // Remove contrato antigo se existir e for diferente do novo nome
        const arquivosContratos = fs.readdirSync(pastaContratos);
        const contratoAntigo = arquivosContratos.find(
          (arquivo) =>
            (arquivo.startsWith(`contrato_id_${codigo}_`) ||
              arquivo.startsWith(`${codigo}_contrato`)) &&
            arquivo !== novoNomeContrato
        );
        if (contratoAntigo) {
          const caminhoContratoAntigo = path.join(
            pastaContratos,
            contratoAntigo
          );
          if (fs.existsSync(caminhoContratoAntigo)) {
            fs.unlinkSync(caminhoContratoAntigo);
          }
        }
        dadosAtualizacao.Alunos_Contrato = novoNomeContrato;
      }

      await atualizaaluno.update(dadosAtualizacao, {
        fields: Object.keys(dadosAtualizacao),
      }); // Atualizando o aluno com os dados fornecidos no corpo da requisição, apenas os campos presentes no corpo serão atualizados. Objeto Object.keys(req.body) retorna um array com os nomes dos campos a serem atualizados.

      // Determina o tipo de ação para o log
      let acao = "UPDATE";
      let descricao = `Aluno ${atualizaaluno.Alunos_Nome} atualizado`;

      if (dadosAtualizacao.Alunos_Situacao) {
        if (dadosAtualizacao.Alunos_Situacao === "Ativo") {
          acao = "ATIVAR";
          descricao = `Aluno ${atualizaaluno.Alunos_Nome} ativado`;
        } else if (dadosAtualizacao.Alunos_Situacao === "Desativado") {
          acao = "DESATIVAR";
          descricao = `Aluno ${atualizaaluno.Alunos_Nome} desativado`;
        }
      }

      // Registra log de atualização
      await registrarLog(
        req.body.usuario || "Sistema",
        acao,
        "Alunos_Cadastros",
        codigo,
        descricao,
        dadosAntigos,
        atualizaaluno.toJSON()
      );

      res.json({
        // Enviando a resposta (res) em formato JSON
        statusCode: res.statusCode || 200, // Retornando o statuscode ou 200 se não houver
        Mensagem: "Aluno alterado parcialmente com sucesso!", // Mensagem de sucesso para o json
        Aluno_Atualizado: atualizaaluno, // Retornando os dados do aluno atualizado no json
      });
      console.log("Aluno atualizado com sucesso! ID: " + codigo); // Log de sucesso na atualização do aluno para o console
    } catch (error) {
      // Capturando erros que possam ocorrer durante a atualização do aluno
      res.json({
        // Enviando a resposta (res) em formato JSON
        statusCode: error.original?.code || 500, // Retornando o status de erro ou 500 se não houver
        Mensagem: "Erro ao atualizar aluno", // Mensagem de erro no json
        Erro: error.message, // Detalhes do erro para o json
      });
      console.log("Erro ao atualizar aluno: " + error); // Log de erro na atualização do aluno para o console
    }
  }
);
// ✅ Fim - Rota para atualizar parcialmente um aluno

// ✅ Inicio -Rota para obter um aluno específico
router.get("/codigo/:aluno_codigo", async (req, res) => {
  // Definindo a rota GET para obter um aluno específico pelo código
  try {
    // Iniciando o bloco try para capturar erros "tentar".
    const aluno_codigo = parseInt(req.params.aluno_codigo, 10); // Convertendo o parâmetro de código para número inteiro

    if (isNaN(aluno_codigo)) {
      // Verificando se o código é um número válido
      return res.status(400).json({ erro: "Código inválido" }); // Retornando status 400 Bad Request se o código for inválido
    }
    const aluno = await Alunos_Cadastros.findByPk(aluno_codigo); // Cria uma constante aluno_codigo que busca pela PK (código) do aluno no banco de dados
    if (!aluno_codigo) {
      // Verificando se o aluno foi encontrado
      return res.status(404).json({ mensagem: "Aluno não encontrado" }); // Retornando status 404 Not Found se o aluno não for encontrado
    }
    res.json(aluno); // Se foi encontrado, retorna os dados do aluno em formato JSON
  } catch (error) {
    // Capturando erros que possam ocorrer durante a busca do aluno
    res.status(500).json({
      statusCode: error.original?.code || 500, // Retornando status 500 Internal Server Error em caso de erro
      Mensagem: "Erro ao buscar aluno", // Mensagem de erro
      Erro: error.message, // Detalhes do erro
    });
  }
});

// ✅ Rota para pesquisar aluno por nome (parcial ou completo)
router.get("/nome/:nome", async (req, res) => {
  try {
    const nome = req.params.nome;
    if (!nome || nome.trim() === "") {
      return res.status(400).json({ Mensagem: "Nome não informado" });
    }
    // Busca alunos cujo nome contenha o termo (case-insensitive)
    const alunos = await Alunos_Cadastros.findAll({
      where: {
        Alunos_Nome: { [Op.like]: `%${nome}%` },
      },
    });
    if (!alunos || alunos.length === 0) {
      return res
        .status(404)
        .json({ Mensagem: "Nenhum aluno encontrado com esse nome" });
    }
    res.json({
      statusCode: 200,
      Mensagem: `Alunos encontrados com nome contendo: ${nome}`,
      Listagem_de_Alunos: alunos,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: error.original?.code || 500,
      Mensagem: "Erro ao buscar aluno por nome",
      Erro: error.message,
    });
  }
});

// ✅ Rota para pesquisar aluno por CPF (exato)
router.get("/cpf/:cpf", async (req, res) => {
  try {
    let cpf = req.params.cpf;
    if (!cpf || cpf.trim() === "") {
      return res.status(400).json({ Mensagem: "CPF não informado" });
    }
    // Busca exatamente o valor recebido (com máscara)
    const aluno = await Alunos_Cadastros.findOne({
      where: { Alunos_CPF: cpf },
    });
    if (!aluno) {
      return res
        .status(404)
        .json({ Mensagem: "Aluno não encontrado com esse CPF" });
    }
    res.json({
      statusCode: 200,
      Mensagem: `Aluno encontrado com CPF: ${cpf}`,
      Aluno: aluno,
    });
  } catch (error) {
    res.status(500).json({
      statusCode: error.original?.code || 500,
      Mensagem: "Erro ao buscar aluno por CPF",
      Erro: error.message,
    });
  }
});

// ✅ Fim - Rota para obter um aluno específico

// Rota para excluir um aluno
router.delete("/delete/:aluno_codigo", async (req, res) => {
  // Definindo a rota DELETE para excluir um aluno pelo código
  try {
    // Iniciando o bloco try para capturar erros "tentar".
    const aluno_codigo = parseInt(req.params.aluno_codigo, 10); // Criando uma constante que converte para número o valor do aluno_codigo
    if (isNaN(aluno_codigo)) {
      // Verificando se o código é um número válido
      return res.status(400).json({
        statusCode: 400,
        Mensagem: "Código inválido",
      });
    }

    const aluno = await Alunos_Cadastros.findByPk(aluno_codigo);

    if (!aluno) {
      // Verificando se o aluno foi encontrado
      return res.status(404).json({
        statusCode: 404,
        Mensagem: "Aluno não encontrado",
      });
    }

    // Remove arquivos associados (foto e contrato)
    const baseDir =
      process.env.NODE_ENV === "production"
        ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
        : path.join(__dirname, "../uploads");

    // Remove foto se existir
    if (aluno.Alunos_Foto) {
      const fotoPath = path.join(baseDir, "fotos", aluno.Alunos_Foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    // Remove contrato se existir
    if (aluno.Alunos_Contrato) {
      const contratoPath = path.join(
        baseDir,
        "contratos",
        aluno.Alunos_Contrato
      );
      if (fs.existsSync(contratoPath)) {
        fs.unlinkSync(contratoPath);
      }
    }

    // Guarda dados antes de apagar
    const dadosApagados = aluno.toJSON();

    await aluno.destroy(); // Apaga do banco

    // Registra log de exclusão
    await registrarLog(
      req.body.usuario || "Sistema",
      "DELETE",
      "Alunos_Cadastros",
      aluno_codigo,
      `Aluno ${dadosApagados.Alunos_Nome} excluído`,
      dadosApagados,
      null
    );

    res.json({
      statusCode: 200,
      Mensagem: `Aluno ${dadosApagados.Alunos_Nome} excluído com sucesso`,
    });
  } catch (error) {
    // Capturando erros que possam ocorrer durante a exclusão do aluno
    console.error("Erro ao excluir aluno:", error.message);
    res.status(500).json({
      statusCode: error.original?.code || 500,
      Mensagem: "Erro ao excluir aluno",
      Erro: error.message,
    });
  }
});

module.exports = router;
