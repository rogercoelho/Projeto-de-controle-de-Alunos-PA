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
      validate: {
        isIn: [["Presente", "Ausente", "Reposicao", "Aula Realizada"]],
      },
    },
    Presenca_Data_Reposicao_Referencia: {
      type: db.Sequelize.DATEONLY,
      allowNull: true,
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
  }
);

Alunos_Presenca.sync({ force: false });

module.exports = Alunos_Presenca;
