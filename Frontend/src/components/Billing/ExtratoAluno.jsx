import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatarDataBR } from "../../utils/Utils";
import MessageToast from "../miscellaneous/MessageToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";
import useToast from "../../hooks/useToast";

/* ── Calcula a data de início do próximo ciclo (Faturamento_Fim + 1 mês) ── */
function proximaRenovacaoISO(dataISO) {
  if (!dataISO) return null;
  const [ano, mes, dia] = String(dataISO).split("-").map(Number);
  // Calcula o mês alvo (1-based) e ano alvo
  const anoAlvo = mes === 12 ? ano + 1 : ano;
  const mesAlvo = mes === 12 ? 1 : mes + 1;
  // Clamp ao último dia do mês alvo (evita overflow: ex. 31/jan → 28/fev, não 03/mar)
  const ultimoDia = new Date(anoAlvo, mesAlvo, 0).getDate();
  const diaAlvo = Math.min(dia, ultimoDia);
  return `${anoAlvo}-${String(mesAlvo).padStart(2, "0")}-${String(diaAlvo).padStart(2, "0")}`;
}

/* ── micro helpers ── */
function StatusBadge({ status }) {
  if (!status) return null;
  const isAtivo = status === "Ativo";
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        isAtivo
          ? "bg-emerald-900/50 text-emerald-300 border-emerald-700/60"
          : "bg-red-900/50 text-red-300 border-red-700/60"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isAtivo ? "bg-emerald-400" : "bg-red-400"}`}
      />
      {status}
    </span>
  );
}

function InfoField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="text-base leading-none mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs leading-none mb-0.5">{label}</p>
        <p className="text-gray-200 text-sm font-medium truncate">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, colorClass }) {
  return (
    <div
      className={`rounded-xl p-2 sm:p-4 border flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3 ${colorClass}`}
    >
      <span className="text-xl sm:text-2xl leading-none shrink-0">{icon}</span>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-gray-400 text-[10px] sm:text-xs">{label}</p>
        <p className="text-white font-bold text-xs sm:text-lg leading-tight break-all">
          {value}
        </p>
      </div>
    </div>
  );
}

function ExtratoAluno({ initialAlunoCodigo } = {}) {
  const [codigoAluno, setCodigoAluno] = useState(
    initialAlunoCodigo ? String(initialAlunoCodigo) : "",
  );
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [extrato, setExtrato] = useState(null);
  const [messageToast, showToast] = useToast();
  const [comprovanteModal, setComprovanteModal] = useState(null);

  // Buscar todos os alunos ao montar
  useEffect(() => {
    const fetchAlunos = async () => {
      try {
        const res = await api.get("/alunos/");
        setAlunos(res.data.Listagem_de_Alunos || []);
      } catch {
        setAlunos([]);
      }
    };
    fetchAlunos();
  }, []);

  // Auto-carregar extrato quando initialAlunoCodigo for fornecido
  useEffect(() => {
    if (initialAlunoCodigo) {
      setLoading(true);
      setExtrato(null);
      api
        .get(`/faturamento/extrato/${initialAlunoCodigo}/all`)
        .then((res) => setExtrato(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [initialAlunoCodigo]);

  const handleExtrato = async () => {
    if (!codigoAluno) {
      showToast({ type: "error", text: "Selecione um aluno." });
      return;
    }
    setLoading(true);
    setExtrato(null);
    try {
      const res = await api.get(`/faturamento/extrato/${codigoAluno}/all`);
      setExtrato(res.data);
    } catch (error) {
      if (error?.response?.status !== 401) {
        showToast({ type: "error", text: "Erro ao buscar extrato." });
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar PDF com jsPDF (sem html2canvas)
  const handleGerarPDF = async () => {
    if (!extrato) {
      showToast({ type: "error", text: "Carregue um extrato primeiro." });
      return;
    }
    setLoadingPdf(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("p", "mm", "a4");

      const nomeAluno = extrato.aluno?.Alunos_Nome || "Aluno";
      const filename = `Extrato_${nomeAluno.replace(/\s+/g, "_")}.pdf`;

      // Cores
      const bgDark = [31, 41, 55]; // #1f2937
      const bgCard = [17, 24, 39]; // #111827
      const textWhite = [255, 255, 255];
      const textGray = [156, 163, 175]; // #9ca3af
      const textGreen = [74, 222, 128]; // #4ade80
      const textYellow = [250, 204, 21]; // #facc15
      const bgGreen = [22, 163, 74]; // #16a34a
      const bgRed = [220, 38, 38]; // #dc2626
      const bgYellow = [202, 138, 4]; // #ca8a04
      const borderGray = [55, 65, 81]; // #374151

      let y = 10;
      const marginLeft = 10;
      const pageWidth = 190;

      // Fundo geral
      doc.setFillColor(...bgDark);
      doc.rect(0, 0, 210, 297, "F");

      // Título
      doc.setFontSize(18);
      doc.setTextColor(...textWhite);
      doc.text(`Extrato do Aluno`, 105, y + 10, { align: "center" });
      y += 25;

      // Card: Informações do Aluno
      doc.setFillColor(...bgCard);
      doc.roundedRect(marginLeft, y, pageWidth, 55, 3, 3, "F");
      doc.setDrawColor(...borderGray);
      doc.roundedRect(marginLeft, y, pageWidth, 55, 3, 3, "S");

      doc.setFontSize(14);
      doc.setTextColor(...textWhite);
      doc.text("Informações do Aluno", marginLeft + 5, y + 10);

      doc.setFontSize(10);
      doc.setTextColor(...textGray);
      let infoY = y + 18;
      doc.text(
        `Código: ${extrato.aluno?.Alunos_Codigo || "-"}`,
        marginLeft + 5,
        infoY,
      );
      infoY += 6;
      doc.text(
        `Nome: ${extrato.aluno?.Alunos_Nome || "-"}`,
        marginLeft + 5,
        infoY,
      );
      // Status badge
      const status = extrato.aluno?.Alunos_Situacao || "";
      if (status) {
        const statusX =
          marginLeft +
          5 +
          doc.getTextWidth(`Nome: ${extrato.aluno?.Alunos_Nome || "-"}`) +
          5;
        doc.setFillColor(...(status === "Ativo" ? bgGreen : bgRed));
        doc.roundedRect(statusX, infoY - 3.5, 15, 5, 1, 1, "F");
        doc.setFontSize(8);
        doc.setTextColor(...textWhite);
        doc.text(status, statusX + 7.5, infoY, { align: "center" });
        doc.setFontSize(10);
        doc.setTextColor(...textGray);
      }
      infoY += 6;
      doc.text(
        `CPF: ${extrato.aluno?.Alunos_CPF || "-"}`,
        marginLeft + 5,
        infoY,
      );
      infoY += 6;
      doc.text(
        `Email: ${extrato.aluno?.Alunos_Email || "-"}`,
        marginLeft + 5,
        infoY,
      );
      infoY += 6;
      doc.text(
        `Telefone: ${extrato.aluno?.Alunos_Telefone || "-"}`,
        marginLeft + 5,
        infoY,
      );
      infoY += 6;
      doc.text(
        `Data Matrícula: ${
          extrato.aluno?.Alunos_Data_Matricula
            ? formatarDataBR(extrato.aluno.Alunos_Data_Matricula)
            : "-"
        }`,
        marginLeft + 5,
        infoY,
      );

      y += 62;

      // Planos
      const planosSorted = [...(extrato.planos || [])].sort((a, b) => {
        const dataA = a.faturamentos?.[0]?.Faturamento_Inicio
          ? new Date(a.faturamentos[0].Faturamento_Inicio)
          : new Date(9999, 0, 1);
        const dataB = b.faturamentos?.[0]?.Faturamento_Inicio
          ? new Date(b.faturamentos[0].Faturamento_Inicio)
          : new Date(9999, 0, 1);
        return dataA - dataB;
      });

      for (const plano of planosSorted) {
        const planFatsSorted = [...(plano.faturamentos || [])].sort(
          (a, b) =>
            new Date(a.Faturamento_Inicio || 0) -
            new Date(b.Faturamento_Inicio || 0),
        );
        const totalPlano = planFatsSorted.reduce(
          (acc, f) =>
            acc +
            (parseFloat(f.Faturamento_Valor_Total) || 0) -
            (parseFloat(f.Faturamento_Desconto) || 0),
          0,
        );
        const ultimoFat = planFatsSorted[planFatsSorted.length - 1];
        const dataRenovacao = ultimoFat?.Faturamento_Fim
          ? formatarDataBR(proximaRenovacaoISO(ultimoFat.Faturamento_Fim))
          : null;

        // Cabeçalho do plano
        if (y + 30 > 280) {
          doc.addPage();
          doc.setFillColor(...bgDark);
          doc.rect(0, 0, 210, 297, "F");
          y = 10;
        }

        doc.setFillColor(...bgCard);
        doc.roundedRect(marginLeft, y, pageWidth, 28, 3, 3, "F");
        doc.setDrawColor(...borderGray);
        doc.roundedRect(marginLeft, y, pageWidth, 28, 3, 3, "S");

        doc.setFontSize(12);
        doc.setTextColor(...textWhite);
        doc.text(
          `Plano: ${plano.Plano_Codigo} - ${plano.Plano_Nome}`,
          marginLeft + 5,
          y + 9,
        );

        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.text(
          `${plano.Plano_Pagamento} | ${plano.Plano_Quantidade_Semana}x/semana | Total: R$ ${totalPlano.toFixed(2)}`,
          marginLeft + 5,
          y + 17,
        );

        if (dataRenovacao) {
          doc.setTextColor(...textYellow);
          doc.text(`Renovação: ${dataRenovacao}`, marginLeft + 5, y + 24);
        }

        y += 32;

        // Sub-seções por contratação
        for (const fat of planFatsSorted) {
          const fatId = fat.id || fat.Faturamento_ID;
          const isPago = !!fat.Faturamento_Data_Pagamento;
          const mesesFat = gerarMesesFaturamento([fat], plano.Plano_Pagamento);
          const mesesKeys = Object.keys(mesesFat).sort();
          const fatTotal = Object.values(mesesFat).reduce(
            (acc, m) => acc + (m.valor - m.desconto),
            0,
          );

          const subHeight = 11 + mesesKeys.length * 8 + 6;

          if (y + subHeight > 280) {
            doc.addPage();
            doc.setFillColor(...bgDark);
            doc.rect(0, 0, 210, 297, "F");
            y = 10;
          }

          // Sub-header da contratação
          doc.setFillColor(...borderGray);
          doc.roundedRect(marginLeft + 2, y, pageWidth - 4, 9, 1, 1, "F");
          doc.setFontSize(8);
          doc.setTextColor(...textGray);
          const periodo = `#${fatId} | ${
            fat.Faturamento_Inicio
              ? formatarDataBR(fat.Faturamento_Inicio)
              : "—"
          } → ${fat.Faturamento_Fim ? formatarDataBR(fat.Faturamento_Fim) : "—"}`;
          doc.text(periodo, marginLeft + 6, y + 6);
          doc.setTextColor(...(isPago ? textGreen : textYellow));
          doc.text(
            `${isPago ? "Pago" : "Pendente"} | R$ ${fatTotal.toFixed(2)}`,
            marginLeft + pageWidth - 6,
            y + 6,
            { align: "right" },
          );

          y += 12;

          // Linhas de meses
          for (let i = 0; i < mesesKeys.length; i++) {
            const mesAno = mesesKeys[i];
            const mesData = mesesFat[mesAno];
            const valorMes = mesData.valor - mesData.desconto;
            const parcela = `${mesData.parcela}/${mesData.totalParcelas}`;

            doc.setFontSize(9);
            doc.setTextColor(192, 132, 252);
            doc.text(parcela, marginLeft + 8, y);
            doc.setTextColor(...textWhite);
            doc.text(nomeMes(mesAno), marginLeft + 22, y);
            doc.setTextColor(...textGreen);
            doc.text(`R$ ${valorMes.toFixed(2)}`, marginLeft + 50, y);

            if (mesData.pago && mesData.dataPagamento) {
              doc.setFontSize(8);
              doc.setTextColor(...textGray);
              doc.text(
                `Pago em: ${formatarDataBR(mesData.dataPagamento)}`,
                marginLeft + 90,
                y,
              );
            }

            if (mesData.desconto > 0) {
              doc.setFontSize(8);
              doc.setTextColor(...textYellow);
              doc.text(
                `(desc: R$ ${mesData.desconto.toFixed(2)})`,
                marginLeft + 145,
                y,
              );
            }

            y += 8;
          }

          y += 4;
        }

        y += 5;
      }

      // Rodapé
      if (y > 280) {
        doc.addPage();
        doc.setFillColor(...bgDark);
        doc.rect(0, 0, 210, 297, "F");
        y = 10;
      }
      doc.setFontSize(8);
      doc.setTextColor(...textGray);
      const agora = new Date();
      const dataGeracao = agora.toLocaleDateString("pt-BR");
      const horaGeracao = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      doc.text(`Gerado em: ${dataGeracao} às ${horaGeracao}`, 105, 290, {
        align: "center",
      });

      doc.save(filename);
      showToast({ type: "success", text: "PDF gerado com sucesso!" });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast({ type: "error", text: "Erro ao gerar PDF." });
    } finally {
      setLoadingPdf(false);
    }
  };

  // Determina quantos meses o plano cobre baseado no tipo de pagamento
  const getMesesPorTipoPlano = (tipoPagamento) => {
    const tipo = String(tipoPagamento || "").toLowerCase();
    if (tipo.includes("anual")) return 12;
    if (tipo.includes("semestral")) return 6;
    if (tipo.includes("trimestral")) return 3;
    // Unitário, Mensal ou qualquer outro = 1 mês
    return 1;
  };

  // Gera os meses baseado no tipo de plano e mês de início
  // Cada lançamento aparece como linha separada (não agrupa por mês)
  const gerarMesesFaturamento = (faturamentos, tipoPagamento) => {
    const lancamentos = {};
    const qtdMesesPlano = getMesesPorTipoPlano(tipoPagamento);

    for (const fat of faturamentos) {
      if (!fat.Faturamento_Inicio) continue;

      // Parse da data de forma segura para evitar problemas de timezone
      // Formato esperado: "YYYY-MM-DD"
      const partes = String(fat.Faturamento_Inicio).split("-");
      const anoInicio = parseInt(partes[0], 10);
      const mesInicio = parseInt(partes[1], 10) - 1; // Mês é 0-indexed em JS
      const diaInicio = parseInt(partes[2], 10);
      const inicio = new Date(anoInicio, mesInicio, diaInicio);

      const valorTotal = parseFloat(fat.Faturamento_Valor_Total) || 0;
      const desconto = parseFloat(fat.Faturamento_Desconto) || 0;
      const pago = fat.Faturamento_Data_Pagamento ? true : false;

      const mesesDoPlano = [];
      for (let i = 0; i < qtdMesesPlano; i++) {
        const mesData = new Date(
          inicio.getFullYear(),
          inicio.getMonth() + i,
          1,
        );
        mesesDoPlano.push({
          ano: mesData.getFullYear(),
          mes: mesData.getMonth() + 1,
          parcela: i + 1,
          totalParcelas: qtdMesesPlano,
        });
      }

      const valorPorMes = valorTotal / qtdMesesPlano;
      const descontoPorMes = desconto / qtdMesesPlano;

      for (const m of mesesDoPlano) {
        const mesAno = `${m.ano}-${String(m.mes).padStart(2, "0")}`;
        const chaveUnica = `${mesAno}-${fat.id || fat.Faturamento_ID || Math.random()}`;

        lancamentos[chaveUnica] = {
          valor: valorPorMes,
          desconto: descontoPorMes,
          pago: !!fat.Faturamento_Data_Pagamento,
          dataPagamento: fat.Faturamento_Data_Pagamento,
          motivo: fat.Faturamento_Motivo || null,
          comprovante: fat.Faturamento_Comprovante || null,
          faturamentoId: fat.id || fat.Faturamento_ID || null,
          faturamentos: [fat],
          parcela: m.parcela,
          totalParcelas: m.totalParcelas,
          mesAno: mesAno,
        };
      }
    }

    return lancamentos;
  };

  // Nomes dos meses
  const nomeMes = (mesAno) => {
    const [anoNum, mesNum] = mesAno.split("-");
    const nomes = [
      "Janeiro",
      "Fevereiro",
      "Março",
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
    return `${nomes[parseInt(mesNum, 10) - 1]}/${anoNum}`;
  };

  const computeStats = () => {
    if (!extrato) return null;
    let totalPago = 0;
    let totalPendente = 0;
    let totalDescontos = 0;
    for (const plano of extrato.planos || []) {
      for (const fat of plano.faturamentos || []) {
        const valor = parseFloat(fat.Faturamento_Valor_Total) || 0;
        const desc = parseFloat(fat.Faturamento_Desconto) || 0;
        totalDescontos += desc;
        if (fat.Faturamento_Data_Pagamento) {
          totalPago += valor - desc;
        } else {
          totalPendente += valor - desc;
        }
      }
    }
    return { totalPago, totalPendente, totalDescontos };
  };

  const stats = extrato ? computeStats() : null;

  return (
    <div className="w-full h-auto">
      <MessageToast messageToast={messageToast} />

      <div className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-6 w-full shadow-lg border-2 border-gray-700">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-gray-700 pb-4">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shrink-0">
            💳
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-none">
              Extrato do Aluno
            </h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Histórico de faturamentos e pagamentos
            </p>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex flex-row gap-2 items-end">
          <div className="flex-1 flex flex-col gap-1 min-w-0">
            <label className="text-gray-300 text-sm font-medium">
              Aluno <span className="text-red-400">*</span>
            </label>
            <CustomSelect
              name="codigoAluno"
              value={codigoAluno}
              onChange={(e) => setCodigoAluno(e.target.value)}
              placeholder="Selecione o aluno"
              options={alunos.map((a) => ({
                value: a.Alunos_Codigo,
                label: `${a.Alunos_Codigo} — ${a.Alunos_Nome}`,
              }))}
            />
          </div>
          <div className="shrink-0">
            <Buttons.BotaoExtrato onClick={handleExtrato} loading={loading} />
          </div>
        </div>

        {/* ── Results ── */}
        {extrato && (
          <div className="space-y-5">
            {/* Student Profile Card */}
            <div className="relative bg-linear-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl p-5 border border-gray-700 overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <div className="relative flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl shrink-0 select-none">
                  {extrato.aluno?.Alunos_Nome?.charAt(0).toUpperCase() || "?"}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-white font-bold text-xl leading-none">
                      {extrato.aluno?.Alunos_Nome}
                    </h3>
                    <span className="text-gray-500 text-sm font-mono">
                      #{extrato.aluno?.Alunos_Codigo}
                    </span>
                    <StatusBadge status={extrato.aluno?.Alunos_Situacao} />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
                    <InfoField
                      icon="🆔"
                      label="CPF"
                      value={extrato.aluno?.Alunos_CPF}
                    />
                    <InfoField
                      icon="📧"
                      label="E-mail"
                      value={extrato.aluno?.Alunos_Email}
                    />
                    <InfoField
                      icon="📱"
                      label="Telefone"
                      value={extrato.aluno?.Alunos_Telefone}
                    />
                    <InfoField
                      icon="📅"
                      label="Matrícula"
                      value={
                        extrato.aluno?.Alunos_Data_Matricula
                          ? formatarDataBR(extrato.aluno.Alunos_Data_Matricula)
                          : undefined
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            {stats && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <StatCard
                  icon="✅"
                  label="Total Pago"
                  value={`R$ ${stats.totalPago.toFixed(2)}`}
                  colorClass="bg-emerald-900/20 border-emerald-800/60"
                />
                <StatCard
                  icon="⏳"
                  label="Pendente"
                  value={`R$ ${stats.totalPendente.toFixed(2)}`}
                  colorClass="bg-amber-900/20 border-amber-800/60"
                />
                <StatCard
                  icon="🏷️"
                  label="Descontos"
                  value={`R$ ${stats.totalDescontos.toFixed(2)}`}
                  colorClass="bg-blue-900/20 border-blue-800/60"
                />
              </div>
            )}

            {/* Contratações — um card por faturamento */}
            {extrato.planos && extrato.planos.length > 0 ? (
              (() => {
                // Expande todos os faturamentos de todos os planos numa lista plana
                const contratacoes = [];
                for (const plano of extrato.planos) {
                  for (const fat of plano.faturamentos || []) {
                    contratacoes.push({ plano, fat });
                  }
                }
                // Ordena por data de início
                contratacoes.sort(
                  (a, b) =>
                    new Date(a.fat.Faturamento_Inicio || 0) -
                    new Date(b.fat.Faturamento_Inicio || 0),
                );

                if (contratacoes.length === 0) {
                  return (
                    <div className="bg-gray-900 rounded-2xl border border-gray-700 p-10 text-center">
                      <p className="text-gray-400 text-lg">
                        Nenhum faturamento encontrado para este aluno.
                      </p>
                    </div>
                  );
                }

                return contratacoes.map(({ plano, fat }, cardIdx) => {
                  const fatId = fat.id || fat.Faturamento_ID;
                  const isPago = !!fat.Faturamento_Data_Pagamento;
                  const fatMeses = gerarMesesFaturamento(
                    [fat],
                    plano.Plano_Pagamento,
                  );
                  const fatMesesSorted = Object.entries(fatMeses).sort(
                    ([a], [b]) => a.localeCompare(b),
                  );
                  const valorBruto =
                    parseFloat(fat.Faturamento_Valor_Total) || 0;
                  const desconto = parseFloat(fat.Faturamento_Desconto) || 0;
                  const valorLiquido = valorBruto - desconto;

                  return (
                    <div
                      key={fatId || cardIdx}
                      className="bg-gray-900 rounded-2xl border border-gray-700 overflow-hidden shadow-lg"
                    >
                      {/* Card header */}
                      <div className="bg-linear-to-r from-purple-900/60 via-indigo-900/40 to-blue-900/20 border-b border-gray-700 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          {/* Left: plan info */}
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="w-9 h-9 rounded-lg bg-purple-700/50 border border-purple-600/40 flex items-center justify-center shrink-0">
                              <span className="text-purple-200 text-xs font-bold leading-none text-center px-0.5">
                                {plano.Plano_Codigo}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-white font-bold text-base leading-none">
                                {plano.Plano_Nome}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="text-gray-500 font-mono text-xs">
                                  #{fatId}
                                </span>
                                <span className="bg-gray-700/80 rounded-md px-2 py-0.5 text-gray-300 text-xs">
                                  {plano.Plano_Pagamento}
                                </span>
                                <span className="bg-gray-700/80 rounded-md px-2 py-0.5 text-gray-300 text-xs">
                                  {plano.Plano_Quantidade_Semana}x/semana
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {fat.Faturamento_Inicio
                                    ? formatarDataBR(fat.Faturamento_Inicio)
                                    : "—"}
                                  <span className="text-gray-600 mx-1">→</span>
                                  {fat.Faturamento_Fim
                                    ? formatarDataBR(fat.Faturamento_Fim)
                                    : "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: totals + status */}
                          <div className="flex flex-wrap gap-3 items-center justify-end">
                            {isPago ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 rounded-full px-3 py-1 text-sm font-semibold">
                                ✓ Pago
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-900/50 text-amber-300 border border-amber-700/50 rounded-full px-3 py-1 text-sm font-semibold">
                                ⏳ Pendente
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-gray-500 text-xs">
                                Bruto / Desc / Líquido
                              </p>
                              <p className="text-sm leading-tight font-mono">
                                <span className="text-gray-300">
                                  R$ {valorBruto.toFixed(2)}
                                </span>
                                {desconto > 0 && (
                                  <>
                                    <span className="text-gray-600 mx-1">
                                      /
                                    </span>
                                    <span className="text-amber-400">
                                      −R$ {desconto.toFixed(2)}
                                    </span>
                                  </>
                                )}
                                <span className="text-gray-600 mx-1">/</span>
                                <span className="text-emerald-400 font-bold">
                                  R$ {valorLiquido.toFixed(2)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Parcelas table */}
                      {fatMesesSorted.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm min-w-[580px]">
                            <thead>
                              <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wide">
                                <th className="px-3 py-2 text-left font-semibold">
                                  Parcela
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">
                                  Mês
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Valor
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Desconto
                                </th>
                                <th className="px-3 py-2 text-right font-semibold">
                                  Líquido
                                </th>
                                <th className="px-3 py-2 text-center font-semibold">
                                  Status
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">
                                  Pago em
                                </th>
                                <th className="px-3 py-2 text-left font-semibold">
                                  Motivo
                                </th>
                                <th className="px-3 py-2 text-center font-semibold">
                                  Comprov.
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {fatMesesSorted.map(([key, m], rowIdx) => (
                                <tr
                                  key={key}
                                  className={`border-b border-gray-800 transition-colors duration-100 ${
                                    rowIdx % 2 === 0
                                      ? "bg-gray-900"
                                      : "bg-gray-900/60"
                                  } ${
                                    m.pago
                                      ? "hover:bg-emerald-900/15"
                                      : "hover:bg-amber-900/15"
                                  }`}
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <span className="text-purple-400 font-semibold">
                                      {m.parcela}/{m.totalParcelas}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-white font-medium whitespace-nowrap">
                                    {nomeMes(m.mesAno)}
                                  </td>
                                  <td className="px-3 py-2 text-gray-300 text-right font-mono whitespace-nowrap">
                                    R$ {m.valor.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    {m.desconto > 0 ? (
                                      <span className="text-amber-400 font-mono text-xs">
                                        −R$ {m.desconto.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">
                                    <span className="text-emerald-400 font-mono font-semibold">
                                      R$ {(m.valor - m.desconto).toFixed(2)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    {m.pago ? (
                                      <span className="inline-flex items-center gap-1 bg-emerald-900/50 text-emerald-300 border border-emerald-700/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                        ✓ Pago
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 bg-amber-900/50 text-amber-300 border border-amber-700/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                        ⏳ Pendente
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-sm whitespace-nowrap">
                                    {m.dataPagamento ? (
                                      <span className="text-gray-300">
                                        {formatarDataBR(m.dataPagamento)}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-gray-400 text-xs max-w-[140px]">
                                    {m.motivo ? (
                                      <span
                                        className="line-clamp-2"
                                        title={m.motivo}
                                      >
                                        {m.motivo}
                                      </span>
                                    ) : (
                                      <span className="text-gray-600">—</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    {m.comprovante ? (
                                      <Buttons.BotaoComprovante
                                        onClick={() =>
                                          setComprovanteModal(m.comprovante)
                                        }
                                      />
                                    ) : (
                                      <span className="text-gray-600 text-xs">
                                        —
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : null}

                      {/* Card footer */}
                      <div className="bg-gray-800/50 border-t border-gray-700 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-4 text-sm flex-wrap">
                          {isPago && fat.Faturamento_Data_Pagamento ? (
                            <span className="text-gray-400">
                              Pago em:{" "}
                              <span className="text-gray-200 font-medium">
                                {formatarDataBR(fat.Faturamento_Data_Pagamento)}
                              </span>
                            </span>
                          ) : (
                            <span className="text-amber-400/70 text-xs">
                              Aguardando pagamento
                            </span>
                          )}
                          {fat.Faturamento_Fim && (
                            <span className="flex items-center gap-1.5">
                              <span className="text-yellow-400">🔄</span>
                              <span className="text-gray-400">
                                Próxima renovação:
                              </span>
                              <span className="text-yellow-300 font-semibold">
                                {formatarDataBR(
                                  proximaRenovacaoISO(fat.Faturamento_Fim),
                                )}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">
                            Total da contratação:
                          </span>
                          <span
                            className={`font-bold text-lg ${isPago ? "text-emerald-400" : "text-amber-400"}`}
                          >
                            R$ {valorLiquido.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <div className="bg-gray-900 rounded-2xl border border-gray-700 p-10 text-center">
                <p className="text-gray-400 text-lg">
                  Nenhum plano encontrado para este aluno.
                </p>
              </div>
            )}

            {/* Global pending section */}
            {extrato.planosPendentes && extrato.planosPendentes.length > 0 && (
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-amber-800/40 flex items-center gap-2">
                  <span className="text-amber-400 text-lg">⚠️</span>
                  <h3 className="text-amber-300 font-bold text-base">
                    Pendências — Faturamentos em Aberto (todos os anos)
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {extrato.planosPendentes.map((pp, pidx) => (
                    <div
                      key={pidx}
                      className="bg-gray-900/60 rounded-xl border border-gray-700 overflow-hidden"
                    >
                      <div className="px-3 py-2 bg-gray-800/50 border-b border-gray-700 flex items-center justify-between">
                        <span className="text-white font-semibold text-sm">
                          {pp.Plano_Codigo} — {pp.Plano_Nome}
                        </span>
                        {pp.Plano_Valor !== null && (
                          <span className="text-amber-300 text-sm font-medium">
                            Valor do Plano: R$ {pp.Plano_Valor}
                          </span>
                        )}
                      </div>
                      <div className="divide-y divide-gray-800">
                        {pp.faturamentos && pp.faturamentos.length > 0 ? (
                          pp.faturamentos.map((f) => (
                            <div
                              key={f.id || f.Faturamento_ID}
                              className="px-3 py-2.5 flex items-center justify-between text-sm"
                            >
                              <div className="text-gray-300 flex items-center gap-2">
                                <span className="text-gray-500 font-mono text-xs">
                                  #{f.id || f.Faturamento_ID}
                                </span>
                                <span>
                                  {f.Faturamento_Inicio
                                    ? formatarDataBR(f.Faturamento_Inicio)
                                    : "—"}
                                  {" → "}
                                  {f.Faturamento_Fim
                                    ? formatarDataBR(f.Faturamento_Fim)
                                    : "—"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-amber-300 font-semibold font-mono">
                                  R${" "}
                                  {(
                                    parseFloat(f.Faturamento_Valor_Total) || 0
                                  ).toFixed(2)}
                                </span>
                                <span className="bg-amber-900/50 text-amber-300 border border-amber-700/50 rounded-full px-2 py-0.5 text-xs font-semibold">
                                  Pendente
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="px-3 py-2.5 text-gray-500 text-sm">
                            Nenhum faturamento listado.
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Download PDF */}
            <div className="flex justify-center pt-2 pb-1">
              <Buttons.BotaoPDF onClick={handleGerarPDF} loading={loadingPdf} />
            </div>
          </div>
        )}
      </div>

      {/* ── Comprovante Modal ── */}
      {comprovanteModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setComprovanteModal(null)}
        >
          <div
            className="bg-gray-800 rounded-2xl p-5 max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-600 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🧾</span> Comprovante de Pagamento
              </h3>
              <button
                type="button"
                onClick={() => setComprovanteModal(null)}
                className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white flex items-center justify-center text-xl font-bold transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex justify-center">
              {String(comprovanteModal).toLowerCase().endsWith(".pdf") ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-400 text-sm">
                    Comprovante em formato PDF
                  </p>
                  <a
                    href={`${import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br"}/uploads/comprovantes/${comprovanteModal}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    📄 Abrir PDF
                  </a>
                </div>
              ) : (
                <img
                  src={`${import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br"}/uploads/comprovantes/${comprovanteModal}`}
                  alt="Comprovante de pagamento"
                  className="max-w-full max-h-[70vh] rounded-xl shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExtratoAluno;
