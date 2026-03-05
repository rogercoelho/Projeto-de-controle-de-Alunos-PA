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
  if (status === "Ausente") return "F";
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
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeAlunos, setGradeAlunos] = useState([]);
  const [gradeMap, setGradeMap] = useState({});
  const [filtroGrade, setFiltroGrade] = useState("");
  const [ordenacaoGrade, setOrdenacaoGrade] = useState({
    campo: "nome",
    direcao: "asc",
  });
  const [reposicaoGradeModal, setReposicaoGradeModal] = useState({
    open: false,
    alunoCodigo: "",
    data: "",
    valor: "",
  });
  const [observacaoGradeModal, setObservacaoGradeModal] = useState({
    open: false,
    alunoCodigo: "",
    data: "",
    texto: "",
  });
  const [observacaoDiaModal, setObservacaoDiaModal] = useState({
    open: false,
    data: "",
    texto: "",
  });
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
            observacao: item.Presenca_Observacao || "",
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
      const observacao = prev[chaveData]?.observacao || "";

      return {
        ...prev,
        [chaveData]: {
          status: proximoStatus,
          dataReposicaoReferencia,
          observacao,
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
          observacao: String(valor.observacao || "").trim() || null,
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

  const abrirModalObservacao = (data) => {
    setObservacaoDiaModal({
      open: true,
      data,
      texto: presencasMap[data]?.observacao || "",
    });
  };

  const salvarObservacaoDoDia = () => {
    const data = observacaoDiaModal.data;
    if (!data || !presencasMap[data]?.status) {
      setObservacaoDiaModal({ open: false, data: "", texto: "" });
      return;
    }

    setPresencasMap((prev) => ({
      ...prev,
      [data]: {
        ...prev[data],
        observacao: observacaoDiaModal.texto,
      },
    }));
    setObservacaoDiaModal({ open: false, data: "", texto: "" });
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

  const nomeDiaSemana = (dia) => {
    const idx = new Date(
      anoSelecionado,
      mesSelecionadoIndex,
      dia
    ).getDay();
    return diasSemana[idx].toLowerCase();
  };

  const gradeAlunosFiltrados = useMemo(() => {
    const termo = String(filtroGrade || "").trim().toLowerCase();
    const base = !termo
      ? [...gradeAlunos]
      : gradeAlunos.filter((aluno) => {
          const nome = String(aluno.Alunos_Nome || "").toLowerCase();
          const codigo = String(aluno.Alunos_Codigo || "");
          return nome.includes(termo) || codigo.includes(termo);
        });

    base.sort((a, b) => {
      if (ordenacaoGrade.campo === "codigo") {
        const diff = Number(a.Alunos_Codigo) - Number(b.Alunos_Codigo);
        return ordenacaoGrade.direcao === "asc" ? diff : -diff;
      }
      const comp = String(a.Alunos_Nome || "").localeCompare(
        String(b.Alunos_Nome || ""),
        "pt-BR"
      );
      return ordenacaoGrade.direcao === "asc" ? comp : -comp;
    });

    return base;
  }, [gradeAlunos, filtroGrade, ordenacaoGrade]);

  const alternarOrdenacaoGrade = (campo) => {
    setOrdenacaoGrade((prev) => {
      if (prev.campo === campo) {
        return {
          campo,
          direcao: prev.direcao === "asc" ? "desc" : "asc",
        };
      }
      return { campo, direcao: "asc" };
    });
  };

  const marcadorOrdenacao = (campo) => {
    if (ordenacaoGrade.campo !== campo) return "↕";
    return ordenacaoGrade.direcao === "asc" ? "↑" : "↓";
  };

  const errosGrade = useMemo(() => {
    const mapaErros = {};
    let total = 0;

    for (const [alunoKey, mapaDias] of Object.entries(gradeMap || {})) {
      for (const [data, valor] of Object.entries(mapaDias || {})) {
        if (valor?.status !== "Reposicao") continue;

        const referencia = String(valor?.dataReposicaoReferencia || "").trim();
        if (!referencia) {
          if (!mapaErros[alunoKey]) mapaErros[alunoKey] = {};
          mapaErros[alunoKey][data] =
            "Reposicao sem data de falta. Clique em R para preencher.";
          total += 1;
          continue;
        }

        const statusRef = mapaDias?.[referencia]?.status;
        if (statusRef === "Aula Realizada") {
          if (!mapaErros[alunoKey]) mapaErros[alunoKey] = {};
          mapaErros[alunoKey][data] =
            "Nao e possivel repor um dia marcado como aula realizada.";
          total += 1;
          continue;
        }

        if (statusRef && statusRef !== "Ausente") {
          if (!mapaErros[alunoKey]) mapaErros[alunoKey] = {};
          mapaErros[alunoKey][data] =
            "A data informada para reposicao precisa estar marcada como Falta.";
          total += 1;
        }
      }
    }

    return { mapaErros, total };
  }, [gradeMap]);

  useEffect(() => {
    const carregarGradeMensal = async () => {
      setLoadingGrade(true);
      try {
        const response = await api.get(
          `/presenca/grade/${anoSelecionado}/${mesSelecionadoIndex + 1}`
        );
        const alunosGrade = response.data?.alunos || [];
        const presencasPorAluno = response.data?.presencasPorAluno || {};
        const mapa = {};

        for (const aluno of alunosGrade) {
          const cod = String(aluno.Alunos_Codigo);
          mapa[cod] = {};
          const lista = presencasPorAluno[cod] || [];
          for (const item of lista) {
            mapa[cod][item.Presenca_Data] = {
              status: item.Presenca_Status,
              dataReposicaoReferencia:
                item.Presenca_Data_Reposicao_Referencia || "",
              observacao: item.Presenca_Observacao || "",
            };
          }
        }

        setGradeAlunos(alunosGrade);
        setGradeMap(mapa);
      } catch (error) {
        if (error.response?.status !== 401) {
          showToast({
            type: "error",
            text: "Erro ao carregar grade mensal de presenca.",
          });
        }
      } finally {
        setLoadingGrade(false);
      }
    };

    carregarGradeMensal();
  }, [anoSelecionado, mesSelecionadoIndex, showToast]);

  const proximoStatus = (statusAtual) => {
    const indiceAtual = STATUS_ORDEM.indexOf(statusAtual);
    return indiceAtual === -1
      ? STATUS_ORDEM[0]
      : STATUS_ORDEM[(indiceAtual + 1) % STATUS_ORDEM.length];
  };

  const alternarStatusGrade = (alunoCodigoGrade, dia) => {
    const alunoKey = String(alunoCodigoGrade);
    const chaveData = toDateKey(anoSelecionado, mesSelecionadoIndex, dia);
    const statusAtual = gradeMap[alunoKey]?.[chaveData]?.status;
    const novoStatus = proximoStatus(statusAtual);

    setGradeMap((prev) => {
      const mapaAluno = { ...(prev[alunoKey] || {}) };
      const celulaAtual = mapaAluno[chaveData] || {};

      if (!novoStatus) {
        delete mapaAluno[chaveData];
      } else {
        mapaAluno[chaveData] = {
          status: novoStatus,
          dataReposicaoReferencia:
            novoStatus === "Reposicao"
              ? celulaAtual.dataReposicaoReferencia || ""
              : "",
          observacao: celulaAtual.observacao || "",
        };
      }

      return {
        ...prev,
        [alunoKey]: mapaAluno,
      };
    });

  };

  const abrirModalObservacaoGrade = (alunoCodigoGrade, data) => {
    const alunoKey = String(alunoCodigoGrade);
    setObservacaoGradeModal({
      open: true,
      alunoCodigo: alunoKey,
      data,
      texto: gradeMap[alunoKey]?.[data]?.observacao || "",
    });
  };

  const salvarObservacaoGrade = () => {
    const alunoKey = String(observacaoGradeModal.alunoCodigo);
    const data = observacaoGradeModal.data;
    if (!alunoKey || !data || !gradeMap[alunoKey]?.[data]?.status) {
      setObservacaoGradeModal({
        open: false,
        alunoCodigo: "",
        data: "",
        texto: "",
      });
      return;
    }

    setGradeMap((prev) => ({
      ...prev,
      [alunoKey]: {
        ...(prev[alunoKey] || {}),
        [data]: {
          ...(prev[alunoKey]?.[data] || {}),
          observacao: observacaoGradeModal.texto,
        },
      },
    }));

    setObservacaoGradeModal({
      open: false,
      alunoCodigo: "",
      data: "",
      texto: "",
    });
  };

  const abrirModalReposicaoGrade = (alunoCodigoGrade, data) => {
    const alunoKey = String(alunoCodigoGrade);
    setReposicaoGradeModal({
      open: true,
      alunoCodigo: alunoKey,
      data,
      valor: gradeMap[alunoKey]?.[data]?.dataReposicaoReferencia || "",
    });
  };

  const nomeAlunoPorCodigoGrade = (alunoCodigoGrade) => {
    const aluno = gradeAlunos.find(
      (a) => String(a.Alunos_Codigo) === String(alunoCodigoGrade)
    );
    return aluno?.Alunos_Nome || "Aluno";
  };

  const salvarMatrizPresencas = async () => {
    const registros = Object.entries(gradeMap)
      .map(([alunoCodigoGrade, mapaDias]) => {
        const presencas = Object.entries(mapaDias || {})
          .filter(([, valor]) => !!valor?.status)
          .map(([data, valor]) => ({
            data,
            status: valor.status,
            dataReposicaoReferencia:
              valor.status === "Reposicao"
                ? valor.dataReposicaoReferencia || null
                : null,
            observacao: String(valor.observacao || "").trim() || null,
          }));
        return { Aluno_Codigo: Number(alunoCodigoGrade), presencas };
      })
      .filter((r) => r.presencas.length > 0);

    if (registros.length === 0) {
      showToast({
        type: "error",
        text: "Nao ha marcacoes na grade para salvar.",
      });
      return;
    }

    if (errosGrade.total > 0) {
      showToast({
        type: "error",
        text: "Existem erros na grade. Passe o mouse nas celulas destacadas para ver o motivo.",
      });
      return;
    }

    setSavingGrade(true);
    try {
      await api.post("/presenca/salvar-matriz", {
        ano: anoSelecionado,
        mes: mesSelecionadoIndex + 1,
        registros,
      });
      showToast({ type: "success", text: "Grade salva com sucesso." });
    } catch (error) {
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            "Nao foi possivel salvar a grade de presenca.",
        });
      }
    } finally {
      setSavingGrade(false);
    }
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
          <span className="px-2 py-1 rounded bg-red-700">F = Falta</span>
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
              const observacao = String(
                presencasMap[chaveData]?.observacao || ""
              ).trim();

              return (
                <div key={chaveData}>
                  <button
                    type="button"
                    onClick={() => alternarStatusDia(dia)}
                    disabled={!alunoCodigo || loadingPresencas}
                    className={`h-14 md:h-16 w-full border rounded-md flex flex-col justify-center items-center transition ${statusClass(
                      status
                    )} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={`${chaveData} - ${status || "Sem marcacao"}`}
                  >
                    <span className="text-xs md:text-sm">{dia}</span>
                    <span className="font-bold leading-none">
                      {legendaStatus(status)}
                    </span>
                    {observacao && (
                      <span className="text-[10px] leading-none max-w-full px-1 truncate opacity-90">
                        {observacao}
                      </span>
                    )}
                    {!!status && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          abrirModalObservacao(chaveData);
                        }}
                        className="mt-0.5 text-[10px] leading-none bg-black/30 hover:bg-black/45 text-white px-1 rounded cursor-pointer"
                        title={`Editar observacao de ${chaveData}`}
                      >
                        ✎
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {Object.entries(presencasMap).some(
          ([, v]) => !!v?.status && String(v?.observacao || "").trim()
        ) && (
          <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
            <h4 className="font-semibold mb-2">Dias com observacao</h4>
            <div className="space-y-1 text-sm">
              {Object.entries(presencasMap)
                .filter(
                  ([, valor]) =>
                    !!valor?.status && String(valor?.observacao || "").trim()
                )
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([data, valor]) => (
                  <p key={`obs-resumo-${data}`}>
                    {data} - {String(valor.observacao).trim()}
                  </p>
                ))}
            </div>
          </div>
        )}

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

        <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h4 className="font-semibold">Modelo 2 (comparacao) - Grade mensal</h4>
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={irParaMesAnterior}
                className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                title="Mes anterior"
              >
                {"<"}
              </button>
              <span className="min-w-[150px] text-center">
                {nomesMeses[mesSelecionadoIndex]} / {anoSelecionado}
              </span>
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
          </div>
          <div className="mb-3 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-2 items-center">
            <label className="text-sm text-gray-300">
              Filtrar alunos (codigo ou nome):
            </label>
            <input
              type="text"
              value={filtroGrade}
              onChange={(e) => setFiltroGrade(e.target.value)}
              className="border border-gray-300 rounded-md p-2 bg-white text-black"
              placeholder="Ex.: 12 ou Maria"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-gray-600 px-2 py-1 text-left bg-gray-800 min-w-[90px]">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoGrade("codigo")}
                      className="w-full text-left hover:text-yellow-300"
                    >
                      Codigo {marcadorOrdenacao("codigo")}
                    </button>
                  </th>
                  <th className="border border-gray-600 px-2 py-1 text-left bg-gray-800 min-w-[260px]">
                    <button
                      type="button"
                      onClick={() => alternarOrdenacaoGrade("nome")}
                      className="w-full text-left hover:text-yellow-300"
                    >
                      Nome do Aluno {marcadorOrdenacao("nome")}
                    </button>
                  </th>
                  {Array.from({ length: totalDiasMes }).map((_, idx) => {
                    const dia = idx + 1;
                    return (
                      <th
                        key={`wk-${dia}`}
                        className="border border-gray-600 px-2 py-1 bg-gray-800 text-center min-w-[34px]"
                      >
                        {nomeDiaSemana(dia)}
                      </th>
                    );
                  })}
                </tr>
                <tr>
                  <th className="border border-gray-600 px-2 py-1 text-left bg-gray-800 min-w-[90px]">
                    #
                  </th>
                  <th className="border border-gray-600 px-2 py-1 text-left bg-gray-800 min-w-[260px]">
                    Alunos ativos ({gradeAlunosFiltrados.length})
                  </th>
                  {Array.from({ length: totalDiasMes }).map((_, idx) => {
                    const dia = idx + 1;
                    return (
                      <th
                        key={`day-${dia}`}
                        className="border border-gray-600 px-2 py-1 bg-blue-900 text-center min-w-[34px]"
                      >
                        {dia}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {gradeAlunosFiltrados.map((alunoGrade) => {
                  const alunoKey = String(alunoGrade.Alunos_Codigo);
                  return (
                    <tr key={`row-grade-${alunoKey}`}>
                      <td className="border border-gray-600 px-2 py-1 bg-gray-800 whitespace-nowrap min-w-[90px]">
                        {alunoGrade.Alunos_Codigo}
                      </td>
                      <td className="border border-gray-600 px-2 py-1 bg-gray-800 whitespace-nowrap min-w-[260px]">
                        {alunoGrade.Alunos_Nome}
                      </td>
                      {Array.from({ length: totalDiasMes }).map((_, idx) => {
                        const dia = idx + 1;
                        const chaveData = toDateKey(
                          anoSelecionado,
                          mesSelecionadoIndex,
                          dia
                        );
                        const status =
                          gradeMap[alunoKey]?.[chaveData]?.status || "";
                        const erroCelula =
                          errosGrade.mapaErros?.[alunoKey]?.[chaveData] || "";
                        const observacao = String(
                          gradeMap[alunoKey]?.[chaveData]?.observacao || ""
                        ).trim();
                        return (
                          <td
                            key={`cell-${alunoKey}-${dia}`}
                            onClick={() =>
                              !loadingGrade &&
                              alternarStatusGrade(alunoKey, dia)
                            }
                            className={`relative group border border-gray-700 text-center font-bold select-none ${
                              loadingGrade
                                ? "cursor-wait opacity-70"
                                : "cursor-pointer"
                            } ${statusClass(status)} ${
                              erroCelula ? "ring-2 ring-yellow-300" : ""
                            }`}
                          >
                            <div className="min-h-[42px] flex flex-col items-center justify-center leading-none px-0.5">
                              <span>{legendaStatus(status)}</span>
                              {observacao && (
                                <span className="text-[9px] max-w-[34px] truncate opacity-90">
                                  {observacao}
                                </span>
                              )}
                              {(!!status || status === "Reposicao") && (
                                <div className="mt-0.5 flex items-center gap-1">
                                  {!!status && (
                                    <span
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirModalObservacaoGrade(
                                          alunoKey,
                                          chaveData
                                        );
                                      }}
                                      className="text-[10px] leading-none bg-black/30 hover:bg-black/45 text-white px-1 rounded cursor-pointer"
                                      title={`Editar observacao de ${chaveData}`}
                                    >
                                      ✎
                                    </span>
                                  )}
                                  {status === "Reposicao" && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        abrirModalReposicaoGrade(
                                          alunoKey,
                                          chaveData
                                        );
                                      }}
                                      className="text-[9px] leading-none bg-black/30 hover:bg-black/45 text-white px-1 rounded cursor-pointer"
                                      title="Editar data de reposicao"
                                    >
                                      R
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            {erroCelula && (
                              <div className="pointer-events-none absolute z-30 left-1/2 -translate-x-1/2 bottom-[calc(100%+10px)] hidden group-hover:block w-52 text-[10px] leading-tight bg-black text-yellow-100 border border-yellow-400 rounded-xl p-2 shadow-lg">
                                <div className="font-bold mb-0.5">
                                  {chaveData}
                                </div>
                                <div>{erroCelula}</div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-yellow-400" />
                                <div className="absolute left-1/2 -translate-x-1/2 top-[calc(100%-1px)] w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-black" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {gradeAlunosFiltrados.length === 0 && (
                  <tr>
                    <td className="border border-gray-600 px-2 py-2 bg-gray-800 min-w-[90px]">
                      -
                    </td>
                    <td className="border border-gray-600 px-2 py-2 bg-gray-800 min-w-[260px]">
                      Nenhum aluno encontrado
                    </td>
                    {Array.from({ length: totalDiasMes }).map((_, idx) => (
                      <td
                        key={`empty-filter-${idx + 1}`}
                        className="border border-gray-700"
                      />
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-2 gap-3">
            <p className="text-[11px] text-gray-400">
              Clique nas celulas para alternar status. Para reposicao na grade,
              sera solicitada a data da falta.
            </p>
            {errosGrade.total > 0 && (
              <p className="text-[11px] text-yellow-300">
                {errosGrade.total} erro(s) detectado(s) na grade.
              </p>
            )}
            <button
              type="button"
              onClick={salvarMatrizPresencas}
              disabled={savingGrade || loadingGrade}
              className="bg-emerald-600 rounded-md px-3 py-2 border-2 border-gray-300 font-bold hover:bg-emerald-700 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {savingGrade ? "Salvando grade..." : "Salvar grade"}
            </button>
          </div>
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

      {observacaoDiaModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-xl p-5">
            <h3 className="text-lg font-bold mb-3">Observacao do dia</h3>
            <p className="text-sm text-gray-300 mb-3">
              Data: {observacaoDiaModal.data}
            </p>
            <textarea
              value={observacaoDiaModal.texto}
              onChange={(e) =>
                setObservacaoDiaModal((prev) => ({
                  ...prev,
                  texto: e.target.value,
                }))
              }
              rows={4}
              maxLength={240}
              className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"
              placeholder="Escreva uma observacao para este dia (opcional)"
            />
            <p className="text-xs text-gray-400 mt-1">
              {observacaoDiaModal.texto.length}/240
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() =>
                  setObservacaoDiaModal({ open: false, data: "", texto: "" })
                }
                className="bg-gray-600 text-white p-2 border-2 rounded-md border-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarObservacaoDoDia}
                className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
              >
                Salvar observacao
              </button>
            </div>
          </div>
        </div>
      )}

      {reposicaoGradeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-xl p-5">
            <h3 className="text-lg font-bold mb-3">Reposicao na grade</h3>
            <p className="text-sm text-gray-300 mb-3">
              {nomeAlunoPorCodigoGrade(reposicaoGradeModal.alunoCodigo)} -
              reposicao em {reposicaoGradeModal.data}
            </p>
            <input
              type="date"
              value={reposicaoGradeModal.valor || ""}
              onChange={(e) =>
                setReposicaoGradeModal((prev) => ({
                  ...prev,
                  valor: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"
            />
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setGradeMap((prev) => {
                    const alunoKey = reposicaoGradeModal.alunoCodigo;
                    const data = reposicaoGradeModal.data;
                    const mapaAluno = { ...(prev[alunoKey] || {}) };
                    delete mapaAluno[data];
                    return { ...prev, [alunoKey]: mapaAluno };
                  });
                  setReposicaoGradeModal({
                    open: false,
                    alunoCodigo: "",
                    data: "",
                    valor: "",
                  });
                }}
                className="bg-gray-600 text-white p-2 border-2 rounded-md border-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!String(reposicaoGradeModal.valor || "").trim()) {
                    showToast({
                      type: "error",
                      text: "Informe a data de falta da reposicao.",
                    });
                    return;
                  }
                  setGradeMap((prev) => {
                    const alunoKey = reposicaoGradeModal.alunoCodigo;
                    const data = reposicaoGradeModal.data;
                    const mapaAluno = { ...(prev[alunoKey] || {}) };
                    mapaAluno[data] = {
                      ...(mapaAluno[data] || {}),
                      status: "Reposicao",
                      dataReposicaoReferencia: reposicaoGradeModal.valor,
                    };
                    return { ...prev, [alunoKey]: mapaAluno };
                  });
                  setReposicaoGradeModal({
                    open: false,
                    alunoCodigo: "",
                    data: "",
                    valor: "",
                  });
                }}
                className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {observacaoGradeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-600 rounded-xl p-5">
            <h3 className="text-lg font-bold mb-3">Observacao da grade</h3>
            <p className="text-sm text-gray-300 mb-3">
              {nomeAlunoPorCodigoGrade(observacaoGradeModal.alunoCodigo)} -{" "}
              {observacaoGradeModal.data}
            </p>
            <textarea
              value={observacaoGradeModal.texto}
              onChange={(e) =>
                setObservacaoGradeModal((prev) => ({
                  ...prev,
                  texto: e.target.value,
                }))
              }
              rows={4}
              maxLength={240}
              className="w-full border border-gray-300 rounded-md p-2 bg-white text-black"
              placeholder="Escreva uma observacao para esta celula (opcional)"
            />
            <p className="text-xs text-gray-400 mt-1">
              {observacaoGradeModal.texto.length}/240
            </p>
            <div className="flex justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() =>
                  setObservacaoGradeModal({
                    open: false,
                    alunoCodigo: "",
                    data: "",
                    texto: "",
                  })
                }
                className="bg-gray-600 text-white p-2 border-2 rounded-md border-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarObservacaoGrade}
                className="bg-emerald-600 rounded-md p-2 border-2 border-gray-300 font-bold hover:bg-emerald-700"
              >
                Salvar observacao
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrarPresenca;
