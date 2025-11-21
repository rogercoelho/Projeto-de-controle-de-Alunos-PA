const express = require("express"); // Importando o módulo express e o modelo Alunos_Cadastro
const Alunos_Cadastros = require("../models/Alunos_Cadastro"); // Importando o modelo Alunos_Cadastro para interagir com a tabela no banco de dados
const { Error } = require("sequelize"); // Importando o objeto Error do Sequelize para manipulação de erros
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
    // Gera nome do arquivo: ID_foto ou ID_contrato
    const codigo = req.body.Alunos_Codigo || Date.now();
    const ext = path.extname(file.originalname);
    const tipo = file.fieldname === "foto" ? "foto" : "contrato";
    const filename = `${codigo}_${tipo}${ext}`;
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
        Alunos_Nome_Responsavel,
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
        // Criando uma constante para o novo registro na tabela Alunos_Cadastro o await espera a conclusão da operação antes de prosseguir
        Alunos_Codigo,
        Alunos_Nome,
        Alunos_CPF,
        Alunos_Nome_Responsavel,
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
      // Capturando erros que possam ocorrer durante o cadastro do novo aluno
      console.error("Erro ao cadastrar aluno:", error.message);
      res.json({
        // Enviando a resposta (res) em formato JSON
        statusCode: error.original?.code || 500, // Retornando o status de erro ou 500 se não houver
        Mensagem: "Erro ao cadastrar novo aluno", // Mensagem de erro no cadastro para o json
        Erro: error.message, // Detalhes do erro para o json
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

      // Guarda dados antigos para o log
      const dadosAntigos = atualizaaluno.toJSON();

      // Se novos arquivos foram enviados, atualiza os caminhos
      if (req.files?.foto) {
        // Remove foto antiga se existir (busca por qualquer arquivo que comece com ID_foto)
        const baseDir =
          process.env.NODE_ENV === "production"
            ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
            : path.join(__dirname, "../uploads");
        const pastaFotos = path.join(baseDir, "fotos");
        const arquivosFotos = fs.readdirSync(pastaFotos);
        const fotoAntiga = arquivosFotos.find((arquivo) =>
          arquivo.startsWith(`${codigo}_foto`)
        );
        if (fotoAntiga) {
          const caminhoFotoAntiga = path.join(pastaFotos, fotoAntiga);
          if (fs.existsSync(caminhoFotoAntiga)) {
            fs.unlinkSync(caminhoFotoAntiga);
          }
        }
        dadosAtualizacao.Alunos_Foto = req.files.foto[0].filename;
      }

      if (req.files?.contrato) {
        // Remove contrato antigo se existir (busca por qualquer arquivo que comece com ID_contrato)
        const pastaContratos = path.join(__dirname, "../uploads/contratos");
        const arquivosContratos = fs.readdirSync(pastaContratos);
        const contratoAntigo = arquivosContratos.find((arquivo) =>
          arquivo.startsWith(`${codigo}_contrato`)
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
        dadosAtualizacao.Alunos_Contrato = req.files.contrato[0].filename;
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
router.get("/search/:aluno_codigo", async (req, res) => {
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
