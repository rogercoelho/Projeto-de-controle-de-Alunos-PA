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
function BotaoLimpar({ onClick, disabled, type = "button" }) {
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
BotaoLimpar.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
};
/* Fim - Botao Limpar */

/* Inicio - Botao X (Remover Conteudo) */
function BotaoX({ onClick }) {
  return (
    <button
      type="button"
      className="ml-0.5 text-red-500 font-bold rounded hover:bg-red-700 hover:text-white"
      style={{ padding: "3px 7px" }}
      onClick={onClick}
      aria-label="X"
    >
      X
    </button>
  );
}
BotaoX.propTypes = {
  onClick: PropTypes.func,
};
/* Fim - Botao X (Remover Conteudo) */

/* Inicio - Botao Pesquisar Aluno */
function BotaoPesquisar({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
}) {
  const label = children || "Pesquisar";
  return (
    <button
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold"
      onClick={onClick}
      type={type}
      disabled={disabled}
    >
      🔎 {loading ? `Pesquisando...` : label}
    </button>
  );
}
BotaoPesquisar.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node,
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

/* Inicio - Botao Editar Aluno */
function BotaoEditar({ onClick }) {
  return (
    <button
      className={`flex gap-4 border-2 p-2 rounded-md font-bold bg-blue-500 border-gray-300 hover:bg-blue-600`}
      onClick={onClick}
    >
      ✏️ Editar
    </button>
  );
}
BotaoEditar.propTypes = {
  onClick: PropTypes.func,
};
/* Fim - Botao Editar Aluno */

/* Inicio - Botao Salvar Alteracoes */
function SalvarAlteracoes({ onClick, type = "submit", disabled, loading }) {
  return (
    <button
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
      onClick={onClick}
      type={type || "submit"}
      disabled={disabled}
      loading={loading}
    >
      💾 {loading ? "Salvando..." : "Salvar Alterações"}
    </button>
  );
}
SalvarAlteracoes.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};
/* Fim - Botao Salvar Alteracoes */

/* Inicio - Botao Ativar/Desativar */
function BotaoAtivarDesativar({ onClick, aluno }) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-4 border-2 p-2 rounded-md font-bold  text-white border-gray-300 ${
        aluno.Alunos_Situacao === "Ativo"
          ? "bg-orange-600 hover:bg-orange-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {aluno.Alunos_Situacao === "Ativo" ? "⛔ Inativar" : "✅ Ativar"}
    </button>
  );
}
BotaoAtivarDesativar.propTypes = {
  onClick: PropTypes.func,
  aluno: PropTypes.object,
};
/* Fim - Botao Ativar/Desativar */

/* Inicio - Botao Cancelar */
function BotaoCancelar({ onClick, disabled, type = "button" }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      className="bg-gray-600 text-white p-2 border-2 rounded-md border-gray-300 hover:bg-gray-700 disabled:bg-gray-400"
    >
      ❌ Cancelar
    </button>
  );
}
BotaoCancelar.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  type: PropTypes.string,
};
/* Fim - Botao Cancelar */

/* Inicio - Botao Cadastrar Plano */
function CadastrarPlano({ onClick, type = "submit", disabled, loading }) {
  return (
    <button
      type={type || "submit"}
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? "Cadastrando..." : "Cadastrar Plano"}
    </button>
  );
}
CadastrarPlano.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};
/* Fim - Botao Cadastrar Aluno */

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
  BotaoEditar,
  BotaoLimpar,
  BotaoCancelar,
  BotaoAtivarDesativar,
  BotaoPesquisar,
  BotaoX,
  OrdenarPorCodigo,
  CadastrarPlano,
  SalvarAlteracoes,
  OrdenarPorNome,
  VoltarPesquisa,
  CadastrarAluno,
  DeletarAluno,
  ControleAulas,
  ControlePresenca,
  ControleUsuarios,
  CadastrarUsuario,
  ListarUsuarios,
};

export default Buttons;
