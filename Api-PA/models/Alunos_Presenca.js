const db = require("./db.js");

const Alunos_Presenca = db.sequelizeconnection.define(
  "Alunos_Presencas",
  {
    Presenca_ID: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    Aluno_Codigo: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
    },
    Presenca_Data: {
      type: db.Sequelize.DATEONLY,
      allowNull: false,
    },
    Presenca_Status: {
      type: db.Sequelize.STRING(20),
      allowNull: false,
    },
    Presenca_Data_Reposicao_Referencia: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
      field: "Presenca_Data_Reposicao_Referencia",
    },
    Presenca_Data_Reposicao_Referencia_2: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
      field: "Presenca_Data_Reposicao_Referencia_2",
    },
    Presenca_Observacao: {
      type: db.Sequelize.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["Aluno_Codigo", "Presenca_Data"],
      },
    ],
  },
);

Alunos_Presenca.sync({ alter: true });

module.exports = Alunos_Presenca;
