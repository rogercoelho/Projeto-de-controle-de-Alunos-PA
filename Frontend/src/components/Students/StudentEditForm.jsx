import {
  calcularIdade,
  validarCPF,
  formatarCPF,
  converterData,
  corCampoEditavel,
} from "../../utils/Utils";
import api from "../../services/api";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";
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
  // Estado local do formulário de edição
  const [editFormData, setEditFormData] = React.useState(initialFormData);
  // Atualiza o estado local se mudar o aluno selecionado
  React.useEffect(() => {
    setEditFormData(initialFormData);
  }, [initialFormData]);
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

  // Handler local para campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;
    if (name === "Alunos_CPF" || name === "Alunos_CPF_Responsavel") {
      newValue = formatarCPF(value);
    }
    setEditFormData((prev) => ({ ...prev, [name]: newValue }));
  };
  // Lógica de controle de edição dos campos
  const idade = calcularIdade(editFormData.Alunos_Data_Nascimento);

  // CPF do aluno: readonly se já estava preenchido ao abrir
  const cpfAlunoReadOnly = !!initialFormData.Alunos_CPF;
  // CPF do aluno: obrigatório se maior de 18 anos
  const cpfAlunoObrigatorio = idade >= 18;

  // Nome do responsável: editável e obrigatório se aluno for menor de idade e
  // (não estiver preenchido ou for "Aluno Maior de Idade")
  const nomeRespObrigatorio =
    idade < 18 ||
    !initialFormData.Alunos_Nome_Responsavel ||
    initialFormData.Alunos_Nome_Responsavel === "Aluno Maior de Idade";

  const cpfRespObrigatorio = idade < 18;

  /* Setloading para atualizar o estado de carregamento (botoes) */
  const [loadingbutton, setLoadingbutton] = React.useState(false);

  return (
    <div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setLoadingbutton(true);
          try {
            // Validação de CPF ao enviar
            if (
              editFormData.Alunos_CPF &&
              !validarCPF(editFormData.Alunos_CPF)
            ) {
              showToast({ type: "error", text: "CPF do aluno inválido" });
              return;
            }
            if (
              editFormData.Alunos_CPF_Responsavel &&
              !validarCPF(editFormData.Alunos_CPF_Responsavel)
            ) {
              showToast({
                type: "error",
                text: "CPF do responsável inválido",
              });
              return;
            }
            const formDataConvertido = {
              ...editFormData,
              Alunos_Data_Nascimento: converterData(
                editFormData.Alunos_Data_Nascimento
              ),
              // Se o nome do responsável estiver vazio, grava "Aluno Maior de Idade"
              Alunos_Nome_Responsavel:
                editFormData.Alunos_Nome_Responsavel?.trim() ||
                "Aluno Maior de Idade",
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
                `/alunos/update/${editFormData.Alunos_Codigo}`,
                data,
                { headers: { "Content-Type": "multipart/form-data" } }
              );
            } else {
              response = await api.patch(
                `/alunos/update/${editFormData.Alunos_Codigo}`,
                formDataConvertido
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
              true
            )} text-white rounded-md`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Data de Nascimento *
          </label>
          <input
            type="date"
            name="Alunos_Data_Nascimento"
            value={editFormData.Alunos_Data_Nascimento || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              false
            )} text-white rounded-md`}
            required
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF{cpfAlunoObrigatorio ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF"
            value={editFormData.Alunos_CPF || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              !cpfAlunoReadOnly
            )} text-white rounded-md`}
            placeholder="000.000.000-00"
            maxLength="14"
            readOnly={cpfAlunoReadOnly}
            required={cpfAlunoObrigatorio}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Responsável{nomeRespObrigatorio ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_Nome_Responsavel"
            value={editFormData.Alunos_Nome_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            required={nomeRespObrigatorio}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CPF do Responsável {cpfRespObrigatorio ? " *" : ""}
          </label>
          <input
            type="text"
            name="Alunos_CPF_Responsavel"
            value={editFormData.Alunos_CPF_Responsavel || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            placeholder="000.000.000-00"
            maxLength="14"
            required={cpfRespObrigatorio}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CEP *
          </label>
          <div className="relative w-full">
            <input
              type="text"
              name="Alunos_Endereco_CEP"
              value={editFormData.Alunos_Endereco_CEP || ""}
              onChange={handleChange}
              className={`w-full px-4 py-2 ${corCampoEditavel(
                true
              )} text-white rounded-md`}
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

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endereço *
          </label>
          <input
            type="text"
            name="Alunos_Endereco"
            value={editFormData.Alunos_Endereco || ""}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              false
            )} text-white rounded-md`}
            readOnly
            required
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
              true
            )} text-white rounded-md`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bairro *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Bairro"
            value={editFormData.Alunos_Endereco_Bairro || ""}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              false
            )} text-white rounded-md`}
            readOnly
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cidade *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Cidade"
            value={editFormData.Alunos_Endereco_Cidade || ""}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              false
            )} text-white rounded-md`}
            readOnly
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Estado *
          </label>
          <input
            type="text"
            name="Alunos_Endereco_Estado"
            value={editFormData.Alunos_Endereco_Estado || ""}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              false
            )} text-white rounded-md`}
            maxLength="2"
            readOnly
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone *
          </label>
          <input
            type="tel"
            name="Alunos_Telefone"
            value={editFormData.Alunos_Telefone || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="Alunos_Email"
            value={editFormData.Alunos_Email || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Contato de Emergência *
          </label>
          <input
            type="text"
            name="Alunos_Contato_Emergencia"
            value={editFormData.Alunos_Contato_Emergencia || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefone Emergência 1 *
          </label>
          <input
            type="tel"
            name="Alunos_Telefone_Emergencia_1"
            value={editFormData.Alunos_Telefone_Emergencia_1 || ""}
            onChange={handleChange}
            className={`w-full px-4 py-2 ${corCampoEditavel(
              true
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
            required
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
              true
            )} text-white rounded-md`}
            placeholder="(00) 00000-0000"
            maxLength="15"
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
              true
            )} text-white rounded-md`}
            placeholder="Observações sobre o aluno (opcional)"
            rows="3"
          />
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <Buttons.BotaoSalvarAlteracoes
            onClick={onclick}
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
