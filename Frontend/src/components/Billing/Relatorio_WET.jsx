import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import { formatarDataBR, formatarData, formatarHora } from "../../utils/Utils";
import MessageToast from "../miscellaneous/MessageToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";
import useToast from "../../hooks/useToast";

function Relatorio_WET() {
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [percentualDesconto, setPercentualDesconto] = useState(15);
  const [meses, setMeses] = useState([]);
  const [anos, setAnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [messageToast, showToast] = useToast();
  const [excludedPlanCodigo, setExcludedPlanCodigo] = useState("");
  const [excludedPlanos, setExcludedPlanos] = useState([]);
  const [planosDisponiveis, setPlanosDisponiveis] = useState([]);

  // Lista de meses
  useEffect(() => {
    const listaMeses = [
      { value: "1", label: "Janeiro" },
      { value: "2", label: "Fevereiro" },
      { value: "3", label: "Março" },
      { value: "4", label: "Abril" },
      { value: "5", label: "Maio" },
      { value: "6", label: "Junho" },
      { value: "7", label: "Julho" },
      { value: "8", label: "Agosto" },
      { value: "9", label: "Setembro" },
      { value: "10", label: "Outubro" },
      { value: "11", label: "Novembro" },
      { value: "12", label: "Dezembro" },
    ];
    setMeses(listaMeses);
    setMes(String(new Date().getMonth() + 1));
  }, []);

  // Lista de anos
  useEffect(() => {
    const anoAtual = new Date().getFullYear();
    const listaAnos = [];
    for (let a = anoAtual + 1; a >= 2020; a--) {
      listaAnos.push({ value: String(a), label: String(a) });
    }
    setAnos(listaAnos);
    setAno(String(anoAtual));
  }, []);

  // Buscar planos disponíveis para popular o select
  useEffect(() => {
    let mounted = true;
    const fetchPlanos = async () => {
      try {
        const res = await api.get("/planos");
        if (mounted) {
          setPlanosDisponiveis(res.data?.Planos || []);
        }
      } catch (err) {
        console.error("Erro ao buscar planos:", err);
      }
    };
    fetchPlanos();
    return () => {
      mounted = false;
    };
  }, []);

  // Buscar relatório
  const handleGerarRelatorio = async () => {
    if (!mes) {
      showToast({ type: "error", text: "Selecione um mês." });
      return;
    }
    if (!ano) {
      showToast({ type: "error", text: "Selecione um ano." });
      return;
    }
    setLoading(true);
    setRelatorio(null);
    try {
      const res = await api.get(`/faturamento/relatorio-mensal/${mes}/${ano}`);
      setRelatorio(res.data);
    } catch (error) {
      if (error?.response?.status !== 401) {
        showToast({ type: "error", text: "Erro ao buscar relatório." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para determinar número de meses do plano
  const getMesesPorTipoPlano = (tipoPagamento) => {
    const tipo = String(tipoPagamento || "").toLowerCase();
    if (tipo.includes("anual")) return 12;
    if (tipo.includes("semestral")) return 6;
    if (tipo.includes("trimestral")) return 3;
    return 1;
  };

  // Extrai mês e ano de uma data string (YYYY-MM-DD) sem problemas de timezone
  const extrairMesAno = (dataString) => {
    if (!dataString) return { mes: 1, ano: 2000 };
    const partes = String(dataString).split("T")[0].split("-");
    return {
      ano: parseInt(partes[0], 10),
      mes: parseInt(partes[1], 10),
    };
  };

  // Calcular qual é a parcela do mês selecionado
  const calcularParcela = (
    faturamentoInicio,
    tipoPagamento,
    mesSelecionado,
    anoSelecionado,
  ) => {
    const { mes: mesInicio, ano: anoInicio } = extrairMesAno(faturamentoInicio);
    const totalParcelas = getMesesPorTipoPlano(tipoPagamento);

    // Se o plano for unitário (1 parcela), sempre retorno 1/1
    if (totalParcelas === 1) {
      return { parcela: 1, totalParcelas };
    }

    // Calcula quantos meses se passaram desde o início
    let mesesPassados =
      (anoSelecionado - anoInicio) * 12 + (mesSelecionado - mesInicio);
    let parcela = mesesPassados + 1;

    // Garante limites entre 1 e totalParcelas
    if (parcela < 1) parcela = 1;
    if (parcela > totalParcelas) parcela = totalParcelas;

    return { parcela, totalParcelas };
  };

  const montarMotivo = (pag) => {
    const motivos = [
      pag.Faturamento_Desconto_Motivo,
      pag.Faturamento_Cancelado_Motivo,
      pag.Faturamento_Reajuste_Motivo,
    ]
      .map((motivo) => String(motivo || "").trim())
      .filter(Boolean);
    return motivos.length > 0 ? motivos.join("\n") : "";
  };

  // Processar dados do relatório
  const processarDados = () => {
    if (
      !relatorio ||
      !relatorio.pagamentos ||
      relatorio.pagamentos.length === 0
    ) {
      return [];
    }

    const { pagamentos, alunos, planos, mesSelecionado, anoSelecionado } =
      relatorio;
    const desconto = parseFloat(percentualDesconto) || 0;

    // aplica exclusões de planos antes de processar
    const pagamentosFiltrados = pagamentos.filter(
      (pag) =>
        !excludedPlanos.some(
          (ep) => String(ep.codigo) === String(pag.Plano_Codigo),
        ),
    );

    const resultado = [];

    const pushCancelamentoRow = (
      pag,
      plano,
      aluno,
      parcelaStr,
      valorMensal,
      valorComDesconto,
      valorWET,
      valorPA,
    ) => {
      resultado.push({
        id: `${pag.id}-cancel`,
        alunoNome: aluno.Alunos_Nome || "-",
        alunoCodigo: pag.Aluno_Codigo,
        planoCodigo: pag.Plano_Codigo,
        planoNome: plano.Plano_Nome || "-",
        planoTipo: plano.Plano_Pagamento || "-",
        dataPagamento: null,
        parcela: parcelaStr,
        valorMensal:
          typeof valorMensal === "number" ? -valorMensal : valorMensal,
        valorComDesconto:
          typeof valorComDesconto === "number"
            ? -valorComDesconto
            : valorComDesconto,
        valorWET: typeof valorWET === "number" ? -valorWET : valorWET,
        valorPA: typeof valorPA === "number" ? -valorPA : valorPA,
        motivo: montarMotivo(pag),
        isCancelamento: true,
      });
    };

    const isMesCancelado = (pag, mesSel, anoSel) => {
      if (!pag.Faturamento_Cancelado || !pag.Faturamento_Cancelado_Em)
        return false;
      const partes = String(pag.Faturamento_Cancelado_Em)
        .split("T")[0]
        .split("-");
      const anoCancelado = parseInt(partes[0], 10);
      const mesCancelado = parseInt(partes[1], 10);
      return (
        anoSel > anoCancelado ||
        (anoSel === anoCancelado && mesSel > mesCancelado)
      );
    };

    const pushReajusteRow = (
      pag,
      plano,
      aluno,
      parcelaStr,
      valorReajuste,
      valorMensalBase,
      valorComDescontoBase,
      valorWETBase,
      valorPABase,
    ) => {
      const desc = parseFloat(percentualDesconto) || 0;
      const valorComDescontoReajuste =
        typeof valorComDescontoBase === "number"
          ? valorReajuste * (1 - desc / 100)
          : "-";
      const valorWETReajuste =
        typeof valorWETBase === "number"
          ? typeof valorComDescontoReajuste === "number"
            ? valorComDescontoReajuste / 2
            : 0
          : "-";
      const valorPAReajuste =
        typeof valorPABase === "number"
          ? typeof valorComDescontoReajuste === "number"
            ? valorComDescontoReajuste / 2
            : 0
          : "-";
      resultado.push({
        id: `${pag.id}-reajuste`,
        alunoNome: aluno.Alunos_Nome || "-",
        alunoCodigo: pag.Aluno_Codigo,
        planoCodigo: pag.Plano_Codigo,
        planoNome: plano.Plano_Nome || "-",
        planoTipo: plano.Plano_Pagamento || "-",
        dataPagamento: null,
        parcela: parcelaStr,
        valorMensal: valorReajuste,
        valorComDesconto: valorComDescontoReajuste,
        valorWET: valorWETReajuste,
        valorPA: valorPAReajuste,
        motivo: montarMotivo(pag),
        isReajuste: true,
      });
    };

    const isMesReajustado = (pag, mesSel, anoSel) => {
      if (!pag.Faturamento_Reajuste || !pag.Faturamento_Reajuste_Partir_De)
        return false;
      const partes = String(pag.Faturamento_Reajuste_Partir_De)
        .split("T")[0]
        .split("-");
      const anoReajuste = parseInt(partes[0], 10);
      const mesReajuste = parseInt(partes[1], 10);
      return (
        anoSel > anoReajuste ||
        (anoSel === anoReajuste && mesSel >= mesReajuste)
      );
    };

    for (const pag of pagamentosFiltrados) {
      const aluno =
        alunos.find((a) => a.Alunos_Codigo === pag.Aluno_Codigo) || {};
      const plano =
        planos.find((p) => p.Plano_Codigo === pag.Plano_Codigo) || {};

      const valorTotalFaturamento =
        parseFloat(pag.Faturamento_Valor_Total) || 0;
      const mesesPlano = getMesesPorTipoPlano(plano.Plano_Pagamento);

      // Se existir contador no faturamento, consideramos apenas linhas com repasse
      if (pag.Faturamento_Contador != null) {
        if (pag.Faturamento_Repasse != null) {
          const repasse = parseFloat(pag.Faturamento_Repasse) || 0;
          const { parcela, totalParcelas } = calcularParcela(
            pag.Faturamento_Inicio,
            plano.Plano_Pagamento,
            mesSelecionado || parseInt(mes, 10),
            anoSelecionado || parseInt(ano, 10),
          );

          resultado.push({
            id: pag.id,
            alunoNome: aluno.Alunos_Nome || "-",
            alunoCodigo: pag.Aluno_Codigo,
            planoCodigo: pag.Plano_Codigo,
            planoNome: plano.Plano_Nome || "-",
            planoTipo: plano.Plano_Pagamento || "-",
            dataPagamento: pag.Faturamento_Data_Pagamento,
            parcela: `${parcela}/${totalParcelas}`,
            // Preencher valorMensal e valorWET com o valor do repasse
            valorMensal: repasse,
            // exibir traço para valor com desconto conforme solicitado
            valorComDesconto: "-",
            valorWET: repasse,
            valorPA: 0,
            motivo: montarMotivo(pag),
          });
          if (
            isMesCancelado(
              pag,
              mesSelecionado || parseInt(mes, 10),
              anoSelecionado || parseInt(ano, 10),
            )
          ) {
            pushCancelamentoRow(
              pag,
              plano,
              aluno,
              `${parcela}/${totalParcelas}`,
              repasse,
              "-",
              repasse,
              0,
            );
          }
          if (
            isMesReajustado(
              pag,
              mesSelecionado || parseInt(mes, 10),
              anoSelecionado || parseInt(ano, 10),
            )
          ) {
            pushReajusteRow(
              pag,
              plano,
              aluno,
              `${parcela}/${totalParcelas}`,
              parseFloat(pag.Faturamento_Reajuste),
              repasse,
              "-",
              repasse,
              0,
            );
          }
        }
        // se não houver repasse, ignoramos a linha
      } else {
        // comportamento padrão quando não há contador
        const valorMensal = valorTotalFaturamento / mesesPlano;
        const valorComDesconto = valorMensal * (1 - desconto / 100);
        const valorWET = valorComDesconto / 2;
        const valorPA = valorComDesconto / 2;

        const { parcela, totalParcelas } = calcularParcela(
          pag.Faturamento_Inicio,
          plano.Plano_Pagamento,
          mesSelecionado || parseInt(mes, 10),
          anoSelecionado || parseInt(ano, 10),
        );

        resultado.push({
          id: pag.id,
          alunoNome: aluno.Alunos_Nome || "-",
          alunoCodigo: pag.Aluno_Codigo,
          planoCodigo: pag.Plano_Codigo,
          planoNome: plano.Plano_Nome || "-",
          planoTipo: plano.Plano_Pagamento || "-",
          dataPagamento: pag.Faturamento_Data_Pagamento,
          parcela: `${parcela}/${totalParcelas}`,
          valorMensal,
          valorComDesconto,
          valorWET,
          valorPA,
          motivo: montarMotivo(pag),
        });
        if (
          isMesCancelado(
            pag,
            mesSelecionado || parseInt(mes, 10),
            anoSelecionado || parseInt(ano, 10),
          )
        ) {
          pushCancelamentoRow(
            pag,
            plano,
            aluno,
            `${parcela}/${totalParcelas}`,
            valorMensal,
            valorComDesconto,
            valorWET,
            valorPA,
          );
        }
        if (
          isMesReajustado(
            pag,
            mesSelecionado || parseInt(mes, 10),
            anoSelecionado || parseInt(ano, 10),
          )
        ) {
          pushReajusteRow(
            pag,
            plano,
            aluno,
            `${parcela}/${totalParcelas}`,
            parseFloat(pag.Faturamento_Reajuste),
            valorMensal,
            valorComDesconto,
            valorWET,
            valorPA,
          );
        }
      }
    }

    return resultado;
  };

  // Calcular totais
  const calcularTotais = (dados) => {
    return dados.reduce(
      (acc, item) => ({
        valorMensal: acc.valorMensal + (Number(item.valorMensal) || 0),
        valorComDesconto:
          acc.valorComDesconto + (Number(item.valorComDesconto) || 0),
        valorWET: acc.valorWET + (Number(item.valorWET) || 0),
        valorPA: acc.valorPA + (Number(item.valorPA) || 0),
      }),
      { valorMensal: 0, valorComDesconto: 0, valorWET: 0, valorPA: 0 },
    );
  };

  // Gerar PDF
  const handleGerarPDF = async () => {
    if (
      !relatorio ||
      !relatorio.pagamentos ||
      relatorio.pagamentos.length === 0
    ) {
      showToast({ type: "error", text: "Gere um relatório primeiro." });
      return;
    }
    setLoadingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("l", "mm", "a4"); // Landscape para caber mais colunas

      const nomeMesLabel = meses.find((m) => m.value === mes)?.label || mes;
      const filename = `Relatorio_WET_${nomeMesLabel}_${ano}.pdf`;

      // Cores
      const bgDark = [31, 41, 55];
      const bgCard = [17, 24, 39];
      const textWhite = [255, 255, 255];
      const textGray = [156, 163, 175];
      const textGreen = [74, 222, 128];
      const textYellow = [250, 204, 21];
      const borderGray = [55, 65, 81];

      let y = 10;
      const marginLeft = 10;
      const pageWidth = 275;

      // Fundo geral
      doc.setFillColor(...bgDark);
      doc.rect(0, 0, 297, 210, "F");

      // Título
      doc.setFontSize(16);
      doc.setTextColor(...textWhite);
      doc.text(`Relatório Mensal WET - ${nomeMesLabel}/${ano}`, 148.5, y + 8, {
        align: "center",
      });
      y += 18;

      // Info do percentual
      doc.setFontSize(10);
      doc.setTextColor(...textGray);
      doc.text(`Percentual de Desconto: ${percentualDesconto}%`, marginLeft, y);
      y += 10;

      // Cabeçalho da tabela
      const dados = processarDados();
      const totais = calcularTotais(dados);

      doc.setFillColor(...bgCard);
      doc.roundedRect(marginLeft, y, pageWidth, 8, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(...textWhite);

      const colX = {
        codigo: marginLeft + 2,
        aluno: marginLeft + 16,
        plano: marginLeft + 62,
        parcela: marginLeft + 92,
        dataPag: marginLeft + 112,
        valorMensal: marginLeft + 136,
        valorDesc: marginLeft + 163,
        valorWET: marginLeft + 190,
        motivo: marginLeft + 219,
      };

      doc.text("Cód", colX.codigo, y + 5.5);
      doc.text("Aluno", colX.aluno, y + 5.5);
      doc.text("Plano", colX.plano, y + 5.5);
      doc.text("Parcela", colX.parcela, y + 5.5);
      doc.text("Data Pgto", colX.dataPag, y + 5.5);
      doc.text("Valor Mensal", colX.valorMensal, y + 5.5);
      doc.text(`Valor c/ Desc`, colX.valorDesc, y + 5.5);
      doc.text("Repasse WET ( 50% )", colX.valorWET, y + 5.5);
      doc.text("Motivo", colX.motivo, y + 5.5);

      y += 12;

      // Linhas de dados
      const textPurple = [192, 132, 252];
      for (const item of dados) {
        const motivoLinhas = item.motivo
          ? doc.splitTextToSize(item.motivo, 26)
          : [];
        const rowHeight = Math.max(6, motivoLinhas.length * 4);
        if (y > 185 - rowHeight) {
          doc.addPage();
          doc.setFillColor(...bgDark);
          doc.rect(0, 0, 297, 210, "F");
          y = 10;
        }

        doc.setFontSize(8);
        doc.setTextColor(...textGray);
        doc.text(String(item.alunoCodigo), colX.codigo, y);
        doc.text(item.alunoNome.substring(0, 25), colX.aluno, y);
        doc.text(item.planoNome.substring(0, 18), colX.plano, y);
        doc.setTextColor(...textPurple);
        doc.text(item.parcela, colX.parcela, y);
        doc.setTextColor(...textGray);
        doc.text(
          item.dataPagamento ? formatarDataBR(item.dataPagamento) : "-",
          colX.dataPag,
          y,
        );

        doc.setTextColor(...textGreen);
        doc.text(`R$ ${item.valorMensal.toFixed(2)}`, colX.valorMensal, y);
        doc.setTextColor(...textYellow);
        const valorComDescText =
          typeof item.valorComDesconto === "number"
            ? `R$ ${item.valorComDesconto.toFixed(2)}`
            : "-";
        doc.text(valorComDescText, colX.valorDesc, y);
        doc.setTextColor(...textWhite);
        const valorWETText =
          typeof item.valorWET === "number" ? `R$ ${item.valorWET.toFixed(2)}` : "-";
        doc.text(valorWETText, colX.valorWET, y);
        doc.setTextColor(...textGray);
        if (motivoLinhas.length > 0) {
          doc.text(motivoLinhas, colX.motivo, y);
        }

        y += rowHeight;
      }

      // Linha de total
      y += 4;
      doc.setFillColor(...borderGray);
      doc.roundedRect(marginLeft, y - 2, pageWidth, 10, 2, 2, "F");

      doc.setFontSize(9);
      doc.setTextColor(...textWhite);
      doc.text("TOTAL", colX.aluno, y + 4);

      doc.setTextColor(...textGreen);
      doc.text(`R$ ${totais.valorMensal.toFixed(2)}`, colX.valorMensal, y + 4);
      doc.setTextColor(...textYellow);
      doc.text(
        `R$ ${totais.valorComDesconto.toFixed(2)}`,
        colX.valorDesc,
        y + 4,
      );
      doc.setTextColor(...textWhite);
      doc.text(`R$ ${totais.valorWET.toFixed(2)}`, colX.valorWET, y + 4);
      doc.setTextColor(...textGray);
      doc.text("", colX.motivo, y + 4);

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(...textGray);
      doc.text(
        `Gerado em: ${formatarData(new Date().toISOString())} às ${formatarHora(
          new Date().toISOString(),
        )}`,
        148.5,
        200,
        { align: "center" },
      );

      doc.save(filename);
      showToast({ type: "success", text: "PDF gerado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast({ type: "error", text: "Erro ao gerar PDF." });
    } finally {
      setLoadingPdf(false);
    }
  };

  const dados = relatorio ? processarDados() : [];
  const totais = dados.length > 0 ? calcularTotais(dados) : null;

  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");

  const handleHeaderClick = (field) => {
    if (sortBy === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const sortedDados = useMemo(() => {
    if (!dados || dados.length === 0) return [];
    if (!sortBy) return dados;
    const copy = [...dados];
    copy.sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];

      // normalize values based on field
      if (sortBy === "alunoCodigo") {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      } else if (sortBy === "alunoNome" || sortBy === "planoNome") {
        // Usa localeCompare para ordenar corretamente com acentos
        const strA = (va || "").toString();
        const strB = (vb || "").toString();
        const comparison = strA.localeCompare(strB, "pt-BR", {
          sensitivity: "base",
        });
        return sortDir === "desc" ? -comparison : comparison;
      } else if (sortBy === "parcela") {
        // parcela format "X/Y"
        va = parseInt((va || "").toString().split("/")[0], 10) || 0;
        vb = parseInt((vb || "").toString().split("/")[0], 10) || 0;
      } else if (sortBy === "dataPagamento") {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      } else if (sortBy === "motivo") {
        va = (va || "").toString();
        vb = (vb || "").toString();
      } else if (["valorMensal", "valorComDesconto", "valorWET", "valorPA"].includes(sortBy)) {
        va = Number(va) || 0;
        vb = Number(vb) || 0;
      }

      if (va < vb) return sortDir === "desc" ? 1 : -1;
      if (va > vb) return sortDir === "desc" ? -1 : 1;
      return 0;
    });
    return copy;
  }, [dados, sortBy, sortDir]);

  return (
    <div className="w-full h-auto">
      <MessageToast messageToast={messageToast} />
      <div
        className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-4 w-full h-full min-h-[80vh] shadow-lg border-2 border-gray-700"
        style={{ minWidth: 0, maxWidth: "100vw" }}
      >
        <h2 className="text-xl font-bold text-white mb-4">
          Relatório Mensal WET
        </h2>

        {/* Dropdowns e Campo de Desconto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Dropdown Mês */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-300 text-sm">
              Mês:<span className="text-red-500"> *</span>
            </label>
            <CustomSelect
              name="mes"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
              required
              placeholder="Selecione o mês"
              options={meses}
            />
          </div>

          {/* Dropdown Ano */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-300 text-sm">
              Ano:<span className="text-red-500"> *</span>
            </label>
            <CustomSelect
              name="ano"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              required
              placeholder="Selecione o ano"
              options={anos}
            />
          </div>

          {/* Campo Percentual de Desconto */}
          <div className="flex flex-col gap-1">
            <label className="text-gray-300 text-sm">
              Percentual de Desconto (%):
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={percentualDesconto}
              onChange={(e) => setPercentualDesconto(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Campo único com select para excluir planos + botão */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm">
              Plano para excluir do relatório
            </label>
            <select
              value={excludedPlanCodigo}
              onChange={(e) => setExcludedPlanCodigo(e.target.value)}
              className="bg-gray-700 text-white rounded-md p-2 border border-gray-600"
            >
              <option value="">-- selecione um plano --</option>
              {planosDisponiveis?.map((p) => (
                <option key={p.Plano_Codigo} value={p.Plano_Codigo}>
                  {`${p.Plano_Codigo} — ${p.Plano_Nome}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center sm:-mt-8">
            <Buttons.BotaoCadastrar
              type="button"
              onClick={() => {
                if (!excludedPlanCodigo) {
                  showToast({
                    type: "error",
                    text: "Selecione um plano para excluir.",
                  });
                  return;
                }
                const planoSelecionado = relatorio?.planos?.find(
                  (pp) =>
                    String(pp.Plano_Codigo) === String(excludedPlanCodigo),
                );
                const nome = planoSelecionado
                  ? planoSelecionado.Plano_Nome
                  : "";
                if (
                  excludedPlanos.some(
                    (p) => String(p.codigo) === String(excludedPlanCodigo),
                  )
                ) {
                  showToast({
                    type: "error",
                    text: "Plano já está na lista de exclusão.",
                  });
                  return;
                }
                setExcludedPlanos((prev) => [
                  ...prev,
                  { codigo: excludedPlanCodigo, nome },
                ]);
                setExcludedPlanCodigo("");
                showToast({
                  type: "success",
                  text: "Plano adicionado à exclusão.",
                });
              }}
            >
              Adicionar
            </Buttons.BotaoCadastrar>
          </div>
          <div className="flex flex-col">
            <label className="text-gray-300 text-sm">
              Planos excluídos do relatório
            </label>
            <div className="bg-gray-800 rounded-md p-2 border border-gray-700 h-24 overflow-auto">
              {excludedPlanos.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  Nenhum plano excluído
                </div>
              ) : (
                <ul className="text-sm text-gray-200 space-y-1">
                  {excludedPlanos.map((p) => (
                    <li
                      key={p.codigo}
                      className="flex items-center justify-between"
                    >
                      <span>
                        <strong className="text-white">{p.codigo}</strong>
                        {p.nome ? ` — ${p.nome}` : ""}
                      </span>
                      <button
                        onClick={() =>
                          setExcludedPlanos((prev) =>
                            prev.filter(
                              (x) => String(x.codigo) !== String(p.codigo),
                            ),
                          )
                        }
                        className="text-red-400 hover:text-red-300 ml-2"
                        type="button"
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Botão Gerar Relatório */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Buttons.BotaoExtrato
            onClick={handleGerarRelatorio}
            loading={loading}
          >
            Gerar Relatório
          </Buttons.BotaoExtrato>
        </div>

        {/* Resultados do Relatório */}
        {relatorio && (
          <div className="mt-6 space-y-4">
            {dados.length > 0 ? (
              <>
                {/* Tabela de resultados */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-900 text-gray-300 uppercase text-xs">
                      <tr>
                        <th
                          className="px-3 py-3 rounded-tl-lg cursor-pointer"
                          onClick={() => handleHeaderClick("alunoCodigo")}
                        >
                          Cód{" "}
                          {sortBy === "alunoCodigo"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => handleHeaderClick("alunoNome")}
                        >
                          Aluno{" "}
                          {sortBy === "alunoNome"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => handleHeaderClick("planoNome")}
                        >
                          Plano{" "}
                          {sortBy === "planoNome"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => handleHeaderClick("parcela")}
                        >
                          Parcela{" "}
                          {sortBy === "parcela"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => handleHeaderClick("dataPagamento")}
                        >
                          Data Pgto{" "}
                          {sortBy === "dataPagamento"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 text-right rounded-tr-lg cursor-pointer"
                          onClick={() => handleHeaderClick("valorMensal")}
                        >
                          Valor Mensal{" "}
                          {sortBy === "valorMensal"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 text-right rounded-tr-lg cursor-pointer"
                          onClick={() => handleHeaderClick("valorComDesconto")}
                        >
                          Valor c/ Desc ({percentualDesconto}%){" "}
                          {sortBy === "valorComDesconto"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 text-right rounded-tr-lg cursor-pointer"
                          onClick={() => handleHeaderClick("valorWET")}
                        >
                          Repasse WET ( 50% ){" "}
                          {sortBy === "valorWET"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                        <th
                          className="px-3 py-3 cursor-pointer"
                          onClick={() => handleHeaderClick("motivo")}
                        >
                          Motivo{" "}
                          {sortBy === "motivo"
                            ? sortDir === "desc"
                              ? "▼"
                              : "▲"
                            : ""}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDados.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-700 ${
                            item.isCancelamento
                              ? "bg-red-950/30 hover:bg-red-900/40"
                              : item.isReajuste
                                ? "bg-blue-950/30 hover:bg-blue-900/40"
                                : idx % 2 === 0
                                  ? "bg-gray-800 hover:bg-gray-700"
                                  : "bg-gray-750 hover:bg-gray-700"
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-400">
                            {item.alunoCodigo}
                          </td>
                          <td className="px-3 py-2 text-white font-medium">
                            {item.isCancelamento ? (
                              <span className="flex items-center gap-1">
                                {item.alunoNome}
                                <span className="text-red-400 text-xs font-semibold ml-1">
                                  cancelamento
                                </span>
                              </span>
                            ) : item.isReajuste ? (
                              <span className="flex items-center gap-1">
                                {item.alunoNome}
                                <span className="text-blue-400 text-xs font-semibold ml-1">
                                  reajuste de mudança de plano
                                </span>
                              </span>
                            ) : (
                              item.alunoNome
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <span className="text-white font-medium">
                              {item.planoNome}
                            </span>
                            <span className="text-slate-400 text-sm ml-2">
                              ({item.planoCodigo})
                            </span>
                          </td>
                          <td
                            className={`px-3 py-2 font-semibold ${item.isCancelamento ? "text-red-400" : item.isReajuste ? "text-blue-400" : "text-purple-400"}`}
                          >
                            {item.parcela}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {item.dataPagamento
                              ? formatarDataBR(item.dataPagamento)
                              : "-"}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${item.isCancelamento ? "text-red-400" : item.isReajuste ? "text-blue-400" : "text-green-400"}`}
                          >
                            {typeof item.valorMensal === "number"
                              ? `${item.isReajuste && item.valorMensal > 0 ? "+" : ""}R$ ${item.valorMensal.toFixed(2)}`
                              : item.valorMensal}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${item.isCancelamento ? "text-red-400" : item.isReajuste ? "text-blue-400" : "text-yellow-400"}`}
                          >
                            {item.valorComDesconto === "-"
                              ? "-"
                              : typeof item.valorComDesconto === "number"
                                ? `${item.isReajuste && item.valorComDesconto > 0 ? "+" : ""}R$ ${item.valorComDesconto.toFixed(2)}`
                                : "-"}
                          </td>
                          <td
                            className={`px-3 py-2 text-right font-semibold ${item.isCancelamento ? "text-red-400" : item.isReajuste ? "text-blue-400" : "text-blue-400"}`}
                          >
                            {typeof item.valorWET === "number"
                              ? `${item.isReajuste && item.valorWET > 0 ? "+" : ""}R$ ${item.valorWET.toFixed(2)}`
                              : item.valorWET}
                          </td>
                          <td className="px-3 py-2 text-gray-300 whitespace-pre-line align-top">
                            {item.motivo || ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {/* Linha de Total */}
                    {totais && (
                      <tfoot className="bg-gray-700">
                        <tr className="font-bold text-white">
                          <td className="px-3 py-3 rounded-bl-lg" colSpan="5">
                            TOTAL
                          </td>
                          <td className="px-3 py-3 text-green-400 text-right">
                            R$ {totais.valorMensal.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-yellow-400 text-right">
                            R$ {totais.valorComDesconto.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-blue-400 text-right rounded-br-lg">
                            R$ {totais.valorWET.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-gray-400"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                {/* Botão Salvar PDF */}
                <div className="flex justify-center pt-4">
                  <Buttons.BotaoPDF
                    onClick={handleGerarPDF}
                    loading={loadingPdf}
                  />
                </div>
              </>
            ) : (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 text-center">
                <span className="text-gray-400">
                  Nenhum pagamento encontrado para o mês selecionado.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Relatorio_WET;
