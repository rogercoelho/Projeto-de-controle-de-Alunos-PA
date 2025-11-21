// Criando uma constante para importar o arquivo db.js
const db = require("./db.js");

// Criando a constante Log_Alteracoes para criar a tabela no banco de dados
const Log_Alteracoes = db.sequelizeconnection.define(
  "Log_Alteracoes",
  {
    Log_ID: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    Log_Usuario: {
      type: db.Sequelize.STRING(100),
      allowNull: false,
    },
    Log_Data: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
      defaultValue: db.Sequelize.NOW,
    },
    Log_Hora: {
      type: db.Sequelize.TIME,
      allowNull: false,
      defaultValue: db.Sequelize.NOW,
    },
    Log_Acao: {
      type: db.Sequelize.STRING(50),
      allowNull: false,
      comment: "Tipo de ação: CREATE, UPDATE, DELETE, ATIVAR, DESATIVAR",
    },
    Log_Tabela: {
      type: db.Sequelize.STRING(100),
      allowNull: false,
      comment: "Nome da tabela afetada",
    },
    Log_Registro_ID: {
      type: db.Sequelize.INTEGER,
      allowNull: true,
      comment: "ID do registro afetado",
    },
    Log_Descricao: {
      type: db.Sequelize.TEXT,
      allowNull: true,
      comment: "Descrição detalhada da alteração",
    },
    Log_Dados_Antigos: {
      type: db.Sequelize.JSON,
      allowNull: true,
      comment: "Dados antes da alteração (formato JSON)",
    },
    Log_Dados_Novos: {
      type: db.Sequelize.JSON,
      allowNull: true,
      comment: "Dados depois da alteração (formato JSON)",
    },
  },
  {
    timestamps: false, // Desativa createdAt e updatedAt automáticos do Sequelize
  }
);

// Sincronizando o modelo com o banco de dados (criando a tabela se não existir)
Log_Alteracoes.sync({ force: false });

// Exportando o modelo Log_Alteracoes para ser usado em outros arquivos
module.exports = Log_Alteracoes;
