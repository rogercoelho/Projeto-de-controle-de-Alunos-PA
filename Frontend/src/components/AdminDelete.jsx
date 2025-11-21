import { useState } from "react";
import api from "../services/api";
import { getUsuario } from "../services/auth";

function AdminDelete() {
  const [tabela, setTabela] = useState("");
  const [registroId, setRegistroId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const tabelas = [
    { value: "Alunos_Cadastros", label: "Alunos" },
    { value: "usuarios", label: "Usuários" },
  ];

  const handleDelete = async (e) => {
    e.preventDefault();

    if (!tabela || !registroId) {
      setMessage({
        type: "error",
        text: "Por favor, selecione uma tabela e informe o ID.",
      });
      return;
    }

    const confirmar = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a excluir permanentemente o registro ID ${registroId} da tabela ${tabela}.\n\nEsta ação NÃO PODE SER DESFEITA!\n\nDeseja continuar?`
    );

    if (!confirmar) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const usuarioLogado = getUsuario();

      // Usa a rota genérica de admin que registra no log
      const response = await api.delete(
        `/admin/delete/${tabela}/${registroId}`,
        {
          data: {
            usuario: usuarioLogado?.login || usuarioLogado?.nome || "Sistema",
          },
        }
      );

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Registro excluído com sucesso!",
      });

      // Limpa os campos após sucesso
      setTabela("");
      setRegistroId("");

      // Limpa a mensagem após 3 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao excluir registro. Verifique se o ID existe.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTabela("");
    setRegistroId("");
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-auto p-6 bg-gray-800 rounded-xl">
      <h2 className="text-2xl font-bold text-red-500 mb-6 text-center">
        ⚠️ Exclusão de Registros - CUIDADO
      </h2>

      {/* Mensagem de feedback */}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border-2 border-green-500"
              : "bg-red-100 text-red-700 border-2 border-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleDelete} className="space-y-6">
        {/* Seleção de Tabela */}
        <div className="space-y-2">
          <label className="block text-white font-semibold">
            Selecione a Tabela:
          </label>
          <select
            value={tabela}
            onChange={(e) => setTabela(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-red-500 focus:outline-none"
            required
          >
            <option value="">-- Escolha uma tabela --</option>
            {tabelas.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
        </div>

        {/* ID do Registro */}
        <div className="space-y-2">
          <label className="block text-white font-semibold">
            ID do Registro:
          </label>
          <input
            type="number"
            value={registroId}
            onChange={(e) => setRegistroId(e.target.value)}
            className="w-full p-3 rounded-md bg-gray-700 text-white border-2 border-gray-600 focus:border-red-500 focus:outline-none"
            placeholder="Digite o ID do registro"
            required
            min="1"
          />
        </div>

        {/* Aviso */}
        <div className="bg-red-900/30 border-2 border-red-600 rounded-md p-4">
          <p className="text-red-300 text-sm font-semibold">
            ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL! O registro será excluído
            permanentemente do banco de dados.
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-4 justify-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-red-600 text-white px-8 py-3 rounded-md hover:bg-red-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {loading ? "Excluindo..." : "🗑️ Excluir Registro"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-600 text-white px-8 py-3 rounded-md hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminDelete;
