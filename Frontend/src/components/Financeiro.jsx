import { useState } from "react";
import api from "../services/api";

function Financeiro() {
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  // Exemplo de mensagem de erro (pode ser removido se não for necessário)
  const showError = (msg) => {
    setMessage({ type: "error", text: msg });
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 1500);
  };

  return (
    <div className="w-full h-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Gestão Financeira</h2>

      {/* Mensagem de feedback */}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto ${
            message.type === "success"
              ? "bg-green-100 text-green-700 border-2 border-green-500"
              : "bg-red-100 text-red-700 border-2 border-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <p className="text-gray-300">
          Sistema financeiro em desenvolvimento...
        </p>
        {/* Exemplo de uso do showError (remova se não quiser exibir) */}
        {/* <button onClick={() => showError('Erro de exemplo!')} className="bg-red-600 text-white px-4 py-2 rounded-md mt-4">Exibir Erro</button> */}
      </div>
    </div>
  );
}

export default Financeiro;
