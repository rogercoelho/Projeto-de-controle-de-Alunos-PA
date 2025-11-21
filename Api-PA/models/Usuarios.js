// ==============================
// 👤 Usuarios.js - Modelo de Usuários
// ==============================

const db = require("./db"); // Importa a conexão com o banco de dados

// Define o modelo de Usuários usando Sequelize
const Usuarios = db.sequelizeconnection.define(
  "Usuarios", // Nome do modelo
  {
    // Definição dos campos da tabela
    Usuario_ID: {
      type: db.Sequelize.INTEGER, // Tipo: número inteiro
      primaryKey: true, // Define como chave primária
      autoIncrement: true, // Auto incremento
      allowNull: false, // Não permite valor nulo
    },
    Usuario_Login: {
      type: db.Sequelize.STRING(50), // Tipo: string com tamanho máximo de 50 caracteres
      allowNull: false, // Não permite valor nulo
      unique: true, // Login deve ser único
    },
    Usuario_Senha: {
      type: db.Sequelize.STRING(255), // Tipo: string com tamanho máximo de 255 caracteres (para hash)
      allowNull: false, // Não permite valor nulo
    },
    Usuario_Nome: {
      type: db.Sequelize.STRING(100), // Tipo: string com tamanho máximo de 100 caracteres
      allowNull: false, // Não permite valor nulo
    },
    Usuario_Grupo: {
      type: db.Sequelize.ENUM("Administrador", "Alunos"), // Tipo: ENUM com valores permitidos
      allowNull: false, // Não permite valor nulo
      defaultValue: "Alunos", // Valor padrão é 'Alunos'
    },
    Usuario_Aluno_ID: {
      type: db.Sequelize.INTEGER, // Tipo: número inteiro (FK para tabela Alunos_Cadastros)
      allowNull: true, // Permite nulo (Administradores não precisam ter ID de aluno)
      unique: true, // Cada aluno pode ter apenas um usuário vinculado
      references: {
        model: "Alunos_Cadastros", // Nome da tabela referenciada
        key: "Alunos_Codigo", // Chave primária da tabela Alunos_Cadastros
      },
    },
    Usuario_Ativo: {
      type: db.Sequelize.BOOLEAN, // Tipo: booleano
      allowNull: false, // Não permite valor nulo
      defaultValue: true, // Valor padrão é true (ativo)
    },
  },
  {
    freezeTableName: true, // Mantém o nome da tabela como definido (não pluraliza)
    timestamps: true, // Adiciona campos createdAt e updatedAt automaticamente
  }
);

// Sincroniza o modelo com o banco de dados (cria a tabela se não existir)
Usuarios.sync({ alter: false })
  .then(() => {
    console.log("✅ Tabela 'Usuarios' sincronizada com sucesso!");
  })
  .catch((error) => {
    console.error("❌ Erro ao sincronizar tabela 'Usuarios':", error);
  });

// Exporta o modelo para ser usado em outras partes da aplicação
module.exports = Usuarios;
