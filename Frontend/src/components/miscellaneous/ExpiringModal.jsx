import React from "react";
import Buttons from "./Buttons";
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

function ItemList({ items, border, badge, badgeColor }) {
  if (!items || items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((it, idx) => (
        <li key={idx} className={`p-2 bg-gray-900 rounded-md border ${border}`}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-semibold truncate">
                {it.Alunos_Nome || it.Alunos_Codigo}
              </div>
              <div className="text-xs text-gray-400">
                Código: {it.Alunos_Codigo} • CPF: {it.Alunos_CPF || "-"}
              </div>
              <div className="text-xs text-gray-400">
                Plano: {it.Plano_Codigo} • Parcela:{" "}
                {formatarData(it.Faturamento_Fim)}
                {it.tipo === "renovacao" && (
                  <> • Renova: {adicionarUmMes(it.Faturamento_Fim)}</>
                )}
              </div>
            </div>
            <span
              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
            >
              {badge}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ExpiringModal({ open, onClose, items }) {
  if (!open) return null;

  const renovacao = (items || []).filter((i) => i.tipo === "renovacao");
  const pendentes = (items || []).filter((i) => i.tipo === "pendente");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-gray-800 text-white rounded-xl p-6 max-w-2xl w-full border border-gray-700">
        <h3 className="text-xl font-bold mb-4">Atenção: Planos e Pagamentos</h3>

        {items && items.length > 0 ? (
          <div className="max-h-80 overflow-y-auto mb-4 space-y-4">
            {renovacao.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1">
                  Planos vencendo este mês ({renovacao.length})
                </p>
                <ItemList
                  items={renovacao}
                  border="border-yellow-600/50"
                  badge="Renovar"
                  badgeColor="bg-yellow-600/20 text-yellow-400"
                />
              </div>
            )}
            {pendentes.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">
                  Pagamentos pendentes ({pendentes.length})
                </p>
                <ItemList
                  items={pendentes}
                  border="border-red-600/50"
                  badge="Pendente"
                  badgeColor="bg-red-600/20 text-red-400"
                />
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-300 mb-4">Nenhum item a exibir.</p>
        )}

        <div className="flex justify-end">
          <Buttons.BotaoOK onClick={onClose}>OK</Buttons.BotaoOK>
        </div>
      </div>
    </div>
  );
}

export default ExpiringModal;
