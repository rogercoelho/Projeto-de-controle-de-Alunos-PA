import { useState, useEffect } from "react";
import api from "../services/api";

function formatarDataBR(dataISO) {
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  if (!ano || !mes || !dia) return dataISO;
  return `${dia}/${mes}/${ano}`;
}

function RegistrarPagamento() {
  const [codigoAluno, setCodigoAluno] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [faturamentos, setFaturamentos] = useState([]);
  const [datasPagamento, setDatasPagamento] = useState({});
  const [descontos, setDescontos] = useState({});
  const [motivosDesconto, setMotivosDesconto] = useState({});

  useEffect(() => {
    const fetchAlunosEPlanos = async () => {
      try {
        const res = await api.get("/alunos/");
        const ativos = (res.data.Listagem_de_Alunos || []).filter(
          (aluno) => aluno.Alunos_Situacao === "Ativo"
        );
        setAlunos(ativos);
      } catch {
        setAlunos([]);
      }
      // Removido: busca de planos e setPlanos, pois não é mais utilizado
    };
    fetchAlunosEPlanos();
  }, []);

  useEffect(() => {
    const fetchAlunoEFaturamentos = async () => {
      if (!codigoAluno) {
        setAlunoInfo(null);
        setFaturamentos([]);
        return;
      }
      try {
        // Busca info do aluno
        const resAluno = await api.get(`/alunos/search/${codigoAluno}`);
        setAlunoInfo(resAluno.data);
      } catch {
        setAlunoInfo(null);
      }
      try {
        // Busca faturamentos SEM data de pagamento
        const resFat = await api.get(`/faturamento/pendentes/${codigoAluno}`);
        setFaturamentos(resFat.data.faturamentos || []);
      } catch {
        setFaturamentos([]);
      }
    };
    fetchAlunoEFaturamentos();
  }, [codigoAluno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    // Validação: se algum desconto for preenchido, motivo deve ser obrigatório
    for (const fat of faturamentos) {
      const fatId = fat.id || fat.Faturamento_ID;
      const desconto = descontos[fatId];
      const motivo = motivosDesconto[fatId];
      if (desconto && (!motivo || motivo.trim() === "")) {
        setMessage({
          type: "error",
          text: `Motivo do desconto é obrigatório para o faturamento ${fatId}.`,
        });
        setLoading(false);
        setTimeout(() => setMessage({ type: "", text: "" }), 1500);
        return;
      }
    }
    // Monta array de pagamentos a registrar
    const pagamentos = faturamentos.map((fat) => {
      const fatId = fat.id || fat.Faturamento_ID;
      return {
        id: fatId,
        Faturamento_Data_Pagamento: datasPagamento[fatId] || null,
        Faturamento_Desconto: descontos[fatId] || null,
        Faturamento_Motivo: motivosDesconto[fatId] || null,
      };
    });
    try {
      await api.patch("/faturamento/registrar-pagamento", { pagamentos });
      setMessage({
        type: "success",
        text: "Pagamento registrado com sucesso!",
      });
      setCodigoAluno("");
      setAlunoInfo(null);
      setDatasPagamento({});
      setDescontos({});
      setMotivosDesconto({});
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.Erro || "Erro ao registrar pagamento.",
      });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 1500);
    }
  };

  return (
    <div className="w-full h-auto px-2 sm:px-0">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
        Registrar Pagamento
      </h2>
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
        className="bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 mx-auto w-full max-w-lg"
      >
        <div>
          <label className="block text-base font-medium text-gray-300 mb-2">
            Código do Aluno *
          </label>
          <select
            name="codigoAluno"
            value={codigoAluno}
            onChange={(e) => setCodigoAluno(e.target.value)}
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
        </div>
        <div>
          <label className="block text-base font-medium text-gray-300 mb-2 mt-4">
            Nome do Aluno
          </label>
          <input
            type="text"
            value={alunoInfo?.Alunos_Nome || ""}
            readOnly
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Informações do Aluno e Plano */}
        {alunoInfo && (
          <div className="bg-gray-800 rounded-xl p-4 mt-6 mb-2">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">
              Informações do Aluno
            </h3>
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
                <b>Data Matrícula:</b>{" "}
                {formatarDataBR(alunoInfo.Alunos_Data_Matricula)}
              </li>
            </ul>
          </div>
        )}
        {/* Lista de faturamentos pendentes */}
        {faturamentos.length > 0 && (
          <div className="mt-4">
            <label className="block text-base font-medium text-gray-300 mb-2">
              Faturamentos Pendentes
            </label>
            <ul className="bg-gray-700 rounded-md p-2 text-white text-sm space-y-2">
              {faturamentos.map((fat) => {
                const fatId = fat.id || fat.Faturamento_ID;
                return (
                  <li
                    key={fatId}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-600 pb-2 last:border-b-0 last:pb-0"
                  >
                    <span>
                      <b>Plano:</b> {fat.Plano_Codigo} | <b>Início:</b>{" "}
                      {fat.Faturamento_Inicio} | <b>Fim:</b>{" "}
                      {fat.Faturamento_Fim} | <b>Valor:</b> R${" "}
                      {fat.Faturamento_Valor_Total}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <label className="text-gray-300 text-xs">
                          Data Pagamento:
                        </label>
                        <input
                          type="date"
                          value={datasPagamento[fatId] || ""}
                          onChange={(e) =>
                            setDatasPagamento((prev) => ({
                              ...prev,
                              [fatId]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 rounded bg-gray-600 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-300 text-xs">
                          Desconto:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="R$"
                          value={descontos[fatId] || ""}
                          onChange={(e) =>
                            setDescontos((prev) => ({
                              ...prev,
                              [fatId]: e.target.value,
                            }))
                          }
                          className="px-2 py-1 rounded bg-gray-600 text-white text-xs w-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-gray-300 text-xs">Motivo:</label>
                        <input
                          type="text"
                          placeholder="Motivo do desconto"
                          value={motivosDesconto[fatId] || ""}
                          onChange={(e) =>
                            setMotivosDesconto((prev) => ({
                              ...prev,
                              [fatId]: e.target.value,
                            }))
                          }
                          className={`px-2 py-1 rounded bg-gray-600 text-white text-xs w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            descontos[fatId] && !motivosDesconto[fatId]
                              ? "border-2 border-red-500"
                              : ""
                          }`}
                          required={!!descontos[fatId]}
                          disabled={!descontos[fatId]}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {loading ? "Salvando..." : "Registrar Pagamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RegistrarPagamento;
