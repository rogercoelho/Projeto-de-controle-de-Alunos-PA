// Hook/função utilitária para buscar CEP e atualizar estados
const buscarCEP = async (cep, setFormData, setMessage, setLoadingCep) => {
  const cepLimpo = cep.replace(/\D/g, "");
  if (cepLimpo.length !== 8) return;
  if (setLoadingCep) setLoadingCep(true);
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();
    if (data.erro) {
      if (setMessage)
        setMessage({ type: "error", text: "CEP não encontrado." });
      if (setFormData)
        setFormData((prev) => ({
          ...prev,
          Alunos_Endereco: "",
          Alunos_Endereco_Bairro: "",
          Alunos_Endereco_Localidade: "",
          Alunos_Endereco_Cidade: "",
          Alunos_Endereco_Estado: "",
        }));
    } else {
      if (setFormData)
        setFormData((prev) => ({
          ...prev,
          Alunos_Endereco: data.logradouro || "",
          Alunos_Endereco_Bairro: data.bairro || "",
          Alunos_Endereco_Localidade: data.localidade || "",
          Alunos_Endereco_Cidade: data.localidade || "",
          Alunos_Endereco_Estado: data.uf || "",
        }));
    }
  } catch (error) {
    if (setMessage)
      setMessage({ type: "error", text: "Erro ao buscar CEP. " + error });
  } finally {
    if (setLoadingCep) setLoadingCep(false);
  }
};

export default buscarCEP;
