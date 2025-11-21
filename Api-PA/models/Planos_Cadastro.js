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
