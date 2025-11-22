import { useState, useEffect } from "react";
import api from "../services/api";

function RegistrarPagamento() {
  const [codigoAluno, setCodigoAluno] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [faturamentos, setFaturamentos] = useState([]);
  const [planos, setPlanos] = useState({});

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
      try {
        // Busca todos os planos e cria um dicionário Plano_Codigo -> Plano_Nome
        const resPlanos = await api.get("/planos");
        const planosDict = {};
        (resPlanos.data.Planos || []).forEach((plano) => {
          planosDict[plano.Plano_Codigo] = plano.Plano_Nome;
        });
        setPlanos(planosDict);
      } catch {
        setPlanos({});
      }
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
    // Aqui você pode implementar a lógica de registrar o pagamento
    setTimeout(() => {
      setMessage({
        type: "success",
        text: "Pagamento registrado com sucesso!",
      });
      setLoading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 1500);
      setCodigoAluno("");
      setAlunoInfo(null);
    }, 1000);
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
                <b>Data Matrícula:</b> {alunoInfo.Alunos_Data_Matricula}
              </li>
            </ul>
            {/* Se houver faturamentos pendentes, mostra info de todos os planos */}
            {faturamentos.length > 0 && (
              <div className="mt-4">
                <h4 className="text-base font-bold text-gray-300 mb-1">
                  Planos dos Faturamentos Pendentes
                </h4>
                <ul className="text-gray-200 text-sm space-y-1">
                  {faturamentos.map((fat, idx) => (
                    <li
                      key={fat.id || fat.Faturamento_ID || idx}
                      className="mb-2"
                    >
                      <b>Código do Plano:</b> {fat.Plano_Codigo} <br />
                      <b>Nome do Plano:</b> {planos[fat.Plano_Codigo] || "-"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {/* Lista de faturamentos pendentes */}
        {faturamentos.length > 0 && (
          <div className="mt-4">
            <label className="block text-base font-medium text-gray-300 mb-2">
              Faturamentos Pendentes
            </label>
            <ul className="bg-gray-700 rounded-md p-2 text-white text-sm space-y-2">
              {faturamentos.map((fat) => (
                <li
                  key={fat.id || fat.Faturamento_ID}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-600 pb-2 last:border-b-0 last:pb-0"
                >
                  <span>
                    <b>Plano:</b> {fat.Plano_Codigo} | <b>Início:</b>{" "}
                    {fat.Faturamento_Inicio} | <b>Fim:</b> {fat.Faturamento_Fim}{" "}
                    | <b>Valor:</b> R$ {fat.Faturamento_Valor_Total}
                  </span>
                  {/* Aqui pode adicionar checkbox ou botão para registrar pagamento */}
                </li>
              ))}
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
