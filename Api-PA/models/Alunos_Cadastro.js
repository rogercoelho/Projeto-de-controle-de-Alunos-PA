//crriando uma constante para importar o arquivo db.js
const { UniqueConstraintError } = require("sequelize");
const db = require("./db.js");

//criando a constante Alunos_Cadastro para criar a tabela no banco de dados
const Alunos_Cadastros = db.sequelizeconnection.define(
  "Alunos_Cadastros",
  {
    Alunos_Codigo: {
      type: db.Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
      validate: {
        min: 1, //impede 0 e numeros negativos.
      },
    },
    Alunos_Data_Matricula: {
      type: db.Sequelize.STRING(50),
      allowNull: true,
      unique: false,
    },
    Alunos_Nome: {
      type: db.Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    Alunos_CPF: {
      type: db.Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    Alunos_Nome_Responsavel: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_CPF_Responsavel: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Alunos_Data_Nascimento: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Endereco_CEP: {
      type: db.Sequelize.STRING(9),
      allowNull: false,
    },
    Alunos_Endereco: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Endereco_Complemento: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Alunos_Endereco_Bairro: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Endereco_Localidade: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Endereco_Cidade: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Endereco_Estado: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Telefone: {
      type: db.Sequelize.STRING(14),
      allowNull: false,
    },
    Alunos_Email: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Contato_Emergencia: {
      type: db.Sequelize.STRING,
      allowNull: false,
    },
    Alunos_Telefone_Emergencia_1: {
      type: db.Sequelize.STRING(14),
      allowNull: false,
    },
    Alunos_Telefone_Emergencia_2: {
      type: db.Sequelize.STRING(14),
      allowNull: true,
    },
    Alunos_Foto: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Alunos_Contrato: {
      type: db.Sequelize.STRING,
      allowNull: true,
    },
    Alunos_Situacao: {
      type: db.Sequelize.STRING(10),
      allowNull: false,
      defaultValue: "Ativo",
    },
  },
  {
    timestamps: false, // ⛔ Desativa createdAt e updatedAt automaticos do Sequelize
  }
);
// Sincronizando o modelo com o banco de dados (criando a tabela se não existir)
//force: false -> não apaga a tabela se já existir. true -> apaga a tabela e cria novamente
Alunos_Cadastros.sync({ force: false });
// Exportando o modelo Alunos_Cadastro para ser usado em outros arquivos
module.exports = Alunos_Cadastros;
