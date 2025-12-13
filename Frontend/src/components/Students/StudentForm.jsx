/* Importa os hooks do react usestate e useref */
import React, { useState, useRef } from "react";
/* Importa a tratativa de mensagens do toast */
import MessageToast from "../miscellaneous/MessageToast";
/* Importa os botoes */
import Buttons from "../miscellaneous/Buttons";
/* Importa as configurações da API */
import api from "../../services/api";
/* Importa o hook para buscar o CEP */
import useBuscarCEP from "../../hooks/BuscarCep";
/* Importa as funções utilitárias (utils) */
import {
  limparFormData,
  formatarTelefone,
  validarTelefone,
  formatarCPF,
  validarCPF,
  validarEmail,
  calcularIdade,
  formatarCEP,
  converterData,
} from "../../utils/Utils";
/* Importa o hook UseToast para gerenciar e exibir mensagens toast */
import useToast from "../../hooks/useToast";
/* Adiciona o link do CDN do Material Icons se ainda não estiver presente
Sao apenas para adicionar os icones do material icons */
if (
  typeof document !== "undefined" &&
  !document.getElementById("material-icons-cdn")
) {
  const link = document.createElement("link");
  link.id = "material-icons-cdn";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/icon?family=Material+Icons";
  document.head.appendChild(link);
}
//=====================================================================================

/* ===== INICIO DA FUNÇÃO ===== */
/* Componente StudentsForm que recebe props: aluno (objeto) e as
   funções onCancel e onSaveSuccess */
