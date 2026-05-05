// ==============================
// ðŸ‘¤ Usuarios.js - Modelo de UsuÃ¡rios
// ==============================

const db = require("./db"); // Importa a conexÃ£o com o banco de dados

// Define o modelo de UsuÃ¡rios usando Sequelize
const Usuarios = db.sequelizeconnection.define(
  "Usuarios", // Nome do modelo
  {
    // DefiniÃ§Ã£o dos campos da tabela
    Usuario_ID: {
      type: db.Sequelize.INTEGER, // Tipo: nÃºmero inteiro
      primaryKey: true, // Define como chave primÃ¡ria
      autoIncrement: true, // Auto incremento
      allowNull: false, // NÃ£o permite valor nulo
    },
    Usuario_Login: {
      type: db.Sequelize.STRING(50), // Tipo: string com tamanho mÃ¡ximo de 50 caracteres
      allowNull: false, // NÃ£o permite valor nulo
      unique: true, // Login deve ser Ãºnico
    },
    Usuario_Senha: {
      type: db.Sequelize.STRING(255), // Tipo: string com tamanho mÃ¡ximo de 255 caracteres (para hash)
      allowNull: false, // NÃ£o permite valor nulo
    },
    Usuario_Nome: {
      type: db.Sequelize.STRING(100), // Tipo: string com tamanho mÃ¡ximo de 100 caracteres
      allowNull: false, // NÃ£o permite valor nulo
    },
    Usuario_Grupo: {
      type: db.Sequelize.ENUM("Administrador", "Alunos"), // Tipo: ENUM com valores permitidos
      allowNull: false, // NÃ£o permite valor nulo
      defaultValue: "Alunos", // Valor padrÃ£o Ã© 'Alunos'
    },
    Usuario_Aluno_ID: {
      type: db.Sequelize.INTEGER, // Tipo: nÃºmero inteiro (FK para tabela Alunos_Cadastros)
      allowNull: true, // Permite nulo (Administradores nÃ£o precisam ter ID de aluno)
      unique: true, // Cada aluno pode ter apenas um usuÃ¡rio vinculado
      references: {
        model: "Alunos_Cadastros", // Nome da tabela referenciada
        key: "Alunos_Codigo", // Chave primÃ¡ria da tabela Alunos_Cadastros
      },
    },
    Usuario_Ativo: {
      type: db.Sequelize.BOOLEAN, // Tipo: booleano
      allowNull: false, // NÃ£o permite valor nulo
      defaultValue: true, // Valor padrÃ£o Ã© true (ativo)
    },
  },
  {
    freezeTableName: true, // MantÃ©m o nome da tabela como definido (nÃ£o pluraliza)
    timestamps: true, // Adiciona campos createdAt e updatedAt automaticamente
  }
);

// Exporta o modelo para ser usado em outras partes da aplicaÃ§Ã£o
module.exports = Usuarios;

