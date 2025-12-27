const express = require("express");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Usuarios = require("../models/Usuarios");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");
const router = express.Router();

// Rota genérica para exclusão administrativa com log
router.delete("/delete/:tabela/:id", async (req, res) => {
  try {
    const { tabela, id } = req.params;
    const usuario = getUsuarioFromReq(req);
    let registro = null;
    let nomeTabela = "";
    let descricao = "";

    console.log(`🔍 Tentando excluir - Tabela: ${tabela}, ID: ${id}`);
    console.log(`👤 Usuário: ${usuario}`);

    switch (tabela) {
      case "Alunos_Cadastros":
        registro = await Alunos_Cadastros.findByPk(parseInt(id, 10));
        console.log(
          `📋 Registro encontrado (Alunos):`,
          registro ? "SIM" : "NÃO"
        );
        if (registro) {
          console.log(`📄 Dados do aluno:`, {
            id: registro.Alunos_ID,
            nome: registro.Alunos_Nome,
            situacao: registro.Alunos_Situacao,
          });
        }
        nomeTabela = "Alunos_Cadastros";
        if (registro) {
          descricao = `Aluno ${registro.Alunos_Nome} (ID: ${id}) excluído via painel admin`;
        }
        break;

      case "usuarios":
        registro = await Usuarios.findOne({
          where: { Usuario_ID: parseInt(id, 10) },
        });
        console.log(
          `📋 Registro encontrado (Usuários):`,
          registro ? "SIM" : "NÃO"
        );
        if (registro) {
          console.log(`📄 Dados do usuário:`, {
            id: registro.Usuario_ID,
            nome: registro.Usuario_Nome,
            login: registro.Usuario_Login,
          });
        }
        nomeTabela = "Usuarios";
        if (registro) {
          descricao = `Usuário ${registro.Usuario_Nome} (ID: ${id}) excluído via painel admin`;
        }
        break;

      default:
        return res.status(400).json({
          statusCode: 400,
          Mensagem: "Tabela não suportada",
        });
    }

    if (!registro) {
      console.log(
        `❌ REGISTRO NÃO ENCONTRADO - ID ${id} não existe na tabela ${tabela}`
      );
      return res.status(404).json({
        statusCode: 404,
        Mensagem: "Registro não encontrado",
      });
    }

    console.log(`✅ Registro encontrado! Prosseguindo com exclusão...`);

    // Guarda os dados antes de excluir
    const dadosExcluidos = registro.toJSON();

    // Exclui o registro
    await registro.destroy();
    console.log(`🗑️ Registro excluído com sucesso do banco de dados`);

    // Registra no log
    await registrarLog(
      usuario,
      "DELETE_ADMIN",
      nomeTabela,
      parseInt(id, 10),
      descricao,
      dadosExcluidos,
      null
    );
    console.log(`📝 Log registrado com sucesso`);

    res.json({
      statusCode: 200,
      Mensagem: `Registro excluído com sucesso`,
    });
  } catch (error) {
    console.error("❌ Erro ao excluir registro:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      statusCode: 500,
      Mensagem: "Erro ao excluir registro",
      Erro: error.message,
    });
  }
});

module.exports = router;
