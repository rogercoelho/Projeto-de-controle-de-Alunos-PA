import { useState, useEffect, useCallback } from "react";
import api from "../../services/api";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";

function AgendamentoAulas() {
  const [loading, setLoading] = useState(false);
  const [messageToast, showToast] = useToast();
  const [horarios, setHorarios] = useState([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState(null);
  const [agendamentos, setAgendamentos] = useState([]);
  const [todosAlunos, setTodosAlunos] = useState([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState("");

  // Carrega os horários ao montar o componente
  useEffect(() => {
    carregarHorarios();
  }, []);

  const carregarHorarios = async () => {
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
  };

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

  const handleSelecionarHorario = (horario) => {
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

  const handleCancelarAgendamento = async (agendamentoId) => {
    if (!confirm("Deseja realmente cancelar este agendamento?")) return;

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
              {horarios.map((horario) => (
                <button
                  key={horario.Horario_Id}
                  onClick={() => handleSelecionarHorario(horario)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
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
          {!horarioSelecionado ? (
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
                              src={`${getApiBaseUrl()}/uploads/${agendamento.Aluno.Alunos_Foto}`}
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
    </div>
  );
}

export default AgendamentoAulas;
