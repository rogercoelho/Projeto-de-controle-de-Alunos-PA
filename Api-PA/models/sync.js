const Alunos_Cadastros = require("./Alunos_Cadastro");
const Planos_Cadastro = require("./Planos_Cadastro");
const Alunos_Faturamento = require("./Alunos_Faturamento");
const Alunos_Faturamento_Reajustes = require("./Alunos_Faturamento_Reajustes");
const Alunos_Presenca = require("./Alunos_Presenca");
const Log_Alteracoes = require("./Log_Alteracoes");
const Horarios_Aulas = require("./Horarios_Aulas");
const Usuarios = require("./Usuarios");
const Agendamento_Aulas = require("./Agendamento_Aulas");

const modelsToSync = [
  { name: "Alunos_Cadastros", model: Alunos_Cadastros, options: { force: false } },
  { name: "Planos_Cadastro", model: Planos_Cadastro, options: { force: false } },
  { name: "Alunos_Faturamento", model: Alunos_Faturamento, options: { force: false } },
  { name: "Alunos_Faturamento_Reajustes", model: Alunos_Faturamento_Reajustes, options: { alter: true } },
  { name: "Alunos_Presenca", model: Alunos_Presenca, options: { alter: true } },
  { name: "Log_Alteracoes", model: Log_Alteracoes, options: { force: false } },
  { name: "Horarios_Aulas", model: Horarios_Aulas, options: { alter: true } },
  { name: "Usuarios", model: Usuarios, options: { alter: false } },
  { name: "Agendamento_Aulas", model: Agendamento_Aulas, options: { alter: true } },
];

async function syncDatabase() {
  for (const item of modelsToSync) {
    await item.model.sync(item.options);
    console.log(`Tabela ${item.name} sincronizada com sucesso!`);
  }
}

module.exports = syncDatabase;
