const db = require("./db.js");

const Alunos_Faturamento_Reajustes = db.sequelizeconnection.define(
  "Alunos_Faturamento_Reajustes",
  {
    Faturamento_ID: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Alunos_Faturamento",
        key: "id",
      },
    },
    Faturamento_Reajuste: {
      type: db.Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    Faturamento_Reajuste_Partir_De: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
    },
    Faturamento_Reajuste_Motivo: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Faturamento_Reajuste_Comprovante: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "Alunos_Faturamento_Reajustes",
  },
);

module.exports = Alunos_Faturamento_Reajustes;
