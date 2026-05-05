const db = require("./db.js");
const Horarios_Aulas = require("./Horarios_Aulas.js");
const Alunos_Cadastros = require("./Alunos_Cadastro.js");

const Agendamento_Aulas = db.sequelizeconnection.define(
  "Agendamento_Aulas",
  {
    Agendamento_Id: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID Ãºnico do agendamento",
    },
    Horario_Id: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: Horarios_Aulas,
        key: "Horario_Id",
      },
      comment: "ID do horÃ¡rio vinculado",
    },
    Aluno_Codigo: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: Alunos_Cadastros,
        key: "Alunos_Codigo",
      },
      comment: "CÃ³digo do aluno vinculado",
    },
  },
  {
    tableName: "Agendamento_Aulas",
    timestamps: true,
    createdAt: "Data_Criacao",
    updatedAt: "Data_Atualizacao",
    indexes: [
      {
        unique: true,
        fields: ["Horario_Id", "Aluno_Codigo"],
        name: "unique_horario_aluno",
      },
    ],
  },
);

// Definindo associaÃ§Ãµes
Agendamento_Aulas.belongsTo(Horarios_Aulas, {
  foreignKey: "Horario_Id",
  as: "Horario",
});

Agendamento_Aulas.belongsTo(Alunos_Cadastros, {
  foreignKey: "Aluno_Codigo",
  as: "Aluno",
});

Horarios_Aulas.hasMany(Agendamento_Aulas, {
  foreignKey: "Horario_Id",
  as: "Agendamentos",
});

Alunos_Cadastros.hasMany(Agendamento_Aulas, {
  foreignKey: "Aluno_Codigo",
  as: "Agendamentos",
});

module.exports = Agendamento_Aulas;

