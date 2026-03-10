// ==============================
// 🔒 securityroutes.js
// ==============================

require("dotenv").config(); // Carrega variáveis de ambiente do arquivo .env

const express = require("express"); // Importa o framework Express
const jwt = require("jsonwebtoken"); // Importa o pacote jsonwebtoken para manipulação de tokens JWT
const bcrypt = require("bcryptjs"); // Importa bcryptjs para hash de senhas
const Usuarios = require("../models/Usuarios"); // Importa o modelo de Usuários
const Alunos_Cadastros = require("../models/Alunos_Cadastro"); // Importa o modelo de Alunos
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");

const router = express.Router(); // Cria uma variavel constante para uma instância do roteador do Express

// 🟢 Inicio - Rota de login (gera token JWT)
router.post("/login", async (req, res) => {
  // Rota POST para login
  const { usuario, senha } = req.body; // Obtém usuário e senha do corpo da requisição

  try {
    // Busca o usuário no banco de dados
    const usuarioEncontrado = await Usuarios.findOne({
      where: { Usuario_Login: usuario, Usuario_Ativo: true },
    });

    // Se usuário não for encontrado ou senha estiver incorreta
    if (!usuarioEncontrado) {
      console.warn(
        `⚠️ Tentativa de login - usuário não encontrado: ${usuario} ⚠️`,
      );
      return res.status(403).json({
        statusCode: 403,
        Mensagem: "Usuário ou senha inválidos.",
      });
    }

    // Verifica se a senha está correta usando bcrypt
    const senhaValida = await bcrypt.compare(
      senha,
      usuarioEncontrado.Usuario_Senha,
    );

    if (!senhaValida) {
      console.warn(`⚠️ Tentativa de login - senha incorreta: ${usuario} ⚠️`);
      return res.status(403).json({
        statusCode: 403,
        Mensagem: "Usuário ou senha inválidos.",
      });
    }

    // Cria token JWT válido por 8 horas, incluindo o grupo do usuário
    const token = jwt.sign(
      {
        id: usuarioEncontrado.Usuario_ID,
        usuario: usuarioEncontrado.Usuario_Login,
        nome: usuarioEncontrado.Usuario_Nome,
        grupo: usuarioEncontrado.Usuario_Grupo,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h", // Tempo de expiração do token
      },
    );

    console.log(
      `✅ Login bem-sucedido: ${usuario} (${usuarioEncontrado.Usuario_Grupo})`,
    );
    return res.status(200).json({
      statusCode: 200,
      Mensagem: "Login realizado com sucesso!",
      token: token,
      usuario: {
        id: usuarioEncontrado.Usuario_ID,
        login: usuarioEncontrado.Usuario_Login,
        nome: usuarioEncontrado.Usuario_Nome,
        grupo: usuarioEncontrado.Usuario_Grupo,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao processar login:", error);
    return res.status(500).json({
      statusCode: 500,
      Mensagem: "Erro ao processar login.",
      Erro: error.message,
    });
  }
});

// 🧩 Middleware de autenticação — protege as rotas
function autenticarToken(req, res, next) {
  // Função middleware para autenticar token JWT
  const authHeader = req.headers["authorization"]; // Obtém o cabeçalho de autorização
  const token = authHeader && authHeader.split(" ")[1]; // Extrai o token do cabeçalho

  if (!token) {
    // Se não houver token
    console.warn("🚫 Tentativa de acesso sem token. Qual é a sua!? 🚫");
    return res.status(401).json({
      // Retorna status 401 Unauthorized
      statusCode: 401, // Status code de não autorizado
      Mensagem: "😠 Token não encontrado. Acesso negado seu abelhudo!!! 😠", // mensagem bonitinha
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // Verifica o token usando o segredo
    if (err) {
      // Se houver erro na verificação do token
      console.error("❌ Token inválido:", err.message); // Log de token inválido
      return res.status(401).json({
        // Retorna status 401 Unauthorized
        statusCode: 401, // Status code de não autorizado
        Mensagem: "Token inválido ou expirado. Faça login novamente.", // mensagem bonitinha
      });
    }

    req.user = user; // adiciona os dados do token à requisição
    next();
  });
}

// 🧩 Middleware para verificar se o usuário é Administrador
function verificarAdmin(req, res, next) {
  if (req.user.grupo !== "Administrador") {
    console.warn(
      `🚫 Acesso negado para ${req.user.usuario} - requer permissão de Administrador`,
    );
    return res.status(403).json({
      statusCode: 403,
      Mensagem:
        "Acesso negado. Apenas administradores podem realizar esta ação.",
    });
  }
  next();
}

// Rota para verificar senha do usuário autenticado (para ações sensíveis)
router.post("/verify-password", async (req, res) => {
  const { usuario, senha } = req.body;
  if (!usuario || !senha) {
    return res
      .status(400)
      .json({ Mensagem: "Usuário e senha são obrigatórios." });
  }
  try {
    const usuarioEncontrado = await Usuarios.findOne({
      where: { Usuario_Login: usuario, Usuario_Ativo: true },
    });
    if (!usuarioEncontrado) {
      return res.status(401).json({ Mensagem: "Usuário ou senha inválidos." });
    }
    const senhaValida = await bcrypt.compare(
      senha,
      usuarioEncontrado.Usuario_Senha,
    );
    if (!senhaValida) {
      return res.status(401).json({ Mensagem: "Usuário ou senha inválidos." });
    }
    return res.status(200).json({ Mensagem: "Senha verificada com sucesso." });
  } catch (error) {
    return res
      .status(500)
      .json({ Mensagem: "Erro ao verificar senha.", Erro: error.message });
  }
});

// 🟢 Rota para criar novo usuário (apenas para Administradores)
router.post(
  "/usuarios/create",
  autenticarToken,
  verificarAdmin,
  async (req, res) => {
    const { login, senha, nome, grupo, alunoId } = req.body;

    try {
      // Verifica se o login já existe
      const usuarioExistente = await Usuarios.findOne({
        where: { Usuario_Login: login },
      });

      if (usuarioExistente) {
        return res.status(400).json({
          statusCode: 400,
          Mensagem: "Login já cadastrado no sistema.",
        });
      }

      let alunoIdFinal = null;

      // Se for do grupo Alunos, DEVE ter um alunoId vinculado
      if (grupo === "Alunos") {
        if (!alunoId) {
          return res.status(400).json({
            statusCode: 400,
            Mensagem:
              "Para criar usuário do grupo Alunos, é necessário informar o ID do aluno.",
          });
        }

        // Verifica se o aluno existe na tabela Alunos_Cadastros
        const alunoExiste = await Alunos_Cadastros.findOne({
          where: { Alunos_Codigo: alunoId },
        });

        if (!alunoExiste) {
          return res.status(404).json({
            statusCode: 404,
            Mensagem: `Aluno com código ${alunoId} não encontrado no sistema.`,
          });
        }

        // Verifica se já existe um usuário vinculado a este aluno
        const usuarioDoAluno = await Usuarios.findOne({
          where: { Usuario_Aluno_ID: alunoId },
        });

        if (usuarioDoAluno) {
          return res.status(400).json({
            statusCode: 400,
            Mensagem: `Já existe um usuário vinculado ao aluno ${alunoExiste.Alunos_Nome}.`,
          });
        }

        alunoIdFinal = alunoId;
      }

      // Se for Administrador, não precisa de alunoId (fica NULL)

      // Cria hash da senha
      const senhaHash = await bcrypt.hash(senha, 10);

      // Cria o novo usuário
      const novoUsuario = await Usuarios.create({
        Usuario_Login: login,
        Usuario_Senha: senhaHash,
        Usuario_Nome: nome,
        Usuario_Grupo: grupo || "Alunos",
        Usuario_Aluno_ID: alunoIdFinal,
        Usuario_Ativo: true,
      });

      console.log(
        `✅ Novo usuário criado: ${login} (${grupo || "Alunos"})${
          alunoIdFinal ? ` - Aluno ID: ${alunoIdFinal}` : ""
        }`,
      );

      // Registra log de criação de usuário
      const usuarioLog = getUsuarioFromReq(req);
      await registrarLog(
        usuarioLog,
        "CREATE",
        "Usuarios",
        novoUsuario.Usuario_ID,
        `Usuário ${novoUsuario.Usuario_Login} criado`,
        null,
        novoUsuario.toJSON(),
      );

      return res.status(201).json({
        statusCode: 201,
        Mensagem: "Usuário criado com sucesso!",
        usuario: {
          id: novoUsuario.Usuario_ID,
          login: novoUsuario.Usuario_Login,
          nome: novoUsuario.Usuario_Nome,
          grupo: novoUsuario.Usuario_Grupo,
          alunoId: novoUsuario.Usuario_Aluno_ID,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao criar usuário:", error);
      return res.status(500).json({
        statusCode: 500,
        Mensagem: "Erro ao criar usuário.",
        Erro: error.message,
      });
    }
  },
);

// 🟢 Rota para listar usuários (apenas para Administradores)
router.get("/usuarios", autenticarToken, verificarAdmin, async (req, res) => {
  try {
    const db = require("../models/db");

    // Faz uma query SQL direta para evitar problemas de associação
    const [usuarios] = await db.sequelizeconnection.query(`
      SELECT 
        u.Usuario_ID,
        u.Usuario_Login,
        u.Usuario_Nome,
        u.Usuario_Grupo,
        u.Usuario_Aluno_ID,
        u.Usuario_Ativo,
        a.Alunos_Codigo,
        a.Alunos_Nome,
        a.Alunos_CPF
      FROM Usuarios u
      LEFT JOIN Alunos_Cadastros a ON u.Usuario_Aluno_ID = a.Alunos_Codigo
      ORDER BY u.Usuario_ID
    `);

    // Formata os dados para o mesmo formato que seria retornado pelo Sequelize
    const usuariosFormatados = usuarios.map((user) => ({
      Usuario_ID: user.Usuario_ID,
      Usuario_Login: user.Usuario_Login,
      Usuario_Nome: user.Usuario_Nome,
      Usuario_Grupo: user.Usuario_Grupo,
      Usuario_Aluno_ID: user.Usuario_Aluno_ID,
      Usuario_Ativo: user.Usuario_Ativo,
      Aluno: user.Alunos_Codigo
        ? {
            Alunos_Codigo: user.Alunos_Codigo,
            Alunos_Nome: user.Alunos_Nome,
            Alunos_CPF: user.Alunos_CPF,
          }
        : null,
    }));

    return res.status(200).json({
      statusCode: 200,
      Total: usuariosFormatados.length,
      Usuarios: usuariosFormatados,
    });
  } catch (error) {
    console.error("❌ Erro ao listar usuários:", error);
    return res.status(500).json({
      statusCode: 500,
      Mensagem: "Erro ao listar usuários.",
      Erro: error.message,
    });
  }
});

// 🟢 Rota para atualizar usuário (apenas para Administradores)
router.patch(
  "/usuarios/update/:id",
  autenticarToken,
  verificarAdmin,
  async (req, res) => {
    const { id } = req.params;
    const { nome, grupo, ativo, senha } = req.body;

    try {
      // Busca o usuário
      const usuario = await Usuarios.findByPk(id);

      if (!usuario) {
        return res.status(404).json({
          statusCode: 404,
          Mensagem: "Usuário não encontrado.",
        });
      }

      // Atualiza os dados
      if (nome !== undefined) usuario.Usuario_Nome = nome;
      if (grupo !== undefined) usuario.Usuario_Grupo = grupo;
      if (ativo !== undefined) usuario.Usuario_Ativo = ativo;

      // Se uma nova senha foi fornecida, criptografa e atualiza
      if (senha && senha.trim() !== "") {
        const senhaHash = await bcrypt.hash(senha, 10);
        usuario.Usuario_Senha = senhaHash;
        console.log(
          `🔐 Senha atualizada para o usuário: ${usuario.Usuario_Login}`,
        );
      }

      await usuario.save();

      console.log(
        `✅ Usuário atualizado: ${usuario.Usuario_Login} (${usuario.Usuario_Grupo})`,
      );

      // Registra log de atualização de usuário
      const usuarioLog = getUsuarioFromReq(req);
      const dadosNovos = usuario.toJSON();
      await registrarLog(
        usuarioLog,
        "UPDATE",
        "Usuarios",
        usuario.Usuario_ID,
        `Usuário ${usuario.Usuario_Login} atualizado`,
        null,
        dadosNovos,
      );

      return res.status(200).json({
        statusCode: 200,
        Mensagem: "Usuário atualizado com sucesso!",
        usuario: {
          id: usuario.Usuario_ID,
          login: usuario.Usuario_Login,
          nome: usuario.Usuario_Nome,
          grupo: usuario.Usuario_Grupo,
          ativo: usuario.Usuario_Ativo,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao atualizar usuário:", error);
      return res.status(500).json({
        statusCode: 500,
        Mensagem: "Erro ao atualizar usuário.",
        Erro: error.message,
      });
    }
  },
);

// 🟢 Rota para excluir usuário (apenas para Administradores)
router.delete(
  "/usuarios/delete/:id",
  autenticarToken,
  verificarAdmin,
  async (req, res) => {
    const { id } = req.params;

    try {
      // Busca o usuário
      const usuario = await Usuarios.findByPk(id);

      if (!usuario) {
        return res.status(404).json({
          statusCode: 404,
          Mensagem: "Usuário não encontrado.",
        });
      }

      const loginUsuario = usuario.Usuario_Login;
      const nomeUsuario = usuario.Usuario_Nome;

      // Exclui o usuário
      const dadosExcluidos = usuario.toJSON();
      await usuario.destroy();

      console.log(`✅ Usuário excluído: ${loginUsuario} (${nomeUsuario})`);

      // Registra log de exclusão do usuário
      const usuarioLog = getUsuarioFromReq(req);
      await registrarLog(
        usuarioLog,
        "DELETE",
        "Usuarios",
        usuario.Usuario_ID,
        `Usuário ${loginUsuario} excluído`,
        dadosExcluidos,
        null,
      );

      return res.status(200).json({
        statusCode: 200,
        Mensagem: "Usuário excluído com sucesso!",
      });
    } catch (error) {
      console.error("❌ Erro ao excluir usuário:", error);
      return res.status(500).json({
        statusCode: 500,
        Mensagem: "Erro ao excluir usuário.",
        Erro: error.message,
      });
    }
  },
);

// 🔄 Rota para renovar o token JWT (estende por mais 1 hora)
router.post("/refresh", autenticarToken, (req, res) => {
  try {
    const { id, usuario, nome, grupo } = req.user;
    const novoToken = jwt.sign(
      { id, usuario, nome, grupo },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    console.log(`🔄 Token renovado para: ${usuario}`);
    return res.status(200).json({ token: novoToken });
  } catch (error) {
    console.error("❌ Erro ao renovar token:", error);
    return res
      .status(500)
      .json({ Mensagem: "Erro ao renovar token.", Erro: error.message });
  }
});

// Exporta o router e os middlewares
module.exports = { router, autenticarToken, verificarAdmin };
