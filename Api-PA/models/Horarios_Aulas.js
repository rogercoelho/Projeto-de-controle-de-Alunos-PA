const db = require("./db.js");

const Horarios_Aulas = db.sequelizeconnection.define(
  "Horarios_Aulas",
  {
    Horario_Id: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      comment: "ID único do horário",
    },
    Horario_Inicio: {
      type: db.Sequelize.TIME,
      allowNull: false,
      comment: "Horário de início da aula",
    },
    Horario_Fim: {
      type: db.Sequelize.TIME,
      allowNull: false,
      comment: "Horário de término da aula",
    },
    Horario_Capacidade: {
      type: db.Sequelize.INTEGER,
      allowNull: false,
      comment: "Capacidade máxima de alunos no horário",
    },
    Horario_Dia_Semana: {
      type: db.Sequelize.ENUM(
        "Segunda",
        "Terça",
        "Quarta",
        "Quinta",
        "Sexta",
        "Sábado",
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

// Sincroniza o modelo com o banco de dados
Horarios_Aulas.sync({ alter: true })
  .then(() => {
    console.log("✅ Tabela Horarios_Aulas sincronizada com sucesso!");
  })
  .catch((error) => {
    console.error("❌ Erro ao sincronizar tabela Horarios_Aulas:", error);
  });

module.exports = Horarios_Aulas;
