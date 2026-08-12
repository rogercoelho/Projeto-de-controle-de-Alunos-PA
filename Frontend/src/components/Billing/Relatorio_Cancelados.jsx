import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import { formatarDataBR } from "../../utils/Utils";
import CustomSelect from "../miscellaneous/CustomSelect";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const getComprovanteUrl = (arquivo) =>
  `${import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br"}/uploads/comprovantes/${arquivo}`;

function Relatorio_Cancelados() {
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [messageToast, showToast] = useToast();
  const [motivoModal, setMotivoModal] = useState(null);
  const [comprovanteModal, setComprovanteModal] = useState(null);

  const meses = useMemo(
    () => [
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
    ],
    [],
  );

  const anos = useMemo(() => {
    const anoAtual = new Date().getFullYear();
    const lista = [];
    for (let a = anoAtual + 1; a >= 2020; a--) {
      lista.push({ value: String(a), label: String(a) });
    }
    return lista;
  }, []);

  useEffect(() => {
    const hoje = new Date();
    setMes(String(hoje.getMonth() + 1));
    setAno(String(hoje.getFullYear()));
  }, []);

  const dados = useMemo(() => {
    if (!relatorio?.cancelados?.length) return [];
    const alunos = relatorio.alunos || [];
    const planos = relatorio.planos || [];

    return relatorio.cancelados.map((fat) => {
      const aluno = alunos.find((a) => a.Alunos_Codigo === fat.Aluno_Codigo) || {};
      const plano = planos.find((p) => p.Plano_Codigo === fat.Plano_Codigo) || {};
      return {
        id: fat.id,
        faturamentoOriginalId: fat.Faturamento_Original_ID || fat.id,
        alunoCodigo: fat.Aluno_Codigo,
        alunoNome: aluno.Alunos_Nome || "-",
        alunoCpf: aluno.Alunos_CPF || "-",
        planoCodigo: fat.Plano_Codigo,
        planoNome: plano.Plano_Nome || fat.Plano_Codigo || "-",
        planoTipo: plano.Plano_Pagamento || "-",
        inicio: fat.Faturamento_Inicio,
        fim: fat.Faturamento_Fim,
        pagoEm: fat.Faturamento_Data_Pagamento,
        canceladoEm: fat.Faturamento_Cancelado_Em,
        valorTotal: Number(fat.Faturamento_Valor_Total) || 0,
        motivo: String(fat.Faturamento_Cancelado_Motivo || "").trim(),
        comprovante: fat.Faturamento_Cancelado_Comprovante || null,
      };
    });
  }, [relatorio]);

  const totalCancelado = dados.reduce((acc, item) => acc + item.valorTotal, 0);

  const handleGerarRelatorio = async () => {
    if (!mes || !ano) {
      showToast({ type: "error", text: "Selecione mês e ano." });
      return;
    }

    setLoading(true);
    setRelatorio(null);
    try {
      const res = await api.get(`/faturamento/relatorio-cancelados/${mes}/${ano}`);
      setRelatorio(res.data);
    } catch (error) {
      if (error?.response?.status !== 401) {
        showToast({ type: "error", text: "Erro ao buscar relatório." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGerarPDF = async () => {
    if (!dados.length) {
      showToast({ type: "error", text: "Gere um relatório primeiro." });
      return;
    }

    setLoadingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF("l", "mm", "a4");
      const nomeMes = meses.find((m) => m.value === mes)?.label || mes;
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let y = 14;

      const colX = {
        id: margin,
        aluno: margin + 18,
        plano: margin + 70,
        periodo: margin + 114,
        cancelado: margin + 152,
        valor: margin + 182,
        comprovante: margin + 210,
        motivo: margin + 238,
      };

      const desenharCabecalho = () => {
        doc.setFillColor(31, 41, 55);
        doc.rect(0, 0, pageWidth, pageHeight, "F");
        doc.setFontSize(15);
        doc.setTextColor(255, 255, 255);
        doc.text(`Relatório de Faturamentos Cancelados - ${nomeMes}/${ano}`, pageWidth / 2, y, { align: "center" });
        y += 10;
        doc.setFontSize(8);
        doc.setFillColor(17, 24, 39);
        doc.roundedRect(margin, y, pageWidth - margin * 2, 8, 2, 2, "F");
        doc.text("ID", colX.id, y + 5.5);
        doc.text("Aluno", colX.aluno, y + 5.5);
        doc.text("Plano", colX.plano, y + 5.5);
        doc.text("Período", colX.periodo, y + 5.5);
        doc.text("Cancelado", colX.cancelado, y + 5.5);
        doc.text("Valor", colX.valor, y + 5.5);
        doc.text("Documento", colX.comprovante, y + 5.5);
        doc.text("Motivo", colX.motivo, y + 5.5);
        y += 13;
      };

      desenharCabecalho();

      for (const item of dados) {
        const motivoLinhas = item.motivo
          ? doc.splitTextToSize(item.motivo, pageWidth - colX.motivo - margin)
          : ["-"];
        const rowHeight = Math.max(7, motivoLinhas.length * 4);

        if (y + rowHeight > pageHeight - 18) {
          doc.addPage();
          y = 14;
          desenharCabecalho();
        }

        doc.setFontSize(8);
        doc.setTextColor(209, 213, 219);
        doc.text(String(item.faturamentoOriginalId), colX.id, y);
        doc.text(`${item.alunoCodigo} - ${item.alunoNome}`.substring(0, 30), colX.aluno, y);
        doc.text(`${item.planoCodigo} - ${item.planoNome}`.substring(0, 24), colX.plano, y);
        doc.text(`${formatarDataBR(item.inicio)} a ${formatarDataBR(item.fim)}`, colX.periodo, y);
        doc.text(formatarDataBR(item.canceladoEm), colX.cancelado, y);
        doc.setTextColor(248, 113, 113);
        doc.text(moeda.format(item.valorTotal), colX.valor, y);
        doc.setTextColor(209, 213, 219);
        doc.text(item.comprovante ? "Anexado" : "-", colX.comprovante, y);
        doc.text(motivoLinhas, colX.motivo, y);
        y += rowHeight;
      }

      y += 4;
      doc.setFillColor(55, 65, 81);
      doc.roundedRect(margin, y - 3, pageWidth - margin * 2, 9, 2, 2, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text("TOTAL CANCELADO", colX.aluno, y + 2.5);
      doc.setTextColor(248, 113, 113);
      doc.text(moeda.format(totalCancelado), colX.valor, y + 2.5);

      doc.save(`Relatorio_Faturamentos_Cancelados_${nomeMes}_${ano}.pdf`);
      showToast({ type: "success", text: "PDF gerado com sucesso." });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast({ type: "error", text: "Erro ao gerar PDF." });
    } finally {
      setLoadingPdf(false);
    }
  };

  const renderComprovante = (arquivo) => {
    if (!arquivo) return <span className="text-gray-500">-</span>;
    const url = getComprovanteUrl(arquivo);
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => setComprovanteModal(arquivo)}
          className="rounded-lg border border-indigo-400/70 bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-600"
        >
          Visualizar
        </button>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-gray-500 bg-gray-700 px-3 py-1.5 text-center text-xs font-semibold text-white transition-colors hover:bg-gray-600"
        >
          Download
        </a>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      <MessageToast messageToast={messageToast} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Faturamentos Cancelados</h2>
          <p className="text-sm text-gray-400">Histórico dos planos cancelados e seus motivos.</p>
        </div>
        {dados.length > 0 && (
          <div className="text-sm text-gray-300">
            Total: <span className="font-bold text-red-300">{moeda.format(totalCancelado)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Mês</label>
          <CustomSelect name="mes" value={mes} onChange={(e) => setMes(e.target.value)} options={meses} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Ano</label>
          <CustomSelect name="ano" value={ano} onChange={(e) => setAno(e.target.value)} options={anos} />
        </div>
        <button type="button" onClick={handleGerarRelatorio} disabled={loading} className="rounded-lg border border-blue-400 bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Gerando..." : "Gerar"}
        </button>
        <button type="button" onClick={handleGerarPDF} disabled={loadingPdf || !dados.length} className="rounded-lg border border-red-300 bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60">
          {loadingPdf ? "Salvando..." : "Salvar PDF"}
        </button>
      </div>

      {relatorio && dados.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-6 text-center text-sm text-gray-400">
          Nenhum faturamento cancelado encontrado para o período selecionado.
        </div>
      )}

      {dados.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-900">
          <table className="min-w-full table-auto text-left text-sm">
            <thead className="bg-gray-800 text-xs uppercase text-gray-300">
              <tr>
                <th className="px-3 py-3">ID Fat.</th>
                <th className="px-3 py-3">Aluno</th>
                <th className="px-3 py-3">Plano</th>
                <th className="px-3 py-3">Período</th>
                <th className="px-3 py-3">Pago em</th>
                <th className="px-3 py-3">Cancelado em</th>
                <th className="px-3 py-3 text-right">Valor</th>
                <th className="px-3 py-3">Comprovante</th>
                <th className="px-3 py-3">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {dados.map((item) => (
                <tr key={item.id} className="text-gray-200 hover:bg-gray-800/70">
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-red-300">#{item.faturamentoOriginalId}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-white">{item.alunoCodigo} - {item.alunoNome}</div>
                    <div className="text-xs text-gray-400">CPF: {item.alunoCpf}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div>{item.planoCodigo} - {item.planoNome}</div>
                    <div className="text-xs text-gray-400">{item.planoTipo}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">{formatarDataBR(item.inicio)} a {formatarDataBR(item.fim)}</td>
                  <td className="whitespace-nowrap px-3 py-3">{item.pagoEm ? formatarDataBR(item.pagoEm) : "-"}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-red-300">{formatarDataBR(item.canceladoEm)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-red-300">{moeda.format(item.valorTotal)}</td>
                  <td className="px-3 py-3">{renderComprovante(item.comprovante)}</td>
                  <td className="px-3 py-3">
                    {item.motivo ? (
                      <button type="button" onClick={() => setMotivoModal(item.motivo)} className="inline-flex rounded-full border border-red-700/60 bg-red-900/50 px-2 py-0.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-900/70 focus:outline-none focus:ring-2 focus:ring-red-500">
                        Motivo Adicionado
                      </button>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {motivoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-xl">
            <h3 className="mb-3 text-lg font-bold text-white">Motivo do cancelamento</h3>
            <p className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-200">{motivoModal}</p>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setMotivoModal(null)} className="rounded-lg border border-gray-500 bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600">
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {comprovanteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setComprovanteModal(null)}>
          <div className="w-full max-w-2xl rounded-2xl border border-gray-600 bg-gray-800 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-white">Comprovante de estorno</h3>
              <button type="button" onClick={() => setComprovanteModal(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-xl font-bold text-gray-300 transition-colors hover:bg-gray-600 hover:text-white">
                ×
              </button>
            </div>
            {String(comprovanteModal).toLowerCase().endsWith(".pdf") ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-gray-400">Documento em formato PDF</p>
                <a href={getComprovanteUrl(comprovanteModal)} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700">
                  Abrir PDF
                </a>
              </div>
            ) : (
              <img src={getComprovanteUrl(comprovanteModal)} alt="Comprovante de estorno" className="mx-auto max-h-[70vh] max-w-full rounded-xl shadow-lg" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorio_Cancelados;
