// Funções utilitárias para Students

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

export function formatarCPF(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  return apenasNumeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2")
    .slice(0, 14);
}

export function formatarCEP(valor) {
  const apenasNumeros = valor.replace(/\D/g, "");
  return apenasNumeros.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}
