import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import Buttons from "../miscellaneous/Buttons";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";

function ControleHorarios() {
  const [loading, setLoading] = useState(false);
  const [messageToast, showToast] = useToast();
  const [horarios, setHorarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [confirmExcluirId, setConfirmExcluirId] = useState(null);
  const [formData, setFormData] = useState({
    horarioInicio: "",
    horarioFim: "",
    capacidade: "",
    diaSemana: "",
  });

  const diasSemana = [
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
    "Domingo",
  ];

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editandoId) {
        // Atualizar horário existente
        await api.patch(`/horarios/${editandoId}`, formData);
        showToast({
          type: "success",
          text: "Horário atualizado com sucesso!",
        });
      } else {
        // Criar novo horário
        await api.post("/horarios/create", formData);
        showToast({
          type: "success",
          text: "Horário cadastrado com sucesso!",
        });
      }
      limparFormulario();
      carregarHorarios();
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Erro ao salvar horário. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (horario) => {
    setEditandoId(horario.Horario_Id);
    setFormData({
      horarioInicio: horario.Horario_Inicio,
      horarioFim: horario.Horario_Fim,
      capacidade: horario.Horario_Capacidade.toString(),
      diaSemana: horario.Horario_Dia_Semana,
    });
  };

  const handleExcluir = (id) => {
    setConfirmExcluirId(id);
  };

  const handleConfirmarExclusao = async () => {
    const id = confirmExcluirId;
    setConfirmExcluirId(null);
    try {
      setLoading(true);
      await api.delete(`/horarios/${id}`);
      showToast({
        type: "success",
        text: "Horário excluído com sucesso!",
      });
      carregarHorarios();
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text: error.response?.data?.Erro || "Erro ao excluir horário.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderClick = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
  };

  const limparFormulario = () => {
    setEditandoId(null);
    setFormData({
      horarioInicio: "",
      horarioFim: "",
      capacidade: "",
      diaSemana: "",
    });
  };

  const formatarHora = (hora) => {
    if (!hora) return "";
    return hora.substring(0, 5); // Remove os segundos se houver
  };

  // Ordem dos dias da semana para ordenação
  const ordemDias = {
    Segunda: 1,
    Terça: 2,
    Quarta: 3,
    Quinta: 4,
    Sexta: 5,
    Sábado: 6,
    Domingo: 7,
  };

  // Horários ordenados
  const horariosOrdenados = useMemo(() => {
    if (!sortBy) return horarios;
    const lista = [...horarios];
    lista.sort((a, b) => {
      let result = 0;
      if (sortBy === "dia") {
        const diaA = ordemDias[a.Horario_Dia_Semana] || 99;
        const diaB = ordemDias[b.Horario_Dia_Semana] || 99;
        result =
          diaA !== diaB
            ? diaA - diaB
            : a.Horario_Inicio.localeCompare(b.Horario_Inicio);
      } else if (sortBy === "horario") {
        result = a.Horario_Inicio.localeCompare(b.Horario_Inicio);
      } else if (sortBy === "vagas") {
        result = a.vagasDisponiveis - b.vagasDisponiveis;
      }
      return sortDir === "asc" ? result : -result;
    });
    return lista;
  }, [horarios, sortBy, sortDir]);

  return (
    <div className="w-full h-auto">
      <h2 className="text-xl font-bold text-white mb-4">
        {editandoId ? "Editar Horário" : "Controle de Horários"}
      </h2>

      {messageToast && <MessageToast messageToast={messageToast} />}

      {/* Formulário de cadastro/edição */}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-4 mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Dia da Semana */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dia da Semana *
            </label>
            <select
              name="diaSemana"
              value={formData.diaSemana}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {diasSemana.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>
          </div>

          {/* Horário Início */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Horário Início *
            </label>
            <input
              type="time"
              name="horarioInicio"
              value={formData.horarioInicio}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Horário Fim */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Horário Fim *
            </label>
            <input
              type="time"
              name="horarioFim"
              value={formData.horarioFim}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Capacidade */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capacidade Máxima *
            </label>
            <input
              type="number"
              name="capacidade"
              value={formData.capacidade}
              onChange={handleChange}
              required
              min="1"
              placeholder="Qtd. de vagas"
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Buttons.BotaoCadastrar
            type="submit"
            disabled={loading}
            loading={loading}
          >
            {editandoId ? "Atualizar" : "Cadastrar"}
          </Buttons.BotaoCadastrar>
          {editandoId && (
            <Buttons.BotaoCancelar type="button" onClick={limparFormulario} />
          )}
        </div>
      </form>

      {/* Lista de horários cadastrados */}
      <div className="bg-gray-800 rounded-xl p-3 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Horários Cadastrados ({horarios.length})
        </h3>

        {loading && !horarios.length ? (
          <p className="text-gray-400">Carregando...</p>
        ) : horarios.length === 0 ? (
          <p className="text-gray-400">Nenhum horário cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-900 text-gray-300 uppercase text-xs">
                <tr>
                  <th
                    className="py-3 px-4 cursor-pointer rounded-tl-lg"
                    onClick={() => handleHeaderClick("dia")}
                  >
                    Dia{" "}
                    {sortBy === "dia" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer"
                    onClick={() => handleHeaderClick("horario")}
                  >
                    Horário{" "}
                    {sortBy === "horario"
                      ? sortDir === "asc"
                        ? "▲"
                        : "▼"
                      : ""}
                  </th>
                  <th className="py-3 px-4 text-center">Capacidade</th>
                  <th className="py-3 px-4 text-center">Ocupadas</th>
                  <th
                    className="py-3 px-4 text-center cursor-pointer"
                    onClick={() => handleHeaderClick("vagas")}
                  >
                    Disponíveis{" "}
                    {sortBy === "vagas" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                  <th className="py-3 px-4 text-center rounded-tr-lg">Ações</th>
                </tr>
              </thead>
              <tbody>
                {horariosOrdenados.map((horario) => (
                  <tr
                    key={horario.Horario_Id}
                    className="border-b border-gray-700 hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-white">
                      {horario.Horario_Dia_Semana}
                    </td>
                    <td className="py-3 px-4 text-white">
                      {formatarHora(horario.Horario_Inicio)} -{" "}
                      {formatarHora(horario.Horario_Fim)}
                    </td>
                    <td className="py-3 px-4 text-white text-center">
                      {horario.Horario_Capacidade}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-1 rounded ${
                          horario.vagasOcupadas >= horario.Horario_Capacidade
                            ? "bg-red-600"
                            : horario.vagasOcupadas > 0
                              ? "bg-yellow-600"
                              : "bg-green-600"
                        }`}
                      >
                        {horario.vagasOcupadas}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
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
                        {horario.vagasDisponiveis}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEditar(horario)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                          title="Editar"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExcluir(horario.Horario_Id)}
                          className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                          title="Excluir"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Confirmar Exclusão ── */}
      {confirmExcluirId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border-2 border-red-600/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center text-3xl">
                🗑️
              </div>
              <h2 className="text-white font-bold text-lg text-center">
                Excluir Horário
              </h2>
              <p className="text-gray-400 text-sm text-center">
                Deseja realmente excluir este horário? Esta ação não pode ser
                desfeita.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmExcluirId(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Não
              </button>
              <button
                type="button"
                onClick={handleConfirmarExclusao}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ControleHorarios;
