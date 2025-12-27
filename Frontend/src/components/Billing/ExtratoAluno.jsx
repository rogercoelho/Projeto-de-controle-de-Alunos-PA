import { useState, useEffect } from "react";
import api from "../../services/api";
import { formatarDataBR, formatarData, formatarHora } from "../../utils/Utils";
import MessageToast from "../miscellaneous/MessageToast";
import CustomSelect from "../miscellaneous/CustomSelect";
import Buttons from "../miscellaneous/Buttons";
import useToast from "../../hooks/useToast";

function ExtratoAluno() {
  const [codigoAluno, setCodigoAluno] = useState("");
  const [ano, setAno] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [extrato, setExtrato] = useState(null);
  const [messageToast, showToast] = useToast();

  // Gera lista de anos (de 2020 até o próximo ano)
  useEffect(() => {
    const anoAtual = new Date().getFullYear();
    const listaAnos = [];
    for (let a = anoAtual + 1; a >= 2020; a--) {
      listaAnos.push({ value: String(a), label: String(a) });
    }
    setAnos(listaAnos);
    setAno(String(anoAtual));
  }, []);

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

  const handleExtrato = async () => {
    if (!codigoAluno) {
      showToast({ type: "error", text: "Selecione um aluno." });
      return;
    }
    if (!ano) {
      showToast({ type: "error", text: "Selecione um ano." });
      return;
    }
    setLoading(true);
    setExtrato(null);
    try {
      const res = await api.get(`/faturamento/extrato/${codigoAluno}/${ano}`);
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
      const filename = `Extrato_${nomeAluno.replace(/\s+/g, "_")}_${ano}.pdf`;

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
      doc.text(`Extrato do Aluno - ${ano}`, 105, y + 10, { align: "center" });
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
        infoY
      );
      infoY += 6;
      doc.text(
        `Nome: ${extrato.aluno?.Alunos_Nome || "-"}`,
        marginLeft + 5,
        infoY
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
        infoY
      );
      infoY += 6;
      doc.text(
        `Email: ${extrato.aluno?.Alunos_Email || "-"}`,
        marginLeft + 5,
        infoY
      );
      infoY += 6;
      doc.text(
        `Telefone: ${extrato.aluno?.Alunos_Telefone || "-"}`,
        marginLeft + 5,
        infoY
      );
      infoY += 6;
      doc.text(
        `Data Matrícula: ${
          extrato.aluno?.Alunos_Data_Matricula
            ? formatarDataBR(extrato.aluno.Alunos_Data_Matricula)
            : "-"
        }`,
        marginLeft + 5,
        infoY
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
        const mesesFaturamento = gerarMesesFaturamento(
          plano.faturamentos || [],
          ano,
          plano.Plano_Pagamento
        );
        const mesesKeys = Object.keys(mesesFaturamento).sort();
        const totalPlano = Object.values(mesesFaturamento).reduce(
          (acc, m) => acc + (m.valor - m.desconto),
          0
        );
        const ultimoFat = plano.faturamentos?.[plano.faturamentos.length - 1];
        const dataRenovacao = ultimoFat?.Faturamento_Fim
          ? formatarDataBR(ultimoFat.Faturamento_Fim)
          : null;

        // Calcular altura do card
        const cardHeight = 35 + mesesKeys.length * 8 + 15;

        // Verificar se precisa nova página
        if (y + cardHeight > 280) {
          doc.addPage();
          doc.setFillColor(...bgDark);
          doc.rect(0, 0, 210, 297, "F");
          y = 10;
        }

        // Card do Plano
        doc.setFillColor(...bgCard);
        doc.roundedRect(marginLeft, y, pageWidth, cardHeight, 3, 3, "F");
        doc.setDrawColor(...borderGray);
        doc.roundedRect(marginLeft, y, pageWidth, cardHeight, 3, 3, "S");

        doc.setFontSize(12);
        doc.setTextColor(...textWhite);
        doc.text(
          `Plano: ${plano.Plano_Codigo} - ${plano.Plano_Nome}`,
          marginLeft + 5,
          y + 8
        );

        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.text(
          `Tipo de Pagamento: ${plano.Plano_Pagamento}`,
          marginLeft + 5,
          y + 15
        );
        doc.text(
          `Quantidade por Semana: ${plano.Plano_Quantidade_Semana}x`,
          marginLeft + 5,
          y + 21
        );

        let mesY = y + 30;
        for (let i = 0; i < mesesKeys.length; i++) {
          const mesAno = mesesKeys[i];
          const mesData = mesesFaturamento[mesAno];
          const valorMes = mesData.valor - mesData.desconto;
          const parcela = `${mesData.parcela}/${mesData.totalParcelas}`;

          doc.setFontSize(9);
          // Número da parcela
          doc.setTextColor(192, 132, 252); // purple-400
          doc.text(parcela, marginLeft + 8, mesY);
          // Mês/Ano
          doc.setTextColor(...textWhite);
          doc.text(nomeMes(mesAno), marginLeft + 22, mesY);

          doc.setTextColor(...textGreen);
          doc.text(`R$ ${valorMes.toFixed(2)}`, marginLeft + 45, mesY);

          // Badge pago/pendente
          const badgeX = marginLeft + 75;
          doc.setFillColor(...(mesData.pago ? bgGreen : bgYellow));
          doc.roundedRect(badgeX, mesY - 3, 18, 5, 1, 1, "F");
          doc.setFontSize(7);
          doc.setTextColor(...textWhite);
          doc.text(mesData.pago ? "Pago" : "Pendente", badgeX + 9, mesY, {
            align: "center",
          });

          // Data pagamento
          if (mesData.pago && mesData.dataPagamento) {
            doc.setFontSize(8);
            doc.setTextColor(...textGray);
            doc.text(
              `Pago em: ${formatarDataBR(mesData.dataPagamento)}`,
              marginLeft + 98,
              mesY
            );
          }

          // Desconto
          if (mesData.desconto > 0) {
            doc.setTextColor(...textYellow);
            doc.text(
              `(desc: R$ ${mesData.desconto.toFixed(2)})`,
              marginLeft + 145,
              mesY
            );
          }

          mesY += 8;
        }

        // Total do plano
        const totalY = y + cardHeight - 8;
        doc.setFillColor(...borderGray);
        doc.roundedRect(
          marginLeft + 3,
          totalY - 5,
          pageWidth - 6,
          10,
          2,
          2,
          "F"
        );

        doc.setFontSize(10);
        doc.setTextColor(...textWhite);
        doc.text("Total do Plano:", marginLeft + 8, totalY);
        doc.setTextColor(...textGreen);
        doc.text(`R$ ${totalPlano.toFixed(2)}`, marginLeft + 45, totalY);

        if (dataRenovacao) {
          doc.setTextColor(...textGray);
          doc.text("Renovação:", marginLeft + 120, totalY);
          doc.setTextColor(...textYellow);
          doc.text(dataRenovacao, marginLeft + 145, totalY);
        }

        y += cardHeight + 5;
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
      doc.text(
        `Gerado em: ${formatarData(new Date().toISOString())} às ${formatarHora(
          new Date().toISOString()
        )}`,
        105,
        290,
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
  const gerarMesesFaturamento = (
    faturamentos,
    anoSelecionado,
    tipoPagamento
  ) => {
    const meses = {};
    const qtdMesesPlano = getMesesPorTipoPlano(tipoPagamento);

    for (const fat of faturamentos) {
      if (!fat.Faturamento_Inicio) continue;

      const inicio = new Date(fat.Faturamento_Inicio);
      const valorTotal = parseFloat(fat.Faturamento_Valor_Total) || 0;
      const desconto = parseFloat(fat.Faturamento_Desconto) || 0;
      const pago = fat.Faturamento_Data_Pagamento ? true : false;

      // Gera os meses a partir do mês de início, baseado no tipo de plano
      const mesesDoPlano = [];
      for (let i = 0; i < qtdMesesPlano; i++) {
        const mesData = new Date(
          inicio.getFullYear(),
          inicio.getMonth() + i,
          1
        );
        mesesDoPlano.push({
          ano: mesData.getFullYear(),
          mes: mesData.getMonth() + 1,
          parcela: i + 1, // número da parcela no plano completo
          totalParcelas: qtdMesesPlano, // total de parcelas do plano
        });
      }

      // Valor por mês (proporcional)
      const valorPorMes = valorTotal / qtdMesesPlano;
      const descontoPorMes = desconto / qtdMesesPlano;

      for (const m of mesesDoPlano) {
        // Filtra apenas os meses do ano selecionado
        if (String(m.ano) !== String(anoSelecionado)) continue;

        const mesAno = `${m.ano}-${String(m.mes).padStart(2, "0")}`;
        if (!meses[mesAno]) {
          meses[mesAno] = {
            valor: 0,
            desconto: 0,
            pago: false,
            dataPagamento: null,
            faturamentos: [],
            parcela: m.parcela,
            totalParcelas: m.totalParcelas,
          };
        }
        meses[mesAno].valor += valorPorMes;
        meses[mesAno].desconto += descontoPorMes;
        // Se tem data de pagamento, TODOS os meses do plano ficam como pago
        if (pago) {
          meses[mesAno].pago = true;
          meses[mesAno].dataPagamento = fat.Faturamento_Data_Pagamento;
        }
        meses[mesAno].faturamentos.push(fat);
      }
    }

    return meses;
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

  return (
    <div className="w-full h-auto">
      <MessageToast messageToast={messageToast} />
      <div
        className="bg-gray-800 rounded-xl p-3 sm:p-6 space-y-4 w-full h-full min-h-[80vh] shadow-lg border-2 border-gray-700"
        style={{ minWidth: 0, maxWidth: "100vw" }}
      >
        <h2 className="text-xl font-bold text-white mb-4">Extrato do Aluno</h2>

        {/* Dropdown Aluno */}
        <div className="flex flex-col gap-1">
          <label className="text-gray-300 text-sm">
            Aluno:<span className="text-red-500"> *</span>
          </label>
          <CustomSelect
            name="codigoAluno"
            value={codigoAluno}
            onChange={(e) => setCodigoAluno(e.target.value)}
            required
            placeholder="Selecione o aluno"
            options={alunos.map((aluno) => ({
              value: aluno.Alunos_Codigo,
              label: `${aluno.Alunos_Codigo} - ${aluno.Alunos_Nome}`,
            }))}
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

        {/* Botão Extrato */}
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Buttons.BotaoExtrato onClick={handleExtrato} loading={loading} />
        </div>

        {/* Resultados do Extrato */}
        {extrato && (
          <div className="mt-6 space-y-6 bg-gray-800 p-4 rounded-xl">
            {/* Card: Informações do Aluno */}
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-2">
                Informações do Aluno
              </h3>
              <ul className="text-gray-200 text-sm space-y-1">
                <li>
                  <b>Código:</b> {extrato.aluno?.Alunos_Codigo}
                </li>
                <li>
                  <b>Nome:</b> {extrato.aluno?.Alunos_Nome}
                  {extrato.aluno?.Alunos_Situacao === "Ativo" && (
                    <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-semibold">
                      Ativo
                    </span>
                  )}
                  {extrato.aluno?.Alunos_Situacao === "Inativo" && (
                    <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-semibold">
                      Inativo
                    </span>
                  )}
                </li>
                <li>
                  <b>CPF:</b> {extrato.aluno?.Alunos_CPF || "-"}
                </li>
                <li>
                  <b>Email:</b> {extrato.aluno?.Alunos_Email || "-"}
                </li>
                <li>
                  <b>Telefone:</b> {extrato.aluno?.Alunos_Telefone || "-"}
                </li>
                <li>
                  <b>Data Matrícula:</b>{" "}
                  {extrato.aluno?.Alunos_Data_Matricula
                    ? formatarDataBR(extrato.aluno.Alunos_Data_Matricula)
                    : "-"}
                </li>
              </ul>
            </div>

            {/* Cards: Planos e Pagamentos */}
            {extrato.planos && extrato.planos.length > 0 ? (
              [...extrato.planos]
                .sort((a, b) => {
                  // Ordena planos mais antigos primeiro (por data de início do faturamento mais antigo)
                  const dataA = a.faturamentos?.[0]?.Faturamento_Inicio
                    ? new Date(a.faturamentos[0].Faturamento_Inicio)
                    : new Date(9999, 0, 1);
                  const dataB = b.faturamentos?.[0]?.Faturamento_Inicio
                    ? new Date(b.faturamentos[0].Faturamento_Inicio)
                    : new Date(9999, 0, 1);
                  return dataA - dataB;
                })
                .map((plano, idx) => {
                  const mesesFaturamento = gerarMesesFaturamento(
                    plano.faturamentos || [],
                    ano,
                    plano.Plano_Pagamento
                  );
                  const totalPlano = Object.values(mesesFaturamento).reduce(
                    (acc, m) => acc + (m.valor - m.desconto),
                    0
                  );

                  return (
                    <div
                      key={idx}
                      className="bg-gray-900 rounded-xl p-4 border border-gray-700"
                    >
                      <h3 className="text-lg font-bold text-white mb-2">
                        Plano: {plano.Plano_Codigo} - {plano.Plano_Nome}
                      </h3>
                      <ul className="text-gray-200 text-sm space-y-1 mb-3">
                        <li>
                          <b>Tipo de Pagamento:</b> {plano.Plano_Pagamento}
                        </li>
                        <li>
                          <b>Quantidade por Semana:</b>{" "}
                          {plano.Plano_Quantidade_Semana}x
                        </li>
                      </ul>

                      {/* Pagamentos por mês */}
                      {Object.keys(mesesFaturamento).length > 0 ? (
                        <div className="space-y-2">
                          {Object.keys(mesesFaturamento)
                            .sort()
                            .map((mesAno) => {
                              const mesData = mesesFaturamento[mesAno];
                              const valorMes = mesData.valor - mesData.desconto;
                              const parcela = `${mesData.parcela}/${mesData.totalParcelas}`;
                              return (
                                <div
                                  key={mesAno}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-800 rounded-lg p-2 border border-gray-600"
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span className="text-purple-400 font-semibold text-sm">
                                      {parcela}
                                    </span>
                                    <span className="text-white font-semibold">
                                      {nomeMes(mesAno)}
                                    </span>
                                    <span className="text-green-400 text-sm">
                                      R$ {valorMes.toFixed(2)}
                                    </span>
                                    {mesData.pago && (
                                      <span className="ml-2 px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-semibold">
                                        Pago
                                      </span>
                                    )}
                                    {!mesData.pago && (
                                      <span className="ml-2 px-2 py-0.5 bg-yellow-600 text-white text-xs rounded-full font-semibold">
                                        Pendente
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1 sm:mt-0">
                                    {mesData.pago && mesData.dataPagamento && (
                                      <span>
                                        Pago em:{" "}
                                        {formatarDataBR(mesData.dataPagamento)}
                                      </span>
                                    )}
                                    {mesData.desconto > 0 && (
                                      <span className="text-yellow-400 ml-2">
                                        (desc: R$ {mesData.desconto.toFixed(2)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          Nenhum mês de faturamento encontrado para este plano
                          no ano selecionado.
                        </p>
                      )}

                      {/* Total do Plano */}
                      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-700 rounded-lg p-3 border border-gray-600 gap-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-white font-bold">
                            Total do Plano:
                          </span>
                          <span className="text-green-400 font-bold text-lg">
                            R$ {totalPlano.toFixed(2)}
                          </span>
                        </div>
                        {plano.faturamentos &&
                          plano.faturamentos.length > 0 &&
                          plano.faturamentos[plano.faturamentos.length - 1]
                            .Faturamento_Fim && (
                            <div className="text-sm text-gray-300">
                              <span className="font-semibold">Renovação:</span>{" "}
                              <span className="text-yellow-400">
                                {formatarDataBR(
                                  plano.faturamentos[
                                    plano.faturamentos.length - 1
                                  ].Faturamento_Fim
                                )}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 text-center">
                <span className="text-gray-400">
                  Nenhum plano encontrado para o ano selecionado.
                </span>
              </div>
            )}

            {/* Botão Salvar PDF */}
            {/* Pendências: faturamentos e planos com parcelas em aberto */}
            {extrato.faturamentosPendentes &&
              extrato.faturamentosPendentes.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 border border-yellow-600 mt-4">
                  <h3 className="text-lg font-bold text-yellow-300 mb-2">
                    Pendências / Faturamentos em Aberto
                  </h3>
                  <div className="space-y-3">
                    {extrato.planosPendentes &&
                      extrato.planosPendentes.map((pp, pidx) => (
                        <div
                          key={pidx}
                          className="bg-gray-800 rounded-lg p-3 border border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-white font-semibold">
                                Plano: {pp.Plano_Codigo} - {pp.Plano_Nome}
                              </div>
                              {pp.Plano_Valor !== null && (
                                <div className="text-yellow-200 text-sm">
                                  Valor do Plano: R$ {pp.Plano_Valor}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 space-y-1">
                            {pp.faturamentos && pp.faturamentos.length > 0 ? (
                              pp.faturamentos.map((f) => (
                                <div
                                  key={f.id || f.Faturamento_ID}
                                  className="flex items-center justify-between text-sm text-gray-200 bg-gray-700 p-2 rounded"
                                >
                                  <div>
                                    <div>
                                      <b>ID:</b> {f.id || f.Faturamento_ID}
                                    </div>
                                    <div>
                                      <b>Período:</b>{" "}
                                      {f.Faturamento_Inicio
                                        ? formatarDataBR(f.Faturamento_Inicio)
                                        : "-"}{" "}
                                      -{" "}
                                      {f.Faturamento_Fim
                                        ? formatarDataBR(f.Faturamento_Fim)
                                        : "-"}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-yellow-300 font-semibold">
                                      R${" "}
                                      {(
                                        parseFloat(f.Faturamento_Valor_Total) ||
                                        0
                                      ).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Status: Pendente
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-gray-300">
                                Nenhum faturamento listado.
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            <div className="flex justify-center pt-4">
              <Buttons.BotaoPDF onClick={handleGerarPDF} loading={loadingPdf} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExtratoAluno;
