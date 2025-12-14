import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatarDataBR } from "../../utils/Utils";
import MessageToast from "../miscellaneous/MessageToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";
import useToast from "../../hooks/useToast";

function Relatorio() {
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [percentualDesconto, setPercentualDesconto] = useState(15);
  const [meses, setMeses] = useState([]);
  const [anos, setAnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [messageToast, showToast] = useToast();

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

  // Calcular qual é a parcela do mês selecionado
  const calcularParcela = (
    faturamentoInicio,
    tipoPagamento,
    mesSelecionado,
    anoSelecionado
  ) => {
    const inicio = new Date(faturamentoInicio);
    const mesInicio = inicio.getMonth() + 1; // 1-12
    const anoInicio = inicio.getFullYear();
    const totalParcelas = getMesesPorTipoPlano(tipoPagamento);

    // Calcula quantos meses se passaram desde o início
    const mesesPassados =
      (anoSelecionado - anoInicio) * 12 + (mesSelecionado - mesInicio);
    const parcela = mesesPassados + 1;

    return { parcela, totalParcelas };
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

    return pagamentos.map((pag) => {
      const aluno =
        alunos.find((a) => a.Alunos_Codigo === pag.Aluno_Codigo) || {};
      const plano =
        planos.find((p) => p.Plano_Codigo === pag.Plano_Codigo) || {};

      // Valor total do faturamento
      const valorTotalFaturamento =
        parseFloat(pag.Faturamento_Valor_Total) || 0;

      // Calcula valor mensal baseado no tipo de plano
      const mesesPlano = getMesesPorTipoPlano(plano.Plano_Pagamento);
      const valorMensal = valorTotalFaturamento / mesesPlano;

      // Aplica percentual de desconto
      const valorComDesconto = valorMensal * (1 - desconto / 100);
      const valorWET = valorComDesconto / 2;
      const valorPA = valorComDesconto / 2;

      // Calcula a parcela
      const { parcela, totalParcelas } = calcularParcela(
        pag.Faturamento_Inicio,
        plano.Plano_Pagamento,
        mesSelecionado || parseInt(mes, 10),
        anoSelecionado || parseInt(ano, 10)
      );

      return {
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
      };
    });
  };

  // Calcular totais
  const calcularTotais = (dados) => {
    return dados.reduce(
      (acc, item) => ({
        valorMensal: acc.valorMensal + item.valorMensal,
        valorComDesconto: acc.valorComDesconto + item.valorComDesconto,
        valorWET: acc.valorWET + item.valorWET,
        valorPA: acc.valorPA + item.valorPA,
      }),
      { valorMensal: 0, valorComDesconto: 0, valorWET: 0, valorPA: 0 }
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
      const filename = `Relatorio_${nomeMesLabel}_${ano}.pdf`;

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
      doc.text(`Relatório Mensal - ${nomeMesLabel}/${ano}`, 148.5, y + 8, {
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
        parcela: marginLeft + 100,
        dataPag: marginLeft + 125,
        valorMensal: marginLeft + 155,
        valorDesc: marginLeft + 190,
        valorWET: marginLeft + 225,
        valorPA: marginLeft + 255,
      };

      doc.text("Cód", colX.codigo, y + 5.5);
      doc.text("Aluno", colX.aluno, y + 5.5);
      doc.text("Plano", colX.plano, y + 5.5);
      doc.text("Parcela", colX.parcela, y + 5.5);
      doc.text("Data Pgto", colX.dataPag, y + 5.5);
      doc.text("Valor Mensal", colX.valorMensal, y + 5.5);
      doc.text(`Valor c/ Desc`, colX.valorDesc, y + 5.5);
      doc.text("WET (50%)", colX.valorWET, y + 5.5);
      doc.text("PA (50%)", colX.valorPA, y + 5.5);

      y += 12;

      // Linhas de dados
      const textPurple = [192, 132, 252];
      for (const item of dados) {
        if (y > 185) {
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
          y
        );

        doc.setTextColor(...textGreen);
        doc.text(`R$ ${item.valorMensal.toFixed(2)}`, colX.valorMensal, y);
        doc.setTextColor(...textYellow);
        doc.text(`R$ ${item.valorComDesconto.toFixed(2)}`, colX.valorDesc, y);
        doc.setTextColor(...textWhite);
        doc.text(`R$ ${item.valorWET.toFixed(2)}`, colX.valorWET, y);
        doc.text(`R$ ${item.valorPA.toFixed(2)}`, colX.valorPA, y);

        y += 6;
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
        y + 4
      );
      doc.setTextColor(...textWhite);
      doc.text(`R$ ${totais.valorWET.toFixed(2)}`, colX.valorWET, y + 4);
      doc.text(`R$ ${totais.valorPA.toFixed(2)}`, colX.valorPA, y + 4);

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(...textGray);
      doc.text(
        `Gerado em: ${new Date().toLocaleDateString(
          "pt-BR"
        )} às ${new Date().toLocaleTimeString("pt-BR")}`,
        148.5,
        200,
        { align: "center" }
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

  return (
    <div className="w-full h-auto">
      <MessageToast messageToast={messageToast} />
      <div
        className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-4 w-full h-full min-h-[80vh] shadow-lg border-2 border-gray-700"
        style={{ minWidth: 0, maxWidth: "100vw" }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Relatório Mensal</h2>

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
                        <th className="px-3 py-3 rounded-tl-lg">Cód</th>
                        <th className="px-3 py-3">Aluno</th>
                        <th className="px-3 py-3">Plano</th>
                        <th className="px-3 py-3">Parcela</th>
                        <th className="px-3 py-3">Data Pgto</th>
                        <th className="px-3 py-3 text-right">Valor Mensal</th>
                        <th className="px-3 py-3 text-right">
                          Valor c/ Desc ({percentualDesconto}%)
                        </th>
                        <th className="px-3 py-3 text-right">WET (50%)</th>
                        <th className="px-3 py-3 text-right rounded-tr-lg">
                          PA (50%)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`border-b border-gray-700 ${
                            idx % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                          }`}
                        >
                          <td className="px-3 py-2 text-gray-400">
                            {item.alunoCodigo}
                          </td>
                          <td className="px-3 py-2 text-white font-medium">
                            {item.alunoNome}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {item.planoNome}
                          </td>
                          <td className="px-3 py-2 text-purple-400 font-semibold">
                            {item.parcela}
                          </td>
                          <td className="px-3 py-2 text-gray-300">
                            {item.dataPagamento
                              ? formatarDataBR(item.dataPagamento)
                              : "-"}
                          </td>
                          <td className="px-3 py-2 text-green-400 text-right font-semibold">
                            R$ {item.valorMensal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-yellow-400 text-right font-semibold">
                            R$ {item.valorComDesconto.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-blue-400 text-right font-semibold">
                            R$ {item.valorWET.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-purple-400 text-right font-semibold">
                            R$ {item.valorPA.toFixed(2)}
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
                          <td className="px-3 py-3 text-blue-400 text-right">
                            R$ {totais.valorWET.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-purple-400 text-right rounded-br-lg">
                            R$ {totais.valorPA.toFixed(2)}
                          </td>
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

export default Relatorio;
