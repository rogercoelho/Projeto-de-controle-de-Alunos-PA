const Log_Alteracoes = require("../models/Log_Alteracoes");

/**
 * Registra uma alteração no banco de dados
 * @param {string} usuario - Nome do usuário que fez a alteração
 * @param {string} acao - Tipo de ação (CREATE, UPDATE, DELETE, ATIVAR, DESATIVAR)
 * @param {string} tabela - Nome da tabela afetada
 * @param {number} registroId - ID do registro afetado
 * @param {string} descricao - Descrição da alteração
 * @param {object} dadosAntigos - Dados antes da alteração
 * @param {object} dadosNovos - Dados depois da alteração
 */
const registrarLog = async (
  usuario,
  acao,
  tabela,
  registroId,
  descricao,
  dadosAntigos = null,
  dadosNovos = null
) => {
  try {
    const agora = new Date();
    const data = agora.toISOString().split("T")[0]; // YYYY-MM-DD
    const hora = agora.toTimeString().split(" ")[0]; // HH:MM:SS

    await Log_Alteracoes.create({
      Log_Usuario: usuario,
      Log_Data: data,
      Log_Hora: hora,
      Log_Acao: acao,
      Log_Tabela: tabela,
      Log_Registro_ID: registroId,
      Log_Descricao: descricao,
      Log_Dados_Antigos: dadosAntigos,
      Log_Dados_Novos: dadosNovos,
    });

    console.log(`📝 Log registrado: ${acao} em ${tabela} por ${usuario}`);
  } catch (error) {
    console.error("❌ Erro ao registrar log:", error.message);
    // Não interrompe o fluxo principal se houver erro no log
  }
};

module.exports = { registrarLog };
