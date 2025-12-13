import PropTypes from "prop-types";
import Buttons from "../miscellaneous/Buttons";

function PackagesEditForm({
  editFormData,
  loading,
  onSave,
  onChangeEdit,
  onCancel,
}) {
  return (
    <form onSubmit={onSave} className="bg-gray-800 rounded-xl p-6 space-y-4">
      {/* Código do Plano (readonly) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Código do Plano
        </label>
        <input
          type="text"
          value={editFormData.Plano_Codigo || ""}
          className="w-full px-4 py-2 bg-gray-600 text-gray-400 rounded-md cursor-not-allowed"
          readOnly
        />
      </div>

      {/* Nome do Plano */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome do Plano *
        </label>
        <input
          type="text"
          name="Plano_Nome"
          value={editFormData.Plano_Nome || ""}
          onChange={onChangeEdit}
          required
          maxLength={100}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Quantidade Por Semana */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quantidade Por Semana *
        </label>
        <input
          type="number"
          name="Plano_Quantidade_Semana"
          value={editFormData.Plano_Quantidade_Semana || ""}
          onChange={onChangeEdit}
          required
          min="1"
          max="7"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tipo de Pagamento */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tipo de Pagamento *
        </label>
        <select
          name="Plano_Pagamento"
          value={editFormData.Plano_Pagamento || ""}
          onChange={onChangeEdit}
          required
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          <option value="Unitário">Unitário</option>
          <option value="Mensal">Mensal</option>
          <option value="Trimestral">Trimestral</option>
          <option value="Semestral">Semestral</option>
          <option value="Anual">Anual</option>
        </select>
      </div>

      {/* Valor do Plano */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Valor do Plano (R$) *
        </label>
        <input
          type="number"
          name="Plano_Valor"
          value={editFormData.Plano_Valor || ""}
          onChange={onChangeEdit}
          required
          min="0"
          step="0.01"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Status *
        </label>
        <select
          name="Plano_Ativo"
          value={editFormData.Plano_Ativo || ""}
          onChange={onChangeEdit}
          required
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecione...</option>
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>

      {/* Botões */}
      <div className="flex gap-4 pt-4">
        <Buttons.BotaoSalvarAlteracoes
          type="submit"
          loading={loading}
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar Alterações"}
        </Buttons.BotaoSalvarAlteracoes>
        <Buttons.BotaoCancelar onClick={onCancel} disabled={loading}>
          Cancelar
        </Buttons.BotaoCancelar>
      </div>
    </form>
  );
}

PackagesEditForm.propTypes = {
  editFormData: PropTypes.shape({
    Plano_Codigo: PropTypes.string,
    Plano_Nome: PropTypes.string,
    Plano_Quantidade_Semana: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
    Plano_Pagamento: PropTypes.string,
    Plano_Valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    Plano_Ativo: PropTypes.string,
  }).isRequired,
  loading: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onChangeEdit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default PackagesEditForm;
