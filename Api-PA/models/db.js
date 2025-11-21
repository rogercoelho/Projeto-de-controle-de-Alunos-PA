const Sequelize = require("sequelize"); // criando uma variavel constante para importar o Sequelize.

// Criando a conexão com o banco de dados usando Sequelize.
const sequelizeconnection = new Sequelize( //criando a constante sequelizeconnection para a conexão com o banco de dados.
  "goutechc_controle_pa2", // Nome do banco de dados
  "goutechc_controle_pa2", // Usuário do banco de dados
  "Lello@dmin1010", // Senha do banco de dados
  {
    host: process.env.DB_HOST || "localhost", // Host do banco de dados. Usa localhost no servidor, IP externo para desenvolvimento local
    dialect: "mysql", // Dialeto do banco de dados
    logging: false, // Desabilita logs SQL no console (melhora performance)
  }
);

sequelizeconnection // Testando a conexão com o banco de dados.
  .authenticate() // Verifica se a conexão foi bem-sucedida Autenticando
  .then(function () {
    // Se a conexão for bem-sucedida
    console.log("✅ Conexão com o banco de dados realizada com sucesso!"); // Mensagem de sucesso na conexão
  })
  .catch(function (error) {
    // Se houver erro na conexão
    console.log("❌ Erro ao conectar ao banco de dados:" + error); // Mensagem de erro na conexão
  });

// Exportando o objeto Sequelize e a conexão com o banco de dados.
module.exports = {
  Sequelize: Sequelize, // Exportando o objeto Sequelize
  sequelizeconnection: sequelizeconnection, // Exportando a conexão com o banco de dados
};
