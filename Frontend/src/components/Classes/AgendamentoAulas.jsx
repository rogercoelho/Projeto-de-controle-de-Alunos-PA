import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../services/api";
import { getUploadUrl } from "../../utils/uploadUrls";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";

const DIAS_SEMANA = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const ORDEM_DIAS = DIAS_SEMANA.reduce((acc, dia, index) => {
  acc[dia] = index;
  return acc;
}, {});

const ORDEM_DIAS_NORMALIZADA = DIAS_SEMANA.reduce((acc, dia, index) => {
  acc[
    dia
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  ] = index;
  return acc;
}, {});

const obterOrdemDiaSemana = (dia) => {
  const diaNormalizado = String(dia || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  return ORDEM_DIAS[dia] ?? ORDEM_DIAS_NORMALIZADA[diaNormalizado] ?? 99;
};

const compararHorariosPorHorarioEDia = (a, b) => {
  const inicio = String(a.Horario_Inicio || "").localeCompare(
    String(b.Horario_Inicio || ""),
  );
  if (inicio !== 0) return inicio;

  const fim = String(a.Horario_Fim || "").localeCompare(
    String(b.Horario_Fim || ""),
  );
  if (fim !== 0) return fim;

  return (
    obterOrdemDiaSemana(a.Horario_Dia_Semana) -
    obterOrdemDiaSemana(b.Horario_Dia_Semana)
  );
};

function AgendamentoAulas() {
  const [loading, setLoading] = useState(false);
  const [messageToast, showToast] = useToast();
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [visaoGeralSelecionada, setVisaoGeralSelecionada] = useState(false);
  const [agendamentosVisaoGeral, setAgendamentosVisaoGeral] = useState([]);
  const [loadingVisaoGeral, setLoadingVisaoGeral] = useState(false);
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [confirmCancelarId, setConfirmCancelarId] = useState(null);

  // Carrega os horários ao montar o componente
  const carregarHorarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/horarios/com-vagas");
      setHorarios(response.data.Horarios || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text: error.response?.data?.Erro || "Erro ao carregar horários.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    carregarHorarios();
  }, [carregarHorarios]);

  const carregarAgendamentos = useCallback(
    async (horarioId) => {
      try {
        setLoading(true);
        const response = await api.get(`/agendamentos/horario/${horarioId}`);
        setAgendamentos(response.data.Agendamentos || []);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({
            type: "error",
            text:
              error.response?.data?.Erro || "Erro ao carregar agendamentos.",
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const carregarVisaoGeral = useCallback(async () => {
    try {
      setLoadingVisaoGeral(true);
      const response = await api.get("/agendamentos");
      setAgendamentosVisaoGeral(response.data.Agendamentos || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Erro ao carregar visão geral dos agendamentos.",
        });
      }
    } finally {
      setLoadingVisaoGeral(false);
    }
  }, [showToast]);

  const carregarAlunos = useCallback(async () => {
    try {
      const response = await api.get("/alunos");
      setTodosAlunos(response.data.Listagem_de_Alunos || []);
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text: error.response?.data?.Erro || "Erro ao carregar alunos.",
        });
      }
    }
  }, [showToast]);

  const handleSelecionarVisaoGeral = () => {
    setVisaoGeralSelecionada(true);
    setHorarioSelecionado(null);
    setAgendamentos([]);
    setAlunoSelecionado("");
    carregarVisaoGeral();
  };

  const handleSelecionarHorario = (horario) => {
    setVisaoGeralSelecionada(false);
    setHorarioSelecionado(horario);
    carregarAgendamentos(horario.Horario_Id);
    carregarAlunos();
    setAlunoSelecionado("");
  };

  const handleSelecionarAluno = (e) => {
    setAlunoSelecionado(e.target.value);
  };

  const handleConfirmarAgendamento = async () => {
    if (!alunoSelecionado) return;
    await handleAgendarAluno(parseInt(alunoSelecionado));
    setAlunoSelecionado("");
  };

  const handleAgendarAluno = async (alunoCodigo) => {
    if (!horarioSelecionado) {
      showToast({
        type: "error",
        text: "Selecione um horário primeiro.",
      });
      return;
    }

    try {
      setLoading(true);
      await api.post("/agendamentos/create", {
        horarioId: horarioSelecionado.Horario_Id,
        alunoCodigo: alunoCodigo,
      });
      showToast({
        type: "success",
        text: "Aluno agendado com sucesso!",
      });
      carregarAgendamentos(horarioSelecionado.Horario_Id);
      carregarHorarios();
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text: error.response?.data?.Erro || "Erro ao agendar aluno.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarAgendamento = (agendamentoId) => {
    setConfirmCancelarId(agendamentoId);
  };

  const handleConfirmarCancelamento = async () => {
    const agendamentoId = confirmCancelarId;
    setConfirmCancelarId(null);
    try {
      setLoading(true);
      await api.delete(`/agendamentos/${agendamentoId}`);
      showToast({
        type: "success",
        text: "Agendamento cancelado com sucesso!",
      });
      carregarAgendamentos(horarioSelecionado.Horario_Id);
      carregarHorarios();
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text: error.response?.data?.Erro || "Erro ao cancelar agendamento.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const formatarHora = (hora) => {
    if (!hora) return "";
    return hora.substring(0, 5);
  };

  const getApiBaseUrl = () => {
    return api.defaults.baseURL?.replace("/api", "") || "";
  };

  const horariosOrdenados = useMemo(
    () => [...horarios].sort(compararHorariosPorHorarioEDia),
    [horarios],
  );

  const agendamentosPorHorario = useMemo(() => {
    const mapa = new Map();

    for (const agendamento of agendamentosVisaoGeral) {
      const horarioId = String(
        agendamento.Horario_Id ?? agendamento.Horario?.Horario_Id ?? "",
      );
      if (!horarioId) continue;

      if (!mapa.has(horarioId)) mapa.set(horarioId, []);
      mapa.get(horarioId).push(agendamento);
    }

    for (const lista of mapa.values()) {
      lista.sort((a, b) =>
        String(a.Aluno?.Alunos_Nome || "").localeCompare(
          String(b.Aluno?.Alunos_Nome || ""),
          "pt-BR",
        ),
      );
    }

    return mapa;
  }, [agendamentosVisaoGeral]);

  const linhasVisaoGeral = useMemo(() => {
    const linhas = new Map();

    for (const horario of horariosOrdenados) {
      const chave = `${horario.Horario_Inicio || ""}|${horario.Horario_Fim || ""}`;
      if (!linhas.has(chave)) {
        linhas.set(chave, {
          chave,
          inicio: horario.Horario_Inicio,
          fim: horario.Horario_Fim,
          dias: {},
        });
      }

      const diaIndex = obterOrdemDiaSemana(horario.Horario_Dia_Semana);
      if (diaIndex < DIAS_SEMANA.length) {
        linhas.get(chave).dias[diaIndex] = {
          horario,
          agendamentos:
            agendamentosPorHorario.get(String(horario.Horario_Id)) || [],
        };
      }
    }

    return Array.from(linhas.values());
  }, [agendamentosPorHorario, horariosOrdenados]);

  return (
    <div className="w-full h-auto">
      <h2 className="text-xl font-bold text-white mb-4">
        Agendamento de Aulas
      </h2>

      {messageToast && <MessageToast messageToast={messageToast} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Horários */}
        <div className="lg:col-span-1 bg-gray-800 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Selecione um Horário
          </h3>

          {loading && !horarios.length ? (
            <p className="text-gray-400">Carregando...</p>
          ) : horarios.length === 0 ? (
            <p className="text-gray-400">Nenhum horário cadastrado.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              <button
                type="button"
                onClick={handleSelecionarVisaoGeral}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  visaoGeralSelecionada
                    ? "bg-blue-600 text-white"
                    : "bg-gray-700 text-white hover:bg-gray-600"
                }`}
              >
                <div className="font-medium">Visao Geral</div>
                <div className="text-sm opacity-80">
                  Semana por horário e alunos
                </div>
              </button>
              {horariosOrdenados.map((horario) => (
                <button
                  key={horario.Horario_Id}
                  onClick={() => handleSelecionarHorario(horario)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    !visaoGeralSelecionada &&
                    horarioSelecionado?.Horario_Id === horario.Horario_Id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  <div className="font-medium">
                    {horario.Horario_Dia_Semana}
                  </div>
                  <div className="text-sm opacity-80">
                    {formatarHora(horario.Horario_Inicio)} -{" "}
                    {formatarHora(horario.Horario_Fim)}
                  </div>
                  <div className="text-xs mt-1">
                    <span
                      className={`px-2 py-1 rounded ${
                        horario.vagasDisponiveis === 0
                          ? "bg-red-600"
                          : horario.vagasDisponiveis <=
                              horario.Horario_Capacidade / 3
                            ? "bg-yellow-600"
                            : "bg-green-600"
                      }`}
                    >
                      {horario.vagasOcupadas}/{horario.Horario_Capacidade} vagas
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Painel de Agendamento */}
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4">
          {visaoGeralSelecionada ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Visao Geral
                </h3>
                <p className="text-gray-300 text-sm">
                  {horarios.length} horários cadastrados
                </p>
              </div>

              {loadingVisaoGeral ? (
                <p className="text-gray-400">Carregando...</p>
              ) : linhasVisaoGeral.length === 0 ? (
                <p className="text-gray-400">Nenhum horário cadastrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full border-collapse text-sm">
                    <thead className="bg-gray-900 text-gray-300 uppercase text-xs">
                      <tr>
                        <th className="py-3 px-3 text-left border border-gray-700">
                          Horário
                        </th>
                        {DIAS_SEMANA.map((dia) => (
                          <th
                            key={`header-${dia}`}
                            className="py-3 px-3 text-left border border-gray-700 min-w-[120px]"
                          >
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {linhasVisaoGeral.map((linha) => (
                        <tr
                          key={linha.chave}
                          className="border-b border-gray-700"
                        >
                          <td className="py-3 px-3 border border-gray-700 bg-gray-900 text-white font-semibold whitespace-nowrap align-top">
                            {formatarHora(linha.inicio)} -{" "}
                            {formatarHora(linha.fim)}
                          </td>
                          {DIAS_SEMANA.map((dia, diaIndex) => {
                            const celula = linha.dias[diaIndex];
                            const lista = celula?.agendamentos || [];

                            return (
                              <td
                                key={`${linha.chave}-${dia}`}
                                className="py-3 px-3 border border-gray-700 text-gray-200 align-top"
                              >
                                {lista.length > 0 && (
                                  <ul className="space-y-1">
                                    {lista.map((agendamento) => (
                                      <li
                                        key={agendamento.Agendamento_Id}
                                        className="leading-tight"
                                      >
                                        {agendamento.Aluno?.Alunos_Nome ||
                                          "N/A"}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : !horarioSelecionado ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <p>Selecione um horário para gerenciar os agendamentos</p>
            </div>
          ) : (
            <>
              {/* Cabeçalho do horário selecionado */}
              <div className="mb-4 p-4 bg-gray-700 rounded-lg">
                <h3 className="text-lg font-semibold text-white">
                  {horarioSelecionado.Horario_Dia_Semana} -{" "}
                  {formatarHora(horarioSelecionado.Horario_Inicio)} às{" "}
                  {formatarHora(horarioSelecionado.Horario_Fim)}
                </h3>
                <p className="text-gray-300 text-sm">
                  Capacidade: {horarioSelecionado.Horario_Capacidade} alunos |
                  Ocupadas: {horarioSelecionado.vagasOcupadas} | Disponíveis:{" "}
                  {horarioSelecionado.vagasDisponiveis}
                </p>
              </div>

              {/* Selecionar aluno para adicionar */}
              {horarioSelecionado.vagasDisponiveis > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adicionar Aluno
                  </label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <CustomSelect
                        name="alunoSelecionado"
                        value={alunoSelecionado}
                        onChange={handleSelecionarAluno}
                        placeholder="Selecione um aluno para adicionar..."
                        options={todosAlunos
                          .filter(
                            (aluno) =>
                              !agendamentos.some(
                                (a) =>
                                  a.Aluno?.Alunos_Codigo ===
                                  aluno.Alunos_Codigo,
                              ),
                          )
                          .map((aluno) => ({
                            value: aluno.Alunos_Codigo,
                            label: `${aluno.Alunos_Codigo} - ${aluno.Alunos_Nome}`,
                          }))}
                      />
                    </div>
                    <Buttons.BotaoCadastrar
                      type="button"
                      onClick={handleConfirmarAgendamento}
                      disabled={!alunoSelecionado || loading}
                      loading={loading}
                    >
                      Salvar
                    </Buttons.BotaoCadastrar>
                  </div>
                </div>
              )}

              {horarioSelecionado.vagasDisponiveis === 0 && (
                <div className="mb-4 p-3 bg-red-600/30 border border-red-600 rounded-lg">
                  <p className="text-red-300">
                    Este horário está com a capacidade máxima. Não é possível
                    adicionar mais alunos.
                  </p>
                </div>
              )}

              {/* Lista de alunos agendados */}
              <div>
                <h4 className="text-md font-semibold text-white mb-3">
                  Alunos Agendados ({agendamentos.length})
                </h4>

                {loading && !agendamentos.length ? (
                  <p className="text-gray-400">Carregando...</p>
                ) : agendamentos.length === 0 ? (
                  <p className="text-gray-400">
                    Nenhum aluno agendado neste horário.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {agendamentos.map((agendamento) => (
                      <div
                        key={agendamento.Agendamento_Id}
                        className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {agendamento.Aluno?.Alunos_Foto ? (
                            <img
                              src={getUploadUrl(agendamento.Aluno.Alunos_Foto, "fotos")}
                              alt={agendamento.Aluno.Alunos_Nome}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-500 flex items-center justify-center">
                              <svg
                                className="w-6 h-6 text-gray-300"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">
                              {agendamento.Aluno?.Alunos_Nome || "N/A"}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Código:{" "}
                              {agendamento.Aluno?.Alunos_Codigo || "N/A"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleCancelarAgendamento(
                              agendamento.Agendamento_Id,
                            )
                          }
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          title="Cancelar agendamento"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Modal Confirmar Cancelamento ── */}
      {confirmCancelarId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-red-600/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center text-3xl">
                🚫
              </div>
              <h2 className="text-white font-bold text-lg text-center">
                Cancelar Agendamento
              </h2>
              <p className="text-gray-400 text-sm text-center">
                Deseja realmente cancelar este agendamento?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancelarId(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Não
              </button>
              <button
                type="button"
                onClick={handleConfirmarCancelamento}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AgendamentoAulas;
