import { useState, useEffect } from "react";
import api from "../services/api";

function StudentPlan() {
  const [searchData, setSearchData] = useState({
    codigo: "",
    cpf: "",
    nome: "",
  });
  const [students, setStudents] = useState([]);
  const [planos, setPlanos] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPlans, setStudentPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;
  // Removido timeoutId

  useEffect(() => {
    // Carrega todos os planos ao montar o componente
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      const response = await api.get("/planos/");
      console.log("Resposta de planos:", response.data);
      const todosPlanos = response.data.Planos || [];
      console.log("Total de planos:", todosPlanos.length);
      // Filtra apenas planos ativos
      const planosAtivos = todosPlanos.filter((p) => p.Plano_Ativo === "Ativo");
      console.log("Planos ativos:", planosAtivos.length);
      setPlanos(planosAtivos);
    } catch (error) {
      console.error("Erro ao listar planos:", error);
      console.log("[LOG] Exibindo mensagem de erro ao listar planos");
      setMessage({
        type: "error",
        text: "Erro ao listar planos",
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de erro ao listar planos");
        setMessage({ type: "", text: "" });
      }, 1500);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatarCPF = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    return apenasNumeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  };

  const handleCPFSearchChange = (e) => {
    const { value } = e.target;
    const cpfFormatado = formatarCPF(value);
    setSearchData((prev) => ({
      ...prev,
      cpf: cpfFormatado,
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    setStudents([]);
    setCurrentPage(1);

    try {
      const response = await api.get("/alunos/");
      const todosAlunos = response.data.Listagem_de_Alunos || [];

      const temFiltro = searchData.codigo || searchData.cpf || searchData.nome;

      let resultadosFiltrados;

      if (!temFiltro) {
        resultadosFiltrados = todosAlunos;
      } else {
        resultadosFiltrados = todosAlunos.filter((aluno) => {
          const matchCodigo = searchData.codigo
            ? aluno.Alunos_Codigo.toString().includes(searchData.codigo)
            : true;

          const matchCPF = searchData.cpf
            ? aluno.Alunos_CPF.replace(/\D/g, "").includes(
                searchData.cpf.replace(/\D/g, "")
              )
            : true;

          const matchNome = searchData.nome
            ? aluno.Alunos_Nome.toLowerCase().includes(
                searchData.nome.toLowerCase()
              )
            : true;

          return matchCodigo && matchCPF && matchNome;
        });
      }

      // Mostra apenas alunos ativos
      resultadosFiltrados = resultadosFiltrados.filter(
        (aluno) => aluno.Alunos_Situacao === "Ativo"
      );

      if (resultadosFiltrados.length === 0) {
        console.log("[LOG] Exibindo mensagem de erro: Nenhum aluno encontrado");
        setMessage({
          type: "error",
          text: "Nenhum aluno encontrado com os critérios informados.",
        });
        setTimeout(() => {
          console.log(
            "[LOG] Limpando mensagem de erro: Nenhum aluno encontrado"
          );
          setMessage({ type: "", text: "" });
        }, 1500);
      } else {
        setStudents(resultadosFiltrados);
        console.log("[LOG] Exibindo mensagem de sucesso: alunos encontrados");
        setMessage({
          type: "success",
          text: `${resultadosFiltrados.length} aluno(s) encontrado(s).`,
        });
        setTimeout(() => {
          console.log("[LOG] Limpando mensagem de sucesso: alunos encontrados");
          setMessage({ type: "", text: "" });
        }, 1500);
      }
    } catch (error) {
      console.error("Erro ao pesquisar alunos:", error);
      console.log("[LOG] Exibindo mensagem de erro ao pesquisar alunos");
      setMessage({
        type: "error",
        text: "Erro ao pesquisar alunos. Tente novamente.",
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de erro ao pesquisar alunos");
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setSelectedPlan("");
    setMessage({ type: "", text: "" });

    // Carrega os planos vinculados ao aluno
    try {
      const response = await api.get(`/alunos/planos/${student.Alunos_Codigo}`);
      setStudentPlans(response.data.Planos || []);
    } catch (error) {
      console.error("Erro ao carregar planos do aluno:", error);
      setStudentPlans([]);
    }
  };

  const handleVincularPlano = async (e) => {
    e.preventDefault();

    if (!selectedStudent || !selectedPlan) {
      console.log("[LOG] Exibindo mensagem de erro: selecione aluno e plano");
      setMessage({
        type: "error",
        text: "Selecione um aluno e um plano.",
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de erro: selecione aluno e plano");
        setMessage({ type: "", text: "" });
      }, 1500);
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/alunos/vincular-plano", {
        Alunos_Codigo: selectedStudent.Alunos_Codigo,
        Plano_Codigo: selectedPlan,
        usuario: localStorage.getItem("usuario") || "Sistema",
      });

      console.log("[LOG] Exibindo mensagem de sucesso ao vincular plano");
      setMessage({
        type: "success",
        text: response.data.Mensagem,
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de sucesso ao vincular plano");
        setMessage({ type: "", text: "" });
      }, 1500);

      // Recarrega os planos do aluno
      const planosResponse = await api.get(
        `/alunos/planos/${selectedStudent.Alunos_Codigo}`
      );
      setStudentPlans(planosResponse.data.Planos || []);
      setSelectedPlan("");
    } catch (error) {
      console.error("Erro ao vincular plano:", error);
      let errorMsg = "Erro ao vincular plano. Tente novamente.";
      if (error.response) {
        errorMsg =
          (error.response.data &&
            (error.response.data.Mensagem ||
              JSON.stringify(error.response.data))) ||
          errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      console.log("[LOG] Exibindo mensagem de erro ao vincular plano");
      setMessage({
        type: "error",
        text: errorMsg,
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de erro ao vincular plano");
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDesvincularPlano = async (vinculoId) => {
    if (!window.confirm("Deseja realmente desvinculer este plano?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.delete(
        `/alunos/desvinculer-plano/${vinculoId}`,
        {
          data: {
            usuario: localStorage.getItem("usuario") || "Sistema",
          },
        }
      );

      console.log("[LOG] Exibindo mensagem de sucesso ao desvincular plano");
      setMessage({
        type: "success",
        text: response.data.Mensagem,
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de sucesso ao desvincular plano");
        setMessage({ type: "", text: "" });
      }, 1500);

      // Recarrega os planos do aluno
      const planosResponse = await api.get(
        `/alunos/planos/${selectedStudent.Alunos_Codigo}`
      );
      setStudentPlans(planosResponse.data.Planos || []);
    } catch (error) {
      console.error("Erro ao desvinculer plano:", error);
      console.log("[LOG] Exibindo mensagem de erro ao desvincular plano");
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          "Erro ao desvinculer plano. Tente novamente.",
      });
      setTimeout(() => {
        console.log("[LOG] Limpando mensagem de erro ao desvincular plano");
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = students.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );
  const totalPages = Math.ceil(students.length / studentsPerPage);

  // Não é mais necessário controlar timeoutId

  return (
    <div className="w-full h-auto space-y-4">
      {/* Mensagem */}
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

      {/* Formulário de Busca */}
      <form onSubmit={handleSearch} className="w-full space-y-3">
        <input
          type="number"
          name="codigo"
          value={searchData.codigo}
          onChange={handleSearchChange}
          placeholder="Código do Aluno"
          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="text"
          name="cpf"
          value={searchData.cpf}
          onChange={handleCPFSearchChange}
          placeholder="CPF (000.000.000-00)"
          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <input
          type="text"
          name="nome"
          value={searchData.nome}
          onChange={handleSearchChange}
          placeholder="Nome do Aluno"
          className="w-full px-4 py-2 border-2 border-gray-400 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? "🔍 Buscando..." : "🔍 Buscar Alunos"}
        </button>
      </form>

      {/* Lista de Alunos e Painel de Planos */}
      {students.length > 0 && (
        <div className="w-full mt-6 space-y-4">
          {/* Resultados */}
          <div className="w-full">
            <h3 className="text-lg font-bold text-white mb-3">
              Alunos Encontrados ({students.length})
            </h3>

            <div className="space-y-2">
              {currentStudents.map((student) => (
                <div
                  key={student.Alunos_Codigo}
                  onClick={() => handleSelectStudent(student)}
                  className={`bg-gray-800 rounded-xl p-4 cursor-pointer transition-colors ${
                    selectedStudent?.Alunos_Codigo === student.Alunos_Codigo
                      ? "ring-2 ring-blue-600 bg-gray-700"
                      : "hover:bg-gray-700 active:bg-gray-600"
                  }`}
                >
                  <div className="space-y-1 text-sm md:text-base">
                    <p>
                      <span className="font-bold">Código:</span>{" "}
                      {student.Alunos_Codigo}
                    </p>
                    <p>
                      <span className="font-bold">Nome:</span>{" "}
                      {student.Alunos_Nome}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:bg-gray-600 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  ← Anterior
                </button>

                <span className="text-white">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:bg-gray-600 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>

          {/* Painel de Planos - Exibido quando aluno está selecionado */}
          {selectedStudent && (
            <div className="w-full bg-gray-800 rounded-xl p-4 space-y-4">
              <h3 className="text-lg font-bold text-white">
                📌 {selectedStudent.Alunos_Nome}
              </h3>

              {/* Formulário de Vinculação */}
              <form onSubmit={handleVincularPlano} className="space-y-3">
                <label className="block text-sm font-bold text-white">
                  Selecionar Plano para Vincular:
                </label>
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="flex-1 px-4 py-2 border-2 border-gray-400 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">-- Escolha um plano --</option>
                    {planos
                      .filter((plano) => plano.Plano_Ativo === "Ativo")
                      .map((plano) => (
                        <option
                          key={plano.Plano_Codigo}
                          value={plano.Plano_Codigo}
                        >
                          {`${plano.Plano_Codigo} - ${
                            plano.Plano_Nome
                          } - R$ ${parseFloat(plano.Plano_Valor).toFixed(2)}`}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={loading || !selectedPlan}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {loading ? "..." : "✔️ Vincular"}
                  </button>
                </div>
              </form>

              {/* Planos Vinculados */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-white">
                  Planos Vinculados:
                </h4>
                {studentPlans.length > 0 ? (
                  <div className="space-y-2">
                    {studentPlans.map((vínculo) => (
                      <div
                        key={vínculo.Alunos_Planos_ID}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg border-l-4 border-blue-500"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {vínculo.Plano?.Plano_Nome}
                          </p>
                          <p className="text-xs text-gray-300">
                            {vínculo.Plano?.Plano_Codigo} - R${" "}
                            {parseFloat(vínculo.Plano?.Plano_Valor).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleDesvincularPlano(vínculo.Alunos_Planos_ID)
                          }
                          disabled={loading}
                          className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                        >
                          ❌ Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Nenhum plano vinculado
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Estado inicial */}
      {students.length === 0 && !message.text && (
        <div className="w-full text-center py-12">
          <p className="text-gray-400 text-lg">
            🔍 Faça uma busca para começar a vincular planos aos alunos
          </p>
        </div>
      )}
    </div>
  );
}

export default StudentPlan;
