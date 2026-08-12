const db = require("./db.js");

const Faturamentos_Cancelados = db.sequelizeconnection.define(
  "Faturamentos_Cancelados",
  {
    Faturamento_Original_ID: {
      type: db.Sequelize.INTEGER,
      allowNull: true,
      comment: "ID original do registro em Alunos_Faturamento",
    },
    Aluno_Codigo: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
    Plano_Codigo: {
      type: db.Sequelize.STRING,
      allowNull: false,
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
    },
    Faturamento_Contador: {
      type: db.Sequelize.INTEGER,
      allowNull: true,
    },
    Faturamento_Repasse: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    Faturamento_Data_Pagamento: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
    },
    Faturamento_Desconto: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    Faturamento_Desconto_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Faturamento_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Faturamento_Cancelado: {
      type: db.Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    Faturamento_Cancelado_Em: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
    },
    Faturamento_Cancelado_Motivo: {
      type: db.Sequelize.TEXT,
      allowNull: false,
    },
    Faturamento_Cancelado_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
      comment: "Comprovante de estorno enviado no cancelamento",
    },
    Faturamento_Reajuste: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: true,
    },
    Faturamento_Reajuste_Partir_De: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
    },
    Faturamento_Reajuste_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Faturamento_Reajuste_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "Faturamentos_Cancelados",
  },
);

module.exports = Faturamentos_Cancelados;
