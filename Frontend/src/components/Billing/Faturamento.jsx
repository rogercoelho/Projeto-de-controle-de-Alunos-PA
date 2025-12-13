import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";

function Faturamento() {
  const [formData, setFormData] = useState({
    codigoAluno: "",
    codigoPlano: "",
    dataVencimento: "",
  });
  const [alunos, setAlunos] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [planoInfo, setPlanoInfo] = useState(null);
  const [fetchingAluno, setFetchingAluno] = useState(false);
  const [fetchingPlano, setFetchingPlano] = useState(false);
  const [messageToast, showToast] = useToast();

  // Calcula o valor total do faturamento conforme o tipo de pagamento
  const valorTotalFaturamento = useMemo(() => {
    if (!planoInfo) return null;
    let multiplicador = 1;
    if (planoInfo.Plano_Pagamento === "Trimestral") multiplicador = 3;
    else if (planoInfo.Plano_Pagamento === "Semestral") multiplicador = 6;
    else if (planoInfo.Plano_Pagamento === "Anual") multiplicador = 12;
    const valor = parseFloat(planoInfo.Plano_Valor);
    if (isNaN(valor)) return null;
    return valor * multiplicador;
  }, [planoInfo]);

  // Buscar todos os alunos e planos ao montar
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const res = await api.get("/alunos/");
        // Filtra apenas alunos ativos
        const ativos = (res.data.Listagem_de_Alunos || []).filter(
          (aluno) => aluno.Alunos_Situacao === "Ativo"
        );
        setAlunos(ativos);
      } catch {
        setAlunos([]);
      }
    };
    const fetchPlanos = async () => {
      try {
        const res = await api.get("/planos");
        // Filtra apenas planos ativos
        const ativos = (res.data.Planos || []).filter(
          (plano) => plano.Plano_Ativo === "Ativo"
        );
        setPlanos(ativos);
      } catch {
        setPlanos([]);
      }
    };
    fetchAlunos();
    fetchPlanos();
  }, []);

  useEffect(() => {
    const fetchAluno = async () => {
      if (!formData.codigoAluno) {
        setAlunoInfo(null);
        return;
      }
      setFetchingAluno(true);
      try {
        const res = await api.get(`/alunos/codigo/${formData.codigoAluno}`);
        setAlunoInfo(res.data);
      } catch {
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
      } catch {
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
    try {
      if (!planoInfo) throw new Error("Plano não encontrado");
      // Calcula a data de início e fim conforme o tipo do plano
      const inicio = new Date(formData.dataVencimento);
      let meses = 1;
      if (planoInfo.Plano_Pagamento === "Trimestral") meses = 3;
      else if (planoInfo.Plano_Pagamento === "Semestral") meses = 6;
      else if (planoInfo.Plano_Pagamento === "Anual") meses = 12;
      // Mensal é 1 mês
      const fim = new Date(inicio);
      fim.setMonth(fim.getMonth() + meses);

      // Calcula o valor total do faturamento
      let multiplicador = 1;
      if (planoInfo.Plano_Pagamento === "Trimestral") multiplicador = 3;
      else if (planoInfo.Plano_Pagamento === "Semestral") multiplicador = 6;
      else if (planoInfo.Plano_Pagamento === "Anual") multiplicador = 12;
      const valor = parseFloat(planoInfo.Plano_Valor);
      const valorTotal = isNaN(valor) ? null : valor * multiplicador;

      await api.post("/faturamento/registrar-faturamento", {
        Aluno_Codigo: formData.codigoAluno,
        Plano_Codigo: formData.codigoPlano,
        Faturamento_Inicio: formData.dataVencimento,
        Faturamento_Fim: fim.toISOString().slice(0, 10),
        Faturamento_Valor_Total: valorTotal,
      });

      showToast({
        type: "success",
        text: "Faturamento registrado com sucesso!",
      });
      setFormData({ codigoAluno: "", codigoPlano: "", dataVencimento: "" });
      setAlunoInfo(null);
      setPlanoInfo(null);
    } catch (error) {
      // Se for erro 401, o interceptor global já trata
      if (error?.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error?.response?.data?.Erro ||
            error?.message ||
            "Erro ao registrar faturamento.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center bg-linear-to-b from-gray-900 to-gray-800 py-2 px-1 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
        Faturamento
      </h2>
      <MessageToast messageToast={messageToast} />
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-0 sm:p-6 space-y-4 w-full h-full min-h-[80vh] shadow-lg border-2 border-gray-700"
        style={{ minWidth: 0, maxWidth: "100vw" }}
      >
        <div>
          <label className="block text-base font-medium text-gray-300 mb-2">
            Código do Aluno *
          </label>
          <select
            name="codigoAluno"
            value={formData.codigoAluno}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                codigoAluno: e.target.value,
              }));
            }}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o código do aluno</option>
            {alunos.map((aluno) => (
              <option key={aluno.Alunos_Codigo} value={aluno.Alunos_Codigo}>
                {aluno.Alunos_Codigo}
              </option>
            ))}
          </select>
          {/* Nome do Aluno (select) */}
          <label className="block text-base font-medium text-gray-300 mt-4 mb-2">
            Nome do Aluno
          </label>
          <select
            name="nomeAluno"
            value={alunoInfo?.Alunos_Nome || ""}
            onChange={(e) => {
              const nomeSelecionado = e.target.value;
              const alunoSelecionado = alunos.find(
                (a) => a.Alunos_Nome === nomeSelecionado
              );
              setFormData((prev) => ({
                ...prev,
                codigoAluno: alunoSelecionado
                  ? String(alunoSelecionado.Alunos_Codigo)
                  : "",
              }));
            }}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o nome do aluno</option>
            {alunos.map((aluno) => (
              <option key={aluno.Alunos_Codigo} value={aluno.Alunos_Nome}>
                {aluno.Alunos_Nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-base font-medium text-gray-300 mb-2">
            Código do Plano *
          </label>
          <select
            name="codigoPlano"
            value={formData.codigoPlano}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione o código do plano</option>
            {planos.map((plano) => (
              <option key={plano.Plano_Codigo} value={plano.Plano_Codigo}>
                {plano.Plano_Codigo} - {plano.Plano_Nome} (
                {plano.Plano_Pagamento})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-base font-medium text-gray-300 mb-2">
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
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {loading ? "Salvando..." : "Registrar Faturamento"}
          </button>
        </div>
      </form>

      {/* Informações do Aluno e do Plano */}
      <div className="mt-8 flex flex-col gap-6 w-full">
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">
            Informações do Aluno
          </h3>
          {fetchingAluno ? (
            <div className="text-gray-400 text-center">Buscando aluno...</div>
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
            <div className="text-gray-400 text-center">
              Nenhum aluno encontrado.
            </div>
          )}
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">
            Informações do Plano
          </h3>
          {fetchingPlano ? (
            <div className="text-gray-400 text-center">Buscando plano...</div>
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
              {/* Status removido conforme solicitado */}
              <li>
                <b>Valor Total Faturamento:</b>{" "}
                {valorTotalFaturamento !== null
                  ? `R$ ${valorTotalFaturamento.toFixed(2)}`
                  : "-"}
              </li>
            </ul>
          ) : (
            <div className="text-gray-400 text-center">
              Nenhum plano encontrado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Faturamento;
