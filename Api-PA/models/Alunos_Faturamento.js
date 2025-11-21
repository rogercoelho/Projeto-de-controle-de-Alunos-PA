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
  },
  {
    timestamps: false,
    tableName: "Alunos_Faturamento",
  }
);

Alunos_Faturamento.sync({ force: false });

module.exports = Alunos_Faturamento;
