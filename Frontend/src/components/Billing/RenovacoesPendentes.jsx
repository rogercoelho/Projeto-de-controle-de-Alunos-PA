import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import api from "../../services/api";
import { formatarData } from "../../utils/Utils";

function getDataRenovacao(dataInput) {
  if (!dataInput) return null;
  const partes = String(dataInput).split("T")[0].split("-").map(Number);
  const [ano, mes, dia] = partes;
  const anoAlvo = mes === 12 ? ano + 1 : ano;
  const mesAlvo = mes === 12 ? 1 : mes + 1;
  const ultimoDia = new Date(anoAlvo, mesAlvo, 0).getDate();
  const diaAlvo = Math.min(dia, ultimoDia);
  return new Date(anoAlvo, mesAlvo - 1, diaAlvo);
}

function adicionarUmMes(dataInput) {
  const dataRenovacao = getDataRenovacao(dataInput);
  return dataRenovacao ? formatarData(dataRenovacao) : "";
}

function adicionarUmMesISO(dataInput) {
  const dataRenovacao = getDataRenovacao(dataInput);
  if (!dataRenovacao) return "";
  const ano = dataRenovacao.getFullYear();
  const mes = String(dataRenovacao.getMonth() + 1).padStart(2, "0");
  const dia = String(dataRenovacao.getDate()).padStart(2, "0");
  return ano + "-" + mes + "-" + dia;
}

function RenovacaoItem({ item, color, onAbrirExtrato, onRenovar }) {
  const isBlue = color === "blue";

  return (
    <li
      onClick={() => onAbrirExtrato && onAbrirExtrato(item.Alunos_Codigo)}
      className={`p-3 bg-gray-900 rounded-lg border transition-colors ${
        isBlue ? "border-blue-600/50" : "border-yellow-600/50"
      } ${onAbrirExtrato ? "cursor-pointer hover:bg-gray-800" : ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-white truncate">
            {item.Alunos_Nome || item.Alunos_Codigo}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            Código: {item.Alunos_Codigo} • CPF: {item.Alunos_CPF || "-"}
          </div>
          <div className="text-xs text-gray-400">
            Plano: {item.Plano_Codigo} • Última parcela: {" "}
            {formatarData(item.Faturamento_Fim)} • Renova: {" "}
            <span
              className={
                isBlue
                  ? "text-blue-400 font-semibold"
                  : "text-yellow-400 font-semibold"
              }
            >
              {adicionarUmMes(item.Faturamento_Fim)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onRenovar &&
              onRenovar({
                codigoAluno: item.Alunos_Codigo,
                codigoPlano: item.Plano_Codigo,
                dataVencimento: adicionarUmMesISO(item.Faturamento_Fim),
              });
          }}
          className={`w-full shrink-0 rounded-lg border-2 px-4 py-2.5 text-sm font-bold shadow-sm transition-colors sm:w-auto sm:min-w-[112px] ${
            isBlue
              ? "border-blue-100 bg-blue-500 text-white hover:border-white hover:bg-blue-400 active:bg-blue-600"
              : "border-yellow-100 bg-yellow-500 text-gray-950 hover:border-white hover:bg-yellow-400 active:bg-yellow-600"
          }`}
        >
          Renovar
        </button>
      </div>
    </li>
  );
}

function RenovacaoSection({ title, items, color, onAbrirExtrato, onRenovar }) {
  if (!items.length) return null;

  return (
    <div>
      <p
        className={`text-xs font-semibold uppercase tracking-wide mb-2 ${
          color === "blue" ? "text-blue-400" : "text-yellow-400"
        }`}
      >
        {title} ({items.length})
      </p>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <RenovacaoItem
            key={item.Faturamento_ID || `${item.Alunos_Codigo}-${item.Plano_Codigo}-${idx}`}
            item={item}
            color={color}
            onAbrirExtrato={onAbrirExtrato}
            onRenovar={onRenovar}
          />
        ))}
      </ul>
    </div>
  );
}

function RenovacoesPendentes({ onAbrirExtrato, onRenovar }) {
  const [renovacaoMesVigente, setRenovacaoMesVigente] = useState([]);
  const [renovacaoProximoMes, setRenovacaoProximoMes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErro(null);
      try {
        const resExp = await api.get("/faturamento/expirando");
        setRenovacaoMesVigente(resExp.data?.mesVigente || []);
        setRenovacaoProximoMes(resExp.data?.proximoMes || []);
      } catch {
        setErro("Erro ao carregar dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = renovacaoMesVigente.length + renovacaoProximoMes.length;

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
          Nenhuma renovação encontrada para o mês vigente ou próximo mês.
        </div>
      )}

      {!loading && !erro && (
        <>
          <RenovacaoSection
            title="Renovações para o mês vigente"
            items={renovacaoMesVigente}
            color="yellow"
            onAbrirExtrato={onAbrirExtrato}
            onRenovar={onRenovar}
          />
          <RenovacaoSection
            title="Renovações para o próximo mês"
            items={renovacaoProximoMes}
            color="blue"
            onAbrirExtrato={onAbrirExtrato}
            onRenovar={onRenovar}
          />
        </>
      )}
    </div>
  );
}

const renovacaoItemShape = PropTypes.shape({
  Alunos_Codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  Alunos_Nome: PropTypes.string,
  Alunos_CPF: PropTypes.string,
  Plano_Codigo: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  Faturamento_Fim: PropTypes.string,
  Faturamento_ID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
});

RenovacaoItem.propTypes = {
  item: renovacaoItemShape.isRequired,
  color: PropTypes.oneOf(["yellow", "blue"]).isRequired,
  onAbrirExtrato: PropTypes.func,
  onRenovar: PropTypes.func,
};

RenovacaoSection.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(renovacaoItemShape).isRequired,
  color: PropTypes.oneOf(["yellow", "blue"]).isRequired,
  onAbrirExtrato: PropTypes.func,
  onRenovar: PropTypes.func,
};

RenovacoesPendentes.propTypes = {
  onAbrirExtrato: PropTypes.func,
  onRenovar: PropTypes.func,
};

export default RenovacoesPendentes;


