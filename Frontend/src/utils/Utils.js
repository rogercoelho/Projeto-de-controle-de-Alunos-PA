export function filtrarQuantidadeSemana(valor) {
  // Remove tudo que não for número (inclusive letras, sinais, etc)
  const apenasNumeros = valor.replace(/\D/g, "");
  // Converte para número e limita entre 1 e 7
  let num = parseInt(apenasNumeros, 10);
  if (isNaN(num)) return "";
  if (num < 1) num = 1;
  if (num > 7) num = 7;
  return String(num);
}
export function bloquearTeclasInvalidasQuantidadeSemana(e) {
  if (
    e.key === "e" ||
    e.key === "E" ||
    e.key === "+" ||
    e.key === "-" ||
    e.key === "." ||
    e.key === ","
  ) {
    e.preventDefault();
  }
}

// Deixa o texto em caixa alta
export function toUpperCaseText(str) {
  return (str || "").toUpperCase();
}
/* Retorna a classe de cor do input do studenteditform conforme editável */
export function corCampoEditavel(isEditable) {
  return isEditable ? "bg-gray-500" : "bg-gray-700";
}

export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return 0;
  const hoje = new Date();
  const partes = dataNascimento.split("-");
  if (partes.length !== 3) return 0;
  const nascimento = new Date(partes[0], partes[1] - 1, partes[2]);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const m = hoje.getMonth() - nascimento.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

export function formatarTelefone(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  if (apenasNumeros.length <= 10) {
    return apenasNumeros
      .replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3")
      .replace(/-$/, "");
  } else {
    return apenasNumeros
      .replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3")
      .replace(/-$/, "");
  }
}
export function validarTelefone(telefone) {
  return telefone.replace(/\D/g, "").length === 11;
}

export function formatarCPF(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  return apenasNumeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
    .slice(0, 14);
}

// Validação de CPF (algoritmo oficial)
export function validarCPF(cpf) {
  const strCPF = cpf.replace(/\D/g, "");
  if (strCPF.length !== 11 || /^([0-9])\1+$/.test(strCPF)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(strCPF.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(strCPF.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(strCPF.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(strCPF.charAt(10));
}

export function formatarCEP(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  return apenasNumeros.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function converterData(dataBR) {
  // de 'DD/MM/AAAA' para 'AAAA-MM-DD'
  if (!dataBR) return "";
  const [dia, mes, ano] = dataBR.split("/");
  if (!dia || !mes || !ano) return dataBR;
  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

export function formatarDataBR(dataISO) {
  // de 'AAAA-MM-DD' para 'DD/MM/AAAA'
  if (!dataISO) return "";
  const [ano, mes, dia] = dataISO.split("-");
  if (!dia || !mes || !ano) return dataISO;
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}

export function formatarData(dataInput) {
  // Aceita: Date object, ISO string (YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS),
  // ou já DD/MM/YYYY e retorna no formato DD/MM/YYYY
  if (!dataInput) return "";

  // Date object
  if (dataInput instanceof Date) {
    const d = dataInput;
    const dia = String(d.getDate()).padStart(2, "0");
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const ano = String(d.getFullYear());
    return `${dia}/${mes}/${ano}`;
  }

  // String handling
  const s = String(dataInput);
  // Já no formato BR
  if (s.includes("/")) return s;

  // Se for ISO com tempo 'YYYY-MM-DDTHH:MM:SS...' usamos a parte da data
  if (s.includes("T")) {
    const datePart = s.split("T")[0];
    return formatarDataBR(datePart);
  }

  // Se for 'YYYY-MM-DD hh:mm:ss' ou similar, pega os 10 primeiros caracteres
  if (s.includes("-") && s.length >= 10) {
    return formatarDataBR(s.substring(0, 10));
  }

  return s;
}

export function formatarHora(dataInput) {
  if (!dataInput) return "";
  // aceita Date ou string
  let d;
  if (dataInput instanceof Date) d = dataInput;
  else {
    try {
      d = new Date(dataInput);
    } catch (e) {
      return "";
    }
  }
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function toISODate(dataInput) {
  if (!dataInput) return "";
  let d;
  if (dataInput instanceof Date) d = dataInput;
  else {
    d = new Date(dataInput);
  }
  if (isNaN(d.getTime())) return "";
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function validarCodigoPlano(codigoPlano) {
  return codigoPlano
    .toUpperCase() // Converte para caixa alta
    .replace(/[^A-Z0-9]/g, ""); // Remove tudo que não é letra ou número
}

export function limparFormData() {
  return {
    Alunos_Codigo: "",
    Alunos_Nome: "",
    Alunos_CPF: "",
    Alunos_Data_Nascimento: "",
    Alunos_Nome_Pai_Responsavel: "",
    Alunos_CPF_Pai_Responsavel: "",
    Alunos_Nome_Mae_Responsavel: "",
    Alunos_CPF_Mae_Responsavel: "",
    Alunos_Endereco_CEP: "",
    Alunos_Endereco: "",
    Alunos_Endereco_Complemento: "",
    Alunos_Endereco_Bairro: "",
    Alunos_Endereco_Localidade: "",
    Alunos_Endereco_Cidade: "",
    Alunos_Endereco_Estado: "",
    Alunos_Telefone: "",
    Alunos_Email: "",
    Alunos_Contato_Emergencia: "",
    Alunos_Telefone_Emergencia_1: "",
    Alunos_Telefone_Emergencia_2: "",
    Alunos_Data_Matricula: "",
    Alunos_Observacoes: "",
  };
}
