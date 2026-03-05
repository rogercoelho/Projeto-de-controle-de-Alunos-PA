import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import useToast from "../../hooks/useToast";
import MessageToast from "../miscellaneous/MessageToast";

const STATUS_ORDEM = [
  "Presente",
  "Ausente",
  "Reposicao",
  "Aula Realizada",
  "",
];

function pad2(n) {
  return String(n).padStart(2, "0");
}

function toDateKey(ano, mesIndex, dia) {
  return `${ano}-${pad2(mesIndex + 1)}-${pad2(dia)}`;
}

function legendaStatus(status) {
  if (status === "Presente") return "P";
  if (status === "Ausente") return "A";
  if (status === "Reposicao") return "R";
  if (status === "Aula Realizada") return "AR";
  return "";
}

function statusClass(status) {
  if (status === "Presente") {
    return "bg-green-600 border-green-300 text-white";
  }
  if (status === "Ausente") {
    return "bg-red-700 border-red-300 text-white";
  }
  if (status === "Reposicao") {
    return "bg-amber-500 border-amber-200 text-black";
  }
  if (status === "Aula Realizada") {
    return "bg-cyan-600 border-cyan-300 text-white";
  }
  return "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700";
}

function RegistrarPresenca() {
  const hoje = useMemo(() => new Date(), []);
  const anoAtual = hoje.getFullYear();
  const mesAtualIndex = hoje.getMonth();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesSelecionadoIndex, setMesSelecionadoIndex] = useState(mesAtualIndex);

  const [alunos, setAlunos] = useState([]);
  const [alunoCodigo, setAlunoCodigo] = useState("");
  const [presencasMap, setPresencasMap] = useState({});
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [loadingPresencas, setLoadingPresencas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showReposicaoModal, setShowReposicaoModal] = useState(false);
  const [messageToast, showToast] = useToast();

  const totalDiasMes = useMemo(
    () => new Date(anoSelecionado, mesSelecionadoIndex + 1, 0).getDate(),
    [anoSelecionado, mesSelecionadoIndex]
  );
  const primeiroDiaSemana = useMemo(
    () => new Date(anoSelecionado, mesSelecionadoIndex, 1).getDay(),
    [anoSelecionado, mesSelecionadoIndex]
  );

  const diasReposicaoSemReferencia = useMemo(
    () =>
      Object.entries(presencasMap)
        .filter(
          ([, v]) =>
            v?.status === "Reposicao" &&
            !String(v?.dataReposicaoReferencia || "").trim()
        )
        .map(([data]) => data),
    [presencasMap]
  );

  const alunoSelecionado = useMemo(
    () =>
      alunos.find((a) => String(a.Alunos_Codigo) === String(alunoCodigo)) ||
      null,
    [alunos, alunoCodigo]
  );

  useEffect(() => {
    const carregarAlunos = async () => {
      setLoadingAlunos(true);
      try {
        const response = await api.get("/presenca/alunos-ativos");
        setAlunos(response.data?.alunos || []);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({
            type: "error",
            text: "Erro ao carregar alunos ativos.",
          });
        }
      } finally {
        setLoadingAlunos(false);
      }
    };

    carregarAlunos();
  }, [showToast]);

  useEffect(() => {
    const carregarPresencasMes = async () => {
      if (!alunoCodigo) {
        setPresencasMap({});
        return;
      }

      setLoadingPresencas(true);
      try {
        const response = await api.get(
          `/presenca/${alunoCodigo}/${anoSelecionado}/${mesSelecionadoIndex + 1}`
        );
        const map = {};
        for (const item of response.data?.presencas || []) {
          map[item.Presenca_Data] = {
            status: item.Presenca_Status,
            dataReposicaoReferencia:
              item.Presenca_Data_Reposicao_Referencia || "",
          };
        }
        setPresencasMap(map);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({
            type: "error",
            text: "Erro ao carregar presencas do mes.",
          });
        }
      } finally {
        setLoadingPresencas(false);
      }
    };

    carregarPresencasMes();
  }, [alunoCodigo, anoSelecionado, mesSelecionadoIndex, showToast]);

  const alternarStatusDia = (dia) => {
    if (!alunoCodigo) {
      showToast({
        type: "error",
        text: "Selecione o aluno antes de marcar presenca.",
      });
      return;
    }

    const chaveData = toDateKey(anoSelecionado, mesSelecionadoIndex, dia);

    setPresencasMap((prev) => {
      const atual = prev[chaveData]?.status;
      const indiceAtual = STATUS_ORDEM.indexOf(atual);
      const proximoStatus =
        indiceAtual === -1
          ? STATUS_ORDEM[0]
          : STATUS_ORDEM[(indiceAtual + 1) % STATUS_ORDEM.length];

      if (!proximoStatus) {
        const novo = { ...prev };
        delete novo[chaveData];
        return novo;
      }

      const dataReposicaoReferencia =
        proximoStatus === "Reposicao"
          ? prev[chaveData]?.dataReposicaoReferencia || ""
          : "";

      return {
        ...prev,
        [chaveData]: {
          status: proximoStatus,
          dataReposicaoReferencia,
        },
      };
    });
  };

  const salvarPresencas = async () => {
    if (!alunoCodigo) {
      showToast({ type: "error", text: "Selecione um aluno." });
      return;
    }

    const entradas = Object.entries(presencasMap).filter(
      ([, valor]) => !!valor?.status
    );
    if (entradas.length === 0) {
      showToast({ type: "error", text: "Nenhum dia foi marcado." });
      return;
    }

    if (diasReposicaoSemReferencia.length > 0) {
      setShowReposicaoModal(true);
      return;
    }

    setSaving(true);
    try {
      await api.post("/presenca/salvar-lote", {
        Aluno_Codigo: Number(alunoCodigo),
        ano: anoSelecionado,
        mes: mesSelecionadoIndex + 1,
        presencas: entradas.map(([data, valor]) => ({
          data,
          status: valor.status,
          dataReposicaoReferencia:
            valor.status === "Reposicao"
              ? valor.dataReposicaoReferencia
              : null,
        })),
      });

      showToast({ type: "success", text: "Presencas salvas com sucesso." });
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Nao foi possivel salvar as presencas.",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const nomesMeses = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  const podeAvancarCompetencia =
    anoSelecionado < anoAtual ||
    (anoSelecionado === anoAtual && mesSelecionadoIndex < mesAtualIndex);

  const irParaMesAnterior = () => {
    if (mesSelecionadoIndex === 0) {
      setMesSelecionadoIndex(11);
      setAnoSelecionado((prev) => prev - 1);
      return;
    }
    setMesSelecionadoIndex((prev) => prev - 1);
  };

  const irParaMesSeguinte = () => {
    if (!podeAvancarCompetencia) return;
    if (mesSelecionadoIndex === 11) {
      setMesSelecionadoIndex(0);
      setAnoSelecionado((prev) => prev + 1);
      return;
    }
    setMesSelecionadoIndex((prev) => prev + 1);
  };

  return (
    <div className="w-full h-auto">
      {messageToast && <MessageToast messageToast={messageToast} />}

      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Registrar Presenca</h2>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-2 items-center">
          <label className="text-gray-200">Aluno:</label>
          <select
            value={alunoCodigo}
            onChange={(e) => setAlunoCodigo(e.target.value)}
            className="border border-gray-300 rounded-md p-2 w-full bg-white text-black"
            disabled={loadingAlunos}
          >
            <option value="">Selecione o aluno</option>
            {alunos.map((aluno) => (
              <option key={aluno.Alunos_Codigo} value={aluno.Alunos_Codigo}>
                {aluno.Alunos_Codigo} - {aluno.Alunos_Nome}
              </option>
            ))}
          </select>
        </div>

        {alunoSelecionado && (
          <p className="text-sm text-gray-300">
            Aluno selecionado: {alunoSelecionado.Alunos_Codigo} -{" "}
            {alunoSelecionado.Alunos_Nome}
          </p>
        )}

        <div className="flex gap-4 text-xs">
          <span className="px-2 py-1 rounded bg-green-600">P = Presente</span>
          <span className="px-2 py-1 rounded bg-red-700">A = Ausente</span>
          <span className="px-2 py-1 rounded bg-amber-500 text-black">
            R = Reposicao
          </span>
          <span className="px-2 py-1 rounded bg-cyan-600">
            AR = Aula realizada
          </span>
        </div>

        <div className="border border-gray-600 rounded-lg p-4 bg-gray-900">
          <div className="mb-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={irParaMesAnterior}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
              title="Mes anterior"
            >
              {"<"}
            </button>
            <div className="font-semibold min-w-[170px] text-center">
              {nomesMeses[mesSelecionadoIndex]} / {anoSelecionado}
            </div>
            <button
              type="button"
              onClick={irParaMesSeguinte}
              disabled={!podeAvancarCompetencia}
              className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
              title="Mes seguinte"
            >
              {">"}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs md:text-sm text-gray-400"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: primeiroDiaSemana }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="h-14 md:h-16 rounded border border-transparent"
              />
            ))}

            {Array.from({ length: totalDiasMes }).map((_, idx) => {
              const dia = idx + 1;
              const chaveData = toDateKey(
                anoSelecionado,
                mesSelecionadoIndex,
                dia
              );
              const status = presencasMap[chaveData]?.status || "";

              return (
                <button
                  type="button"
                  key={chaveData}
                  onClick={() => alternarStatusDia(dia)}
                  disabled={!alunoCodigo || loadingPresencas}
                  className={`h-14 md:h-16 border rounded-md flex flex-col justify-center items-center transition ${statusClass(
                    status
                  )} disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={`${chaveData} - ${status || "Sem marcacao"}`}
                >
                  <span className="text-xs md:text-sm">{dia}</span>
                  <span className="font-bold">{legendaStatus(status)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={salvarPresencas}
            disabled={saving || loadingPresencas || !alunoCodigo}
            className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {showReposicaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-600 rounded-xl p-5">
            <h3 className="text-lg font-bold mb-3">
              Informar data de falta para reposicao
            </h3>

            <p className="text-sm text-gray-300 mb-4">
              Cada dia marcado como reposicao precisa informar qual falta esta
              sendo reposta.
            </p>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {Object.entries(presencasMap)
                .filter(([, valor]) => valor?.status === "Reposicao")
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([data, valor]) => (
                  <div
                    key={`reposicao-${data}`}
                    className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-2 items-center"
                  >
                    <label className="text-gray-200">Reposicao em {data}</label>
                    <input
                      type="date"
                      value={valor?.dataReposicaoReferencia || ""}
                      onChange={(e) =>
                        setPresencasMap((prev) => ({
                          ...prev,
                          [data]: {
                            ...prev[data],
                            dataReposicaoReferencia: e.target.value,
                          },
                        }))
                      }
                      className="border border-gray-300 rounded-md p-2 bg-white text-black"
                      required
                    />
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => setShowReposicaoModal(false)}
                className="bg-gray-600 text-white p-2 border-2 rounded-md border-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const faltando = Object.entries(presencasMap).some(
                    ([, v]) =>
                      v?.status === "Reposicao" &&
                      !String(v?.dataReposicaoReferencia || "").trim()
                  );
                  if (faltando) {
                    showToast({
                      type: "error",
                      text: "Preencha todas as datas de referencia.",
                    });
                    return;
                  }

                  setShowReposicaoModal(false);
                  await salvarPresencas();
                }}
                className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
              >
                Confirmar e Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarPresenca;
