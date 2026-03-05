import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import PhotoSkeleton from "../miscellaneous/PhotoSkeleton";
import Buttons from "../miscellaneous/Buttons";
import { formatarDataBR } from "../../utils/Utils";
import api from "../../services/api";

function StudentDetails({ aluno, onEdit, onToggleSituacao, onBack }) {
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [contratoPreviewImagens, setContratoPreviewImagens] = useState([]);
  const [loadingContratoPreview, setLoadingContratoPreview] = useState(false);
  const [erroContratoPreview, setErroContratoPreview] = useState("");
  const contratoArquivo = String(aluno?.Alunos_Contrato || "");
  const contratoUrl = useMemo(
    () =>
      `https://api2.plantandoalegria.com.br/uploads/contratos/${contratoArquivo}`,
    [contratoArquivo]
  );
  const contratoExt = useMemo(() => {
    const nome = contratoArquivo.toLowerCase();
    if (!nome.includes(".")) return "";
    return nome.split(".").pop();
  }, [contratoArquivo]);
  const contratoEhImagem = useMemo(
    () => ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(contratoExt),
    [contratoExt]
  );
  const contratoEhPdf = useMemo(() => contratoExt === "pdf", [contratoExt]);
  if (!aluno) return null;

  const abrirContratoModal = async () => {
    setShowContratoModal(true);
    setErroContratoPreview("");
    setContratoPreviewImagens([]);

    if (contratoEhImagem) {
      setContratoPreviewImagens([contratoUrl]);
      return;
    }

    if (!contratoEhPdf) {
      setErroContratoPreview("Formato do contrato não suportado para preview.");
      return;
    }

    setLoadingContratoPreview(true);
    try {
      const response = await api.get(
        `/alunos/contrato-preview?arquivo=${encodeURIComponent(
          aluno.Alunos_Contrato
        )}&t=${Date.now()}`
      );
      const paginas = response.data?.paginas || [];
      if (Array.isArray(paginas) && paginas.length > 0) {
        setContratoPreviewImagens(paginas);
      } else {
        setErroContratoPreview(
          "A API não retornou páginas convertidas para este PDF."
        );
      }
    } catch (error) {
      console.error("Erro ao obter preview do contrato:", error);
      setErroContratoPreview(
        error?.response?.data?.detalhe ||
          error?.response?.data?.Erro ||
          "Falha ao converter PDF em imagem no servidor."
      );
    } finally {
      setLoadingContratoPreview(false);
    }
  };

  const fecharContratoModal = () => {
    setShowContratoModal(false);
    setLoadingContratoPreview(false);
    setErroContratoPreview("");
    setContratoPreviewImagens([]);
  };
  return (
    <div className="w-full h-auto space-y-2 mx-auto">
      <div className="flex gap-2 mb-4">
        <Buttons.BotaoVoltar onBack={onBack} />
        <Buttons.BotaoEditar onClick={onEdit} />
        <Buttons.BotaoAtivarInativar
          onClick={onToggleSituacao}
          isAtivo={aluno?.Alunos_Situacao === "Ativo"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
        <label className="font-bold">Foto:</label>
        <div className="flex flex-col gap-2">
          <PhotoSkeleton foto={aluno.Alunos_Foto} nome={aluno.Alunos_Nome} />
          {aluno.Alunos_Foto && (
            <span className="text-xs text-gray-500">
              Arquivo: {aluno.Alunos_Foto}
            </span>
          )}
        </div>
      </div>

      {aluno.Alunos_Contrato &&
      typeof aluno.Alunos_Contrato === "string" &&
      aluno.Alunos_Contrato.trim() !== "" &&
      aluno.Alunos_Contrato.trim().toLowerCase() !== "null" &&
      aluno.Alunos_Contrato.trim().toLowerCase() !== "undefined" ? (
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 items-center">
          <label className="font-bold">Contrato:</label>
          <button
            type="button"
            onClick={abrirContratoModal}
            className="text-blue-500 hover:text-blue-700 underline text-left"
          >
            Ver Contrato
          </button>
        </div>
      ) : null}

      {showContratoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3">
          <div className="w-full max-w-5xl max-h-[92vh] bg-gray-900 border border-gray-700 rounded-xl p-3 md:p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-sm md:text-base">
                Contrato - {aluno.Alunos_Nome}
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={contratoUrl}
                  download
                  className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
                >
                  Baixar PDF original
                </a>
                <button
                  type="button"
                  onClick={fecharContratoModal}
                  className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-black rounded-lg border border-gray-700 p-2 md:p-3">
              {loadingContratoPreview && (
                <div className="text-gray-200 text-sm">
                  Convertendo contrato para imagem...
                </div>
              )}

              {!loadingContratoPreview && erroContratoPreview && (
                <div className="space-y-2">
                  <p className="text-red-300 text-sm">{erroContratoPreview}</p>
                  <a
                    href={contratoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-400 hover:text-blue-300 underline text-sm"
                  >
                    Abrir contrato em nova aba
                  </a>
                </div>
              )}

              {!loadingContratoPreview &&
                !erroContratoPreview &&
                contratoPreviewImagens.length > 0 && (
                  <div className="space-y-3">
                    {contratoPreviewImagens.map((imgSrc, idx) => (
                      <div
                        key={`contrato-img-${idx + 1}`}
                        className="bg-white rounded border border-gray-500 overflow-hidden"
                      >
                        <img
                          src={imgSrc}
                          alt={`Contrato página ${idx + 1}`}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ))}
                  </div>
                )}

            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Situação:</div>
          <div
            className={`font-semibold ${
              aluno.Alunos_Situacao === "Ativo"
                ? "text-green-400"
                : "text-orange-400"
            }`}
          >
            {aluno.Alunos_Situacao}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Código do Aluno:</div>
          <div>{aluno.Alunos_Codigo}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Nome Completo:</div>
          <div>{aluno.Alunos_Nome}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">CPF:</div>
          <div>{aluno.Alunos_CPF}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">
            Nome do Pai / Responsável:
          </div>
          <div>{aluno.Alunos_Nome_Pai_Responsavel || ""}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">
            CPF do Pai / Responsável:
          </div>
          <div>{aluno.Alunos_CPF_Pai_Responsavel || ""}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">
            Nome da Mãe / Responsável:
          </div>
          <div>{aluno.Alunos_Nome_Mae_Responsavel || ""}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">
            CPF da Mãe / Responsável:
          </div>
          <div>{aluno.Alunos_CPF_Mae_Responsavel || ""}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">CEP:</div>
          <div>{aluno.Alunos_Endereco_CEP}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Endereço:</div>
          <div>{aluno.Alunos_Endereco}</div>
        </div>
        {aluno.Alunos_Endereco_Complemento && (
          <div className="text-sm md:text-base">
            <div className="font-bold text-gray-400">Complemento:</div>
            <div>{aluno.Alunos_Endereco_Complemento}</div>
          </div>
        )}
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Bairro:</div>
          <div>{aluno.Alunos_Endereco_Bairro}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Localidade:</div>
          <div>{aluno.Alunos_Endereco_Localidade}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Cidade:</div>
          <div>{aluno.Alunos_Endereco_Cidade}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Estado:</div>
          <div>{aluno.Alunos_Endereco_Estado}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone:</div>
          <div>{aluno.Alunos_Telefone}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Email:</div>
          <div>{aluno.Alunos_Email}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Contato de Emergência:</div>
          <div>{aluno.Alunos_Contato_Emergencia}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone Emergência 1:</div>
          <div>{aluno.Alunos_Telefone_Emergencia_1}</div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Telefone Emergência 2:</div>
          <div>
            {aluno.Alunos_Telefone_Emergencia_2 || (
              <span className="text-gray-500 italic">Não informado</span>
            )}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Data de Nascimento:</div>
          <div>
            {aluno.Alunos_Data_Nascimento ? (
              formatarDataBR(aluno.Alunos_Data_Nascimento)
            ) : (
              <span className="text-gray-500 italic">Não informada</span>
            )}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Data de Matrícula:</div>
          <div>
            {aluno.Alunos_Data_Matricula ? (
              formatarDataBR(aluno.Alunos_Data_Matricula)
            ) : (
              <span className="text-gray-500 italic">Não informada</span>
            )}
          </div>
        </div>
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Observações:</div>
          <div className="whitespace-pre-wrap">
            {aluno.Alunos_Observacoes || (
              <span className="text-gray-500 italic">Não informado</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDetails;

StudentDetails.propTypes = {
  aluno: PropTypes.shape({
    Alunos_Codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Alunos_Nome: PropTypes.string,
    Alunos_CPF: PropTypes.string,
    Alunos_Data_Nascimento: PropTypes.string,
    Alunos_Nome_Pai_Responsavel: PropTypes.string,
    Alunos_CPF_Pai_Responsavel: PropTypes.string,
    Alunos_Nome_Mae_Responsavel: PropTypes.string,
    Alunos_CPF_Mae_Responsavel: PropTypes.string,
    Alunos_Endereco_CEP: PropTypes.string,
    Alunos_Endereco: PropTypes.string,
    Alunos_Endereco_Complemento: PropTypes.string,
    Alunos_Endereco_Bairro: PropTypes.string,
    Alunos_Endereco_Localidade: PropTypes.string,
    Alunos_Endereco_Cidade: PropTypes.string,
    Alunos_Endereco_Estado: PropTypes.string,
    Alunos_Telefone: PropTypes.string,
    Alunos_Email: PropTypes.string,
    Alunos_Contato_Emergencia: PropTypes.string,
    Alunos_Telefone_Emergencia_1: PropTypes.string,
    Alunos_Telefone_Emergencia_2: PropTypes.string,
    Alunos_Data_Matricula: PropTypes.string,
    Alunos_Situacao: PropTypes.string,
    Alunos_Foto: PropTypes.string,
    Alunos_Contrato: PropTypes.string,
    Alunos_Observacoes: PropTypes.string,
  }),
  onEdit: PropTypes.func,
  onToggleSituacao: PropTypes.func,
  onBack: PropTypes.func,
};





