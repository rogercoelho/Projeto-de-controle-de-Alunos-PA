const db = require("./db.js");

const Planos_Cadastro = db.sequelizeconnection.define(
  "Planos_Cadastro",
  {
    Plano_Codigo: {
      type: db.Sequelize.STRING(20),
      allowNull: false,
      primaryKey: true,
      comment: "Código alfanumérico do plano",
    },
    Plano_Nome: {
      type: db.Sequelize.STRING(100),
      allowNull: false,
      comment: "Nome do plano",
    },
    Plano_Quantidade_Semana: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      comment: "Quantidade de vezes por semana",
    },
    Plano_Pagamento: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: "Valor do pagamento",
    },
    Plano_Valor: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: false,
      comment: "Valor do plano",
    },
    Plano_Contador_Habilitado: {
      type: db.Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Indica se o contador WET está habilitado para este plano",
    },
    Plano_Contador_Limite: {
      type: db.Sequelize.INTEGER,
      allowNull: true,
      comment: "Limite do contador para gerar cobrança WET",
    },
    Plano_Wet_Valor: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Valor fixo a ser registrado quando contador atingir o limite",
    },
    Plano_Ativo: {
      type: db.Sequelize.ENUM("Ativo", "Inativo"),
      allowNull: false,
      defaultValue: "Ativo",
      comment: "Status do plano",
    },
  },
  {
    tableName: "Planos_Cadastro",
    timestamps: false,
  }
);

module.exports = Planos_Cadastro;
