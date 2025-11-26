import React from "react";

function ControleAluno({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Controle de Alunos
    </button>
  );
}

function CadastrarAluno({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Cadastrar Aluno
    </button>
  );
}

function EditarAluno({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Editar Aluno
    </button>
  );
}
function DeletarAluno({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Deletar Aluno
    </button>
  );
}

function PesquisarAluno({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Pesquisar Aluno
    </button>
  );
}
function ControleAulas({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Controle de Aulas
    </button>
  );
}

function ControlePresenca({ onClick }) {
  return (
    <button
      className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Controle de Presença
    </button>
  );
}

function ControleUsuarios({ onClick }) {
  return (
    <button
      className="bg-purple-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Gerenciar Usuários
    </button>
  );
}

function CadastrarUsuario({ onClick }) {
  return (
    <button
      className="bg-purple-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Cadastrar Usuário
    </button>
  );
}

function ListarUsuarios({ onClick }) {
  return (
    <button
      className="bg-purple-600 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
    >
      Listar Usuários
    </button>
  );
}

export const Buttons = {
  ControleAluno,
  CadastrarAluno,
  EditarAluno,
  DeletarAluno,
  PesquisarAluno,
  ControleAulas,
  ControlePresenca,
  ControleUsuarios,
  CadastrarUsuario,
  ListarUsuarios,
};
