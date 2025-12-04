import React from "react";
import { useState } from "react";
import api from "../../services/api";
import { formatarCPF } from "../../utils/Utils";
import StudentDetails from "./StudentDetails";
//import StudentForm from "./StudentForm";
import StudentEditForm from "./StudentEditForm";
import MessageToast from "../miscellaneous/MessageToast";
import { Buttons } from "../miscellaneous/Buttons";

/* ===== Inicio da Função StudentSearch */

/* Cria variavel constante do objeto searchData e a função setSearchData, recebe o useState
   setando codigo, cpf e nome como vazios */
function StudentSearch() {
  const [searchData, setSearchData] = useState({
    codigo: "",
    cpf: "",
    nome: "",
  });

  /* Cria as variaveis constantes para controlar o estado do componente. 
     mostrarInativos para controlar se alunos inativos devem ser exibidos.
     results para armazenar os resultados da busca
     loading para indicar se a busca está em andamento
     message para armazenar mensagens de feedback
     selectedAluno para armazenar o aluno selecionado
     isEditing para controlar se o modo de edição está ativo
     sortBy para controlar o critério de ordenação
     currentPage para controlar a página atual na paginação
     alunosPerPage para controlar a quantidade de alunos por página */
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [sortBy, setSortBy] = useState("codigo");
  const [currentPage, setCurrentPage] = useState(1);
  const alunosPerPage = 10;

  /* Função para ordenar os resultados com base no critério selecionado
     Cria uma variavel constante (ordenarResultados) que recebe 2 parametros:
     alunos e criterio. Se o criterio for igual a "codigo" entao retorna o 
     conteudo de parametro alunos ordenado pelo codigo. Se o codigo do aluno A
     for menor que o codigo do aluno B, entao A vem antes de B na ordenação e vice versa.
     Senao retorna o conteudo do parametro alunos ordenado pelo nome usando a funcao
     localeCompare */
  const ordenarResultados = (alunos, criterio) => {
    if (criterio === "codigo") {
      return [...alunos].sort((a, b) => a.Alunos_Codigo - b.Alunos_Codigo);
    } else {
      return [...alunos].sort((a, b) =>
        a.Alunos_Nome.localeCompare(b.Alunos_Nome)
      );
    }
  };

  /* Função para calcular os índices para paginação e os alunos atuais a serem exibidos
     Cria uma variavel constante (indexOfLastAluno) que representa o índice do último
     aluno a ser exibido na página atual. Ele recebe currentPage multiplicado por alunosPerPage.
     A variavel indexOfFirstAluno representa o índice do primeiro aluno a ser exibido na 
     página atual. Ele recebe indexOfLastAluno menos alunosPerPage.
     A variavel currentAlunos representa os alunos que serão exibidos na página atual,
     obtidos a partir do array results usando slice para dividir o array, utilizando os
     indices indexOfFirstAluno e indexOfLastAluno.
      A variavel totalPages representa o número total de páginas, calculado dividindo. Ele
      recebe o tamanho do array results dividido por alunosPerPage e arredondando para cima.
  */
  const indexOfLastAluno = currentPage * alunosPerPage;
  const indexOfFirstAluno = indexOfLastAluno - alunosPerPage;
  const currentAlunos = results.slice(indexOfFirstAluno, indexOfLastAluno);
  const totalPages = Math.ceil(results.length / alunosPerPage);

  /* Funcao que cotrola a mudança do critério de ordenação. 
     Cria uma variavel constante (handleSortChange) que recebe um parametro novoCriterio.
     Ele usa a função setSortBy para atualizar o estado de sortBy com o novo critério.
     O setResults usa a função ordenarResultados para atualizar os resultados com base no
     results e novoCriterio */
  const handleSortChange = (novoCriterio) => {
    setSortBy(novoCriterio);
    setResults(ordenarResultados(results, novoCriterio));
  };

  /* Funcao para limpar os campos de busca e resultados
     Cria uma variavel constante (handleClearSearch) que limpa os dados de busca,
     resultados, mensagens e reseta a pagina atual */
  const handleClearSearch = () => {
    setSearchData({ codigo: "", cpf: "", nome: "" });
    setResults([]);
    setMessage({ type: "", text: "" });
    setCurrentPage(1);
  };

  /* Funcao para selecionar um aluno e buscar seus dados mais atualizados
     Cria uma variavel constante (handleSelectAluno) que recebe um parametro assincrono aluno.
     Ele faz uma requisição usando o try. Cria uma variavel constante (response) que aguarda o
     recebimento da resposta da API, buscando o aluno pelo código.
     Se os dados de response.data e response.data.Alunos_Codigo existirem, ele usa a função
     setSelectedAluno trazendo os dados de response.data.
     Caso contrário, usa os dados do aluno que estava em memoria como alternativa caso a
     requisição falhe.
     Em caso de erro na requisição, também usa os dados do aluno passado como fallback e mais
     a mensagem de erro. */
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
      setSelectedAluno(aluno + error); // fallback em caso de erro
    }
  };

  /* Funcao para voltar para a tela de busca
     Cria a variavel constante (handleBackToSearch) que reseta o estado 
     selectedAluno para null */
  const handleBackToSearch = () => {
    setSelectedAluno(null);
  };

  /* Funcao para iniciar a edição de um aluno
     Cria a variavel constante (handleEdit) que verifica se o aluno selecionado está inativo.
     Se estiver, exibe uma mensagem de erro. Caso contrário, ativa o modo de edição (true). */
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

  /* Funcao para alternar a situação do aluno entre Ativo e Inativo.
     Cria uma variavel constante (handleToggleSituacao) que verifica se há um aluno selecionado.
     Se nao tiver retorna. Se tiver, cria a variavel constante novoStatus que recebe o aluno
     selecionado e alterna o campo Alunos_Situacao entre "Ativo" e "Inativo".
     Em seguida faz um try, criando uma variavel constante (response) que aguarda a resposta
     da atualizacao da API. O novoStatus é repassado para Alunos_Situacao. O usuario é
     registrado na atualização. */
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
      /* Se response.data tiver dados e response.data.statusCode for 200, entao traz o conteudo
         de response.data e usa o setSelectedAluno para atualizar o estado repassando o 
         conteudo de prev e atualizando o campo Alunos_Situacao com o novoStatus. Em seguida
         exibe uma mensagem de sucesso mostrando o status atualizado. */
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
        /* Caso contrário, exibe uma mensagem de erro com a mensagem retornada pela API ou 
           uma mensagem padrão */
      } else {
        setMessage({
          type: "error",
          text: response.data?.Mensagem || "Erro ao atualizar situação.",
        });
      }
      /* A mesma coisa com o Catch. Mostra a mensagem de erro caso ocorra um problema na 
        requisição */
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao atualizar situação do aluno." + error,
      });
    }
  };

  /* Funcao para mudar a página atual na paginação */
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  /* Funcao para atualizar os dados de busca conforme o usuário digita. Burca pelo nome */
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchData((prev) => ({ ...prev, [name]: value }));
  };

  /* Funcao para atualizar os dados de busca conforme o usuário digita. Burca pelo CPF */
  const handleCPFSearchChange = (e) => {
    const { value } = e.target;
    setSearchData((prev) => ({ ...prev, cpf: formatarCPF(value) }));
  };

  /* Função assíncrona para realizar a busca dos alunos com base nos critérios fornecidos.
     faz o preventDefault para evitar o comportamento padrão do formulário
     coloca o setLoading como true para indicar que a busca está em andamento
     limpa a mensagem de status do setMessage */
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    /* Faz a tentativa de buscar os alunos com base nos critérios fornecidos. */
    try {
      const { codigo, cpf, nome } = searchData;
      let alunos = [];
      /* Busca por prioridade: Código > CPF > Nome */
      if (codigo && !cpf && !nome) {
        /* Busca por código */
        const response = await api.get(`/alunos/codigo/${codigo}`);
        if (response.data && response.data.Alunos_Codigo) {
          alunos = [response.data];
        } else if (response.data && response.data.statusCode === 404) {
          setMessage({ type: "error", text: "Aluno não encontrado." });
        } else {
          setMessage({ type: "error", text: "Aluno não encontrado." });
        }
        /* busca por CPF */
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
        /* busca por nome */
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
          setMessage({ type: "error", text: "Aluno não encontrado." + error });
        }
        /* Busca combinada: E (retorna apenas os que batem com todos os critérios) */
      } else if (
        (codigo && cpf) ||
        (codigo && nome) ||
        (cpf && nome) ||
        (codigo && cpf && nome)
      ) {
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
        /* Remove duplicados pelo código do aluno */
        const unique = {};
        tempAlunos.forEach((a) => {
          if (a.Alunos_Codigo) unique[a.Alunos_Codigo] = a;
        });
        alunos = Object.values(unique);
        if (alunos.length === 0) {
          setMessage({ type: "error", text: "Nenhum aluno encontrado." });
        }
        /* Caso nenhum critério seja fornecido, busca todos os alunos, paginado */
      } else {
        const response = await api.get("/alunos");
        alunos = response.data.Listagem_de_Alunos || [];
      }

      /* Filtra por situação Apenas alunos ativos ou inativos */
      alunos = alunos.filter((a) => {
        if (mostrarInativos) {
          return a.Alunos_Situacao === "Inativo";
        } else {
          return a.Alunos_Situacao === "Ativo";
        }
      });

      /* Se nao tiver aluno inativo ou ativo mostra a mensagem */
      if (alunos.length === 0) {
        setMessage({
          type: "error",
          text: mostrarInativos
            ? "Nenhum aluno inativo encontrado."
            : "Nenhum aluno ativo encontrado.",
        });
        /* Caso contrario mostra a mensagem de quantos alunos encontrou */
      } else {
        setMessage({
          type: "success",
          text: `Encontrado ${alunos.length} aluno(s) cadastrado(s)`,
        });
      }
      setResults(ordenarResultados(alunos, sortBy));
      setCurrentPage(1);
    } catch {
      /* Caso de erro na busca mostra a mensagem */
      setMessage({ type: "error", text: "Aluno não encontrado." });
      setResults([]);
    } finally {
      /* e o bloco finally coloca o setLoading(false) para finalizar a busca */
      setLoading(false);
    }
  };
  /* Esconde a mensagem após 1,5s */
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [message.text]);

  /* Inicio - Retorna as informacoes na tela. */
  return (
    <div className="w-full h-auto">
      {/* Chama a função MessageToast para exibir mensagens padronizadas */}
      <MessageToast messageToast={message} />
      {/* Se isEditing for verdadeiro e selectedAluno existir, mostra o formulário
       de edição do aluno. Repassa as informacoes, aluno que recebe de
       selectedAluno, onCancel recebe o valor de setIsEditing(false) e 
       onSaveSuccess recebe a função para atualizar o aluno e setIsEditing(false) */}
      {isEditing && selectedAluno ? (
        <StudentEditForm
          aluno={selectedAluno}
          onCancel={() => setIsEditing(false)}
          onSaveSuccess={async (updatedAluno) => {
            setIsEditing(false);
            /* Tenta buscar o aluno atualizado na API para garantir que a 
               foto/contrato estejam atualizados
               Cria a variavel constante response que aguarda a resposta da API,
               repassando o código do aluno armazenado no updatedAluno.Alunos_Codigo */
            try {
              const response = await api.get(
                `/alunos/codigo/${updatedAluno.Alunos_Codigo}`
              );
              /* Se a resposta da API contiver dados e o código do aluno entao setSelectedAluno
                 recebe os dados atualizados de response.data
                 Senao, setSelectedAluno usa o parametro prev repassando seu conteúdo e 
                 atualizando com o conteudo de updatedAluno */
              if (response.data && response.data.Alunos_Codigo) {
                setSelectedAluno(response.data);
              } else {
                setSelectedAluno((prev) => ({ ...prev, ...updatedAluno }));
              }
              /* Se der erro na requisição, setSelectedAluno usa o parametro prev repassando seu
               conteúdo e atualizando com o conteudo de updatedAluno. Depois seta a mensagem de sucesso */
            } catch {
              setSelectedAluno((prev) => ({ ...prev, ...updatedAluno }));
            }
            setMessage({
              type: "success",
              text: "Alterações salvas com sucesso!",
            });
          }}
        />
      ) : /* Se isEditing for falso e selectedAluno existir, mostra os detalhes do aluno. A variavel
           selectedAluno chama a funcao StudentDetails e repassa as informacoes aluno de selectedAluno,
           onEdit, de HandleEdit, onToggleSituacao, de HandleToggleSituacao e onBack, de 
           HandleBackToSearch */
      selectedAluno ? (
        <StudentDetails
          aluno={selectedAluno}
          onEdit={handleEdit}
          onToggleSituacao={handleToggleSituacao}
          onBack={handleBackToSearch}
        />
      ) : (
        /* E se os dois forem falsos (ternario ? :), mostra o formulário de busca.
             onSubmit recebe a função handleSearch */
        <div className="w-full">
          {/* Inicio - Formulario de pesquisa do aluno */}
          <form
            onSubmit={handleSearch}
            className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Pesquisar Aluno
            </h3>
            {/* Inicio - Campo de pesquisa pelo codigo. 
                type definido como number, name definido como codigo, value recebe de 
                searchData.codigo, onChange recebe a funcao handleSearchChange. */}
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
            {/* Fim - Campo de pesquisa pelo codigo */}

            {/* Inicio - Campo de pesquisa pelo CPF.
                Type é definido como texto, name como cpf, o value recebe de searchData.cpf, onChange
                recebe a funcao de handleCPFChange. */}
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
            {/* Fim - Campo de pesquisa pelo CPF */}

            {/* Inicio - Campo de pesquisa pelo nome.
                type é definido como texto, name definido como nome, value recebe a funcao de
                searchData.nome, onChange recebe a funcao de handleSearchChange.  */}
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
            {/* Fim - Campo de pesuisa pelo nome */}

            {/* Inicio - Campo que busca apenas alunos inativos.
                Type é definido como checkbox, id definido como mostrarInaivos, checked recebe a
                funcao mostrarInativos e onChange recebe o evento (e) que executa a funcao 
                setMostrarInativos (do evento (e) e.target.checked) */}
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
            {/* Fim - Campo que busca apenas alunos inativos. */}
          </form>
          {/* Fim - Formulario de pesquisa do aluno. */}
          {/* Inicio - Botoes de controle - pesquisae e limpar */}
          <div className="flex justify-center gap-4 pt-4">
            <Buttons.PesquisarAluno
              onClick={handleSearch}
              loading={loading}
              disabled={loading}
            />
            <Buttons.Limpar onClick={handleClearSearch} />
          </div>
          {/* Fim - Botoes de controle - pesquisar e limpar */}

          {/* Inicio - Resultados da pesquisa 
              Nesse bloco, se o tamanho do results.length for maior que 0 e se contiver resultados,
              mostra na tela ordenando por codigo ou nome (clicando nos botoes) e se tiver mais de 
              10 alunos, mostra a paginacao. */}
          {results.length > 0 && (
            <div className="w-full mt-6">
              <div className="md:hidden mb-4 space-y-3">
                <h3 className="text-lg font-bold text-white text-center">
                  Resultados ({results.length} alunos)
                </h3>
                <div className="flex flex-col gap-2">
                  <span className="text-white text-sm text-center">
                    Ordenar por:
                  </span>
                  {/* Inicio - Botoes de controle de ordenacao - codigo e nome */}
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => handleSortChange("codigo")}
                      className={`flex gap-4 border-2 rounded-md font-bold transition-colors text-sm ${
                        sortBy === "codigo"
                          ? "bg-blue-500 border-gray-300 hover:bg-blue-600"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      🧩 Código
                    </button>
                    <button
                      onClick={() => handleSortChange("nome")}
                      className={`flex gap-4 items-center border-2 rounded-md font-bold transition-colors text-sm ${
                        sortBy === "nome"
                          ? "bg-blue-500 border-gray-300 hover:bg-blue-600"
                          : "bg-gray-700 text-gray-300 active:bg-gray-600"
                      }`}
                    >
                      <img
                        src="/controle_pa/user.png"
                        alt="Nome"
                        className="w-6 h-6 flex"
                      />
                      Nome
                    </button>
                  </div>
                  {/* Fim - Botoes de controle de ordenacao - codigo e nome */}
                </div>
              </div>
              {/* Inicio - Tags de alunos da pesquisa */}
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
              {/* Fim - Tags de alunos da pesquisa */}

              {/* Inicio - Paginacao e botoes de controle - anterior e proximo */}
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
              {/* Fim - Paginacao e botoes de controle - anterior e proximo */}
            </div>
          )}
          {/* Fim - Resultados da pesquisa  */}
        </div>
        /* Fim - Formulario de pesquisa */
      )}
    </div>
  );
}

export default StudentSearch;
