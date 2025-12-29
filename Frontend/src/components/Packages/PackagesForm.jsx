import { useState } from "react";
import api from "../../services/api";
import Buttons from "../miscellaneous/Buttons";
import MessageToast from "../miscellaneous/MessageToast";
import useToast from "../../hooks/useToast";
import {
  validarCodigoPlano,
  toUpperCaseText,
  filtrarQuantidadeSemana,
  bloquearTeclasInvalidasQuantidadeSemana,
} from "../../utils/Utils";

// Componente de Cadastro de Plano
function PackagesForm() {
  const [loading, setLoading] = useState(false);
  const [messageToast, showToast] = useToast();
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    quantidadeSemana: "",
    tipoPagamento: "",
    valor: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Se for o campo código, valida para aceitar apenas números e letras em caixa alta
    if (name === "codigo") {
      const codigoFormatado = validarCodigoPlano(value);
      setFormData((prev) => ({
        ...prev,
        [name]: codigoFormatado,
      }));
      return;
    }
    // Se for o campo nome, deixa em caixa alta
    if (name === "nome") {
      setFormData((prev) => ({
        ...prev,
        [name]: toUpperCaseText(value),
      }));
      return;
    }
    // Se for o campo quantidadeSemana, filtra para aceitar apenas números de 1 a 7
    if (name === "quantidadeSemana") {
      setFormData((prev) => ({
        ...prev,
        [name]: filtrarQuantidadeSemana(value),
      }));
      return;
    }
    // checkbox handling
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/planos/create", {
        codigo: formData.codigo,
        nome: formData.nome,
        quantidadeSemana: formData.quantidadeSemana,
        tipoPagamento: formData.tipoPagamento,
        valor: formData.valor,
        contador_habilitado: formData.contador_habilitado || false,
        contador_limite: formData.contador_limite || null,
        wet_value: formData.wet_value || null,
      });
      showToast({
        type: "success",
        text: response.data.Mensagem || "Plano cadastrado com sucesso!",
      });
      setFormData({
        codigo: "",
        nome: "",
        quantidadeSemana: "",
        tipoPagamento: "",
        valor: "",
        contador_habilitado: false,
        contador_limite: "",
        wet_value: "",
      });
    } catch (error) {
      // Se for erro 401, o interceptor global já trata
      if (error.response?.status !== 401) {
        showToast({
          type: "error",
          text:
            error.response?.data?.Erro ||
            error.response?.data?.Mensagem ||
            "Erro ao cadastrar plano. Tente novamente.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      codigo: "",
      nome: "",
      quantidadeSemana: "",
      tipoPagamento: "",
      valor: "",
    });
  };

  return (
    <div className="w-full h-auto">
      <h2 className="text-xl font-bold text-white mb-4">Cadastrar Plano</h2>
      {/* Mensagem de feedback */}
      {messageToast && <MessageToast messageToast={messageToast} />}
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 rounded-xl p-6 space-y-4"
      >
        {/* Código do Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Código do Plano *
          </label>
          <input
            type="text"
            name="codigo"
            value={formData.codigo}
            onChange={handleChange}
            required
            maxLength={20}
            placeholder="Ex: PLAN001"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Nome do Plano */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nome do Plano *
          </label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            maxLength={100}
            placeholder="Ex: Plano Básico"
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
            name="quantidadeSemana"
            value={formData.quantidadeSemana}
            onChange={handleChange}
            onKeyDown={bloquearTeclasInvalidasQuantidadeSemana}
            required
            inputMode="numeric"
            min="1"
            max="7"
            placeholder="Ex: 2"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Tipo de Pagamento */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tipo de Pagamento *
          </label>
          <select
            name="tipoPagamento"
            value={formData.tipoPagamento}
            onChange={handleChange}
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
            name="valor"
            value={formData.valor}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Ex: 150.00"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* Habilitar contador */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="contador_habilitado"
            checked={!!formData.contador_habilitado}
            onChange={handleChange}
            id="contador_habilitado"
            className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 rounded"
          />
          <label
            htmlFor="contador_habilitado"
            className="text-sm text-gray-300"
          >
            Habilitar contador
          </label>
        </div>

        {formData.contador_habilitado && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limite do Contador *
              </label>
              <input
                type="number"
                name="contador_limite"
                value={formData.contador_limite}
                onChange={handleChange}
                required
                min="1"
                placeholder="Ex: 4"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valor a ser registrado (WET) (R$) *
              </label>
              <input
                type="number"
                name="wet_value"
                value={formData.wet_value}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                placeholder="Ex: 50.00"
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}
        {/* Botões */}
        <div className="flex justify-center gap-6 pt-4">
          <Buttons.BotaoCadastrar
            type="submit"
            disabled={loading}
            loading={loading}
          >
            Cadastrar Plano
          </Buttons.BotaoCadastrar>
          <Buttons.BotaoLimpar
            type="button"
            onClick={handleClear}
            disabled={loading}
          ></Buttons.BotaoLimpar>
        </div>
      </form>
    </div>
  );
}

export default PackagesForm;
