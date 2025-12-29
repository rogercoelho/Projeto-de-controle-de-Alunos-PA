const db = require("./db.js");

const Alunos_Faturamento = db.sequelizeconnection.define(
  "Alunos_Faturamento",
  {
    Aluno_Codigo: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Alunos_Cadastros",
        key: "Alunos_Codigo",
      },
    },
    Plano_Codigo: {
      type: db.Sequelize.STRING,
      allowNull: false,
      references: {
        model: "Planos_Cadastro",
        key: "Plano_Codigo",
      },
    },
    Faturamento_Inicio: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
    },
    Faturamento_Fim: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
    },
    Faturamento_Valor_Total: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Valor total do faturamento",
    },
    Faturamento_Contador: {
      type: db.Sequelize.INTEGER,
      allowNull: true,
      comment: "Contador utilizado para lógica de WET",
    },
    Faturamento_Repasse: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Valor do repasse a ser enviado para WET",
    },
    Faturamento_Data_Pagamento: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
      comment: "Data em que o pagamento foi realizado",
    },
    Faturamento_Desconto: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Valor do desconto aplicado no pagamento",
    },
    Faturamento_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Motivo do desconto ou observação do pagamento",
    },
    Faturamento_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Caminho do arquivo do comprovante de pagamento",
    },
  },
  {
    timestamps: false,
    tableName: "Alunos_Faturamento",
  }
);

Alunos_Faturamento.sync({ force: false });

module.exports = Alunos_Faturamento;
