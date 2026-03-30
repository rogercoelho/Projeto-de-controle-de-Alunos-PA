import {
  calcularIdade,
  validarCPF,
  formatarCPF,
  formatarTelefone,
  formatarCEP,
  converterData,
  corCampoEditavel,
} from "../../utils/Utils";
import api from "../../services/api";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";
import useBuscarCEP from "../../hooks/BuscarCep";
import React, { useRef } from "react";
import PropTypes from "prop-types";
import PhotoSkeleton from "../miscellaneous/PhotoSkeleton";
import Buttons from "../miscellaneous/Buttons";

function StudentEditForm({
  editFormData: initialFormData,
  onSaveSuccess,
  onCancel,
  arquivosEdit,
  onFileChange,
  loading,
  loadingCep,
  selectedAluno,
}) {
  const formRef = useRef(null);
  const codigoOriginalRef = useRef(initialFormData?.Alunos_Codigo);
  // Estado local do formulário de edição
  const [editFormData, setEditFormData] = React.useState(initialFormData);
  // Atualiza o estado local se mudar o aluno selecionado
  React.useEffect(() => {
    setEditFormData(initialFormData);
    codigoOriginalRef.current = initialFormData?.Alunos_Codigo;
  }, [initialFormData]);

  // Estado para Aluno de Aplicativo
  const [alunoAplicativo, setAlunoAplicativo] = React.useState(
    !!(initialFormData?.Alunos_Aplicativo),
  );
  React.useEffect(() => {
    setAlunoAplicativo(!!(initialFormData?.Alunos_Aplicativo));
  }, [initialFormData]);

  const {
    loadingCep: loadingCepBuscando,
    dadosCep,
    erroCep,
  } = useBuscarCEP(editFormData.Alunos_Endereco_CEP);

  // Handler do checkbox Aluno de Aplicativo
  const handleAlunoAplicativoChange = (e) => {
    const novoValor = e.target.checked;
    setAlunoAplicativo(novoValor);
    setEditFormData((prev) => ({ ...prev, Alunos_Aplicativo: novoValor }));
  };

  const isCampoVazio = (fieldValue) =>
    fieldValue === undefined ||
    fieldValue === null ||
    String(fieldValue).trim() === "" ||
    String(fieldValue).trim().toLowerCase() === "null" ||
    String(fieldValue).trim().toLowerCase() === "undefined" ||
    String(fieldValue).trim() === "0000-00-00";

  const fieldEditable = (fieldValue) => {
    if (alunoAplicativo) return true;
    return isCampoVazio(fieldValue);
  };
  // Ref para o input de foto
  const fotoInputRef = useRef(null);
  // Ref para o input de contrato
  const contratoInputRef = useRef(null);
  // Estado local para forçar atualização visual imediata
  const [fotoRemovida, setFotoRemovida] = React.useState(false);
  const [contratoRemovido, setContratoRemovido] = React.useState(false);
  // Resetar controle local ao selecionar nova foto
  React.useEffect(() => {
    setFotoRemovida(false);
  }, [arquivosEdit.foto]);
  // Resetar controle local ao selecionar novo contrato
  React.useEffect(() => {
    setContratoRemovido(false);
  }, [arquivosEdit.contrato]);
  // Toast custom hook
  const [messageToast, showToast] = useToast();

  React.useEffect(() => {
    if (dadosCep) {
      setEditFormData((prev) => ({
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

  // Handler local para campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (typeof e.target.setCustomValidity === "function") {
      e.target.setCustomValidity("");
    }
    if (
      name === "Alunos_CPF" ||
      name === "Alunos_CPF_Pai_Responsavel" ||
      name === "Alunos_CPF_Mae_Responsavel"
    ) {
      newValue = formatarCPF(value);
    }
    if (
      name === "Alunos_Telefone" ||
      name === "Alunos_Telefone_Emergencia_1" ||
      name === "Alunos_Telefone_Emergencia_2"
    ) {
      newValue = formatarTelefone(value);
    }
    setEditFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleCepChangeFormatado = (e) => {
    const { value } = e.target;
    const cepFormatado = formatarCEP(value);
    setEditFormData((prev) => ({
      ...prev,
      Alunos_Endereco_CEP: cepFormatado,
    }));
    showToast({ type: "", text: "" });
  };
  // Lógica de controle de edição dos campos
  const idade = calcularIdade(editFormData.Alunos_Data_Nascimento);

  // CPF do aluno: readonly se já estava preenchido ao abrir
  // Tornar CPF editável no formulário de edição conforme solicitado
  const cpfAlunoReadOnly = false;
  // CPF do aluno: obrigatório se maior de 18 anos
  const cpfAlunoObrigatorio = idade >= 18;
  const dataNascimentoEditavel = fieldEditable(
    editFormData.Alunos_Data_Nascimento
  );
  const dataMatriculaEditavel = fieldEditable(
    editFormData.Alunos_Data_Matricula
  );

  const focarCampo = (fieldName) => {
    const campo = formRef.current?.querySelector(`[name="${fieldName}"]`);
    return campo || null;
  };

  const apontarCampoObrigatorio = (
    fieldName,
    mensagem = "Preencha este campo."
  ) => {
    const campo = focarCampo(fieldName);
    if (!campo) return false;
    if (typeof campo.setCustomValidity === "function") {
      campo.setCustomValidity(mensagem);
    }
    if (typeof campo.reportValidity === "function") {
      campo.reportValidity();
    }
    return false;
  };

  const validarCamposObrigatorios = () => {
    if (alunoAplicativo) return true;

    const camposObrigatorios = [
      { name: "Alunos_Codigo", label: "Código do Aluno" },
      { name: "Alunos_Nome", label: "Nome Completo" },
      { name: "Alunos_Data_Nascimento", label: "Data de Nascimento" },
      { name: "Alunos_Data_Matricula", label: "Data de Matrícula" },
      { name: "Alunos_Endereco_CEP", label: "CEP" },
      { name: "Alunos_Endereco", label: "Endereço" },
      { name: "Alunos_Endereco_Bairro", label: "Bairro" },
      { name: "Alunos_Endereco_Localidade", label: "Localidade" },
      { name: "Alunos_Endereco_Cidade", label: "Cidade" },
      { name: "Alunos_Endereco_Estado", label: "Estado" },
      { name: "Alunos_Telefone", label: "Telefone" },
      { name: "Alunos_Email", label: "Email" },
      {
        name: "Alunos_Contato_Emergencia",
        label: "Nome do Contato de Emergência",
      },
      {
        name: "Alunos_Telefone_Emergencia_1",
        label: "Telefone Emergência 1",
      },
    ];

    const primeiroCampoFaltante = camposObrigatorios.find(({ name }) => {
      const valor = editFormData[name];
      return isCampoVazio(valor);
    });

    if (primeiroCampoFaltante) {
      return apontarCampoObrigatorio(primeiroCampoFaltante.name);
    }

    if (cpfAlunoObrigatorio && !editFormData.Alunos_CPF?.trim()) {
      return apontarCampoObrigatorio("Alunos_CPF");
    }

    if (!cpfAlunoObrigatorio) {
      const paiNome = !!editFormData.Alunos_Nome_Pai_Responsavel?.trim();
      const paiCpf = !!editFormData.Alunos_CPF_Pai_Responsavel?.trim();
      const maeNome = !!editFormData.Alunos_Nome_Mae_Responsavel?.trim();
      const maeCpf = !!editFormData.Alunos_CPF_Mae_Responsavel?.trim();

      const paiCompleto = paiNome && paiCpf;
      const maeCompleta = maeNome && maeCpf;

      if (!paiCompleto && !maeCompleta) {
        if (paiNome && !paiCpf) {
          return apontarCampoObrigatorio("Alunos_CPF_Pai_Responsavel");
        }
        if (!paiNome && paiCpf) {
          return apontarCampoObrigatorio("Alunos_Nome_Pai_Responsavel");
        }
        if (maeNome && !maeCpf) {
          return apontarCampoObrigatorio("Alunos_CPF_Mae_Responsavel");
        }
        if (!maeNome && maeCpf) {
          return apontarCampoObrigatorio("Alunos_Nome_Mae_Responsavel");
        }
        return apontarCampoObrigatorio("Alunos_Nome_Pai_Responsavel");
      }
    }

    return true;
  };

  // Observação: validações específicas de pai/mãe para menores são
  // realizadas no submit (exigem pai ou mãe com nome+CPF). Removidas
  // flags legadas de `Responsavel`.

  /* Setloading para atualizar o estado de carregamento (botoes) */
  const [loadingbutton, setLoadingbutton] = React.useState(false);

  return (
    <div>
      <form
        ref={formRef}
        onSubmit={async (e) => {
          e.preventDefault();
          setLoadingbutton(true);
          try {
            if (!validarCamposObrigatorios()) {
              return;
            }
            // Validação de CPF do aluno
            if (
              editFormData.Alunos_CPF &&
              !validarCPF(editFormData.Alunos_CPF)
            ) {
              showToast({ type: "error", text: "CPF do aluno inválido" });
              return;
            }
            // Para menores: exigir (pai nome + pai cpf válidos) OU (mae nome + mae cpf válidos)
            // Somente se não for aluno de aplicativo
            if (!alunoAplicativo && calcularIdade(editFormData.Alunos_Data_Nascimento) < 18) {
              const paiHasName = !!(
                editFormData.Alunos_Nome_Pai_Responsavel &&
                editFormData.Alunos_Nome_Pai_Responsavel.trim()
              );
              const paiHasCpf = !!(
                editFormData.Alunos_CPF_Pai_Responsavel &&
                editFormData.Alunos_CPF_Pai_Responsavel.trim()
              );
              const paiCpfInvalid =
                paiHasCpf &&
                !validarCPF(editFormData.Alunos_CPF_Pai_Responsavel);
              const paiValido = paiHasName && paiHasCpf && !paiCpfInvalid;

              const maeHasName = !!(
                editFormData.Alunos_Nome_Mae_Responsavel &&
                editFormData.Alunos_Nome_Mae_Responsavel.trim()
              );
              const maeHasCpf = !!(
                editFormData.Alunos_CPF_Mae_Responsavel &&
                editFormData.Alunos_CPF_Mae_Responsavel.trim()
              );
              const maeCpfInvalid =
                maeHasCpf &&
                !validarCPF(editFormData.Alunos_CPF_Mae_Responsavel);
              const maeValida = maeHasName && maeHasCpf && !maeCpfInvalid;

              // Se ambos CPFs preenchidos, validar ambos e mostrar mensagens específicas
              if (paiHasCpf && maeHasCpf) {
                if (paiCpfInvalid && !maeCpfInvalid) {
                  showToast({ type: "error", text: "CPF do pai inválido" });
                  return;
                }
                if (maeCpfInvalid && !paiCpfInvalid) {
                  showToast({ type: "error", text: "CPF da mãe inválido" });
                  return;
                }
                if (paiCpfInvalid && maeCpfInvalid) {
                  showToast({
                    type: "error",
                    text: "CPF do pai inválido e CPF da mãe inválido",
                  });
                  return;
                }
              } else if (paiHasCpf && !maeHasCpf) {
                if (paiCpfInvalid) {
                  showToast({ type: "error", text: "CPF do pai inválido" });
                  return;
                }
              } else if (maeHasCpf && !paiHasCpf) {
                if (maeCpfInvalid) {
                  showToast({ type: "error", text: "CPF da mãe inválido" });
                  return;
                }
              }

              // Se não há CPFs inválidos, garantir que ao menos uma combinação nome+cpf válida exista
              if (!paiValido && !maeValida) {
                showToast({
                  type: "error",
                  text: "Nome e CPF do pai ou nome e CPF da mãe são obrigatórios para menores de 18 anos.",
                });
                return;
              }
            }
            const formDataConvertido = {
              ...editFormData,
              Alunos_Data_Nascimento: converterData(
                editFormData.Alunos_Data_Nascimento,
              ),
              // Mantém campos de pai e mãe (não altera nomes aqui)
            };
            let response;
            if (arquivosEdit.foto || arquivosEdit.contrato) {
              const data = new FormData();
              Object.entries(formDataConvertido).forEach(([key, value]) => {
                data.append(key, value);
              });
              if (arquivosEdit.foto) data.append("foto", arquivosEdit.foto);
              if (arquivosEdit.contrato)
                data.append("contrato", arquivosEdit.contrato);
              response = await api.patch(
                `/alunos/update/${codigoOriginalRef.current}`,
                data,
                { headers: { "Content-Type": "multipart/form-data" } },
              );
            } else {
              response = await api.patch(
                `/alunos/update/${codigoOriginalRef.current}`,
                formDataConvertido,
              );
            }
            const resData = response.data;
            if (resData && resData.statusCode === 200) {
              showToast({
                type: "success",
                text: resData.Mensagem || "Alterações salvas com sucesso!",
              });
              // Chama o callback correto para atualizar e fechar o formulário
              if (typeof onSaveSuccess === "function")
                onSaveSuccess(editFormData);
            } else {
              showToast({
                type: "error",
                text: resData.Mensagem || "Erro ao salvar alterações.",
              });
            }
          } catch (error) {
            // Se for erro 401, o interceptor global já trata
            if (error?.response?.status !== 401) {
              showToast({
                type: "error",
                text:
                  error?.response?.data?.Mensagem ||
                  "Erro ao salvar alterações.",
              });
            }
          } finally {
            setLoadingbutton(false);
          }
        }}
        className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-4 mx-auto"
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
        <div>
          <div className="flex flex-col mb-6">
            <label className="font-bold text-gray-300 mb-1">Foto:</label>
            <div className="flex flex-col gap-2">
              {/* Se houver nova foto, mostra ela. Senão, mostra a foto atual */}
              <PhotoSkeleton
                foto={
                  fotoRemovida ||
                  (!arquivosEdit.foto && !editFormData.Alunos_Foto)
                    ? null
                    : arquivosEdit.foto
                      ? URL.createObjectURL(arquivosEdit.foto)
                      : editFormData.Alunos_Foto
                }
                nome={
                  editFormData.Alunos_Nome ||
                  selectedAluno?.Alunos_Nome ||
                  "Aluno"
                }
              />
            </div>
          </div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nova Foto
          </label>
          <input
            ref={fotoInputRef}
            type="file"
            name="foto"
            onChange={(e) => {
              setFotoRemovida(false);
              onFileChange(e);
            }}
            accept="image/*"
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md"
          />
          {arquivosEdit.foto && !fotoRemovida && (
            <span className="text-sm text-green-600">
              📷 {arquivosEdit.foto.name} (
              {(arquivosEdit.foto.size / 1024).toFixed(1)} KB)
              <Buttons.BotaoX
                onClick={() => {
                  if (fotoInputRef.current) fotoInputRef.current.value = "";
                  setFotoRemovida(true);
                  onFileChange({
                    target: {
                      name: "foto",
                      files: [],
                    },
                  });
                }}
              />
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Novo Contrato
          </label>
          <input
            ref={contratoInputRef}
            type="file"
            name="contrato"
            onChange={(e) => {
              setContratoRemovido(false);
              onFileChange(e);
            }}
            accept="application/pdf,image/*"
            className="w-full px-4 py-2 bg-gray-500 text-white rounded-md"
          />
          {arquivosEdit.contrato && !contratoRemovido && (
            <span className="text-sm text-green-600 flex items-center gap-2">
              📄 {arquivosEdit.contrato.name} (
              {(arquivosEdit.contrato.size / 1024).toFixed(1)} KB)
              <Buttons.BotaoX
                onClick={() => {
                  if (contratoInputRef.current)
                    contratoInputRef.current.value = "";
                  setContratoRemovido(true);
                  onFileChange({
                    target: {
                      name: "contrato",
                      files: [],
                    },
                  });
                }}
              />
            </span>
          )}
          {selectedAluno?.Alunos_Contrato &&
            (!arquivosEdit.contrato || contratoRemovido) && (
              <span className="text-sm text-gray-600">
                Atual: {selectedAluno.Alunos_Contrato}
              </span>
            )}
        </div>

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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="Alunos_Nome"
            value={editFormData.Alunos_Nome || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Nome),
            )} text-white rounded-md`}
            required
            readOnly={!fieldEditable(editFormData.Alunos_Nome)}
          />
        </div>

        {/* Início - Aluno de Aplicativo */}
        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="editAlunoAplicativo"
            checked={alunoAplicativo}
            onChange={handleAlunoAplicativoChange}
            className="w-4 h-4 accent-blue-500 cursor-pointer"
          />
          <label
            htmlFor="editAlunoAplicativo"
            className="text-sm font-medium text-blue-400 cursor-pointer select-none"
          >
            Aluno de Aplicativo
          </label>
        </div>
        {/* FIM - Aluno de Aplicativo */}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Nascimento{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="date"
            name="Alunos_Data_Nascimento"
            value={editFormData.Alunos_Data_Nascimento || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              dataNascimentoEditavel,
            )} text-white rounded-md`}
            required={!alunoAplicativo}
            disabled={!dataNascimentoEditavel}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF{!alunoAplicativo && cpfAlunoObrigatorio ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF"
            value={editFormData.Alunos_CPF || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_CPF),
            )} text-white rounded-md`}
            placeholder="000.000.000-00"
            maxLength="14"
            readOnly={cpfAlunoReadOnly || !fieldEditable(editFormData.Alunos_CPF)}
            required={!alunoAplicativo && cpfAlunoObrigatorio}
          />
        </div>

        {/* Início - Pai / Responsavel */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Pai / Responsavel
            {!alunoAplicativo &&
            calcularIdade(editFormData.Alunos_Data_Nascimento) < 18
              ? " *"
              : ""}
          </label>
          <input
            type="text"
            name="Alunos_Nome_Pai_Responsavel"
            value={editFormData.Alunos_Nome_Pai_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Nome_Pai_Responsavel),
            )} text-white rounded-md`}
            placeholder="Deixe em branco se for maior de idade"
            readOnly={!fieldEditable(editFormData.Alunos_Nome_Pai_Responsavel)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF do Pai / Responsavel
            {!alunoAplicativo &&
            calcularIdade(editFormData.Alunos_Data_Nascimento) < 18
              ? " *"
              : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF_Pai_Responsavel"
            value={editFormData.Alunos_CPF_Pai_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_CPF_Pai_Responsavel),
            )} text-white rounded-md`}
            placeholder="000.000.000-00"
            maxLength="14"
            readOnly={!fieldEditable(editFormData.Alunos_CPF_Pai_Responsavel)}
          />
        </div>
        {/* FIM - Pai */}

        {/* Início - Mae / Responsavel */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome da Mãe / Responsavel
            {!alunoAplicativo &&
            calcularIdade(editFormData.Alunos_Data_Nascimento) < 18
              ? " *"
              : ""}
          </label>
          <input
            type="text"
            name="Alunos_Nome_Mae_Responsavel"
            value={editFormData.Alunos_Nome_Mae_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Nome_Mae_Responsavel),
            )} text-white rounded-md`}
            placeholder="Deixe em branco se for maior de idade"
            readOnly={!fieldEditable(editFormData.Alunos_Nome_Mae_Responsavel)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF da Mãe / Responsavel
            {!alunoAplicativo &&
            calcularIdade(editFormData.Alunos_Data_Nascimento) < 18
              ? " *"
              : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF_Mae_Responsavel"
            value={editFormData.Alunos_CPF_Mae_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_CPF_Mae_Responsavel),
            )} text-white rounded-md`}
            placeholder="000.000.000-00"
            maxLength="14"
            readOnly={!fieldEditable(editFormData.Alunos_CPF_Mae_Responsavel)}
          />
        </div>
        {/* FIM - Mae */}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CEP{!alunoAplicativo ? " *" : ""}
          </label>
          <div className="relative w-full">
            <input
              type="text"
              name="Alunos_Endereco_CEP"
              value={editFormData.Alunos_Endereco_CEP || ""}
              onChange={handleCepChangeFormatado}
              className={`w-full px-4 py-2 ${corCampoEditavel(
                fieldEditable(editFormData.Alunos_Endereco_CEP),
              )} text-white rounded-md`}
              placeholder="00000-000"
              maxLength="9"
              required={!alunoAplicativo}
              readOnly={!fieldEditable(editFormData.Alunos_Endereco_CEP)}
            />
            {(loadingCepBuscando || loadingCep) && (
              <span className="absolute right-2 top-2 text-white text-sm">
                Buscando...
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endereço{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Endereco"
            value={editFormData.Alunos_Endereco || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco),
            )} text-white rounded-md`}
            readOnly={!fieldEditable(editFormData.Alunos_Endereco)}
            required={!alunoAplicativo}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Complemento
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Complemento"
            value={editFormData.Alunos_Endereco_Complemento || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco_Complemento),
            )} text-white rounded-md`}
            readOnly={!fieldEditable(editFormData.Alunos_Endereco_Complemento)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bairro{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Bairro"
            value={editFormData.Alunos_Endereco_Bairro || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco_Bairro),
            )} text-white rounded-md`}
            readOnly={!fieldEditable(editFormData.Alunos_Endereco_Bairro)}
            required={!alunoAplicativo}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Localidade{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Localidade"
            value={editFormData.Alunos_Endereco_Localidade || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco_Localidade),
            )} text-white rounded-md`}
            readOnly={!fieldEditable(editFormData.Alunos_Endereco_Localidade)}
            required={!alunoAplicativo}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cidade{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Cidade"
            value={editFormData.Alunos_Endereco_Cidade || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco_Cidade),
            )} text-white rounded-md`}
            readOnly={!fieldEditable(editFormData.Alunos_Endereco_Cidade)}
            required={!alunoAplicativo}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Estado"
            value={editFormData.Alunos_Endereco_Estado || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Endereco_Estado),
            )} text-white rounded-md`}
            maxLength="2"
            readOnly={!fieldEditable(editFormData.Alunos_Endereco_Estado)}
            required={!alunoAplicativo}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="tel"
            name="Alunos_Telefone"
            value={editFormData.Alunos_Telefone || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Telefone),
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
            required={!alunoAplicativo}
            readOnly={!fieldEditable(editFormData.Alunos_Telefone)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="email"
            name="Alunos_Email"
            value={editFormData.Alunos_Email || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Email),
            )} text-white rounded-md`}
            required={!alunoAplicativo}
            readOnly={!fieldEditable(editFormData.Alunos_Email)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Contato de Emergência{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Contato_Emergencia"
            value={editFormData.Alunos_Contato_Emergencia || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Contato_Emergencia),
            )} text-white rounded-md`}
            required={!alunoAplicativo}
            readOnly={!fieldEditable(editFormData.Alunos_Contato_Emergencia)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone Emergência 1{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="tel"
            name="Alunos_Telefone_Emergencia_1"
            value={editFormData.Alunos_Telefone_Emergencia_1 || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Telefone_Emergencia_1),
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
            required={!alunoAplicativo}
            readOnly={!fieldEditable(editFormData.Alunos_Telefone_Emergencia_1)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone Emergência 2
          </label>
          <input
            type="tel"
            name="Alunos_Telefone_Emergencia_2"
            value={editFormData.Alunos_Telefone_Emergencia_2 || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              fieldEditable(editFormData.Alunos_Telefone_Emergencia_2),
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
            readOnly={!fieldEditable(editFormData.Alunos_Telefone_Emergencia_2)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Matrícula{!alunoAplicativo ? " *" : ""}
          </label>
          <input
            type="date"
            name="Alunos_Data_Matricula"
            value={editFormData.Alunos_Data_Matricula || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              dataMatriculaEditavel,
            )} text-white rounded-md`}
            required={!alunoAplicativo}
            disabled={!dataMatriculaEditavel}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Observações
          </label>
          <textarea
            name="Alunos_Observacoes"
            value={editFormData.Alunos_Observacoes || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true,
            )} text-white rounded-md`}
            placeholder="Observações sobre o aluno (opcional)"
            rows="3"
          />
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Buttons.BotaoSalvarAlteracoes
            loading={loadingbutton}
            disabled={loadingbutton}
          />
          <Buttons.BotaoCancelar onClick={onCancel} disabled={loading} />
        </div>
        {messageToast && <MessageToast messageToast={messageToast} />}
      </form>
    </div>
  );
}

export default StudentEditForm;

StudentEditForm.propTypes = {
  editFormData: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  onSaveSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  arquivosEdit: PropTypes.shape({
    foto: PropTypes.any,
    contrato: PropTypes.any,
  }).isRequired,
  onFileChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  loadingCep: PropTypes.bool,
  selectedAluno: PropTypes.shape({
    Alunos_Foto: PropTypes.string,
    Alunos_Nome: PropTypes.string,
    Alunos_Contrato: PropTypes.string,
  }),
};
