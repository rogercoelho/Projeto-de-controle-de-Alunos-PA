import React, { useState, useRef } from "react";
import {
  calcularIdade,
  formatarTelefone,
  formatarCPF,
  formatarCEP,
} from "./studentUtils";
import api from "../../services/api";

function StudentForm() {
  const [formData, setFormData] = useState({
    Alunos_Codigo: "",
    Alunos_Nome: "",
    Alunos_CPF: "",
    Alunos_Data_Nascimento: "",
    Alunos_Nome_Responsavel: "",
    Alunos_CPF_Responsavel: "",
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

  // Esconde a mensagem após 1,5s
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [message.text]);
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
    const cepLimpo = cep.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;
    setLoadingCep(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cepLimpo}/json/`
      );
      const data = await response.json();
      if (data.erro) {
        setMessage({ type: "error", text: "CEP não encontrado." });
        setFormData((prev) => ({
          ...prev,
          Alunos_Endereco: "",
          Alunos_Endereco_Bairro: "",
          Alunos_Endereco_Localidade: "",
          Alunos_Endereco_Cidade: "",
          Alunos_Endereco_Estado: "",
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          Alunos_Endereco: data.logradouro || "",
          Alunos_Endereco_Bairro: data.bairro || "",
          Alunos_Endereco_Localidade: data.localidade || "",
          Alunos_Endereco_Cidade: data.localidade || "",
          Alunos_Endereco_Estado: data.uf || "",
        }));
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao buscar CEP." + error });
    } finally {
      setLoadingCep(false);
    }
  };

  const handleTelefoneChange = (e) => {
    const { name, value } = e.target;
    let apenasNumeros = value.replace(/\D/g, "");
    if (apenasNumeros.length > 11) apenasNumeros = apenasNumeros.slice(0, 11);
    const telefoneFormatado = formatarTelefone(apenasNumeros);
    setFormData((prev) => ({
      ...prev,
      [name]: telefoneFormatado,
    }));
  };

  const handleCPFChange = (e) => {
    const { name, value } = e.target;
    const cpfFormatado = formatarCPF(value);
    setFormData((prev) => ({
      ...prev,
      [name]: cpfFormatado,
    }));
  };

  const handleCepChangeFormatado = (e) => {
    const { value } = e.target;
    const cepFormatado = formatarCEP(value);
    setFormData((prev) => ({
      ...prev,
      Alunos_Endereco_CEP: cepFormatado,
    }));
    setMessage({ type: "", text: "" });
    const cepLimpo = value.replace(/\D/g, "");
    if (cepLimpo.length === 8) buscarCEP(cepLimpo);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    const telPrincipal = formData.Alunos_Telefone.replace(/\D/g, "");
    const telEmerg1 = formData.Alunos_Telefone_Emergencia_1.replace(/\D/g, "");
    const telEmerg2 = formData.Alunos_Telefone_Emergencia_2.replace(/\D/g, "");
    if (formData.Alunos_Telefone && telPrincipal.length !== 11) {
      setMessage({
        type: "error",
        text: "Telefone principal deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }
    if (formData.Alunos_Telefone_Emergencia_1 && telEmerg1.length !== 11) {
      setMessage({
        type: "error",
        text: "Telefone de emergência 1 deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }
    if (formData.Alunos_Telefone_Emergencia_2 && telEmerg2.length !== 11) {
      setMessage({
        type: "error",
        text: "Telefone de emergência 2 deve ter 11 dígitos.",
      });
      setLoading(false);
      return;
    }

    try {
      // Se houver arquivos, usa FormData
      let response;
      if (arquivos.foto || arquivos.contrato) {
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          data.append(key, value);
        });
        if (arquivos.foto) data.append("foto", arquivos.foto);
        if (arquivos.contrato) data.append("contrato", arquivos.contrato);
        response = await api.post("/alunos/create/", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/alunos/create/", formData);
      }
      const resData = response.data;
      const isSuccess =
        resData.Mensagem && resData.Mensagem.toLowerCase().includes("sucesso");
      if (isSuccess) {
        setMessage({
          type: "success",
          text: resData.Mensagem || "Aluno cadastrado com sucesso!",
        });
        handleReset();
      } else {
        setMessage({
          type: "error",
          text: resData.Erro || resData.Mensagem || "Erro ao cadastrar aluno.",
        });
      }
    } catch (error) {
      let msg = "Erro ao cadastrar aluno.";
      if (error.response && error.response.data) {
        const errData = error.response.data;
        msg = errData.Erro || errData.Mensagem || msg;
      }
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      Alunos_Codigo: "",
      Alunos_Nome: "",
      Alunos_CPF: "",
      Alunos_Data_Nascimento: "",
      Alunos_Nome_Responsavel: "",
      Alunos_CPF_Responsavel: "",
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
    setArquivos({ foto: null, contrato: null });
    if (fotoInputRef.current) fotoInputRef.current.value = "";
    if (contratoInputRef.current) contratoInputRef.current.value = "";
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      setArquivos((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  return (
    <div className="w-full h-auto">
      {message.text &&
        (() => {
          console.log("DEBUG message:", message);
          return null;
        })()}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto ${
            (message.type && message.type.trim().toLowerCase() === "success") ||
            (message.text && message.text.toLowerCase().includes("sucesso"))
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

        {/* Nome Completo */}
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

        {/* Data de Nascimento */}
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

        {/* CPF */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF{calcularIdade(formData.Alunos_Data_Nascimento) >= 18 ? ' *' : ''}
          </label>
          <input
            type="text"
            name="Alunos_CPF"
            value={formData.Alunos_CPF}
            onChange={handleCPFChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="000.000.000-00"
            maxLength="14"
            required={calcularIdade(formData.Alunos_Data_Nascimento) >= 18}
          />
        </div>

        {/* Nome do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Responsável{calcularIdade(formData.Alunos_Data_Nascimento) < 18 ? ' *' : ''}
          </label>
          <input
            type="text"
            name="Alunos_Nome_Responsavel"
            value={formData.Alunos_Nome_Responsavel}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Deixe em branco se for maior de idade"
            required={calcularIdade(formData.Alunos_Data_Nascimento) < 18}
          />
        </div>

        {/* CPF do Responsável */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF do Responsável{calcularIdade(formData.Alunos_Data_Nascimento) < 18 ? ' *' : ''}
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

        {/* Telefone Emergência 1 */}
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

        {/* Telefone Emergência 2 */}
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

export default StudentForm;
