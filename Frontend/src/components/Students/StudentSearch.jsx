import React from "react";
import { useState } from "react";
import { formatarCPF } from "../../utils/utils";
import api from "../../services/api";
import StudentDetails from "./StudentDetails";
import StudentForm from "./StudentForm";

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
  const [isEditing, setIsEditing] = useState(false);
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

  const handleSelectAluno = async (aluno) => {
    // Sempre buscar os dados mais atualizados do aluno ao selecionar
    try {
      const response = await api.get(`/alunos/codigo/${aluno.Alunos_Codigo}`);
      if (response.data && response.data.Alunos_Codigo) {
        setSelectedAluno(response.data);
      } else {
        setSelectedAluno(aluno); // fallback
      }
    } catch (error) {
      setSelectedAluno(aluno); // fallback em caso de erro
    }
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
    if (selectedAluno && selectedAluno.Alunos_Situacao === "Inativo") {
      setMessage({
        type: "error",
        text: "Editar aluno inativo nao é permitido",
      });
      return;
    }
    setIsEditing(true);
  };

  const handleToggleSituacao = async () => {
    if (!selectedAluno) return;
    const novoStatus =
      selectedAluno.Alunos_Situacao === "Ativo" ? "Inativo" : "Ativo";
    try {
      const response = await api.patch(
        `/alunos/update/${selectedAluno.Alunos_Codigo}`,
        {
          Alunos_Situacao: novoStatus,
          usuario: localStorage.getItem("usuario") || "Sistema",
        }
      );
      if (response.data && response.data.statusCode === 200) {
        setSelectedAluno((prev) => ({
          ...prev,
          Alunos_Situacao: novoStatus,
        }));
        // Garante que a mensagem toast apareça mesmo se já houver uma mensagem anterior
        setMessage({});
        setTimeout(() => {
          setMessage({
            type: "success",
            text: `Aluno ${
              novoStatus === "Inativo" ? "desativado" : "ativado"
            } com sucesso!`,
          });
        }, 50);
      } else {
        setMessage({
          type: "error",
          text: response.data?.Mensagem || "Erro ao atualizar situação.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao atualizar situação do aluno." + error,
      });
    }
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
      const { codigo, cpf, nome } = searchData;
      let alunos = [];
      // Busca por prioridade: Código > CPF > Nome
      if (codigo && !cpf && !nome) {
        // Busca por código
        const response = await api.get(`/alunos/codigo/${codigo}`);
        if (response.data && response.data.Alunos_Codigo) {
          alunos = [response.data];
        } else if (response.data && response.data.statusCode === 404) {
          setMessage({ type: "error", text: "Aluno não encontrado." });
        } else {
          setMessage({ type: "error", text: "Aluno não encontrado." });
        }
      } else if (!codigo && cpf && !nome) {
        try {
          const response = await api.get(
            `/alunos/cpf/${encodeURIComponent(cpf)}`
          );
          if (response.data) {
            if (response.data.Aluno) {
              alunos = [response.data.Aluno];
            } else if (response.data.Alunos_Codigo) {
              alunos = [response.data];
            } else if (response.data.statusCode === 404) {
              setMessage({ type: "error", text: "Aluno não encontrado." });
            } else {
              setMessage({ type: "error", text: "Aluno não encontrado." });
            }
          } else {
            setMessage({ type: "error", text: "Aluno não encontrado." });
          }
        } catch (error) {
          if (error?.response?.status === 404) {
            setMessage({ type: "error", text: "Aluno não encontrado." });
          } else {
            setMessage({ type: "error", text: "Aluno não encontrado." });
          }
        }
      } else if (!codigo && !cpf && nome) {
        // Busca por nome
        try {
          const response = await api.get(
            `/alunos/nome/${encodeURIComponent(nome)}`
          );
          if (response.data && response.data.Listagem_de_Alunos) {
            alunos = response.data.Listagem_de_Alunos;
          } else if (response.data && response.data.statusCode === 404) {
            setMessage({ type: "error", text: "Aluno não encontrado." });
          } else {
            setMessage({ type: "error", text: "Aluno não encontrado." });
          }
        } catch (error) {
          setMessage({ type: "error", text: "Aluno não encontrado." });
        }
      } else if (
        (codigo && cpf) ||
        (codigo && nome) ||
        (cpf && nome) ||
        (codigo && cpf && nome)
      ) {
        // Busca combinada: OU (retorna todos que batem com qualquer critério)
        let promises = [];
        if (codigo) promises.push(api.get(`/alunos/codigo/${codigo}`));
        if (cpf) {
          promises.push(api.get(`/alunos/cpf/${encodeURIComponent(cpf)}`));
        }
        if (nome)
          promises.push(api.get(`/alunos/nome/${encodeURIComponent(nome)}`));
        const responses = await Promise.allSettled(promises);
        let tempAlunos = [];
        responses.forEach((res) => {
          if (res.status === "fulfilled" && res.value.data) {
            if (res.value.data.Alunos_Codigo) {
              tempAlunos.push(res.value.data);
            } else if (res.value.data.Aluno) {
              tempAlunos.push(res.value.data.Aluno);
            } else if (Array.isArray(res.value.data.Listagem_de_Alunos)) {
              tempAlunos = tempAlunos.concat(res.value.data.Listagem_de_Alunos);
            }
          }
        });
        // Remove duplicados pelo código do aluno
        const unique = {};
        tempAlunos.forEach((a) => {
          if (a.Alunos_Codigo) unique[a.Alunos_Codigo] = a;
        });
        alunos = Object.values(unique);
        if (alunos.length === 0) {
          setMessage({ type: "error", text: "Nenhum aluno encontrado." });
        }
      } else {
        // Nenhum campo: busca todos, paginado
        const response = await api.get("/alunos");
        alunos = response.data.Listagem_de_Alunos || [];
        // Paginação já é feita no front, mas limita exibição a 10 por página
      }

      // FILTRO DE SITUAÇÃO
      alunos = alunos.filter((a) => {
        if (mostrarInativos) {
          return a.Alunos_Situacao === "Inativo";
        } else {
          return a.Alunos_Situacao === "Ativo";
        }
      });

      if (alunos.length === 0) {
        setMessage({
          type: "error",
          text: mostrarInativos
            ? "Nenhum aluno inativo encontrado."
            : "Nenhum aluno ativo encontrado.",
        });
      } else {
        setMessage({
          type: "success",
          text: `Encontrado ${alunos.length} aluno(s) cadastrado(s)`,
        });
      }

      setResults(ordenarResultados(alunos, sortBy));
      setCurrentPage(1);
    } catch {
      setMessage({ type: "error", text: "Aluno não encontrado." });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  // Esconde a mensagem após 1,5s
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  return (
    <div className="w-full h-auto">
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto
            ${
              message.type === "success" && message.text.includes("desativado")
                ? "bg-orange-100 text-orange-700 border-2 border-orange-500"
                : message.type === "success"
                ? "bg-green-100 text-green-700 border-2 border-green-500"
                : "bg-red-100 text-red-700 border-2 border-red-500"
            }
          `}
        >
          {message.text}
        </div>
      )}
      {isEditing && selectedAluno ? (
        <StudentForm
          aluno={selectedAluno}
          onCancel={() => setIsEditing(false)}
          onSaveSuccess={(updatedAluno) => {
            setIsEditing(false);
            setSelectedAluno((prev) => ({ ...prev, ...updatedAluno }));
            setMessage({
              type: "success",
              text: "Alterações salvas com sucesso!",
            });
          }}
        />
      ) : selectedAluno ? (
        <StudentDetails
          aluno={selectedAluno}
          onEdit={handleEdit}
          onToggleSituacao={handleToggleSituacao}
          onBack={handleBackToSearch}
        />
      ) : (
        <div className="w-full">
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
                className="flex items-center bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-[15px]"
                style={{ fontWeight: 400, boxShadow: "none" }}
              >
                <span className="align-middle mr-1" style={{ fontSize: 17 }}>
                  🧹
                </span>
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
