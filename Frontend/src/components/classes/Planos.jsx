import { useState } from "react";
import api from "../../services/api";

// Componente de Cadastro de Plano
function PlanoForm() {
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    quantidadeSemana: "",
    tipoPagamento: "",
    valor: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Se for o campo código, valida para aceitar apenas números e letras em caixa alta
    if (name === "codigo") {
      const codigoFormatado = value
        .toUpperCase() // Converte para caixa alta
        .replace(/[^A-Z0-9]/g, ""); // Remove tudo que não é letra ou número

      setFormData((prev) => ({
        ...prev,
        [name]: codigoFormatado,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.post("/planos/create", {
        codigo: formData.codigo,
        nome: formData.nome,
        quantidadeSemana: formData.quantidadeSemana,
        tipoPagamento: formData.tipoPagamento,
        valor: formData.valor,
      });

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Plano cadastrado com sucesso!",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      // Limpa o formulário
      setFormData({
        codigo: "",
        nome: "",
        quantidadeSemana: "",
        tipoPagamento: "",
        valor: "",
      });
    } catch (error) {
      console.error("Erro ao cadastrar plano:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Erro ||
          "Erro ao cadastrar plano. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      codigo: "",
      nome: "",
      quantidadeSemana: "",
      tipoPagamento: "",
      valor: "",
    });
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="w-full h-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Cadastrar Plano</h2>

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

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-6 space-y-4"
      >
        {/* Código do Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Plano *
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            maxLength={20}
            placeholder="Ex: PLAN001"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Nome do Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Plano *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="Ex: Plano Básico"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quantidade Por Semana */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantidade Por Semana *
          </label>
          <input
            type="number"
            name="quantidadeSemana"
            value={formData.quantidadeSemana}
            onChange={handleChange}
            required
            min="1"
            max="7"
            placeholder="Ex: 2"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Tipo de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Pagamento *
          </label>
          <select
            name="tipoPagamento"
            value={formData.tipoPagamento}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione...</option>
            <option value="Mensal">Mensal</option>
            <option value="Trimestral">Trimestral</option>
            <option value="Semestral">Semestral</option>
            <option value="Anual">Anual</option>
          </select>
        </div>

        {/* Valor do Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Valor do Plano (R$) *
          </label>
          <input
            type="number"
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Ex: 150.00"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            {loading ? "Cadastrando..." : "Cadastrar Plano"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}

// Componente de Pesquisa de Planos
function PlanoSearch() {
  const [planos, setPlanos] = useState([]);
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
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
    setMessage({ type: "", text: "" });
    setCurrentPage(1);

    try {
      // Busca todos os planos
      const response = await api.get("/planos/");
      const todosPlanos = response.data.Planos || [];

      // ...

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
        setMessage({
          type: "error",
          text: "Nenhum plano encontrado.",
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 1500);
      } else {
        setMessage({
          type: "success",
          text: `${resultadosFiltrados.length} plano(s) encontrado(s).`,
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 1500);
      }
    } catch (error) {
      console.error("Erro ao pesquisar planos:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Erro ||
          "Erro ao pesquisar planos. Tente novamente.",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchData({ codigo: "", nome: "" });
    setPlanos([]);
    setMessage({ type: "", text: "" });
    setCurrentPage(1);
  };

  const handleSelectPlano = (plano) => {
    setSelectedPlano(plano);
    setMessage({ type: "", text: "" });
  };

  const handleBackToSearch = () => {
    setSelectedPlano(null);
    setMessage({ type: "", text: "" });
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
    setMessage({ type: "", text: "" });

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

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Plano atualizado com sucesso!",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
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
      setMessage({
        type: "error",
        text:
          error.response?.data?.Erro ||
          "Erro ao atualizar plano. Tente novamente.",
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
      {selectedPlano ? (
        <div className="w-full h-auto">
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleBackToSearch}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
            >
              ← Voltar para Pesquisa
            </button>
            {!isEditing && (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const novoStatus =
                        selectedPlano.Plano_Ativo === "Ativo"
                          ? "Inativo"
                          : "Ativo";
                      setMessage({ type: "", text: "" });
                      const response = await api.patch(
                        `/planos/update/${selectedPlano.Plano_Codigo}`,
                        { ativo: novoStatus }
                      );
                      setSelectedPlano({
                        ...selectedPlano,
                        Plano_Ativo: novoStatus,
                      });
                      setMessage({
                        type: "success",
                        text:
                          response.data.Mensagem ||
                          (novoStatus === "Ativo"
                            ? "Plano ativado com sucesso!"
                            : "Plano desativado com sucesso!"),
                      });
                      setTimeout(
                        () => setMessage({ type: "", text: "" }),
                        1500
                      );
                    } catch (error) {
                      setMessage({
                        type: "error",
                        text:
                          error.response?.data?.Erro ||
                          "Erro ao atualizar status do plano.",
                      });
                      setTimeout(
                        () => setMessage({ type: "", text: "" }),
                        1500
                      );
                    }
                  }}
                  className={`px-4 py-2 rounded-md text-white transition-colors focus:outline-none ${
                    selectedPlano.Plano_Ativo === "Ativo"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {selectedPlano.Plano_Ativo === "Ativo"
                    ? "Desativar"
                    : "Ativar"}
                </button>
              </>
            )}
          </div>

          <h3 className="text-xl font-bold text-white mb-4">
            {isEditing ? "Editar Plano" : "Detalhes do Plano"}
          </h3>

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

          {isEditing ? (
            /* FORMULÁRIO DE EDIÇÃO */
            <form
              onSubmit={handleUpdateSubmit}
              className="bg-gray-800 rounded-xl p-6 space-y-4"
            >
              {/* Código do Plano (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Plano
                </label>
                <input
                  type="text"
                  value={editFormData.Plano_Codigo || ""}
                  className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
                  readOnly
                />
              </div>

              {/* Nome do Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  name="Plano_Nome"
                  value={editFormData.Plano_Nome || ""}
                  onChange={handleEditChange}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Quantidade Por Semana */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Quantidade Por Semana *
                </label>
                <input
                  type="number"
                  name="Plano_Quantidade_Semana"
                  value={editFormData.Plano_Quantidade_Semana || ""}
                  onChange={handleEditChange}
                  required
                  min="1"
                  max="7"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tipo de Pagamento *
                </label>
                <select
                  name="Plano_Pagamento"
                  value={editFormData.Plano_Pagamento || ""}
                  onChange={handleEditChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>

              {/* Valor do Plano */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Valor do Plano (R$) *
                </label>
                <input
                  type="number"
                  name="Plano_Valor"
                  value={editFormData.Plano_Valor || ""}
                  onChange={handleEditChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status *
                </label>
                <select
                  name="Plano_Ativo"
                  value={editFormData.Plano_Ativo || ""}
                  onChange={handleEditChange}
                  required
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
                >
                  {loading ? "Salvando..." : "💾 Salvar Alterações"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          ) : (
            /* VISUALIZAÇÃO DE DETALHES */
            <div className="space-y-4">
              {/* Card único com todos os detalhes */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Código:</div>
                  <div>{selectedPlano.Plano_Codigo}</div>
                </div>

                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Nome do Plano:</div>
                  <div>{selectedPlano.Plano_Nome}</div>
                </div>

                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Quantidade por Semana:
                  </div>
                  <div>{selectedPlano.Plano_Quantidade_Semana}x por semana</div>
                </div>

                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Tipo de Pagamento:
                  </div>
                  <div>{selectedPlano.Plano_Pagamento}</div>
                </div>

                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Valor:</div>
                  <div>
                    R$ {parseFloat(selectedPlano.Plano_Valor).toFixed(2)}
                  </div>
                </div>

                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Status:</div>
                  <div
                    className={`font-semibold ${
                      selectedPlano.Plano_Ativo === "Ativo"
                        ? "text-green-400"
                        : "text-orange-400"
                    }`}
                  >
                    {selectedPlano.Plano_Ativo}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
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
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors"
              >
                {loading ? "Pesquisando..." : "Pesquisar"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Limpar
              </button>
            </div>
          </form>

          {/* Resultados da Pesquisa */}
          {planos.length > 0 && (
            <div>
              {/* Header com ordenação - Mobile e Desktop */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
                <h3 className="text-xl font-bold text-white text-center md:text-left">
                  Resultados ({sortedPlanos.length} planos)
                </h3>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <label className="text-sm text-gray-300">Ordenar por:</label>
                  <div className="flex gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setSortBy("codigo")}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        sortBy === "codigo"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Código
                    </button>
                    <button
                      onClick={() => setSortBy("nome")}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        sortBy === "nome"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      Nome
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de Planos */}
              <div className="space-y-3">
                {currentPlanos.map((plano) => (
                  <div
                    key={plano.Plano_Codigo}
                    onClick={() => handleSelectPlano(plano)}
                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 active:bg-gray-600 cursor-pointer transition-colors space-y-1"
                  >
                    <p className="text-sm md:text-base">
                      <span className="font-bold">Nome:</span>{" "}
                      {plano.Plano_Nome}
                    </p>
                    <p className="text-sm md:text-base">
                      <span className="font-bold">Código:</span>{" "}
                      {plano.Plano_Codigo}
                    </p>
                    <p className="text-sm md:text-base">
                      <span className="font-bold">Valor:</span> R${" "}
                      {parseFloat(plano.Plano_Valor).toFixed(2)}
                    </p>
                    <p className="text-sm md:text-base">
                      <span className="font-bold">Status:</span>{" "}
                      <span
                        className={`font-semibold ${
                          plano.Plano_Ativo === "Ativo"
                            ? "text-green-400"
                            : "text-orange-400"
                        }`}
                      >
                        {plano.Plano_Ativo}
                      </span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Paginação */}
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
                    {[...Array(totalPages)].map((_, index) => {
                      const pageNumber = index + 1;
                      // Mostrar apenas algumas páginas próximas
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 &&
                          pageNumber <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`px-3 py-2 rounded-md transition-colors ${
                              currentPage === pageNumber
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2
                      ) {
                        return (
                          <span key={pageNumber} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
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

export { PlanoForm, PlanoSearch };

export default { PlanoForm, PlanoSearch };
