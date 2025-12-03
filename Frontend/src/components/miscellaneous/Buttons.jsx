import PropTypes from "prop-types";

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

ControleAluno.propTypes = {
  onClick: PropTypes.func,
};

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

CadastrarAluno.propTypes = {
  onClick: PropTypes.func,
};

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

EditarAluno.propTypes = {
  onClick: PropTypes.func,
};
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

DeletarAluno.propTypes = {
  onClick: PropTypes.func,
};

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

PesquisarAluno.propTypes = {
  onClick: PropTypes.func,
};
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

ControleAulas.propTypes = {
  onClick: PropTypes.func,
};

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

ControlePresenca.propTypes = {
  onClick: PropTypes.func,
};

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

ControleUsuarios.propTypes = {
  onClick: PropTypes.func,
};

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

CadastrarUsuario.propTypes = {
  onClick: PropTypes.func,
};

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

ListarUsuarios.propTypes = {
  onClick: PropTypes.func,
};

function Limpar({ onClick, disabled }) {
  return (
    <button
      className="bg-gray-500 rounded-2xl p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
      disabled={disabled}
    >
      Limpar
    </button>
  );
}
Limpar.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

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
  Limpar,
};

export default Buttons;
