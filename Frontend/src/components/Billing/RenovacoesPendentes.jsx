import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import { formatarData } from "../../utils/Utils";

function adicionarUmMes(dataInput) {
  if (!dataInput) return "";
  const partes = String(dataInput).split("T")[0].split("-").map(Number);
  const [ano, mes, dia] = partes;
  const anoAlvo = mes === 12 ? ano + 1 : ano;
  const mesAlvo = mes === 12 ? 1 : mes + 1;
  const ultimoDia = new Date(anoAlvo, mesAlvo, 0).getDate();
  const diaAlvo = Math.min(dia, ultimoDia);
  const d = new Date(anoAlvo, mesAlvo - 1, diaAlvo);
  return formatarData(d);
}

function RenovacoesPendentes({ onAbrirExtrato }) {
  const [renovacao, setRenovacao] = useState([]);
  const [pendentes, setPendentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErro(null);
      try {
        const [resExp, resPend] = await Promise.all([
          api.get("/faturamento/expirando"),
          api.get("/faturamento/pendentes"),
        ]);
        setRenovacao(resExp.data?.alunos || []);
        setPendentes(resPend.data?.alunos || []);
      } catch {
        setErro("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = renovacao.length + pendentes.length;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white">Renovações Pendentes</h2>
        {!loading && !erro && (
          <span className="text-sm text-gray-400">
            {total} {total === 1 ? "aluno" : "alunos"} encontrado
            {total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {loading && (
        <div className="text-gray-400 text-sm py-8 text-center">
          Carregando...
        </div>
      )}

      {erro && (
        <div className="text-red-400 text-sm py-4 text-center">{erro}</div>
      )}

      {!loading && !erro && total === 0 && (
        <div className="text-gray-400 text-sm py-8 text-center">
          Nenhuma renovação ou pagamento pendente encontrado.
        </div>
      )}

      {!loading && !erro && renovacao.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-2">
            Planos vencendo / renovação pendente ({renovacao.length})
          </p>
          <ul className="space-y-2">
            {renovacao.map((it, idx) => (
              <li
                key={idx}
                onClick={() =>
                  onAbrirExtrato && onAbrirExtrato(it.Alunos_Codigo)
                }
                className={`p-3 bg-gray-900 rounded-lg border border-yellow-600/50 transition-colors ${
                  onAbrirExtrato ? "cursor-pointer hover:bg-gray-800" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {it.Alunos_Nome || it.Alunos_Codigo}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Código: {it.Alunos_Codigo} • CPF: {it.Alunos_CPF || "-"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Plano: {it.Plano_Codigo} • Última parcela:{" "}
                      {formatarData(it.Faturamento_Fim)} • Renova:{" "}
                      <span className="text-yellow-400 font-semibold">
                        {adicionarUmMes(it.Faturamento_Fim)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400">
                    Renovar
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !erro && pendentes.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
            Pagamentos pendentes ({pendentes.length})
          </p>
          <ul className="space-y-2">
            {pendentes.map((it, idx) => (
              <li
                key={idx}
                onClick={() =>
                  onAbrirExtrato && onAbrirExtrato(it.Alunos_Codigo)
                }
                className={`p-3 bg-gray-900 rounded-lg border border-red-600/50 transition-colors ${
                  onAbrirExtrato ? "cursor-pointer hover:bg-gray-800" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-white truncate">
                      {it.Alunos_Nome || it.Alunos_Codigo}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Código: {it.Alunos_Codigo} • CPF: {it.Alunos_CPF || "-"}
                    </div>
                    <div className="text-xs text-gray-400">
                      Plano: {it.Plano_Codigo} • Parcela:{" "}
                      {formatarData(it.Faturamento_Fim)}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">
                    Pendente
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

RenovacoesPendentes.propTypes = {
  onAbrirExtrato: PropTypes.func,
};

export default RenovacoesPendentes;
