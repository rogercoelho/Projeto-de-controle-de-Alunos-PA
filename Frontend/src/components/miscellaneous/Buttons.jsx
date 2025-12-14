import PropTypes from "prop-types";

/* Inicio - Botao Cadastrar */
function BotaoCadastrar({
  children,
  onClick,
  type = "submit",
  disabled,
  loading,
}) {
  const label = children || "Cadastrar";
  return (
    <button
      type={type || "submit"}
      className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
      onClick={onClick}
      disabled={disabled}
    >
      {loading ? "Cadastrando..." : label}
    </button>
  );
}
BotaoCadastrar.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node,
};
/* Fim - Botao Cadastrar */

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

/* Inicio - Botao Pesquisar */
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
/* Fim - Botao Pesquisar */

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

/* Inicio - Select Ordenação */
function SelectOrdenacao({ value, onChange, options, label = "Ordenar por:" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 text-sm">{label}</span>
      <select
        value={value}
        onChange={onChange}
        className="bg-gray-700 text-white px-3 py-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
SelectOrdenacao.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  label: PropTypes.string,
};
/* Fim - Select Ordenação */

/* Inicio - Botao Voltar */
function BotaoVoltar({ onBack }) {
  return (
    <button
      onClick={onBack}
      className="bg-gray-500 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-gray-600"
    >
      🠔 Voltar
    </button>
  );
}
BotaoVoltar.propTypes = {
  onBack: PropTypes.func,
};
/* Fim - Botao Voltar */

/* Inicio - Botao Editar */
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
/* Fim - Botao Editar */

/* Inicio - Botao Ativar/Inativar */
function BotaoAtivarInativar({ onClick, isAtivo }) {
  return (
    <button
      onClick={onClick}
      className={`flex gap-2 border-2 p-2 rounded-md font-bold text-white border-gray-300 ${
        isAtivo
          ? "bg-orange-600 hover:bg-orange-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      {isAtivo ? "🚫 Inativar" : "✅ Ativar"}
    </button>
  );
}
BotaoAtivarInativar.propTypes = {
  onClick: PropTypes.func,
  isAtivo: PropTypes.bool,
};
/* Fim - Botao Ativar/Inativar */

/* Inicio - Botao Salvar Alteracoes */
function BotaoSalvarAlteracoes({
  onClick,
  type = "submit",
  disabled,
  loading,
}) {
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
BotaoSalvarAlteracoes.propTypes = {
  onClick: PropTypes.func,
  type: PropTypes.string,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
};
/* Fim - Botao Salvar Alteracoes */

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

/* Inicio - Botao Paginação Anterior */
function BotaoPaginacaoAnterior({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
    >
      Anterior
    </button>
  );
}
BotaoPaginacaoAnterior.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
/* Fim - Botao Paginação Anterior */

/* Inicio - Botao Paginação Próxima */
function BotaoPaginacaoProxima({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1 bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
    >
      Próxima
    </button>
  );
}
BotaoPaginacaoProxima.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};
/* Fim - Botao Paginação Próxima */

/* ============================================== */
/* ============================================== */

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
/* Fim - Botao Cadastrar Plano */

/* Inicio - Botao Extrato */
function BotaoExtrato({ onClick, loading, disabled }) {
  return (
    <button
      type="button"
      className="bg-purple-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled || loading}
    >
      📄 {loading ? "Carregando..." : "Extrato"}
    </button>
  );
}
BotaoExtrato.propTypes = {
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};
/* Fim - Botao Extrato */

/* Inicio - Botao PDF */
function BotaoPDF({ onClick, loading, disabled }) {
  return (
    <button
      type="button"
      className="bg-red-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      onClick={onClick}
      disabled={disabled || loading}
    >
      📥 {loading ? "Gerando..." : "Salvar PDF"}
    </button>
  );
}
BotaoPDF.propTypes = {
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
};
/* Fim - Botao PDF */

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
  BotaoCadastrar,
  BotaoEditar,
  BotaoLimpar,
  BotaoCancelar,
  BotaoAtivarInativar,
  BotaoPesquisar,
  BotaoX,
  CadastrarPlano,
  BotaoSalvarAlteracoes,
  BotaoVoltar,
  BotaoExtrato,
  BotaoPDF,
  DeletarAluno,
  ControleAulas,
  ControlePresenca,
  ControleUsuarios,
  CadastrarUsuario,
  ListarUsuarios,
  BotaoPaginacaoAnterior,
  BotaoPaginacaoProxima,
  SelectOrdenacao,
};

export default Buttons;
