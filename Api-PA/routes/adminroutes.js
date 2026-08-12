const express = require("express");
const path = require("path");
const fs = require("fs");
const Alunos_Cadastros = require("../models/Alunos_Cadastro");
const Usuarios = require("../models/Usuarios");
const Alunos_Faturamento = require("../models/Alunos_Faturamento");
const Alunos_Faturamento_Reajustes = require("../models/Alunos_Faturamento_Reajustes");
const Faturamentos_Cancelados = require("../models/Faturamentos_Cancelados");
const bcrypt = require("bcryptjs");
const { registrarLog, getUsuarioFromReq } = require("../utils/logger");
const router = express.Router();
const getUploadsBaseDir = () =>
  process.env.NODE_ENV === "production"
    ? "/home2/goutechc/wwwplantandoalegria_API/uploads"
    : path.join(__dirname, "../uploads");

const excluirComprovante = (nome, descricao) => {
  if (!nome) return;

  try {
    const comprovantePath = path.join(
      getUploadsBaseDir(),
      "comprovantes",
      nome,
    );

    if (fs.existsSync(comprovantePath)) {
      fs.unlinkSync(comprovantePath);
      console.log(`${descricao} excluido: ${nome}`);
    } else {
      console.log(`${descricao} nao encontrado no disco: ${nome}`);
    }
  } catch (fileError) {
    console.error(
      `Erro ao excluir ${descricao.toLowerCase()}: ${fileError.message}`,
    );
  }
};

// Rota genérica para exclusão administrativa com log
router.delete("/delete/:tabela/:id", async (req, res) => {
  try {
    const { tabela, id } = req.params;
    const usuario = getUsuarioFromReq(req);
    const { senha } = req.body || {};

    // Validação server-side: senha obrigatória para exclusões administrativas
    if (!senha) {
      return res.status(400).json({
        statusCode: 400,
        Mensagem: "Senha é obrigatória para confirmação da exclusão.",
      });
    }

    // Usa o usuário do token como referência (mais confiável que valor enviado pelo cliente)
    const usuarioLogin = req.user?.usuario || usuario;
    const usuarioEncontrado = await Usuarios.findOne({
      where: { Usuario_Login: usuarioLogin, Usuario_Ativo: true },
    });
    if (!usuarioEncontrado) {
      return res
        .status(401)
        .json({ statusCode: 401, Mensagem: "Usuário inválido." });
    }
    const senhaValida = await bcrypt.compare(
      senha,
      usuarioEncontrado.Usuario_Senha,
    );
    if (!senhaValida) {
      return res
        .status(401)
        .json({ statusCode: 401, Mensagem: "Senha incorreta." });
    }
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
          registro ? "SIM" : "NÃO",
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
          registro ? "SIM" : "NÃO",
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

      case "reajustes_faturamento":
      case "Alunos_Faturamento_Reajustes":
        registro = await Alunos_Faturamento_Reajustes.findByPk(
          parseInt(id, 10),
        );
        console.log(
          `Registro encontrado (Reajuste de faturamento):`,
          registro ? "SIM" : "NAO",
        );
        if (registro) {
          console.log(`Dados do reajuste:`, {
            id: registro.id,
            faturamento: registro.Faturamento_ID,
            valor: registro.Faturamento_Reajuste,
            apartirDe: registro.Faturamento_Reajuste_Partir_De,
          });
        }
        nomeTabela = "Alunos_Faturamento_Reajustes";
        if (registro) {
          descricao = `Reajuste ${registro.id} do faturamento ${registro.Faturamento_ID} excluido via painel admin`;
        }
        break;
      case "Faturamentos_Cancelados":
        registro = await Faturamentos_Cancelados.findByPk(parseInt(id, 10));
        nomeTabela = "Faturamentos_Cancelados";
        if (registro) {
          descricao = `Faturamento cancelado ${registro.id} (Faturamento original: ${registro.Faturamento_Original_ID || "-"}) excluído via painel admin`;
        }
        break;

      case "faturamento":
      case "Alunos_Faturamento":
        registro = await Alunos_Faturamento.findByPk(parseInt(id, 10));
        console.log(
          `📋 Registro encontrado (Faturamento):`,
          registro ? "SIM" : "NÃO",
        );
        if (registro) {
          console.log(`📄 Dados do faturamento:`, {
            id: registro.id || registro.Faturamento_ID,
            aluno: registro.Aluno_Codigo,
            plano: registro.Plano_Codigo,
          });
        }
        nomeTabela = "Alunos_Faturamento";
        if (registro) {
          descricao = `Faturamento ${
            registro.id || registro.Faturamento_ID
          } (Aluno: ${registro.Aluno_Codigo}) excluído via painel admin`;
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
        `❌ REGISTRO NÃO ENCONTRADO - ID ${id} não existe na tabela ${tabela}`,
      );
      return res.status(404).json({
        statusCode: 404,
        Mensagem: "Registro não encontrado",
      });
    }

    console.log(`✅ Registro encontrado! Prosseguindo com exclusão...`);

    // Guarda os dados antes de excluir
    const dadosExcluidos = registro.toJSON();

    // Se for aluno, exclui foto e contrato associados (se existirem)
    if (tabela === "Alunos_Cadastros") {
      const baseDir = getUploadsBaseDir();

      const arquivos = [
        { campo: registro.Alunos_Foto, subdir: "fotos" },
        { campo: registro.Alunos_Contrato, subdir: "contratos" },
      ];

      for (const { campo, subdir } of arquivos) {
        if (campo) {
          try {
            const filePath = path.join(baseDir, subdir, campo);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`🗑️ Arquivo excluído: ${subdir}/${campo}`);
            } else {
              console.log(
                `⚠️ Arquivo não encontrado no disco: ${subdir}/${campo}`,
              );
            }
          } catch (fileError) {
            console.error(
              `❌ Erro ao excluir ${subdir}/${campo}: ${fileError.message}`,
            );
            // Continua com a exclusão do registro mesmo se falhar ao excluir o arquivo
          }
        }
      }
    }

    // Se for reajuste, exclui o comprovante associado antes do registro.
    if (tabela === "Faturamentos_Cancelados") {
      excluirComprovante(
        registro.Faturamento_Cancelado_Comprovante,
        "Comprovante de estorno",
      );
    }

    if (
      tabela === "reajustes_faturamento" ||
      tabela === "Alunos_Faturamento_Reajustes"
    ) {
      excluirComprovante(
        registro.Faturamento_Reajuste_Comprovante,
        "Comprovante de reajuste",
      );
    }

    // Se for faturamento, exclui comprovantes e reajustes vinculados antes do registro pai.
    if (tabela === "faturamento" || tabela === "Alunos_Faturamento") {
      excluirComprovante(
        registro.Faturamento_Comprovante,
        "Comprovante de pagamento",
      );
      excluirComprovante(
        registro.Faturamento_Reajuste_Comprovante,
        "Comprovante de reajuste",
      );

      const reajustes = await Alunos_Faturamento_Reajustes.findAll({
        where: { Faturamento_ID: parseInt(id, 10) },
      });

      for (const reajuste of reajustes) {
        excluirComprovante(
          reajuste.Faturamento_Reajuste_Comprovante,
          "Comprovante de reajuste",
        );
        await reajuste.destroy();
      }

      console.log(
        `${reajustes.length} reajuste(s) vinculado(s) ao faturamento ${id} excluido(s)`,
      );
    }
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
      null,
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
