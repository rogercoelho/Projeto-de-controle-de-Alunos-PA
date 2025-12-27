import React from "react";
import Buttons from "./Buttons";
import { formatarData } from "../../utils/Utils";

function ExpiringModal({ open, onClose, items }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
      <div className="bg-gray-800 text-white rounded-xl p-6 max-w-2xl w-full border border-gray-700">
        <h3 className="text-xl font-bold mb-4">Planos vencendo este mês</h3>
        {items && items.length > 0 ? (
          <div className="max-h-64 overflow-y-auto mb-4">
            <ul className="space-y-2">
              {items.map((it, idx) => (
                <li
                  key={idx}
                  className="p-2 bg-gray-900 rounded-md border border-gray-700"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">
                        {it.Alunos_Nome || it.Alunos_Codigo}
                      </div>
                      <div className="text-xs text-gray-400">
                        Código: {it.Alunos_Codigo} • CPF: {it.Alunos_CPF || "-"}
                      </div>
                      <div className="text-xs text-gray-400">
                        Plano: {it.Plano_Codigo} • Vence:{" "}
                        {formatarData(it.Faturamento_Fim)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-300 mb-4">Nenhum plano vencendo este mês.</p>
        )}

        <div className="flex justify-end">
          <Buttons.BotaoOK onClick={onClose}>OK</Buttons.BotaoOK>
        </div>
      </div>
    </div>
  );
}

export default ExpiringModal;
