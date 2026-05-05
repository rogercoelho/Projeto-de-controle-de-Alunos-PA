const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const Sequelize = require("sequelize");

const database = process.env.DB_NAME || "goutechc_controle_pa2";
const username = process.env.DB_USER || "goutechc_controle_pa2";
const password = process.env.DB_PASSWORD || "Lello@dmin1010";
const host = process.env.DB_HOST || "localhost";
const port = Number(process.env.DB_PORT || 3306);

const sequelizeconnection = new Sequelize(database, username, password, {
  host,
  port,
  dialect: "mysql",
  dialectOptions: {
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 10000),
  },
  logging: false,
});

async function testConnection() {
  await sequelizeconnection.authenticate();
  console.log(
    `Conexao com o banco de dados realizada com sucesso! (${host}:${port}/${database})`,
  );
}

function logConnectionError(error) {
  console.error("Erro ao conectar ao banco de dados.");
  console.error(`Destino configurado: ${host}:${port}/${database}`);

  if (error?.name === "SequelizeConnectionRefusedError") {
    console.error(
      "A conexao foi recusada. Verifique se o MySQL/MariaDB esta iniciado e se DB_HOST/DB_PORT estao corretos no arquivo Api-PA/.env.",
    );
    return;
  }

  if (error?.name === "SequelizeAccessDeniedError") {
    console.error(
      "Acesso negado. Verifique DB_USER e DB_PASSWORD no arquivo Api-PA/.env.",
    );
    return;
  }

  if (error?.name === "SequelizeConnectionError") {
    console.error(
      "Nao foi possivel abrir conexao. Verifique host, porta, rede e credenciais do banco.",
    );
    return;
  }

  console.error(error);
}

module.exports = {
  Sequelize,
  sequelizeconnection,
  testConnection,
  logConnectionError,
};
