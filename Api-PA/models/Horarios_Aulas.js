const db = require("./db.js");

const Horarios_Aulas = db.sequelizeconnection.define(
  "Horarios_Aulas",
  {
    Horario_Id: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID Ãºnico do horÃ¡rio",
    },
    Horario_Inicio: {
      type: db.Sequelize.TIME,
      allowNull: false,
      comment: "HorÃ¡rio de inÃ­cio da aula",
    },
    Horario_Fim: {
      type: db.Sequelize.TIME,
      allowNull: false,
      comment: "HorÃ¡rio de tÃ©rmino da aula",
    },
    Horario_Capacidade: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      comment: "Capacidade mÃ¡xima de alunos no horÃ¡rio",
    },
    Horario_Dia_Semana: {
      type: db.Sequelize.ENUM(
        "Segunda",
        "TerÃ§a",
        "Quarta",
        "Quinta",
        "Sexta",
        "SÃ¡bado",
        "Domingo",
      ),
      allowNull: false,
      comment: "Dia da semana da aula",
    },
  },
  {
    tableName: "Horarios_Aulas",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
  },
);

module.exports = Horarios_Aulas;

