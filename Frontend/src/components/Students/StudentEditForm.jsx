function StudentEditForm({
  editFormData,
  onChange,
  onSubmit,
  onCancel,
  arquivosEdit,
  onFileChange,
  loading,
  loadingCep,
  selectedAluno,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-gray-800 rounded-xl p-6 space-y-4 mx-auto"
    >
      <div className="w-full mb-8 flex">
        <span
          style={{
            color: "#b91c1c",
            fontWeight: "bold",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span role="img" aria-label="alerta">
            ⚠️
          </span>
          Campos com * são obrigatórios.
        </span>
      </div>

      {selectedAluno?.Alunos_Foto && (
        <div className="flex flex-col items-center mb-2">
          <label className="font-bold text-gray-300 mb-1">Foto Atual:</label>
          <img
            src={`https://api2.plantandoalegria.com.br/uploads/fotos/${selectedAluno.Alunos_Foto}`}
            alt={selectedAluno.Alunos_Nome}
            className="w-32 h-32 object-cover rounded-md border-2 border-gray-300"
            onError={(e) => (e.target.style.display = "none")}
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nova Foto
        </label>
        <input
          type="file"
          name="foto"
          onChange={onFileChange}
          accept="image/*"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
        />
        {arquivosEdit.foto && (
          <span className="text-sm text-green-600">
            📷 {arquivosEdit.foto.name} (
            {(arquivosEdit.foto.size / 1024).toFixed(1)} KB)
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Novo Contrato
        </label>
        <input
          type="file"
          name="contrato"
          onChange={onFileChange}
          accept="application/pdf,image/*"
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
        />
        {arquivosEdit.contrato && (
          <span className="text-sm text-green-600">
            📄 {arquivosEdit.contrato.name} (
            {(arquivosEdit.contrato.size / 1024).toFixed(1)} KB)
          </span>
        )}
        {selectedAluno?.Alunos_Contrato && !arquivosEdit.contrato && (
          <span className="text-sm text-gray-600">
            Atual: {selectedAluno.Alunos_Contrato}
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Código do Aluno *
        </label>
        <input
          type="number"
          name="Alunos_Codigo"
          value={editFormData.Alunos_Codigo || ""}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          readOnly
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome Completo *
        </label>
        <input
          type="text"
          name="Alunos_Nome"
          value={editFormData.Alunos_Nome || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Data de Nascimento *
        </label>
        <input
          type="date"
          name="Alunos_Data_Nascimento"
          value={editFormData.Alunos_Data_Nascimento || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CPF *
        </label>
        <input
          type="text"
          name="Alunos_CPF"
          value={editFormData.Alunos_CPF || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          placeholder="000.000.000-00"
          maxLength="14"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Nome do Responsável
        </label>
        <input
          type="text"
          name="Alunos_Nome_Responsavel"
          value={editFormData.Alunos_Nome_Responsavel || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CPF do Responsável
        </label>
        <input
          type="text"
          name="Alunos_CPF_Responsavel"
          value={editFormData.Alunos_CPF_Responsavel || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          placeholder="000.000.000-00"
          maxLength="14"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          CEP *
        </label>
        <div className="relative w-full">
          <input
            type="text"
            name="Alunos_Endereco_CEP"
            value={editFormData.Alunos_Endereco_CEP || ""}
            onChange={onChange}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
            placeholder="00000-000"
            maxLength="9"
            required
          />
          {loadingCep && (
            <span className="absolute right-2 top-2 text-white text-sm">
              Buscando...
            </span>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Endereço *
        </label>
        <input
          type="text"
          name="Alunos_Endereco"
          value={editFormData.Alunos_Endereco || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          readOnly
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Complemento
        </label>
        <input
          type="text"
          name="Alunos_Endereco_Complemento"
          value={editFormData.Alunos_Endereco_Complemento || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Bairro *
        </label>
        <input
          type="text"
          name="Alunos_Endereco_Bairro"
          value={editFormData.Alunos_Endereco_Bairro || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          readOnly
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cidade *
        </label>
        <input
          type="text"
          name="Alunos_Endereco_Cidade"
          value={editFormData.Alunos_Endereco_Cidade || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          readOnly
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Estado *
        </label>
        <input
          type="text"
          name="Alunos_Endereco_Estado"
          value={editFormData.Alunos_Endereco_Estado || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          maxLength="2"
          readOnly
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Telefone *
        </label>
        <input
          type="tel"
          name="Alunos_Telefone"
          value={editFormData.Alunos_Telefone || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          placeholder="(00) 00000-0000"
          maxLength="15"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email *
        </label>
        <input
          type="email"
          name="Alunos_Email"
          value={editFormData.Alunos_Email || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Contato de Emergência
        </label>
        <input
          type="text"
          name="Alunos_Contato_Emergencia"
          value={editFormData.Alunos_Contato_Emergencia || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Telefone Emergência 1
        </label>
        <input
          type="tel"
          name="Alunos_Telefone_Emergencia_1"
          value={editFormData.Alunos_Telefone_Emergencia_1 || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          placeholder="(00) 00000-0000"
          maxLength="15"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Telefone Emergência 2
        </label>
        <input
          type="tel"
          name="Alunos_Telefone_Emergencia_2"
          value={editFormData.Alunos_Telefone_Emergencia_2 || ""}
          onChange={onChange}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-md"
          placeholder="(00) 00000-0000"
          maxLength="15"
        />
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Salvando..." : "💾 Salvar Alterações"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
        >
          ❌ Cancelar
        </button>
      </div>
    </form>
  );
}

export default StudentEditForm;

import PropTypes from "prop-types";

StudentEditForm.propTypes = {
  editFormData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  arquivosEdit: PropTypes.shape({
    foto: PropTypes.any,
    contrato: PropTypes.any,
  }).isRequired,
  onFileChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  loadingCep: PropTypes.bool,
  selectedAluno: PropTypes.shape({
    Alunos_Foto: PropTypes.string,
    Alunos_Nome: PropTypes.string,
    Alunos_Contrato: PropTypes.string,
  }),
};
