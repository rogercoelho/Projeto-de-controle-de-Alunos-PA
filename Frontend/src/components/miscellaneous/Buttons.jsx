import PropTypes, { func } from "prop-types";

/* Inicio - Botao Cadastrar Aluno */
function CadastrarAluno({ onClick, type = "submit", disabled, loading }) {
  return (
    <button
      type={type || "submit"}
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? "Cadastrando..." : "Cadastrar Aluno"}
    </button>
  );
}
CadastrarAluno.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};
/* Fim - Botao Cadastrar Aluno */

/* Inicio - Botao Limpar */
function Limpar({ onClick, disabled, type = "button" }) {
  return (
    <button
      className="bg-gray-500 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-gray-600"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      🧹Limpar
    </button>
  );
}
Limpar.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
};
/* Fim - Botao Limpar */

/* Inicio - Botao Pesquisar Aluno */
function PesquisarAluno({ onClick, type = "button", disabled, loading }) {
  return (
    <button
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
      type={type}
      disabled={disabled}
      loading={loading}
    >
      🔎{loading ? "Pesquisando..." : "Pesquisar Aluno"}
    </button>
  );
}
PesquisarAluno.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};
/* Fim - Botao Pesquisar Aluno */

/* Inicio - Botao Ordenar por Código */
function OrdenarPorCodigo({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-4 border-2 p-2 rounded-md font-bold transition-colors text-sm ${
        isActive
          ? "bg-blue-500 border-gray-300 hover:bg-blue-600"
          : "bg-gray-700 text-gray-300 active:bg-gray-600"
      }`}
    >
      🧩 Código
    </button>
  );
}
OrdenarPorCodigo.propTypes = {
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
};
/* Fim - Botao Ordenar por Código */

/* Inicio - Botao Ordenar por Nome */
function OrdenarPorNome({ onClick, isActive }) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-4 border-2 p-2 rounded-md font-bold transition-colors text-sm ${
        isActive
          ? "bg-blue-500 border-gray-300 hover:bg-blue-600"
          : "bg-gray-700 text-gray-300 active:bg-gray-600"
      }`}
    >
      <img src="/controle_pa/user.png" alt="Nome" className="w-6 h-6 flex" />
      Nome
    </button>
  );
}
OrdenarPorNome.propTypes = {
  onClick: PropTypes.func,
  isActive: PropTypes.bool,
};
/* Fim - Botao Ordenar por Nome */

/* Inicio - Botao Voltar para a Pesquisa */

/* Inicio - Botao Voltar para a Pesquisa */
function VoltarPesquisa({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="bg-gray-500 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-gray-600"
    >
      🠔 Voltar
    </button>
  );
}
VoltarPesquisa.propTypes = {
  onBack: PropTypes.func,
};
/* Fim - Botao Voltar para a Pesquisa */

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

export const Buttons = {
  OrdenarPorCodigo,
  OrdenarPorNome,
  VoltarPesquisa,
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
