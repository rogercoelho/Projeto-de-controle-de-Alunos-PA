import { useState, useEffect } from "react";
import api from "../services/api";

function Users() {
  return (
    <>
      <style>{`
        .menu-usuarios-branco { color: #fff !important; }
      `}</style>
      <ul className="flex flex-wrap gap-0">
        <li
          className="rounded-2xl p-2 border-2 border-gray-300 m-1"
          style={{
            background: "#8B0000", // dark red
            color: "#fff",
            fontWeight: 700,
            textShadow: "0 0 2px #000",
            border: "2px solid #fff",
            padding: "12px 16px",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            filter: "none",
            WebkitTextFillColor: "#fff",
            WebkitTextStroke: "0px #fff",
            mixBlendMode: "normal",
            opacity: 1,
          }}
        >
          Cadastrar Usuário
        </li>
        <li
          className="rounded-2xl p-2 border-2 border-gray-300 m-1"
          style={{
            background: "#8B0000",
            color: "#fff",
            fontWeight: 700,
            textShadow: "0 0 2px #000",
            border: "2px solid #fff",
            padding: "12px 16px",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            filter: "none",
            WebkitTextFillColor: "#fff",
            WebkitTextStroke: "0px #fff",
            mixBlendMode: "normal",
            opacity: 1,
          }}
        >
          Listar Usuários
        </li>
      </ul>
    </>
  );
}

