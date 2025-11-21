import { useState, useEffect } from "react";
import api from "../services/api";

function Faturamento() {
  const [formData, setFormData] = useState({
    codigoAluno: "",
    codigoPlano: "",
    dataVencimento: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [planoInfo, setPlanoInfo] = useState(null);
  const [fetchingAluno, setFetchingAluno] = useState(false);
  const [fetchingPlano, setFetchingPlano] = useState(false);

  useEffect(() => {
    const fetchAluno = async () => {
      if (!formData.codigoAluno) {
        setAlunoInfo(null);
        return;
      }
      setFetchingAluno(true);
      try {
        const res = await api.get(`/alunos/search/${formData.codigoAluno}`);
        setAlunoInfo(res.data);
      } catch (err) {
        setAlunoInfo(null);
      } finally {
        setFetchingAluno(false);
      }
    };
    fetchAluno();
  }, [formData.codigoAluno]);

  useEffect(() => {
    const fetchPlano = async () => {
      if (!formData.codigoPlano) {
        setPlanoInfo(null);
        return;
      }
      setFetchingPlano(true);
      try {
        const res = await api.get(`/planos/${formData.codigoPlano}`);
        setPlanoInfo(res.data.Plano);
      } catch (err) {
        setPlanoInfo(null);
      } finally {
        setFetchingPlano(false);
      }
    };
    fetchPlano();
  }, [formData.codigoPlano]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      if (!planoInfo) throw new Error("Plano não encontrado");
      // Calcula a data de fim conforme o tipo do plano
      const inicio = new Date(formData.dataVencimento);
      let meses = 1;
      if (planoInfo.Plano_Pagamento === "Trimestral") meses = 3;
      else if (planoInfo.Plano_Pagamento === "Semestral") meses = 6;
      else if (planoInfo.Plano_Pagamento === "Anual") meses = 12;
      // Mensal é 1 mês
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + meses);

      await api.post("/faturamento/registrar-faturamento", {
        Aluno_Codigo: formData.codigoAluno,
        Plano_Codigo: formData.codigoPlano,
        Faturamento_Inicio: formData.dataVencimento,
        Faturamento_Fim: fim.toISOString().slice(0, 10),
      });

      setMessage({
        type: "success",
        text: "Faturamento registrado com sucesso!",
      });
      setFormData({ codigoAluno: "", codigoPlano: "", dataVencimento: "" });
      setAlunoInfo(null);
      setPlanoInfo(null);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err?.response?.data?.Erro ||
          err.message ||
          "Erro ao registrar faturamento.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Faturamento</h2>
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
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-6 space-y-4 mx-auto"
      >
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Aluno *
          </label>
          <input
            type="text"
            name="codigoAluno"
            value={formData.codigoAluno}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o código do aluno"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Plano *
          </label>
          <input
            type="text"
            name="codigoPlano"
            value={formData.codigoPlano}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Digite o código do plano"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Vencimento *
          </label>
          <input
            type="date"
            name="dataVencimento"
            value={formData.dataVencimento}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Registrar Faturamento"}
          </button>
        </div>
      </form>

      {/* Informações do Aluno e do Plano */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-2">
            Informações do Aluno
          </h3>
          {fetchingAluno ? (
            <div className="text-gray-400">Buscando aluno...</div>
          ) : alunoInfo ? (
            <ul className="text-gray-200 text-sm space-y-1">
              <li>
                <b>Código:</b> {alunoInfo.Alunos_Codigo}
              </li>
              <li>
                <b>Nome:</b> {alunoInfo.Alunos_Nome}
              </li>
              <li>
                <b>CPF:</b> {alunoInfo.Alunos_CPF}
              </li>
              <li>
                <b>Email:</b> {alunoInfo.Alunos_Email}
              </li>
              <li>
                <b>Telefone:</b> {alunoInfo.Alunos_Telefone}
              </li>
              <li>
                <b>Data Matrícula:</b> {alunoInfo.Alunos_Data_Matricula}
              </li>
            </ul>
          ) : (
            <div className="text-gray-400">Nenhum aluno encontrado.</div>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-bold text-white mb-2">
            Informações do Plano
          </h3>
          {fetchingPlano ? (
            <div className="text-gray-400">Buscando plano...</div>
          ) : planoInfo ? (
            <ul className="text-gray-200 text-sm space-y-1">
              <li>
                <b>Código:</b> {planoInfo.Plano_Codigo}
              </li>
              <li>
                <b>Nome:</b> {planoInfo.Plano_Nome}
              </li>
              <li>
                <b>Valor:</b> R$ {parseFloat(planoInfo.Plano_Valor).toFixed(2)}
              </li>
              <li>
                <b>Tipo Pagamento:</b> {planoInfo.Plano_Pagamento}
              </li>
              <li>
                <b>Status:</b> {planoInfo.Plano_Ativo}
              </li>
            </ul>
          ) : (
            <div className="text-gray-400">Nenhum plano encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Faturamento;
