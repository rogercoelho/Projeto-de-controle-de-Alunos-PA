import { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import { formatarDataBR } from "../../utils/Utils";
import MessageToast from "../miscellaneous/MessageToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";
import useToast from "../../hooks/useToast";

function RegistrarPagamento() {
  const [codigoAluno, setCodigoAluno] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [faturamentos, setFaturamentos] = useState([]);
  const [planosMap, setPlanosMap] = useState({});
  const [datasPagamento, setDatasPagamento] = useState({});
  const [descontos, setDescontos] = useState({});
  const [motivosDesconto, setMotivosDesconto] = useState({});
  const [comprovantes, setComprovantes] = useState({});
  const comprovanteInputRefs = useRef({});
  const [messageToast, showToast] = useToast();

  // Função para buscar alunos com pendências
  const fetchAlunosComPendencia = async () => {
    try {
      const res = await api.get("/faturamento/pendentes");
      setAlunos(res.data.alunos || []);
    } catch {
      setAlunos([]);
    }
  };

  // Busca inicial ao montar
  useEffect(() => {
    fetchAlunosComPendencia();
    // Busca planos para lógica de contador/WET
    const fetchPlanos = async () => {
      try {
        const res = await api.get("/planos/");
        const planos = res.data.Planos || [];
        const map = {};
        planos.forEach((p) => {
          map[p.Plano_Codigo] = p;
        });
        setPlanosMap(map);
      } catch {
        setPlanosMap({});
      }
    };
    fetchPlanos();
  }, []);

  useEffect(() => {
    const fetchAlunoEFaturamentos = async () => {
      if (!codigoAluno) {
        setAlunoInfo(null);
        setFaturamentos([]);
        return;
      }
      try {
        const resAluno = await api.get(`/alunos/codigo/${codigoAluno}`);
        setAlunoInfo(resAluno.data);
      } catch {
        setAlunoInfo(null);
      }
      try {
        const resFat = await api.get(`/faturamento/pendentes/${codigoAluno}`);
        setFaturamentos(resFat.data.faturamentos || []);
      } catch {
        setFaturamentos([]);
      }
    };
    fetchAlunoEFaturamentos();
  }, [codigoAluno]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Validação: se algum desconto for preenchido, motivo deve ser obrigatório
    for (const fat of faturamentos) {
      const fatId = fat.id || fat.Faturamento_ID;
      const desconto = descontos[fatId];
      const motivo = motivosDesconto[fatId];
      if (desconto && (!motivo || motivo.trim() === "")) {
        showToast({
          type: "error",
          text: `Motivo do desconto é obrigatório para o faturamento ${fatId}.`,
        });
        setLoading(false);
        return;
      }
    }

    // Monta array de pagamentos conforme esperado pelo backend
    const pagamentos = faturamentos.map((fat) => {
      const fatId = fat.id || fat.Faturamento_ID;

      // Lógica de contador/repasse executada no momento do pagamento
      const plano = planosMap[fat.Plano_Codigo];

      let novoContador = fat.Faturamento_Contador ?? null;
      let repasse = null;
      if (plano && plano.Plano_Contador_Habilitado) {
        const limite = parseInt(plano.Plano_Contador_Limite, 10);
        const atual =
          typeof fat.Faturamento_Contador !== "undefined" &&
          fat.Faturamento_Contador !== null
            ? parseInt(fat.Faturamento_Contador, 10)
            : 0;

        if (!isNaN(limite) && atual === limite) {
          // atingiu o limite -> gravar repasse e zerar contador
          repasse =
            plano.Plano_Wet_Valor != null
              ? parseFloat(plano.Plano_Wet_Valor)
              : null;
          novoContador = 0;
        } else {
          // incrementa contador
          novoContador = atual + 1;
        }
      }

      return {
        id: fatId,
        Faturamento_Data_Pagamento: datasPagamento[fatId] || null,
        Faturamento_Desconto: descontos[fatId] || null,
        Faturamento_Motivo: motivosDesconto[fatId] || null,
        ...(novoContador !== null && { Faturamento_Contador: novoContador }),
        ...(repasse !== null && { Faturamento_Repasse: repasse }),
      };
    });

    try {
      // Verifica se há comprovantes para enviar
      const temComprovantes = Object.values(comprovantes).some((c) => c);

      if (temComprovantes) {
        // Usa FormData para enviar arquivos
        const data = new FormData();
        data.append("pagamentos", JSON.stringify(pagamentos));
        data.append("alunoCodigo", codigoAluno);

        // Coleta os IDs dos faturamentos que têm comprovante na ordem
        const faturamentoIds = [];
        Object.entries(comprovantes).forEach(([fatId, arquivo]) => {
          if (arquivo) {
            data.append("comprovantes", arquivo);
            faturamentoIds.push(fatId);
          }
        });
        // Envia os IDs como JSON para manter a ordem
        data.append("faturamentoIds", JSON.stringify(faturamentoIds));

        await api.patch("/faturamento/registrar-pagamento", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        // Sem arquivos, envia JSON normal
        await api.patch("/faturamento/registrar-pagamento", {
          pagamentos,
        });
      }
      showToast({
        type: "success",
        text: "Pagamento registrado com sucesso!",
      });
      // Limpa campos e atualiza listas
      setDatasPagamento({});
      setDescontos({});
      setMotivosDesconto({});
      setComprovantes({});
      setCodigoAluno("");
      setAlunoInfo(null);
      setFaturamentos([]);
      await fetchAlunosComPendencia();
    } catch (error) {
      // Se for erro 401, o interceptor global já trata
      if (error?.response?.status !== 401) {
        showToast({ type: "error", text: "Erro ao registrar pagamento." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-auto">
      {/* Toast de mensagem */}
      <MessageToast messageToast={messageToast} />
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-4 sm:p-6 space-y-4 w-full h-full min-h-[80vh] shadow-lg border-2 border-gray-700"
        style={{ minWidth: 0, maxWidth: "100vw" }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-white mb-4">
            Registrar Pagamento
          </h2>
          <CustomSelect
            name="codigoAluno"
            value={codigoAluno}
            onChange={(e) => setCodigoAluno(e.target.value)}
            required
            placeholder="Selecione o código do aluno"
            options={alunos.map((aluno) => ({
              value: aluno.Alunos_Codigo || aluno.Aluno_Codigo,
              label: `${aluno.Alunos_Codigo || aluno.Aluno_Codigo} - ${
                aluno.Alunos_Nome || aluno.Aluno_Nome
              }`,
            }))}
          />
        </div>
        {alunos.length === 0 ? (
          <div className="bg-gray-900 rounded-xl p-3 mt-4 mb-2 border border-gray-700 min-h-20">
            <div className="flex items-center justify-center min-h-20">
              <span className="text-green-400 text-base font-semibold flex items-center gap-2 justify-center">
                <span style={{ fontSize: "1.5em" }}>✔️</span> Não existe planos
                de alunos pendentes!
              </span>
            </div>
          </div>
        ) : codigoAluno && codigoAluno !== "" ? (
          <div className="bg-gray-900 rounded-xl p-3 mt-4 mb-2 border border-gray-700 min-h-20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-center">
              Informações do Aluno
            </h3>
            <ul className="text-gray-200 text-sm space-y-1">
              <li>
                <b>Código:</b> {alunoInfo?.Alunos_Codigo || codigoAluno}
              </li>
              <li>
                <b>Nome:</b> {alunoInfo?.Alunos_Nome || ""}
              </li>
              <li>
                <b>CPF:</b> {alunoInfo?.Alunos_CPF || ""}
              </li>
              <li>
                <b>Email:</b> {alunoInfo?.Alunos_Email || ""}
              </li>
              <li>
                <b>Telefone:</b> {alunoInfo?.Alunos_Telefone || ""}
              </li>
              <li>
                <b>Data Matrícula:</b>{" "}
                {alunoInfo?.Alunos_Data_Matricula
                  ? formatarDataBR(alunoInfo.Alunos_Data_Matricula)
                  : ""}
              </li>
            </ul>
            {/* Mensagem de nenhum plano pendente, no mesmo frame */}
            {faturamentos.length === 0 && (
              <div className="mt-4 text-center flex items-center justify-center min-h-20">
                {/* Nenhuma mensagem quando um aluno está selecionado e não há planos pendentes */}
              </div>
            )}
          </div>
        ) : null}
        {alunos.length > 0 &&
          codigoAluno &&
          codigoAluno !== "" &&
          faturamentos.length > 0 && (
            <>
              <div className="mt-4">
                <label className="block text-xl font-bold text-gray-300 mb-2">
                  Faturamentos Pendentes
                </label>
                <ul className="bg-gray-700 rounded-lg p-3 text-white text-base space-y-4">
                  {faturamentos.map((fat) => {
                    const fatId = fat.id || fat.Faturamento_ID;
                    return (
                      <li
                        key={fatId}
                        className="flex flex-col gap-3 border-b border-gray-600 pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-md sm:text-base">
                          <b>Plano:</b> {fat.Plano_Codigo} <br />
                          <b>Início:</b>{" "}
                          {formatarDataBR(fat.Faturamento_Inicio)} | <b>Fim:</b>{" "}
                          {formatarDataBR(fat.Faturamento_Fim)} <br />
                          <b>Valor:</b> R$ {fat.Faturamento_Valor_Total}
                        </span>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center w-full">
                          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                            <label className="text-gray-300 text-sm">
                              Data Pagamento:
                              <span className="text-red-500"> *</span>
                            </label>
                            <input
                              type="date"
                              value={datasPagamento[fatId] || ""}
                              required
                              onChange={(e) =>
                                setDatasPagamento((prev) => ({
                                  ...prev,
                                  [fatId]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 rounded bg-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                              style={{ minWidth: 0 }}
                            />
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                            <label className="text-gray-300 text-sm">
                              Desconto:
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="R$"
                              value={descontos[fatId] || ""}
                              onChange={(e) =>
                                setDescontos((prev) => ({
                                  ...prev,
                                  [fatId]: e.target.value,
                                }))
                              }
                              className="px-2 py-1 rounded bg-gray-600 text-white text-sm w-full sm:w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              style={{ minWidth: 0 }}
                            />
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
                            <label className="text-gray-300 text-sm">
                              Motivo:
                              {descontos[fatId] && (
                                <span className="text-red-500">*</span>
                              )}
                            </label>
                            <input
                              type="text"
                              placeholder="Motivo do desconto"
                              value={motivosDesconto[fatId] || ""}
                              onChange={(e) =>
                                setMotivosDesconto((prev) => ({
                                  ...prev,
                                  [fatId]: e.target.value,
                                }))
                              }
                              className={`px-2 py-1 rounded bg-gray-600 text-white text-sm w-full sm:w-40 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                descontos[fatId] && !motivosDesconto[fatId]
                                  ? "border-2 border-red-500"
                                  : ""
                              }`}
                              style={{ minWidth: 0 }}
                              required={!!descontos[fatId]}
                              disabled={!descontos[fatId]}
                            />
                          </div>
                        </div>
                        {/* Campo de upload de comprovante */}
                        <div className="flex flex-col gap-1 w-full mt-2">
                          <div className="flex items-center gap-2 w-full">
                            <label className="text-gray-300 text-sm whitespace-nowrap">
                              Comprovante:
                              <span className="text-red-500"> *</span>
                            </label>
                            <input
                              ref={(el) =>
                                (comprovanteInputRefs.current[fatId] = el)
                              }
                              type="file"
                              accept="image/*,.pdf"
                              required
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setComprovantes((prev) => ({
                                  ...prev,
                                  [fatId]: file,
                                }));
                              }}
                              className="px-2 py-1 rounded bg-gray-600 text-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-gray-500 file:text-white hover:file:bg-gray-400"
                            />
                          </div>
                          {comprovantes[fatId] && (
                            <span className="text-sm text-green-400 flex items-center gap-2 ml-1">
                              📄 {comprovantes[fatId].name} (
                              {(comprovantes[fatId].size / 1024).toFixed(1)} KB)
                              <Buttons.BotaoX
                                onClick={() => {
                                  setComprovantes((prev) => ({
                                    ...prev,
                                    [fatId]: null,
                                  }));
                                  if (comprovanteInputRefs.current[fatId]) {
                                    comprovanteInputRefs.current[fatId].value =
                                      "";
                                  }
                                }}
                              />
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto font-semibold text-base tracking-tight shadow"
                >
                  {loading ? "Salvando..." : "Registrar Pagamento"}
                </button>
              </div>
            </>
          )}
      </form>
    </div>
  );
}

export default RegistrarPagamento;
