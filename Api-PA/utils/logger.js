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

/**
 * Extrai o usuário responsável a partir do objeto de request.
 * Prioriza `req.user.usuario` ou `req.user.nome` (decodificado do token),
 * depois `req.body.usuario` e por último retorna "Sistema" como fallback.
 */
const getUsuarioFromReq = (req) => {
  try {
    if (!req) return "Sistema";
    const fromUser = req.user && (req.user.usuario || req.user.nome);
    if (fromUser) return fromUser;
    if (req.body && req.body.usuario) return req.body.usuario;
    // opcional: checar header customizado
    if (req.headers && (req.headers.x_usuario || req.headers["x-usuario"])) {
      return req.headers.x_usuario || req.headers["x-usuario"];
    }
    return "Sistema";
  } catch (err) {
    return "Sistema";
  }
};

module.exports = { registrarLog, getUsuarioFromReq };
