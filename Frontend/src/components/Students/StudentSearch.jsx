import { useState } from "react";
import { formatarCPF } from "./studentUtils";
import api from "../../services/api";
import StudentDetails from "./StudentDetails";

function StudentSearch() {
  const [searchData, setSearchData] = useState({
    codigo: "",
    cpf: "",
    nome: "",
  });
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [sortBy, setSortBy] = useState("codigo");
  const [currentPage, setCurrentPage] = useState(1);
  const alunosPerPage = 10;

  // Ordenação
  const ordenarResultados = (alunos, criterio) => {
    if (criterio === "codigo") {
      return [...alunos].sort((a, b) => a.Alunos_Codigo - b.Alunos_Codigo);
    } else {
      return [...alunos].sort((a, b) =>
        a.Alunos_Nome.localeCompare(b.Alunos_Nome)
      );
    }
  };

  // Paginação
  const indexOfLastAluno = currentPage * alunosPerPage;
  const indexOfFirstAluno = indexOfLastAluno - alunosPerPage;
  const currentAlunos = results.slice(indexOfFirstAluno, indexOfLastAluno);
  const totalPages = Math.ceil(results.length / alunosPerPage);

  // Handlers
  const handleSortChange = (novoCriterio) => {
    setSortBy(novoCriterio);
    setResults(ordenarResultados(results, novoCriterio));
  };

  const handleClearSearch = () => {
    setSearchData({ codigo: "", cpf: "", nome: "" });
    setResults([]);
    setMessage({ type: "", text: "" });
    setCurrentPage(1);
  };

  const handleSelectAluno = (aluno) => {
    setSelectedAluno(aluno);
    //setIsEditing(false);
    // setEditFormData(aluno);
    // setArquivosEdit({ foto: null, contrato: null });
  };

  const handleBackToSearch = () => {
    setSelectedAluno(null);
    //setIsEditing(false);
    // setArquivosEdit({ foto: null, contrato: null });
    // setEditFormData({});
  };

  const handleEdit = () => {
    //setIsEditing(true);
  };

  const handleToggleSituacao = async () => {
    // Aqui ficaria a chamada para ativar/desativar aluno na API
    setMessage({ type: "success", text: "Situação do aluno alterada!" });
    // Atualização local simulada
    setSelectedAluno((prev) => ({
      ...prev,
      Alunos_Situacao: prev.Alunos_Situacao === "Ativo" ? "Inativo" : "Ativo",
    }));
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCPFSearchChange = (e) => {
    const { value } = e.target;
    setSearchData((prev) => ({ ...prev, cpf: formatarCPF(value) }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      // Monta os filtros como query params
      const params = {};
      if (searchData.codigo) params.Alunos_Codigo = searchData.codigo;
      if (searchData.cpf) params.Alunos_CPF = searchData.cpf.replace(/\D/g, "");
      if (searchData.nome) params.Alunos_Nome = searchData.nome;
      // Chama a API de alunos
      const response = await api.get("/alunos", { params });
      let alunos = response.data.Listagem_de_Alunos || [];
      if (!Array.isArray(alunos)) alunos = [];
      if (alunos.length === 0) {
        setMessage({ type: "error", text: "Nenhum aluno encontrado." });
      }
      setResults(ordenarResultados(alunos, sortBy));
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao buscar alunos." + error });
      setResults([]);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  return (
    <div className="w-full h-auto">
      {selectedAluno ? (
        <StudentDetails
          aluno={selectedAluno}
          onEdit={handleEdit}
          onToggleSituacao={handleToggleSituacao}
          onBack={handleBackToSearch}
        />
      ) : (
        <div className="w-full">
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
            onSubmit={handleSearch}
            className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Pesquisar Aluno
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label>Código:</label>
              <input
                type="number"
                name="codigo"
                value={searchData.codigo}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Digite o código"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label>CPF:</label>
              <input
                type="text"
                name="cpf"
                value={searchData.cpf}
                onChange={handleCPFSearchChange}
                className="border border-gray-300 rounded-md p-2 w-full bg-white text-black"
                placeholder="000.000.000-00"
                maxLength="14"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label>Nome:</label>
              <input
                type="text"
                name="nome"
                value={searchData.nome}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md p-2 w-full bg-white text-black"
                placeholder="Digite o nome"
              />
            </div>
            <div className="flex items-center gap-3 pl-0 md:pl-52">
              <input
                type="checkbox"
                id="mostrarInativos"
                checked={mostrarInativos}
                onChange={(e) => setMostrarInativos(e.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <label
                htmlFor="mostrarInativos"
                className="cursor-pointer text-white"
              >
                Mostrar apenas alunos inativos
              </label>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Pesquisando..." : "Pesquisar"}
              </button>
              <button
                type="button"
                onClick={handleClearSearch}
                disabled={loading}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Limpar
              </button>
            </div>
          </form>
          {results.length > 0 && (
            <div className="w-full mt-6">
              <div className="hidden md:flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Resultados ({results.length} alunos)
                </h3>
                <div className="flex gap-2">
                  <span className="text-white self-center mr-2">
                    Ordenar por:
                  </span>
                  <button
                    onClick={() => handleSortChange("codigo")}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortBy === "codigo"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    🔢 Código
                  </button>
                  <button
                    onClick={() => handleSortChange("nome")}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortBy === "nome"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    🔤 Nome
                  </button>
                </div>
              </div>
              <div className="md:hidden mb-4 space-y-3">
                <h3 className="text-lg font-bold text-white text-center">
                  Resultados ({results.length} alunos)
                </h3>
                <div className="flex flex-col gap-2">
                  <span className="text-white text-sm text-center">
                    Ordenar por:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortChange("codigo")}
                      className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm ${
                        sortBy === "codigo"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      🔢 Código
                    </button>
                    <button
                      onClick={() => handleSortChange("nome")}
                      className={`flex-1 px-4 py-2 rounded-md transition-colors text-sm ${
                        sortBy === "nome"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      🔤 Nome
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {currentAlunos.map((aluno) => (
                  <div
                    key={aluno.Alunos_Codigo}
                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 active:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => handleSelectAluno(aluno)}
                  >
                    <div className="space-y-1 text-sm md:text-base">
                      <p>
                        <span className="font-bold">Código do Aluno:</span>{" "}
                        {aluno.Alunos_Codigo}
                      </p>
                      <p>
                        <span className="font-bold">Nome Completo:</span>{" "}
                        {aluno.Alunos_Nome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:bg-gray-600 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    ← Anterior
                  </button>
                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(index + 1)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === index + 1
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 text-white rounded-md disabled:bg-gray-600 disabled:opacity-50 hover:bg-gray-600 transition-colors"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default StudentSearch;
