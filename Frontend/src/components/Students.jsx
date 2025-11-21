import { useState, useRef } from "react";
import api from "../services/api";
import { getUsuario } from "../services/auth";
import StudentPlan from "./StudentPlan";

function Students() {
  return (
    <>
      <ul className="flex flex-wrap gap-0">
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Cadastrar Aluno
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Editar Aluno
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Deletar Aluno
        </li>
        <li className="bg-emerald-600 rounded-2xl p-2 border-2 border-gray-300 m-1">
          Pesquisar Aluno
        </li>
      </ul>
    </>
  );
}

function StudentForm() {
  const [formData, setFormData] = useState({
    Alunos_Codigo: "",
    Alunos_Nome: "",
    Alunos_CPF: "",
    Alunos_Nome_Responsavel: "",
    Alunos_Endereco_CEP: "",
    Alunos_Endereco: "",
    Alunos_Endereco_Complemento: "",
    Alunos_Endereco_Bairro: "",
    Alunos_Endereco_Localidade: "",
    Alunos_Endereco_Cidade: "",
    Alunos_Endereco_Estado: "",
    Alunos_Telefone: "",
    Alunos_Email: "",
    Alunos_Contato_Emergencia: "",
    Alunos_Telefone_Emergencia_1: "",
    Alunos_Telefone_Emergencia_2: "",
    Alunos_Data_Matricula: "",
  });

  const [arquivos, setArquivos] = useState({
    foto: null,
    contrato: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loadingCep, setLoadingCep] = useState(false);

  // Refs para limpar inputs de arquivo
  const fotoInputRef = useRef(null);
  const contratoInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const buscarCEP = async (cep) => {
    // Remove caracteres não numéricos do CEP
    const cepLimpo = cep.replace(/\D/g, "");

    // Verifica se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        setMessage({
          type: "error",
          text: "CEP não encontrado. Verifique o número digitado.",
        });
        return;
      }

      // Preenche os campos com os dados do CEP
      setFormData((prev) => ({
        ...prev,
        Alunos_Endereco: data.logradouro || "",
        Alunos_Endereco_Bairro: data.bairro || "",
        Alunos_Endereco_Localidade: data.bairro || "",
        Alunos_Endereco_Cidade: data.localidade || "",
        Alunos_Endereco_Estado: data.uf || "",
      }));

      console.log("CEP encontrado:", data);
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setMessage({
        type: "error",
        text: "Erro ao buscar CEP. Tente novamente.",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const formatarTelefone = (valor) => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, "");

    // Aplica a máscara de telefone
    if (apenasNumeros.length <= 10) {
      // Formato: (00) 0000-0000
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      // Formato: (00) 00000-0000
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15); // Limita a 15 caracteres
    }
  };

  const handleTelefoneChange = (e) => {
    const { name, value } = e.target;
    // Permite digitar só números e aplicar máscara
    let apenasNumeros = value.replace(/\D/g, "");
    // Limita a 11 dígitos
    if (apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.slice(0, 11);
    }
    const telefoneFormatado = formatarTelefone(apenasNumeros);
    setFormData((prev) => ({
      ...prev,
      [name]: telefoneFormatado,
    }));
  };

  const formatarCPF = (valor) => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, "");

    // Aplica a máscara de CPF: 000.000.000-00
    return apenasNumeros
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14); // Limita a 14 caracteres
  };

  const handleCPFChange = (e) => {
    const { value } = e.target;
    const cpfFormatado = formatarCPF(value);

    setFormData((prev) => ({
      ...prev,
      Alunos_CPF: cpfFormatado,
    }));
  };

  const formatarCEP = (valor) => {
    // Remove tudo que não é dígito
    const apenasNumeros = valor.replace(/\D/g, "");

    // Aplica a máscara de CEP: 00000-000
    return apenasNumeros.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9); // Limita a 9 caracteres
  };

  const handleCepChangeFormatado = (e) => {
    const { value } = e.target;
    const cepFormatado = formatarCEP(value);

    setFormData((prev) => ({
      ...prev,
      Alunos_Endereco_CEP: cepFormatado,
    }));

    // Limpa mensagem de erro anterior
    setMessage({ type: "", text: "" });

    // Busca o CEP automaticamente quando tiver 8 dígitos
    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCEP(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validação dos telefones: exatamente 11 dígitos (com máscara)
    const telPrincipal = formData.Alunos_Telefone.replace(/\D/g, "");
    const telEmerg1 = formData.Alunos_Telefone_Emergencia_1.replace(/\D/g, "");
    const telEmerg2 = formData.Alunos_Telefone_Emergencia_2.replace(/\D/g, "");
    if (formData.Alunos_Telefone && telPrincipal.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone principal deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }
    if (formData.Alunos_Telefone_Emergencia_1 && telEmerg1.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone de emergência 1 deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }
    if (formData.Alunos_Telefone_Emergencia_2 && telEmerg2.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone de emergência 2 deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }

    // ATENÇÃO: NÃO REMOVER OU COMENTAR O BLOCO ABAIXO!
    // Este bloco é responsável por enviar o cadastro do aluno para a API.
    // Se removido, o cadastro não funcionará.
    try {
      // Cria FormData para enviar dados e arquivos
      const formDataToSend = new FormData();

      // Adiciona os dados do formulário
      formDataToSend.append(
        "Alunos_Data_Matricula",
        formData.Alunos_Data_Matricula
      );
      formDataToSend.append(
        "Alunos_Codigo",
        parseInt(formData.Alunos_Codigo, 10)
      );
      formDataToSend.append("Alunos_Nome", formData.Alunos_Nome);
      formDataToSend.append("Alunos_CPF", formData.Alunos_CPF);
      formDataToSend.append(
        "Alunos_Nome_Responsavel",
        formData.Alunos_Nome_Responsavel || "Aluno Maior de Idade"
      );
      formDataToSend.append(
        "Alunos_Endereco_CEP",
        formData.Alunos_Endereco_CEP
      );
      formDataToSend.append("Alunos_Endereco", formData.Alunos_Endereco);
      formDataToSend.append(
        "Alunos_Endereco_Complemento",
        formData.Alunos_Endereco_Complemento
      );
      formDataToSend.append(
        "Alunos_Endereco_Bairro",
        formData.Alunos_Endereco_Bairro
      );
      formDataToSend.append(
        "Alunos_Endereco_Localidade",
        formData.Alunos_Endereco_Localidade
      );
      formDataToSend.append(
        "Alunos_Endereco_Cidade",
        formData.Alunos_Endereco_Cidade
      );
      formDataToSend.append(
        "Alunos_Endereco_Estado",
        formData.Alunos_Endereco_Estado
      );
      formDataToSend.append("Alunos_Telefone", formData.Alunos_Telefone);
      formDataToSend.append("Alunos_Email", formData.Alunos_Email);
      formDataToSend.append(
        "Alunos_Contato_Emergencia",
        formData.Alunos_Contato_Emergencia
      );
      formDataToSend.append(
        "Alunos_Telefone_Emergencia_1",
        formData.Alunos_Telefone_Emergencia_1
      );
      formDataToSend.append(
        "Alunos_Telefone_Emergencia_2",
        formData.Alunos_Telefone_Emergencia_2
      );

      // Adiciona situação padrão como "Ativo"
      formDataToSend.append("Alunos_Situacao", "Ativo");

      // Adiciona usuário logado para o log
      const usuarioLogado = getUsuario();
      if (usuarioLogado) {
        formDataToSend.append(
          "usuario",
          usuarioLogado.login || usuarioLogado.nome
        );
      }

      // Adiciona os arquivos se foram selecionados
      if (arquivos.foto) {
        formDataToSend.append("foto", arquivos.foto);
      }
      if (arquivos.contrato) {
        formDataToSend.append("contrato", arquivos.contrato);
      }

      // Faz a requisição POST para cadastrar o aluno
      const response = await api.post("/alunos/create/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Verifica se houve sucesso (considera tanto status HTTP quanto statusCode no body)
      const sucesso =
        (response.status === 200 || response.status === 201) &&
        (!response.data.statusCode ||
          response.data.statusCode === 200 ||
          response.data.statusCode === 201);

      if (sucesso) {
        setMessage({
          type: "success",
          text: response.data.Mensagem || "Aluno cadastrado com sucesso!",
        });

        // Limpa a mensagem após 1.5 segundos
        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 1500);

        // Limpa o formulário APENAS após sucesso confirmado
        setFormData({
          Alunos_Codigo: "",
          Alunos_Nome: "",
          Alunos_CPF: "",
          Alunos_Nome_Responsavel: "",
          Alunos_Endereco_CEP: "",
          Alunos_Endereco: "",
          Alunos_Endereco_Complemento: "",
          Alunos_Endereco_Bairro: "",
          Alunos_Endereco_Localidade: "",
          Alunos_Endereco_Cidade: "",
          Alunos_Endereco_Estado: "",
          Alunos_Telefone: "",
          Alunos_Email: "",
          Alunos_Contato_Emergencia: "",
          Alunos_Telefone_Emergencia_1: "",
          Alunos_Telefone_Emergencia_2: "",
        });
        setArquivos({ foto: null, contrato: null });

        // Limpa os inputs de arquivo
        if (fotoInputRef.current) fotoInputRef.current.value = "";
        if (contratoInputRef.current) contratoInputRef.current.value = "";
      } else {
        // Se chegou aqui, API retornou 200 mas com erro no body
        setMessage({
          type: "error",
          text:
            response.data.Mensagem ||
            response.data.Erro ||
            "Erro ao cadastrar aluno.",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          error.response?.data?.Erro ||
          "Erro ao cadastrar aluno. Tente novamente.",
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
      Alunos_Codigo: "",
      Alunos_Nome: "",
      Alunos_CPF: "",
      Alunos_Nome_Responsavel: "",
      Alunos_Endereco_CEP: "",
      Alunos_Endereco: "",
      Alunos_Endereco_Complemento: "",
      Alunos_Endereco_Bairro: "",
      Alunos_Endereco_Localidade: "",
      Alunos_Endereco_Cidade: "",
      Alunos_Endereco_Estado: "",
      Alunos_Telefone: "",
      Alunos_Email: "",
      Alunos_Contato_Emergencia: "",
      Alunos_Telefone_Emergencia_1: "",
      Alunos_Telefone_Emergencia_2: "",
    });
    setArquivos({ foto: null, contrato: null });
    setMessage({ type: "", text: "" });

    // Limpa os inputs de arquivo
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (contratoInputRef.current) contratoInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setArquivos((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
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
        className="bg-gray-800 rounded-xl p-6 space-y-4 mx-auto"
      >
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
        {/* Código do Aluno */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Aluno *
          </label>
          <input
            type="number"
            name="Alunos_Codigo"
            value={formData.Alunos_Codigo}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Nome Completo do Aluno */}
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
        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF *
          </label>
          <input
            type="text"
            name="Alunos_CPF"
            value={formData.Alunos_CPF}
            onChange={handleCPFChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
            maxLength="14"
            required
          />
        </div>
        {/* Nome do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Responsável
          </label>
          <input
            type="text"
            name="Alunos_Nome_Responsavel"
            value={formData.Alunos_Nome_Responsavel}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deixe em branco se for maior de idade"
          />
        </div>
        {/* Endereço - CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CEP *
          </label>
          <div className="relative w-full">
            <input
              type="text"
              name="Alunos_Endereco_CEP"
              value={formData.Alunos_Endereco_CEP}
              onChange={handleCepChangeFormatado}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="00000-000"
              maxLength="9"
              required
            />
            {loadingCep && (
              <span className="absolute right-2 top-2 text-white text-sm">
                Buscando...
              </span>
            )}
          </div>
        </div>
        {/* Endereço */}
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
        {/* Complemento */}
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
        {/* Bairro */}
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
        {/* Localidade */}
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
        {/* Cidade */}
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
        {/* Estado */}
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
        {/* Telefone */}
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
        {/* Email */}
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
        {/* Contato de Emergência */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Contato de Emergência *
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
        {/* Telefone de Emergência 1 */}
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
        {/* Telefone de Emergência 2 */}
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
        {/* Foto do Aluno */}
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
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {arquivos.foto && (
            <span className="text-sm text-green-600">
              📷 {arquivos.foto.name} ({(arquivos.foto.size / 1024).toFixed(1)}{" "}
              KB)
            </span>
          )}
        </div>
        {/* Contrato do Aluno */}
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
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {arquivos.contrato && (
            <span className="text-sm text-green-600">
              📄 {arquivos.contrato.name} (
              {(arquivos.contrato.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>
        {/* Data de Matrícula */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Matrícula *
          </label>
          <input
            type="date"
            name="Alunos_Data_Matricula"
            value={formData.Alunos_Data_Matricula}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Botões */}
        <div className="flex justify-center gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "Cadastrando..." : "Cadastrar"}
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

function StudentSearch() {
  // HOOKS E VARIÁVEIS DE ESTADO DEVEM VIR PRIMEIRO
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
  const [sortBy, setSortBy] = useState("codigo"); // "codigo" ou "nome"
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [arquivosEdit, setArquivosEdit] = useState({
    foto: null,
    contrato: null,
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const alunosPerPage = 10;
  // HOOKS E VARIÁVEIS DE ESTADO DEVEM VIR PRIMEIRO

  // Função para ordenar resultados
  const ordenarResultados = (alunos, criterio) => {
    const alunosOrdenados = [...alunos];
    if (criterio === "codigo") {
      return alunosOrdenados.sort((a, b) => a.Alunos_Codigo - b.Alunos_Codigo);
    } else if (criterio === "nome") {
      return alunosOrdenados.sort((a, b) =>
        a.Alunos_Nome.localeCompare(b.Alunos_Nome)
      );
    }
    return alunosOrdenados;
  };

  // Paginação
  const indexOfLastAluno = currentPage * alunosPerPage;
  const indexOfFirstAluno = indexOfLastAluno - alunosPerPage;
  const currentAlunos = results.slice(indexOfFirstAluno, indexOfLastAluno);
  const totalPages = Math.ceil(results.length / alunosPerPage);

  // Função para mudar ordenação
  const handleSortChange = (novoCriterio) => {
    setSortBy(novoCriterio);
    setCurrentPage(1);
    if (results.length > 0) {
      const resultadosOrdenados = ordenarResultados(results, novoCriterio);
      setResults(resultadosOrdenados);
    }
  };

  // Função para limpar busca
  const handleClearSearch = () => {
    setSearchData({
      codigo: "",
      cpf: "",
      nome: "",
    });
    setResults([]);
    setMessage({ type: "", text: "" });
    setSelectedAluno(null);
    setCurrentPage(1);
  };

  // Função para selecionar aluno
  const handleSelectAluno = (aluno) => {
    setSelectedAluno(aluno);
    setResults([]);
    setSearchData({
      codigo: "",
      cpf: "",
      nome: "",
    });
    setMessage({ type: "", text: "" });
  };

  // Função para voltar para busca
  const handleBackToSearch = () => {
    setSelectedAluno(null);
    setIsEditing(false);
    setEditFormData({});
    setArquivosEdit({ foto: null, contrato: null });
    setMessage({ type: "", text: "" });
  };

  // Função para editar aluno
  const handleEdit = () => {
    setIsEditing(true);
    setEditFormData({ ...selectedAluno });
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
    setArquivosEdit({ foto: null, contrato: null });
  };

  // Função para alternar situação do aluno
  const handleToggleSituacao = async () => {
    if (!selectedAluno) return;

    const novoStatus =
      selectedAluno.Alunos_Situacao === "Ativo" ? "Inativo" : "Ativo";
    const acao = novoStatus === "Ativo" ? "ativar" : "desativar";

    const confirmar = window.confirm(
      `Tem certeza que deseja ${acao} o aluno ${selectedAluno.Alunos_Nome}?`
    );

    if (!confirmar) return;

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const usuarioLogado = getUsuario && getUsuario();
      const response = await api.patch(
        `/alunos/update/${selectedAluno.Alunos_Codigo}`,
        {
          Alunos_Situacao: novoStatus,
          usuario: usuarioLogado?.login || "Sistema",
        }
      );

      setMessage({
        type: "success",
        text:
          response.data.Mensagem ||
          `Aluno ${novoStatus.toLowerCase()} com sucesso!`,
      });

      setSelectedAluno({
        ...selectedAluno,
        Alunos_Situacao: novoStatus,
      });

      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          "Erro ao atualizar status do aluno. Tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para mudar página
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    // Não limpar os resultados imediatamente; só limpe se realmente não houver dados
    setCurrentPage(1);

    // Bloco duplicado removido. O bloco correto está logo abaixo.
    setMessage({ type: "", text: "" });
    setCurrentPage(1);

    try {
      // Busca todos os alunos
      const response = await api.get("/alunos/");

      // Se a resposta for 304, não atualize os resultados (mantenha os anteriores)
      if (response.status === 304) {
        setMessage({
          type: "info",
          text: "Dados não modificados. Mantendo resultados anteriores.",
        });
        setLoading(false);
        return;
      }

      const todosAlunos = response.data.Listagem_de_Alunos || [];
      console.log("Alunos retornados pela API:", todosAlunos);
      if (todosAlunos.length > 0) {
        console.log(
          "Status de cada aluno:",
          todosAlunos.map((a) => ({
            codigo: a.Alunos_Codigo,
            nome: a.Alunos_Nome,
            situacao: a.Alunos_Situacao,
          }))
        );
      }
      const temFiltro = searchData.codigo || searchData.cpf || searchData.nome;
      let resultadosFiltrados;

      if (!temFiltro) {
        resultadosFiltrados = todosAlunos;
        console.log("Nenhum filtro aplicado - mostrando todos os alunos");
      } else {
        console.log("Aplicando filtros:", searchData);
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

      resultadosFiltrados = resultadosFiltrados.filter((aluno) => {
        if (mostrarInativos) {
          return aluno.Alunos_Situacao === "Inativo";
        } else {
          return aluno.Alunos_Situacao === "Ativo";
        }
      });

      console.log("Resultados filtrados:", resultadosFiltrados.length);

      if (resultadosFiltrados.length === 0) {
        setResults([]);
        setMessage({
          type: "error",
          text: "Nenhum aluno encontrado com os critérios informados.",
        });
      } else {
        const resultadosOrdenados = ordenarResultados(
          resultadosFiltrados,
          sortBy
        );
        setResults(resultadosOrdenados);
        setMessage({
          type: "success",
          text: temFiltro
            ? `${resultadosFiltrados.length} aluno(s) encontrado(s).`
            : `Listando todos os ${resultadosFiltrados.length} aluno(s) cadastrados.`,
        });
        setTimeout(() => {
          setMessage({ type: "", text: "" });
        }, 1500);
      }
    } catch (error) {
      console.error("Erro ao pesquisar alunos:", error);
      console.error("Detalhes do erro:", error.response);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.message ||
          "Erro ao pesquisar alunos. Tente novamente.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileEditChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setArquivosEdit((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const buscarCEP = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();

      if (data.erro) {
        setMessage({
          type: "error",
          text: "CEP não encontrado. Verifique o número digitado.",
        });
        return;
      }

      setEditFormData((prev) => ({
        ...prev,
        Alunos_Endereco: data.logradouro || "",
        Alunos_Endereco_Bairro: data.bairro || "",
        Alunos_Endereco_Localidade: data.bairro || "",
        Alunos_Endereco_Cidade: data.localidade || "",
        Alunos_Endereco_Estado: data.uf || "",
      }));
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setMessage({
        type: "error",
        text: "Erro ao buscar CEP. Tente novamente.",
      });
    } finally {
      setLoadingCep(false);
    }
  };

  const formatarCEP = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    return apenasNumeros.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const handleCepEditChange = (e) => {
    const { value } = e.target;
    const cepFormatado = formatarCEP(value);

    setEditFormData((prev) => ({
      ...prev,
      Alunos_Endereco_CEP: cepFormatado,
    }));

    // Limpa mensagem de erro anterior
    setMessage({ type: "", text: "" });

    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) {
      buscarCEP(value);
    }
  };

  const formatarTelefone = (valor) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    if (apenasNumeros.length <= 10) {
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      return apenasNumeros
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleTelefoneEditChange = (e) => {
    const { name, value } = e.target;
    // Permite digitar só números e aplicar máscara
    let apenasNumeros = value.replace(/\D/g, "");
    // Limita a 11 dígitos
    if (apenasNumeros.length > 11) {
      apenasNumeros = apenasNumeros.slice(0, 11);
    }
    const telefoneFormatado = formatarTelefone(apenasNumeros);
    setEditFormData((prev) => ({
      ...prev,
      [name]: telefoneFormatado,
    }));
  };

  const handleCPFEditChange = (e) => {
    const { value } = e.target;
    const cpfFormatado = formatarCPF(value);
    setEditFormData((prev) => ({
      ...prev,
      Alunos_CPF: cpfFormatado,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validação dos telefones: exatamente 11 dígitos (com máscara)
    const telPrincipal = (editFormData.Alunos_Telefone || "").replace(
      /\D/g,
      ""
    );
    const telEmerg1 = (editFormData.Alunos_Telefone_Emergencia_1 || "").replace(
      /\D/g,
      ""
    );
    const telEmerg2 = (editFormData.Alunos_Telefone_Emergencia_2 || "").replace(
      /\D/g,
      ""
    );
    if (editFormData.Alunos_Telefone && telPrincipal.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone principal deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }
    if (editFormData.Alunos_Telefone_Emergencia_1 && telEmerg1.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone de emergência 1 deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }
    if (editFormData.Alunos_Telefone_Emergencia_2 && telEmerg2.length !== 11) {
      setMessage({
        type: "error",
        text: "O telefone de emergência 2 deve ter exatamente 11 dígitos.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();

      // Adiciona todos os campos do formulário
      Object.keys(editFormData).forEach((key) => {
        if (key !== "Alunos_Foto" && key !== "Alunos_Contrato") {
          formDataToSend.append(key, editFormData[key]);
        }
      });

      // Adiciona os novos arquivos se foram selecionados
      if (arquivosEdit.foto) {
        formDataToSend.append("foto", arquivosEdit.foto);
      }
      if (arquivosEdit.contrato) {
        formDataToSend.append("contrato", arquivosEdit.contrato);
      }

      // Adiciona usuário logado para o log
      const usuarioLogado = getUsuario();
      if (usuarioLogado) {
        formDataToSend.append("usuario", usuarioLogado.login);
      }

      const response = await api.patch(
        `/alunos/update/${selectedAluno.Alunos_Codigo}`,
        formDataToSend,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage({
        type: "success",
        text: response.data.Mensagem || "Aluno atualizado com sucesso!",
      });

      // Limpa a mensagem após 1.5 segundos
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);

      // Atualiza os dados do aluno selecionado
      setSelectedAluno(response.data.Aluno_Atualizado);
      setIsEditing(false);
      setArquivosEdit({ foto: null, contrato: null });
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.Mensagem ||
          error.response?.data?.Erro ||
          "Erro ao atualizar aluno. Tente novamente.",
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
      {/* Se um aluno foi selecionado, mostra os detalhes */}
      {selectedAluno ? (
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={handleToggleSituacao}
                  className={`text-white px-4 py-2 rounded-md ${
                    selectedAluno.Alunos_Situacao === "Ativo"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {selectedAluno.Alunos_Situacao === "Ativo"
                    ? "⛔ Desativar"
                    : "✅ Ativar"}
                </button>
              </>
            )}
          </div>

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

          <h3 className="text-xl font-bold text-white mb-4">
            {isEditing ? "Editar Aluno" : "Detalhes do Aluno"}
          </h3>

          {isEditing ? (
            /* FORMULÁRIO DE EDIÇÃO - PADRÃO MOBILE */
            <form
              onSubmit={handleUpdateSubmit}
              className="bg-gray-800 rounded-xl p-6 space-y-4 mx-auto"
            >
              {/* Foto do Aluno */}
              {selectedAluno.Alunos_Foto && (
                <div className="flex flex-col items-center mb-2">
                  <label className="font-bold text-gray-300 mb-1">
                    Foto Atual:
                  </label>
                  <img
                    src={`https://api2.plantandoalegria.com.br/uploads/fotos/${selectedAluno.Alunos_Foto}`}
                    alt={selectedAluno.Alunos_Nome}
                    className="w-32 h-32 object-cover rounded-md border-2 border-gray-300"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              {/* Upload Nova Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova Foto
                </label>
                <input
                  type="file"
                  name="foto"
                  onChange={handleFileEditChange}
                  accept="image/*"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
                {arquivosEdit.foto && (
                  <span className="text-sm text-green-600">
                    📷 {arquivosEdit.foto.name} (
                    {(arquivosEdit.foto.size / 1024).toFixed(1)} KB)
                  </span>
                )}
              </div>
              {/* Upload Novo Contrato */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Novo Contrato
                </label>
                <input
                  type="file"
                  name="contrato"
                  onChange={handleFileEditChange}
                  accept="application/pdf,image/*"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
                {arquivosEdit.contrato && (
                  <span className="text-sm text-green-600">
                    📄 {arquivosEdit.contrato.name} (
                    {(arquivosEdit.contrato.size / 1024).toFixed(1)} KB)
                  </span>
                )}
                {selectedAluno.Alunos_Contrato && !arquivosEdit.contrato && (
                  <span className="text-sm text-gray-600">
                    Atual: {selectedAluno.Alunos_Contrato}
                  </span>
                )}
              </div>
              {/* Código do Aluno (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Código do Aluno *
                </label>
                <input
                  type="number"
                  name="Alunos_Codigo"
                  value={editFormData.Alunos_Codigo || ""}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  readOnly
                />
              </div>
              {/* Nome Completo */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  name="Alunos_Nome"
                  value={editFormData.Alunos_Nome || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  required
                />
              </div>
              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CPF *
                </label>
                <input
                  type="text"
                  name="Alunos_CPF"
                  value={editFormData.Alunos_CPF || ""}
                  onChange={handleCPFEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  placeholder="000.000.000-00"
                  maxLength="14"
                  required
                />
              </div>
              {/* Nome do Responsável */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Responsável
                </label>
                <input
                  type="text"
                  name="Alunos_Nome_Responsavel"
                  value={editFormData.Alunos_Nome_Responsavel || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
              </div>
              {/* CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  CEP *
                </label>
                <div className="relative w-full">
                  <input
                    type="text"
                    name="Alunos_Endereco_CEP"
                    value={editFormData.Alunos_Endereco_CEP || ""}
                    onChange={handleCepEditChange}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                    placeholder="00000-000"
                    maxLength="9"
                    required
                  />
                  {loadingCep && (
                    <span className="absolute right-2 top-2 text-white text-sm">
                      Buscando...
                    </span>
                  )}
                </div>
              </div>
              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Endereço *
                </label>
                <input
                  type="text"
                  name="Alunos_Endereco"
                  value={editFormData.Alunos_Endereco || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  readOnly
                  required
                />
              </div>
              {/* Complemento */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  name="Alunos_Endereco_Complemento"
                  value={editFormData.Alunos_Endereco_Complemento || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
              </div>
              {/* Bairro */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="Alunos_Endereco_Bairro"
                  value={editFormData.Alunos_Endereco_Bairro || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  readOnly
                  required
                />
              </div>
              {/* Cidade */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="Alunos_Endereco_Cidade"
                  value={editFormData.Alunos_Endereco_Cidade || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  readOnly
                  required
                />
              </div>
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  name="Alunos_Endereco_Estado"
                  value={editFormData.Alunos_Endereco_Estado || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  maxLength="2"
                  readOnly
                  required
                />
              </div>
              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone *
                </label>
                <input
                  type="tel"
                  name="Alunos_Telefone"
                  value={editFormData.Alunos_Telefone || ""}
                  onChange={handleTelefoneEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                  required
                />
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="Alunos_Email"
                  value={editFormData.Alunos_Email || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  required
                />
              </div>
              {/* Contato de Emergência */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contato de Emergência
                </label>
                <input
                  type="text"
                  name="Alunos_Contato_Emergencia"
                  value={editFormData.Alunos_Contato_Emergencia || ""}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                />
              </div>
              {/* Telefone Emergência 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone Emergência 1
                </label>
                <input
                  type="tel"
                  name="Alunos_Telefone_Emergencia_1"
                  value={editFormData.Alunos_Telefone_Emergencia_1 || ""}
                  onChange={handleTelefoneEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                />
              </div>
              {/* Telefone Emergência 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefone Emergência 2
                </label>
                <input
                  type="tel"
                  name="Alunos_Telefone_Emergencia_2"
                  value={editFormData.Alunos_Telefone_Emergencia_2 || ""}
                  onChange={handleTelefoneEditChange}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
                  placeholder="(00) 00000-0000"
                  maxLength="15"
                />
              </div>
              {/* Botões */}
              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  {loading ? "Salvando..." : "💾 Salvar Alterações"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={loading}
                  className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          ) : (
            /* VISUALIZAÇÃO DE DETALHES */
            <div className="w-full h-auto space-y-2 mx-auto">
              {/* Debug: Mostrar valor do campo Alunos_Foto */}
              {console.log("🔍 Dados do aluno selecionado:", selectedAluno)}
              {console.log("📷 Alunos_Foto:", selectedAluno.Alunos_Foto)}

              {/* Foto do Aluno */}
              {selectedAluno.Alunos_Foto ? (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                  <label className="font-bold">Foto:</label>
                  <div className="flex flex-col gap-2">
                    <img
                      src={`https://api2.plantandoalegria.com.br/uploads/fotos/${selectedAluno.Alunos_Foto}`}
                      alt={selectedAluno.Alunos_Nome}
                      className="w-48 h-48 object-cover rounded-md border-2 border-gray-300"
                      onError={(e) => {
                        console.error(
                          "❌ Erro ao carregar foto:",
                          selectedAluno.Alunos_Foto
                        );
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                      onLoad={() =>
                        console.log("✅ Foto carregada com sucesso!")
                      }
                    />
                    <span
                      className="text-sm text-red-600"
                      style={{ display: "none" }}
                    >
                      ⚠️ Erro ao carregar foto: {selectedAluno.Alunos_Foto}
                    </span>
                    <span className="text-xs text-gray-500">
                      Arquivo: {selectedAluno.Alunos_Foto}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                  <label className="font-bold">Foto:</label>
                  <span className="text-gray-500 italic">
                    Nenhuma foto cadastrada
                  </span>
                </div>
              )}

              {/* Contrato do Aluno */}
              {selectedAluno.Alunos_Contrato && (
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
                  <label className="font-bold">Contrato:</label>
                  <a
                    href={`https://api2.plantandoalegria.com.br/uploads/contratos/${selectedAluno.Alunos_Contrato}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 underline"
                  >
                    📄 Ver Contrato
                  </a>
                </div>
              )}

              {/* Card único com todos os detalhes */}
              <div className="bg-gray-800 rounded-xl p-4 space-y-3">
                {/* Situação */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Situação:</div>
                  <div
                    className={`font-semibold ${
                      selectedAluno.Alunos_Situacao === "Ativo"
                        ? "text-green-400"
                        : "text-orange-400"
                    }`}
                  >
                    {selectedAluno.Alunos_Situacao}
                  </div>
                </div>

                {/* Código do Aluno */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Código do Aluno:
                  </div>
                  <div>{selectedAluno.Alunos_Codigo}</div>
                </div>

                {/* Nome Completo */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Nome Completo:</div>
                  <div>{selectedAluno.Alunos_Nome}</div>
                </div>

                {/* CPF */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">CPF:</div>
                  <div>{selectedAluno.Alunos_CPF}</div>
                </div>

                {/* Nome do Responsável */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Nome do Responsável:
                  </div>
                  <div>{selectedAluno.Alunos_Nome_Responsavel}</div>
                </div>

                {/* CEP */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">CEP:</div>
                  <div>{selectedAluno.Alunos_Endereco_CEP}</div>
                </div>

                {/* Endereço */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Endereço:</div>
                  <div>{selectedAluno.Alunos_Endereco}</div>
                </div>

                {/* Complemento */}
                {selectedAluno.Alunos_Endereco_Complemento && (
                  <div className="text-sm md:text-base">
                    <div className="font-bold text-gray-400">Complemento:</div>
                    <div>{selectedAluno.Alunos_Endereco_Complemento}</div>
                  </div>
                )}

                {/* Bairro */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Bairro:</div>
                  <div>{selectedAluno.Alunos_Endereco_Bairro}</div>
                </div>

                {/* Localidade */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Localidade:</div>
                  <div>{selectedAluno.Alunos_Endereco_Localidade}</div>
                </div>

                {/* Cidade */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Cidade:</div>
                  <div>{selectedAluno.Alunos_Endereco_Cidade}</div>
                </div>

                {/* Estado */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Estado:</div>
                  <div>{selectedAluno.Alunos_Endereco_Estado}</div>
                </div>

                {/* Telefone */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Telefone:</div>
                  <div>{selectedAluno.Alunos_Telefone}</div>
                </div>

                {/* Email */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">Email:</div>
                  <div>{selectedAluno.Alunos_Email}</div>
                </div>

                {/* Contato de Emergência */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Contato de Emergência:
                  </div>
                  <div>{selectedAluno.Alunos_Contato_Emergencia}</div>
                </div>
                {/* Telefone Emergência 1 */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Telefone Emergência 1:
                  </div>
                  <div>{selectedAluno.Alunos_Telefone_Emergencia_1}</div>
                </div>
                {/* Telefone Emergência 2 */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Telefone Emergência 2:
                  </div>
                  <div>
                    {selectedAluno.Alunos_Telefone_Emergencia_2 || (
                      <span className="text-gray-500 italic">
                        Não informado
                      </span>
                    )}
                  </div>
                </div>
                {/* Data de Matrícula */}
                <div className="text-sm md:text-base">
                  <div className="font-bold text-gray-400">
                    Data de Matrícula:
                  </div>
                  <div>
                    {selectedAluno.Alunos_Data_Matricula ? (
                      (() => {
                        const d = selectedAluno.Alunos_Data_Matricula;
                        const parts =
                          d.length >= 10 ? d.substring(0, 10).split("-") : null;
                        if (parts && parts.length === 3) {
                          return `${parts[2]}/${parts[1]}/${parts[0]}`;
                        }
                        return d;
                      })()
                    ) : (
                      <span className="text-gray-500 italic">
                        Não informada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full">
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

          {/* Formulário de Pesquisa */}
          <form
            onSubmit={handleSearch}
            className="w-full h-auto p-2 sm:p-4 space-y-2 sm:space-y-4 mx-auto"
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Pesquisar Aluno
            </h3>

            {/* Código */}
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

            {/* CPF */}
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

            {/* Checkbox Inativos */}
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

          {/* Resultados da Pesquisa */}
          {results.length > 0 && (
            <div className="w-full mt-6">
              {/* Header - Desktop */}
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

              {/* Header - Mobile */}
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

export const StudentsComponents = {
  Students,
  StudentForm,
  StudentSearch,
  StudentPlan,
};
