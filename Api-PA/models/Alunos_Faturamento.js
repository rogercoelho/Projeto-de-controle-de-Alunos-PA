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
      comment: "Contador utilizado para lÃ³gica de WET",
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
    Faturamento_Desconto_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Motivo do desconto aplicado no pagamento",
    },
    Faturamento_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Caminho do arquivo do comprovante de pagamento",
    },
    Faturamento_Cancelado: {
      type: db.Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      comment: "Indica se o plano foi cancelado neste faturamento",
    },
    Faturamento_Cancelado_Em: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
      comment: "Data em que o cancelamento foi realizado",
    },
    Faturamento_Cancelado_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Motivo do cancelamento do plano",
    },
    Faturamento_Reajuste: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment:
        "Valor do reajuste mensal aplicado a partir de Faturamento_Reajuste_Partir_De",
    },
    Faturamento_Reajuste_Partir_De: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
      comment:
        "Data a partir da qual o reajuste Ã© aplicado (primeiro dia do mÃªs)",
    },
    Faturamento_Reajuste_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Motivo do reajuste aplicado ao plano",
    },
    Faturamento_Reajuste_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Caminho do arquivo do comprovante do reajuste",
    },
  },
  {
    timestamps: false,
    tableName: "Alunos_Faturamento",
  },
);


module.exports = Alunos_Faturamento;