function UserForm() {
  const [formData, setFormData] = useState({
    login: "",
    senha: "",
    nome: "",
    grupo: "Alunos",
    alunoId: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [alunos, setAlunos] = useState([]);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    setLoadingAlunos(true);
    try {
      const response = await api.get("/alunos/");
      setAlunos(response.data.Listagem_de_Alunos || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoadingAlunos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Se o campo alterado for grupo, limpa o campo nome
    if (name === "grupo") {
      setFormData((prev) => ({
        ...prev,
        grupo: value,
        nome: "",
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
      const response = await api.post("/auth/usuarios/create", formData);

      console.log("Resposta do servidor:", response.data);

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Usuário criado com sucesso!",
      });

      // Limpa a mensagem após 1.5 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);

      // Limpa o formulário após sucesso
      setFormData({
        login: "",
        senha: "",
        nome: "",
        grupo: "Alunos",
        alunoId: "",
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      console.error("Detalhes do erro:", error.response?.data);

      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          error.response?.data?.Erro ||
          "Erro ao criar usuário. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      login: "",
      senha: "",
      nome: "",
      grupo: "Alunos",
      alunoId: "",
    });
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="w-full h-auto">
      {/* Mensagem de feedback - Float no rodapé à direita */}
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
        className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          Cadastrar Novo Usuário
        </h3>

        {/* Login */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label>Login:</label>
          <input
            type="text"
            name="login"
            value={formData.login}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
            placeholder="usuario.login"
            required
          />
        </div>

        {/* Senha */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label>Senha:</label>
          <input
            type="password"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
            placeholder="Mínimo 6 caracteres"
            minLength="6"
            required
          />
        </div>

        {/* Nome Completo - muda conforme grupo */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label>Nome Completo:</label>
          {formData.grupo === "Alunos" ? (
            loadingAlunos ? (
              <p className="text-gray-400">Carregando alunos...</p>
            ) : (
              <select
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
                required
              >
                <option value="">Selecione o nome do aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.Alunos_Codigo} value={aluno.Alunos_Nome}>
                    {aluno.Alunos_Nome}
                  </option>
                ))}
              </select>
            )
          ) : (
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
              placeholder="Nome completo do usuário"
              required
            />
          )}
        </div>

        {/* Grupo */}
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label>Grupo de Acesso:</label>
          <select
            name="grupo"
            value={formData.grupo}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
            required
          >
            <option value="Alunos">👤 Alunos (Acesso Limitado)</option>
            <option value="Administrador">
              👑 Administrador (Acesso Total)
            </option>
          </select>
        </div>

        {/* Campo de seleção de aluno - só aparece se grupo = Alunos */}
        {formData.grupo === "Alunos" && (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
            <label>Vincular ao Aluno:</label>
            {loadingAlunos ? (
              <p className="text-gray-400">Carregando alunos...</p>
            ) : (
              <select
                name="alunoId"
                value={formData.alunoId}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
                required={formData.grupo === "Alunos"}
              >
                <option value="">Selecione um aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.Alunos_Codigo} value={aluno.Alunos_Codigo}>
                    {aluno.Alunos_Codigo} - {aluno.Alunos_Nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Informação sobre permissões */}
        <div className="bg-blue-900 bg-opacity-50 border border-blue-500 rounded-md p-3 text-sm">
          <p className="font-bold mb-2">ℹ️ Sobre os grupos:</p>
          <ul className="space-y-1 ml-4">
            <li>
              <strong>👤 Alunos:</strong> Podem apenas pesquisar informações de
              alunos. Requer vínculo com um aluno cadastrado.
            </li>
            <li>
              <strong>👑 Administrador:</strong> Acesso completo ao sistema
              (cadastrar, editar, gerenciar tudo). Não requer vínculo com aluno.
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Criando..." : "Criar Usuário"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Limpar
          </button>
        </div>
      </form>
    </div>
  );
}

function UserList() {
  const [usuarios, setUsuarios] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedUsuario, setSelectedUsuario] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    nome: "",
    grupo: "",
    ativo: true,
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [searchData, setSearchData] = useState({
    id: "",
    login: "",
    nome: "",
  });
  const [sortBy, setSortBy] = useState("id"); // "id", "login" ou "nome"

  // Removido o useEffect que carregava automaticamente
  // useEffect(() => {
  //   carregarUsuarios();
  // }, []);

  const carregarUsuarios = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.get("/auth/usuarios");
      const todosOsUsuarios = response.data.Usuarios || [];
      setTodosUsuarios(todosOsUsuarios);
      // NÃO carrega automaticamente na lista - só depois de pesquisar
      // setUsuarios(todosOsUsuarios);

      if (todosOsUsuarios.length === 0) {
        setMessage({
          type: "error",
          text: "Nenhum usuário encontrado no sistema.",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao carregar usuários. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    // Carrega os usuários do banco ao pesquisar
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.get("/auth/usuarios");
      const todosOsUsuarios = response.data.Usuarios || [];
      setTodosUsuarios(todosOsUsuarios);

      // Verifica se algum campo foi preenchido
      const temFiltro = searchData.id || searchData.login || searchData.nome;

      let resultadosFiltrados;

      if (!temFiltro) {
        // Se nenhum campo foi preenchido, retorna todos os usuários
        resultadosFiltrados = todosOsUsuarios;
      } else {
        // Filtra os usuários baseado nos critérios de pesquisa
        resultadosFiltrados = todosOsUsuarios.filter((usuario) => {
          const matchId = searchData.id
            ? usuario.Usuario_ID.toString().includes(searchData.id)
            : true;

          const matchLogin = searchData.login
            ? usuario.Usuario_Login.toLowerCase().includes(
                searchData.login.toLowerCase()
              )
            : true;

          const matchNome = searchData.nome
            ? usuario.Usuario_Nome.toLowerCase().includes(
                searchData.nome.toLowerCase()
              )
            : true;

          // Retorna true apenas se TODOS os campos preenchidos corresponderem
          return matchId && matchLogin && matchNome;
        });
      }

      if (resultadosFiltrados.length === 0) {
        setMessage({
          type: "error",
          text: "Nenhum usuário encontrado com os critérios informados.",
        });
        setUsuarios([]);
      } else {
        const resultadosOrdenados = ordenarResultados(
          resultadosFiltrados,
          sortBy
        );
        setUsuarios(resultadosOrdenados);
        setMessage({
          type: "success",
          text: temFiltro
            ? `${resultadosFiltrados.length} usuário(s) encontrado(s).`
            : `Listando todos os ${resultadosFiltrados.length} usuário(s) cadastrados.`,
        });

        // Limpa a mensagem após 1.5 segundos
        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 1500);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao carregar usuários. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  const ordenarResultados = (usuariosArray, criterio) => {
    const usuariosOrdenados = [...usuariosArray];
    if (criterio === "id") {
      return usuariosOrdenados.sort((a, b) => a.Usuario_ID - b.Usuario_ID);
    } else if (criterio === "login") {
      return usuariosOrdenados.sort((a, b) =>
        a.Usuario_Login.localeCompare(b.Usuario_Login)
      );
    } else if (criterio === "nome") {
      return usuariosOrdenados.sort((a, b) =>
        a.Usuario_Nome.localeCompare(b.Usuario_Nome)
      );
    }
    return usuariosOrdenados;
  };

  const handleSortChange = (novoCriterio) => {
    setSortBy(novoCriterio);
    const resultadosOrdenados = ordenarResultados(usuarios, novoCriterio);
    setUsuarios(resultadosOrdenados);
  };

  const handleClearSearch = () => {
    setSearchData({
      id: "",
      login: "",
      nome: "",
    });
    setUsuarios(todosUsuarios);
    setMessage({ type: "", text: "" });
  };

  const handleSelectUsuario = (usuario) => {
    setSelectedUsuario(usuario);
    setEditData({
      nome: usuario.Usuario_Nome,
      grupo: usuario.Usuario_Grupo,
      ativo: usuario.Usuario_Ativo,
      senha: "",
    });
    setEditMode(false);
    setMessage({ type: "", text: "" }); // Limpa mensagem ao abrir detalhes
  };

  const handleBackToList = () => {
    setSelectedUsuario(null);
    setEditMode(false);
    carregarUsuarios();
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.patch(
        `/auth/usuarios/update/${selectedUsuario.Usuario_ID}`,
        editData
      );

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Usuário atualizado com sucesso!",
      });

      // Limpa a mensagem após 1.5 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);

      // Atualiza os dados do usuário selecionado
      setSelectedUsuario({
        ...selectedUsuario,
        Usuario_Nome: editData.nome,
        Usuario_Grupo: editData.grupo,
        Usuario_Ativo: editData.ativo,
      });

      setEditMode(false);
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao atualizar usuário. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUsuario = async () => {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o usuário "${selectedUsuario.Usuario_Nome}"?\n\nEsta ação não pode ser desfeita!`
    );

    if (!confirmar) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.delete(
        `/auth/usuarios/delete/${selectedUsuario.Usuario_ID}`
      );

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Usuário excluído com sucesso!",
      });

      // Aguarda 1.5 segundos e volta para a lista
      setTimeout(() => {
        setLoading(false);
        handleBackToList();
      }, 1500);
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao excluir usuário. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-auto">
      {/* Se um usuário foi selecionado, mostra os detalhes */}
      {selectedUsuario ? (
        <div className="w-full h-auto">
          <button
            onClick={handleBackToList}
            className="mb-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            ← Voltar para Lista
          </button>

          <h3 className="text-xl font-bold text-white mb-4">
            {editMode ? "Editar Usuário" : "Detalhes do Usuário"}
          </h3>

          {/* Mensagem de feedback - Float no rodapé */}
          {message.text && (
            <div
              className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-md shadow-lg max-w-md w-full ${
                message.type === "success"
                  ? "bg-green-100 text-green-700 border-2 border-green-500"
                  : "bg-red-100 text-red-700 border-2 border-red-500"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto">
            {/* Login (não editável) */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label className="font-bold">Login:</label>
              <span className="text-gray-300">
                {selectedUsuario.Usuario_Login}
              </span>
            </div>

            {/* Nome Completo */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label className="font-bold">Nome Completo:</label>
              {editMode ? (
                <input
                  type="text"
                  name="nome"
                  value={editData.nome}
                  onChange={handleEditChange}
                  className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
                  required
                />
              ) : (
                <span>{selectedUsuario.Usuario_Nome}</span>
              )}
            </div>

            {/* Grupo */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label className="font-bold">Grupo de Acesso:</label>
              {editMode ? (
                <select
                  name="grupo"
                  value={editData.grupo}
                  onChange={handleEditChange}
                  className="border border-gray-300 rounded-md p-2 w-full text-black bg-white"
                  required
                >
                  <option value="Alunos">👤 Alunos (Acesso Limitado)</option>
                  <option value="Administrador">
                    👑 Administrador (Acesso Total)
                  </option>
                </select>
              ) : (
                <span>
                  {selectedUsuario.Usuario_Grupo === "Administrador"
                    ? "👑 Administrador"
                    : "👤 Alunos"}
                </span>
              )}
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label className="font-bold">Status:</label>
              {editMode ? (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="ativo"
                      checked={editData.ativo}
                      onChange={handleEditChange}
                      className="w-5 h-5"
                    />
                    <span>Usuário ativo</span>
                  </label>
                </div>
              ) : (
                <span>
                  {selectedUsuario.Usuario_Ativo ? (
                    <span className="text-green-400">✅ Ativo</span>
                  ) : (
                    <span className="text-red-400">❌ Inativo</span>
                  )}
                </span>
              )}
            </div>

            {/* Nova Senha (só aparece em modo de edição) */}
            {editMode && (
              <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                <label className="font-bold">Nova Senha:</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="senha"
                    value={editData.senha}
                    onChange={handleEditChange}
                    className="border border-gray-300 rounded-md p-2 w-full pr-10 text-black bg-white"
                    placeholder="Deixe em branco para não alterar"
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <div></div>
                <p className="text-sm text-gray-400">
                  Mínimo de 6 caracteres. Deixe em branco se não quiser alterar
                  a senha.
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex justify-center gap-4 pt-4">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Salvando..." : "💾 Salvar Alterações"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditData({
                        nome: selectedUsuario.Usuario_Nome,
                        grupo: selectedUsuario.Usuario_Grupo,
                        ativo: selectedUsuario.Usuario_Ativo,
                        senha: "",
                      });
                      setShowPassword(false);
                    }}
                    disabled={loading}
                    className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    ❌ Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditMode(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                  >
                    ✏️ Editar Usuário
                  </button>
                  <button
                    onClick={handleDeleteUsuario}
                    disabled={loading}
                    className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    🗑️ Excluir Usuário
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full">
          <h3 className="text-xl font-bold text-white mb-4">
            Pesquisar Usuários
          </h3>

          {/* Formulário de Pesquisa */}
          <form
            onSubmit={handleSearch}
            className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto mb-6 bg-gray-800 rounded-xl"
          >
            {/* ID */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label>ID:</label>
              <input
                type="number"
                name="id"
                value={searchData.id}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md p-2 w-full bg-white text-black"
                placeholder="Digite o ID"
              />
            </div>

            {/* Login */}
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
              <label>Login:</label>
              <input
                type="text"
                name="login"
                value={searchData.login}
                onChange={handleSearchChange}
                className="border border-gray-300 rounded-md p-2 w-full bg-white text-black"
                placeholder="Digite o login"
              />
            </div>

            {/* Nome */}
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

            {/* Botões */}
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

          {/* Mensagem de feedback - Float no rodapé à direita */}
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

          {/* Resultados */}
          {usuarios.length > 0 && (
            <div className="w-full mt-6">
              {/* Botões de ordenação - Desktop */}
              <div className="hidden md:flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  Resultados da Pesquisa
                </h3>

                <div className="flex gap-2">
                  <span className="text-white self-center mr-2">
                    Ordenar por:
                  </span>
                  <button
                    onClick={() => handleSortChange("id")}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortBy === "id"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    🔢 ID
                  </button>
                  <button
                    onClick={() => handleSortChange("login")}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      sortBy === "login"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    👤 Login
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

              {/* Botões de ordenação - Mobile */}
              <div className="md:hidden mb-4 space-y-3">
                <h3 className="text-lg font-bold text-white text-center">
                  Resultados da Pesquisa
                </h3>

                <div className="flex flex-col gap-2">
                  <span className="text-white text-sm text-center">
                    Ordenar por:
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortChange("id")}
                      className={`flex-1 px-3 py-2 rounded-md transition-colors text-sm ${
                        sortBy === "id"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      🔢 ID
                    </button>
                    <button
                      onClick={() => handleSortChange("login")}
                      className={`flex-1 px-3 py-2 rounded-md transition-colors text-sm ${
                        sortBy === "login"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      👤 Login
                    </button>
                    <button
                      onClick={() => handleSortChange("nome")}
                      className={`flex-1 px-3 py-2 rounded-md transition-colors text-sm ${
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
                {usuarios.map((usuario) => (
                  <div
                    key={usuario.Usuario_ID}
                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 active:bg-gray-600 cursor-pointer transition-colors"
                    onClick={() => handleSelectUsuario(usuario)}
                  >
                    <div className="space-y-1 text-sm md:text-base">
                      <p>
                        <span className="font-bold">Login:</span>{" "}
                        {usuario.Usuario_Login}
                      </p>
                      <p>
                        <span className="font-bold">Nome:</span>{" "}
                        {usuario.Usuario_Nome}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              onClick={carregarUsuarios}
              disabled={loading}
              className="bg-purple-600 text-white px-6 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              🔄 Recarregar Lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const UsersComponents = { Users, UserForm, UserList };
