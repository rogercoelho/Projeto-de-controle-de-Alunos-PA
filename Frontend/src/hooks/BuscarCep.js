import { useState, useEffect } from "react";

function useBuscarCEP(cep) {
  const [loadingCep, setLoadingCep] = useState(false);
  const [dadosCep, setDadosCep] = useState(null);
  const [erroCep, setErroCep] = useState("");

  useEffect(() => {
    const cepLimpo = cep ? cep.replace(/\D/g, "") : "";
    if (cepLimpo.length !== 8) {
      setDadosCep(null);
      setErroCep("");
      setLoadingCep(false);
      return;
    }

    const controller = new AbortController();
    setLoadingCep(true);
    setErroCep("");

    fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.erro) {
          setDadosCep(null);
          setErroCep("CEP não encontrado.");
        } else {
          setDadosCep(data);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDadosCep(null);
          setErroCep("Erro ao buscar CEP. " + error.message);
        }
      })
      .finally(() => setLoadingCep(false));

    // Cleanup para abortar requisições antigas
    return () => controller.abort();
  }, [cep]);

  return { loadingCep, dadosCep, erroCep };
}

export default useBuscarCEP;
