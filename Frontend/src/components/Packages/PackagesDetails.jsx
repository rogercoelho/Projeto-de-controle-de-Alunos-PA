import PropTypes from "prop-types";
import Buttons from "../miscellaneous/Buttons";

function PackagesDetails({ plano, onEdit, onToggleStatus, onBack }) {
  if (!plano) return null;

  return (
    <div className="w-full h-auto space-y-2 mx-auto">
      {/* Botões de ação */}
      <div className="flex gap-2 mb-4">
        <Buttons.VoltarPesquisa onBack={onBack} />
        <Buttons.BotaoEditar onClick={onEdit} />
        <button
          onClick={onToggleStatus}
          className={`px-4 py-2 rounded-md text-white transition-colors focus:outline-none ${
            plano.Plano_Ativo === "Ativo"
              ? "bg-orange-500 hover:bg-orange-600"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {plano.Plano_Ativo === "Ativo" ? "🚫 Desativar" : "✅ Ativar"}
        </button>
      </div>

      {/* Card com detalhes do plano */}
      <div className="bg-gray-800 rounded-xl p-4 space-y-3">
        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Status:</div>
          <div
            className={`font-semibold ${
              plano.Plano_Ativo === "Ativo"
                ? "text-green-400"
                : "text-orange-400"
            }`}
          >
            {plano.Plano_Ativo}
          </div>
        </div>

        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Código:</div>
          <div>{plano.Plano_Codigo}</div>
        </div>

        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Nome do Plano:</div>
          <div>{plano.Plano_Nome}</div>
        </div>

        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Quantidade por Semana:</div>
          <div>{plano.Plano_Quantidade_Semana}x por semana</div>
        </div>

        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Tipo de Pagamento:</div>
          <div>{plano.Plano_Pagamento}</div>
        </div>

        <div className="text-sm md:text-base">
          <div className="font-bold text-gray-400">Valor:</div>
          <div>R$ {parseFloat(plano.Plano_Valor).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}

PackagesDetails.propTypes = {
  plano: PropTypes.shape({
    Plano_Codigo: PropTypes.string,
    Plano_Nome: PropTypes.string,
    Plano_Quantidade_Semana: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    Plano_Pagamento: PropTypes.string,
    Plano_Valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Plano_Ativo: PropTypes.string,
  }),
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default PackagesDetails;