function StudentForm({ aluno, onSaveSuccess }) {
  /* Função que cria uma constante para tratar mudança nos campos
     de telefone usando utilitários formatarTelefone */
  const handleTelefoneChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: formatarTelefone(value),
    }));
  };

  /* Inicialização do estado do formulário usando
     o utilitario limparFormData para iniciar sem dados */
  const [formData, setFormData] = useState(
    aluno ? { ...aluno } : limparFormData()
  );

  /* Chama o hook useBuscarCEP no topo do componente, passando o CEP atual */
  const { loadingCep, dadosCep, erroCep } = useBuscarCEP(
    formData.Alunos_Endereco_CEP
  );

  //const [message, setMessage] = useState({ type: "", text: "" });
  const [messageToast, showToast] = useToast();

  /* Usa o React useEffect para atualizar o formulário quando dadosCep ou erroCep mudarem
    Se dadosCep tiver informacao, entao preenche os campos do formulario. Se erroCep tiver
    informacao, entao exibe a mensagem de erro */
  React.useEffect(() => {
    if (dadosCep) {
      setFormData((prev) => ({
        ...prev,
        Alunos_Endereco: dadosCep.logradouro || "",
        Alunos_Endereco_Bairro: dadosCep.bairro || "",
        Alunos_Endereco_Localidade: dadosCep.localidade || "",
        Alunos_Endereco_Cidade: dadosCep.localidade || "",
        Alunos_Endereco_Estado: dadosCep.uf || "",
      }));
    }
    if (erroCep) {
      showToast({ type: "error", text: erroCep });
    }
  }, [dadosCep, erroCep, showToast]);

  /* Cria variaveis constante de estado para controlar as mensagens
  de loading e feedback (resultado) do toast */
  const [loading, setLoading] = useState(false);

  /*  Uso do react useEffect para limpar mensagens do toast 
  após 1.5 segundos */
  // React.useEffect(() => {
  //   if (message.text) {
  //     const timer = setTimeout(() => {
  //       setMessage({ type: "", text: "" });
  //     }, 1500);
  //     return () => clearTimeout(timer);
  //   }
  // }, [message.text]);

  /* Cria variavel constante para inicializar o armazenamento dos
  arquivos (foto e contrato). Ambos sao iniciados sem valor */
  const [arquivos, setArquivos] = useState({
    foto: null,
    contrato: null,
  });

  /*   Cria uma variável constante de referência para os inputs de
  foto e contrato, para poder limpar os campos depois, usando useRef
  que é um hook do react para guardar referencias a elementos do DOM */
  const fotoInputRef = useRef(null);
  const contratoInputRef = useRef(null);

  /* Função para formatar o CPF usando o utilitario formatarCPF
  importado do utils */
  const handleCPFChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: formatarCPF(value),
    }));
  };

  /* Função para formatar o CEP usando o utilitario formatarCEP
      importado do utils e buscar o endereço via API do ViaCEP
      importado do hook buscarCEP */
  const handleCepChangeFormatado = (e) => {
    const { value } = e.target;
    const cepFormatado = formatarCEP(value);
    setFormData((prev) => ({
      ...prev,
      Alunos_Endereco_CEP: cepFormatado,
    }));
    showToast({ type: "", text: "" });
  };
  /* Cria uma variavel constante handleChange que recebe o evento (e)
     e atualiza o estado do formulário. 
     Cria as variaveis name e value recebendo o evento (e).target (name e value)
     O setFormData, atraves da variavel (prev) repassa o conteudo ...prev (o 
     conteudo anterior) e atualiza o campo [name] com o novo value. */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* Cria uma variavel constante que recebe uma funcao asincrona.
     Passa a subfuncao preventDefault para evitar o envio padrão
     do formulário.
     A funcao setLoading para ativar o loading durante o processamento
     A funcao setMessage para limpar mensagens anteriores */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    showToast({ type: "", text: "" });
    /* Usa a funcao utilitaria validarTelefone importado do utils
       para validar os telefones */
    if (
      formData.Alunos_Telefone &&
      !validarTelefone(formData.Alunos_Telefone)
    ) {
      showToast({
        type: "error",
        text: "Telefone principal deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }
    if (
      formData.Alunos_Telefone_Emergencia_1 &&
      !validarTelefone(formData.Alunos_Telefone_Emergencia_1)
    ) {
      showToast({
        type: "error",
        text: "Telefone de emergência 1 deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }
    if (
      formData.Alunos_Telefone_Emergencia_2 &&
      !validarTelefone(formData.Alunos_Telefone_Emergencia_2)
    ) {
      showToast({
        type: "error",
        text: "Telefone de emergência 2 deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }

    /* Faz a validacao do email usando o utilitario 
       validarEmail importado do utils */

    if (formData.Alunos_Email && !validarEmail(formData.Alunos_Email)) {
      showToast({
        type: "error",
        text: "E-mail inválido.",
      });
      setLoading(false);
      return;
    }

    /* Validação de CPF usando o utilitario validarCPF 
       importado do utils */
    if (
      formData.Alunos_CPF &&
      calcularIdade(formData.Alunos_Data_Nascimento) >= 18 &&
      !validarCPF(formData.Alunos_CPF)
    ) {
      showToast({
        type: "error",
        text: "CPF do aluno inválido.",
      });
      setLoading(false);
      return;
    }
    if (
      formData.Alunos_CPF_Responsavel &&
      calcularIdade(formData.Alunos_Data_Nascimento) < 18 &&
      !validarCPF(formData.Alunos_CPF_Responsavel)
    ) {
      showToast({
        type: "error",
        text: "CPF do responsável inválido.",
      });
      setLoading(false);
      return;
    }

    /* Se estiver tudo ok, tenta enviar os dados para a API
     Cria a variavel response para armazenar a resposta da API
     Se aluno e aluno.Alunos_Codigo existirem ele faz a atualizacao (Patch).
     Se foto ou contrato foram alterados, cria um FormData
     Cria uma variável constante data que "seta" como um FormData
     Object.entries transforma o formData em um array de pares [chave, valor]
     para cada key (chave) e value (valor) do formData, adiciona ao FormData
     => (arrow function) significa que para cada par chave-valor, executa a função que esta no bloco { }
     Data.append (variavel data do tipo FormData) append (adiciona) "o proximo". como no começo nao tem nada
     ele adiciona o primeiro par chave-valor, depois o segundo, e assim por diante*/
    try {
      /* Converte datas do formato brasileiro para ISO antes de enviar usando 
         o utilitario converterData importado do utils */
      const formDataConvertido = {
        ...formData,
        Alunos_Data_Nascimento: converterData(formData.Alunos_Data_Nascimento),
        Alunos_Data_Matricula: converterData(formData.Alunos_Data_Matricula),
      };
      /* cria uma variavel do tipo let (response).
         Se aluno e aluno.Alunos_Codigo existirem ele faz a atualizacao (Patch).
         Se arquivos.foto ou arquivos.contrato existirem, cria um FormData.
         Cria uma variável constante data que "seta" como um FormData
         Object.entries transforma o formData em um array de pares [chave, valor]
         Ele pega o formDataConvertido (que é o formData com as datas convertidas)
         Usa o forEach para iterar sobre cada par chave-valor e adiciona ao FormData.
         Usa a variavel data e faz o append dos dados. */
      let response;
      if (aluno && aluno.Alunos_Codigo) {
        if (arquivos.foto || arquivos.contrato) {
          const data = new FormData();
          Object.entries(formDataConvertido).forEach(([key, value]) => {
            data.append(key, value);
          });
          /* Se arquivos.foto ou arquivos.contrato existirem, adiciona ao FormData */
          if (arquivos.foto) data.append("foto", arquivos.foto);
          if (arquivos.contrato) data.append("contrato", arquivos.contrato);
          /* Response aguarda o recebimento da resposta da API, que chama o endpoint
             de atualização do aluno, passando o codigo do aluno e os dados em formato 
             formData, informando o tipo de conteúdo header como multipart/form-data */
          response = await api.patch(
            `/alunos/update/${aluno.Alunos_Codigo}`,
            data,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
        }
        /* (Senao) Se o aluno nao existir, faz o cadastro (Post) e segue o mesmo
           fluxo descrito acima para foto e contrato */
      } else {
        if (arquivos.foto || arquivos.contrato) {
          const data = new FormData();
          Object.entries(formDataConvertido).forEach(([key, value]) => {
            data.append(key, value);
          });
          if (arquivos.foto) data.append("foto", arquivos.foto);
          if (arquivos.contrato) data.append("contrato", arquivos.contrato);
          response = await api.post("/alunos/create/", data, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          /* (Senao) Se nao aluno nem foto ou contrato, faz o cadastro (Post)
             apenas das informações do aluno repassadas no formulario */
        } else {
          response = await api.post("/alunos/create/", formDataConvertido);
        }
        /* Resumo:  se tiver o aluno, e se tiver foto e contrato, atualiza, se tiver so 
           foto ou contrato, atualiza, se nao tiver aluno, e tiver foto ou contrato, faz 
           o cadastro do aluno com a foto e o contrato, senao tiver foto ou contrato,
           so faz o cadastro do aluno */
      }
      /* Cria uma variavel constante (resData) que recebe o resultado da variavel response,
         criada acima.
         Cria uma variavel constante (isSuccess) que vai verificar se a mensagem foi de 
         sucesso ou erro.
         IsSuccess recebe a mensagem de resData se ela existir E (&&) se tiver "sucesso"
         (,includes) no conteudo dela, transformando tudo em letra minuscula (toLowerCase) */
      const resData = response.data;
      const isSuccess =
        resData.Mensagem && resData.Mensagem.toLowerCase().includes("sucesso");
      /* Se isSuccess for verdadeiro (true) exibe a mensagem de sucesso no toast */
      if (isSuccess) {
        showToast({
          type: "success",
          text:
            (aluno && aluno.Alunos_Codigo
              ? "Alterações salvas com sucesso!"
              : resData.Mensagem) || "Aluno cadastrado com sucesso!",
        });
        /* Aqui faz uma validacao do tipo de propriedade (props type validation).
           Se o aluno existir e o tipo de onSaveSuccess for igual a "function"
           Entao onSaveSuccess recebe a copia do conteudo de formData (...formData)  */
        if (aluno && typeof onSaveSuccess === "function") {
          onSaveSuccess({ ...formData });
        }
        /* Se aluno nao tiver conteudo (!aluno) chama a funcao handleReset para 
        limpar o formulario, Signinifica que é um cadastro novo. */
        if (!aluno) handleReset();

        /* Caso nao seja nenhuma das condições acima, trata como erro. Ai define o SetMessage
           como tipo error e no texto passa o erro do resData OU ("||") passa a mensagem do 
           resData OU ("||") ve se aluno tem conteudo. Se tiver manda a mensagem de erro para 
           atualizar o aluno, se nao tiver manda a mensagem de erro para cadastrar um novo aluno.
            */
      } else {
        showToast({
          type: "error",
          text:
            resData.Erro ||
            resData.Mensagem ||
            (aluno ? "Erro ao salvar aluno." : "Erro ao cadastrar aluno."),
        });
      }
    } catch (error) {
      /* E ai vem o bloco do catch. O try (tentativa) tentou fazer tudo aquilo acima.
    Se por algum motivo der erro, ele cai aqui no catch. O Catch usa uma variavel
    de sistema padrao (error). 
    let -> cria uma variavel local que recebe o conteudo de aluno. Usa o ternario (? , :)
    para definir a mensagem. Se aluno tem conteudo entao é atualizacao, se nao tem é 
    cadastro. 
    Se dentro da variavel de sistema error tiver "a parte" de response E ("&&") se dentro
    da parte de response tiver a parte de data" isso quer dizer que tem mensagem de erro
    especifico dentro do sistema. Entao, cria uma variavel constante (errData) que recebe 
    essa parte .data da variavel de sistema error. Entao a variavel msg recebe, OU ("||")
    .erro OU .mensagem OU msg que é a mensagem definida anteriormente. (nessa ordem de 
    prioridade)) E ai passa para o setMessage o type e o conteudo da variavel msg 
    como Text */

      // Se for erro 401, o interceptor global já trata - não mostrar mensagem local
      if (error.response?.status === 401) {
        // Não fazer nada, o interceptor global cuida
      } else {
        let msg = "Erro ao cadastrar aluno.";
        if (error.response) {
          // Mensagem principal
          msg =
            error.response.data?.Mensagem ||
            error.response.data?.Erro ||
            `Erro do servidor: ${error.response.status} ${error.response.statusText}`;

          // Se for validation error, tenta mostrar detalhes extras
          if (
            msg.toLowerCase().includes("validation error") &&
            error.response.data
          ) {
            // Tenta mostrar detalhes comuns de validação
            if (error.response.data.errors) {
              msg +=
                " | Detalhes: " + JSON.stringify(error.response.data.errors);
            } else if (error.response.data.details) {
              msg +=
                " | Detalhes: " + JSON.stringify(error.response.data.details);
            } else {
              msg += " | Dados: " + JSON.stringify(error.response.data);
            }
          }
        } else if (error.request) {
          msg = "Erro de rede: não foi possível conectar ao servidor.";
        } else if (error.message) {
          msg = `Erro: ${error.message}`;
        }
        showToast({ type: "error", text: msg });
      }
      setLoading(false);
    }
  };

  /* Cria a variavel constante handleReset. Ela faz o setFormData chamar o utilitario
     limparFormData, para as informacoes do formulario, e o setArquivos para limpar
     os arquivos. Também pergunta se fotoImputRef e contratoImputRef contem referebcias.
     Se tiver, também limpa as referencias */
  const handleReset = () => {
    setFormData(limparFormData());
    setArquivos({ foto: null, contrato: null });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (contratoInputRef.current) contratoInputRef.current.value = "";
  };
  /*   Cria uma variavel constante handleFileChange que lida com mudanças nos inputs de
       arquivos. Ele recebe a variavel (e) "event" variavel de sitema. (e) recebe o resultado
       da funcao (=>). A funcao cria outras 2 variaveis constante {name e files} que recebe
       o conteudo de (e). Usa a propriedade de sistema target para acessar os valores. No
       objeto input (campo do formulario) tem por padrao file e name entao quando colocamos
       name e files entre { } criamos duas variaves constantes que recebem esses valores do
       input (desestruturacao de objetos). O name recebe o e.target.name e files recebe o
       e.target.files. 
       Se files tiver conteudo e for maior que zero chama SetArquivos com o objeto de sistema
       (prev) que guarda o estado atual. A funcao (=>) passa o conteudo de prev (...prev),
       e atualiza name e file no indice 0  */
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setArquivos((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  /* O return é o que vai ser exibido na tela.
     Essa é a div principal Ela tem como objetico encapsular tudo o que ira aparecer
     A div Configura a tela e o formulario, o classname chama um "bloco" de  configuracoes de 
     layout que nesse caso é usado TailwindCSS */
  return (
    <div className="w-full h-auto p-6 bg-gray-800 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Cadastrar Aluno</h2>
      {/* Aqui fica a mensagem toast (que aparece no canto direito da tela) Ela é 
        uma props (propriedade) que esta definida em /miscellaneous/Messages.jsx  */}
      {messageToast && <MessageToast messageToast={messageToast} />}

      {/* Aqui começa o Formulario. dentro de form, usamos uma funcao dele (onsubmit)
        para definir o conportamento ao enviar o formulario. O onsubmit recebe a funcao
        criada acima handleSubmit */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Essas divs internas sao o formulario em si. */}

        {/* INICIO - Informacao de campos obrigatorios */}
        <div className="w-full mb-8 flex">
          <span
            style={{
              color: "#b91c1c",
              fontWeight: "bold",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span role="img" aria-label="alerta">
              ⚠️
            </span>
            Campos com * são obrigatórios.
          </span>
        </div>
        {/* FIM - Informacao de campos obrigatorios */}

        {/* INICIO - Código do Aluno */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Aluno *
          </label>
          <input
            /* O imput define os valores. name e value sao usados para 
               identificar e controlar os dados do formulario.
               onChange faz a atualizacao do estado do formulario */
            type="number"
            name="Alunos_Codigo"
            value={formData.Alunos_Codigo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* FIM - Código do Aluno */}

        {/* Inicio - Nome Completo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="Alunos_Nome"
            value={formData.Alunos_Nome}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* FIM - Nome Completo */}

        {/* Inicio - Data de Nascimento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Nascimento *
          </label>
          <input
            type="date"
            name="Alunos_Data_Nascimento"
            value={formData.Alunos_Data_Nascimento}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* FIM - Data de Nascimento */}

        {/* Inicio - CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF
            {/* Chama o utilitario calcularIdade para saber se o aluno é maior de idade */}
            {calcularIdade(formData.Alunos_Data_Nascimento) >= 18 ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF"
            value={formData.Alunos_CPF}
            onChange={handleCPFChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
            maxLength="14"
            /* inclui o required para o campo */
            required={calcularIdade(formData.Alunos_Data_Nascimento) >= 18}
          />
        </div>
        {/* FIM - CPF */}

        {/* Inicio - Nome do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Responsável
            {/* Chama o utilitario calcularIdade para saber se o aluno é menor de idade */}
            {calcularIdade(formData.Alunos_Data_Nascimento) < 18 ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Nome_Responsavel"
            value={formData.Alunos_Nome_Responsavel}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deixe em branco se for maior de idade"
            /* inclui o required para o campo */
            required={calcularIdade(formData.Alunos_Data_Nascimento) < 18}
          />
        </div>
        {/* FIM - Nome do Responsável */}

        {/* Inicio - CPF do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF do Responsável
            {calcularIdade(formData.Alunos_Data_Nascimento) < 18 ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF_Responsavel"
            value={formData.Alunos_CPF_Responsavel}
            onChange={handleCPFChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
            maxLength="14"
            required={calcularIdade(formData.Alunos_Data_Nascimento) < 18}
          />
        </div>
        {/* FIM - CPF do Responsável */}

        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CEP *
          </label>
          <div className="relative w-full">
            <input
              type="text"
              name="Alunos_Endereco_CEP"
              value={formData.Alunos_Endereco_CEP}
              /* onChange chama o utilitario para formatar o CEP */
              onChange={handleCepChangeFormatado}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000-000"
              maxLength="9"
              required
            />
            {loadingCep && (
              <span className="absolute right-2 top-2 text-orange-500 text-base">
                Buscando...
              </span>
            )}
          </div>
        </div>
        {/* FIM - CEP */}

        {/* Inicio - Endereço */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endereço *
          </label>
          <input
            type="text"
            name="Alunos_Endereco"
            value={formData.Alunos_Endereco}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
            required
          />
        </div>
        {/* FIM - Endereço */}

        {/* Inicio - Complemento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Complemento
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Complemento"
            value={formData.Alunos_Endereco_Complemento}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* FIM - Complemento */}

        {/* Inicio - Bairro */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bairro *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Bairro"
            value={formData.Alunos_Endereco_Bairro}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
            required
          />
        </div>
        {/* FIM - Bairro */}

        {/* Inicio - Localidade */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Localidade *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Localidade"
            value={formData.Alunos_Endereco_Localidade}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
            required
          />
        </div>
        {/* FIM - Localidade */}

        {/* Inicio - Cidade */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cidade *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Cidade"
            value={formData.Alunos_Endereco_Cidade}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
            required
          />
        </div>
        {/* FIM - Cidade */}

        {/* Inicio - Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Estado"
            value={formData.Alunos_Endereco_Estado}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength="2"
            readOnly
            required
          />
        </div>
        {/* FIM - Estado */}

        {/* Inicio - Telefone */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone *
          </label>
          <input
            type="tel"
            name="Alunos_Telefone"
            value={formData.Alunos_Telefone}
            onChange={handleTelefoneChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(00) 00000-0000"
            maxLength="15"
            required
          />
        </div>
        {/* FIM - Telefone */}

        {/* Inicio - Email */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="Alunos_Email"
            value={formData.Alunos_Email}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* FIM - Email */}

        {/* Inicio - Nome do Contato de Emergência */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Contato de Emergência *
          </label>
          <input
            type="text"
            name="Alunos_Contato_Emergencia"
            value={formData.Alunos_Contato_Emergencia}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* FIM - Nome do Contato de Emergência */}

        {/* Inicio - Telefone Emergência 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone Emergência 1 *
          </label>
          <input
            type="tel"
            name="Alunos_Telefone_Emergencia_1"
            value={formData.Alunos_Telefone_Emergencia_1}
            onChange={handleTelefoneChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(00) 00000-0000"
            maxLength="15"
            required
          />
        </div>
        {/* FIM - Telefone Emergência 1 */}

        {/* Inicio - Telefone Emergência 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone Emergência 2
          </label>
          <input
            type="tel"
            name="Alunos_Telefone_Emergencia_2"
            value={formData.Alunos_Telefone_Emergencia_2}
            onChange={handleTelefoneChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="(00) 00000-0000"
            maxLength="15"
          />
        </div>
        {/* FIM - Telefone Emergência 2 */}

        {/* Inicio - Foto do Aluno */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Foto do Aluno
          </label>
          <input
            ref={fotoInputRef}
            type="file"
            name="foto"
            onChange={handleFileChange}
            accept="image/*"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {arquivos.foto && (
            <span className="text-sm text-green-600 flex items-center gap-2">
              📷 {arquivos.foto.name} ({(arquivos.foto.size / 1024).toFixed(1)}{" "}
              KB)
              <Buttons.BotaoX
                onClick={() => {
                  setArquivos((prev) => ({ ...prev, foto: null }));
                  if (fotoInputRef.current) fotoInputRef.current.value = "";
                }}
              />
            </span>
          )}
        </div>
        {/* FIM - Foto do Aluno */}

        {/* Inicio - Contrato do Aluno */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contrato do Aluno
          </label>
          <input
            ref={contratoInputRef}
            type="file"
            name="contrato"
            onChange={handleFileChange}
            accept="application/pdf,image/*"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {arquivos.contrato && (
            <span className="text-sm text-green-600 flex items-center gap-2">
              📄 {arquivos.contrato.name} (
              {(arquivos.contrato.size / 1024).toFixed(1)} KB)
              <Buttons.BotaoX
                onClick={() => {
                  setArquivos((prev) => ({ ...prev, contrato: null }));
                  if (contratoInputRef.current)
                    contratoInputRef.current.value = "";
                }}
              />
            </span>
          )}
        </div>
        {/* FIM - Contrato do Aluno */}

        {/* Inicio - Data de Matrícula */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Matrícula *
          </label>
          <input
            type="date"
            name="Alunos_Data_Matricula"
            value={formData.Alunos_Data_Matricula}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* FIM - Data de Matrícula */}

        {/* Inicio - Botoes de Ação: Cadastrar e Limpar */}
        <div className="flex justify-center gap-6 pt-4">
          <Buttons.BotaoCadastrar
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Cadastrar Aluno
          </Buttons.BotaoCadastrar>
          <Buttons.BotaoLimpar
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleReset();
            }}
            disabled={loading}
          />
        </div>
        {/* FIM - Botoes de Ação: Cadastrar e Limpar */}
      </form>
    </div>
  );
}

import PropTypes from "prop-types";

StudentForm.propTypes = {
  aluno: PropTypes.object,
  onSaveSuccess: PropTypes.func,
};

export default StudentForm;
