import { useEffect, useMemo, useState } from "react";

function useBuscarCEP(cep) {
  const cepLimpo = useMemo(() => (cep ? cep.replace(/\D/g, "") : ""), [cep]);
  const [resultado, setResultado] = useState({
    cep: "",
    loadingCep: false,
    dadosCep: null,
    erroCep: "",
  });

  useEffect(() => {
    if (cepLimpo.length !== 8) return undefined;

    const controller = new AbortController();
    let ativo = true;

    Promise.resolve()
      .then(() => {
        if (!ativo) return null;
        setResultado({
          cep: cepLimpo,
          loadingCep: true,
          dadosCep: null,
          erroCep: "",
        });
        return fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`, {
          signal: controller.signal,
        });
      })
      .then((res) => res?.json())
      .then((data) => {
        if (!ativo || !data) return;
        if (data.erro) {
          setResultado({
            cep: cepLimpo,
            loadingCep: false,
            dadosCep: null,
            erroCep: "CEP nao encontrado.",
          });
          return;
        }

        setResultado({
          cep: cepLimpo,
          loadingCep: false,
          dadosCep: data,
          erroCep: "",
        });
      })
      .catch((error) => {
        if (!ativo || error.name === "AbortError") return;
        setResultado({
          cep: cepLimpo,
          loadingCep: false,
          dadosCep: null,
          erroCep: `Erro ao buscar CEP. ${error.message}`,
        });
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [cepLimpo]);

  if (cepLimpo.length !== 8 || resultado.cep !== cepLimpo) {
    return { loadingCep: false, dadosCep: null, erroCep: "" };
  }

  return {
    loadingCep: resultado.loadingCep,
    dadosCep: resultado.dadosCep,
    erroCep: resultado.erroCep,
  };
}

export default useBuscarCEP;
