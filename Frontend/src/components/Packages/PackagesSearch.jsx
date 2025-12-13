import api from "../../services/api";
import { useState } from "react";
import Buttons from "../miscellaneous/Buttons";
import PackagesDetails from "./PackagesDetails";
import PackagesEditForm from "./PackagesEditForm";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";

/* Componente de Pesquisa de Planos */
function PackagesSearch() {
  const [planos, setPlanos] = useState([]);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messageToast, showToast] = useToast();
  const [searchData, setSearchData] = useState({
    codigo: "",
    nome: "",
  });
  const [selectedPlano, setSelectedPlano] = useState(null);
  const [sortBy, setSortBy] = useState("codigo");
  const [currentPage, setCurrentPage] = useState(1);
  const planosPerPage = 10;
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    showToast({ type: "", text: "" });
    setCurrentPage(1);

    try {
      // Busca todos os planos
      const response = await api.get("/planos/");
      const todosPlanos = response.data.Planos || [];

      let resultadosFiltrados;

      // Se mostrarInativos está marcado, filtra apenas inativos; senão, apenas ativos
      resultadosFiltrados = todosPlanos.filter((plano) => {
        const matchCodigo = searchData.codigo
          ? (plano.Plano_Codigo || "")
              .toLowerCase()
              .includes(searchData.codigo.toLowerCase())
          : true;

        const matchNome = searchData.nome
          ? plano.Plano_Nome.toLowerCase().includes(
              searchData.nome.toLowerCase()
            )
          : true;

        const matchStatus = mostrarInativos
          ? plano.Plano_Ativo === "Inativo"
          : plano.Plano_Ativo === "Ativo";

        return matchCodigo && matchNome && matchStatus;
      });

      setPlanos(resultadosFiltrados);

      if (resultadosFiltrados.length === 0) {
        showToast({
          type: "error",
          text: "Nenhum plano encontrado.",
        });
      } else {
        showToast({
          type: "success",
          text: `${resultadosFiltrados.length} plano(s) encontrado(s).`,
        });
      }
    } catch (error) {
      console.error("Erro ao pesquisar planos:", error);
      // Se for erro 401, o interceptor global já trata
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Erro ao pesquisar planos. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchData({ codigo: "", nome: "" });
    setPlanos([]);
    showToast({ type: "", text: "" });
    setCurrentPage(1);
  };

  const handleBackToSearch = () => {
    setSelectedPlano(null);
    setIsEditing(false);
    showToast({ type: "", text: "" });
  };

  const sortPlanos = (planosArray) => {
    return [...planosArray].sort((a, b) => {
      if (sortBy === "codigo") {
        return (a.Plano_Codigo || "").localeCompare(b.Plano_Codigo || "");
      } else if (sortBy === "nome") {
        return a.Plano_Nome.localeCompare(b.Plano_Nome);
      }
      return 0;
    });
  };

  // Calcular planos da página atual
  const sortedPlanos = sortPlanos(planos);
  const indexOfLastPlano = currentPage * planosPerPage;
  const indexOfFirstPlano = indexOfLastPlano - planosPerPage;
  const currentPlanos = sortedPlanos.slice(indexOfFirstPlano, indexOfLastPlano);
  const totalPages = Math.ceil(sortedPlanos.length / planosPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleEdit = () => {
    console.log("🔧 handleEdit chamado - isEditing será true");
    setIsEditing(true);
    setEditFormData({ ...selectedPlano });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    showToast({ type: "", text: "" });

    const dados = {
      Plano_Nome: editFormData.Plano_Nome,
      Plano_Quantidade_Semana: editFormData.Plano_Quantidade_Semana,
      Plano_Pagamento: editFormData.Plano_Pagamento,
      Plano_Valor: editFormData.Plano_Valor,
      Plano_Ativo: editFormData.Plano_Ativo,
    };

    console.log("📤 Dados sendo enviados:", dados);
    console.log("📤 URL:", `/planos/update/${selectedPlano.Plano_Codigo}`);

    try {
      const response = await api.patch(
        `/planos/update/${selectedPlano.Plano_Codigo}`,
        dados
      );

      console.log("✅ Resposta da API:", response.data);

      showToast({
        type: "success",
        text: response.data.Mensagem || "Plano atualizado com sucesso!",
      });
      // Atualiza os dados do plano selecionado
      setSelectedPlano(
        response.data.Plano_Atualizado || {
          ...selectedPlano,
          ...editFormData,
        }
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      // Se for erro 401, o interceptor global já trata
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Erro ao atualizar plano. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    try {
      const novoStatus =
        selectedPlano.Plano_Ativo === "Ativo" ? "Inativo" : "Ativo";
      showToast({ type: "", text: "" });
      const response = await api.patch(
        `/planos/update/${selectedPlano.Plano_Codigo}`,
        { ativo: novoStatus }
      );
      setSelectedPlano({
        ...selectedPlano,
        Plano_Ativo: novoStatus,
      });
      showToast({
        type: "success",
        text:
          response.data.Mensagem ||
          (novoStatus === "Ativo"
            ? "Plano ativado com sucesso!"
            : "Plano desativado com sucesso!"),
      });
    } catch (error) {
      // Se for erro 401, o interceptor global já trata
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro || "Erro ao atualizar status do plano.",
        });
      }
    }
  };

  return (
    <div className="w-full h-auto">
      <MessageToast messageToast={messageToast} />

      {selectedPlano ? (
        isEditing ? (
          <PackagesEditForm
            editFormData={editFormData}
            loading={loading}
            onSave={handleUpdateSubmit}
            onChangeEdit={handleEditChange}
            onCancel={handleCancelEdit}
          />
        ) : (
          <PackagesDetails
            plano={selectedPlano}
            onEdit={handleEdit}
            onToggleStatus={handleToggleStatus}
            onBack={handleBackToSearch}
          />
        )
      ) : (
        <div className="w-full">
          <h2 className="text-2xl font-bold text-white mb-6">
            Pesquisar Planos
          </h2>

          {/* Formulário de Pesquisa */}
          <form
            onSubmit={handleSearch}
            className="bg-gray-800 rounded-xl p-6 space-y-4 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Plano
                </label>
                <input
                  type="text"
                  value={searchData.codigo}
                  onChange={(e) =>
                    setSearchData({ ...searchData, codigo: e.target.value })
                  }
                  placeholder="Ex: PLAN001"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={searchData.nome}
                  onChange={(e) =>
                    setSearchData({ ...searchData, nome: e.target.value })
                  }
                  placeholder="Ex: Plano Básico"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <label className="flex items-center text-gray-300 text-sm">
                <input
                  type="checkbox"
                  checked={mostrarInativos}
                  onChange={(e) => setMostrarInativos(e.target.checked)}
                  className="mr-2 accent-blue-600"
                />
                Mostrar apenas planos inativos
              </label>
            </div>

            <div className="flex gap-4">
              <Buttons.BotaoPesquisar
                type="submit"
                loading={loading}
                disabled={loading}
              >
                Pesquisar Plano
              </Buttons.BotaoPesquisar>
              <Buttons.BotaoLimpar onClick={handleClear} />
            </div>
          </form>

          {/* Resultados da pesquisa */}
          {planos.length > 0 && (
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Resultados ({planos.length})
                </h3>
                <Buttons.SelectOrdenacao
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={[
                    { value: "codigo", label: "Código" },
                    { value: "nome", label: "Nome" },
                  ]}
                />
              </div>

              <div className="space-y-2">
                {currentPlanos.map((plano) => (
                  <div
                    key={plano.Plano_Codigo}
                    onClick={() => setSelectedPlano(plano)}
                    className="flex justify-between items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <div>
                      <span className="text-white font-medium">
                        {plano.Plano_Nome}
                      </span>
                      <span className="text-slate-400 text-sm ml-2">
                        ({plano.Plano_Codigo})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-300 text-sm">
                        R$ {parseFloat(plano.Plano_Valor).toFixed(2)}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          plano.Plano_Ativo === "Ativo"
                            ? "bg-green-600 text-white"
                            : "bg-orange-600 text-white"
                        }`}
                      >
                        {plano.Plano_Ativo}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Buttons.BotaoPaginacaoAnterior
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  <span className="text-gray-400">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Buttons.BotaoPaginacaoProxima
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PackagesSearch;
