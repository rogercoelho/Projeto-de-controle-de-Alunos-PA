const fs = require("fs");
const path = require("path");

const UPLOADS_PRODUCTION_DIR = "/home2/goutechc/wwwplantandoalegria_API/uploads";

function getUploadsBaseDir() {
  return process.env.NODE_ENV === "production"
    ? UPLOADS_PRODUCTION_DIR
    : path.join(__dirname, "../uploads");
}

function normalizarArquivoUpload(arquivo) {
  return String(arquivo || "").trim().split("\\").join("/").replace(/^\/+/, "");
}

function sanitizarCodigoUpload(codigo, fallback = "novo") {
  return (
    String(codigo || fallback)
      .trim()
      .replace(/[^a-zA-Z0-9_.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || fallback
  );
}

function slugifyNomeUpload(nome) {
  return (
    String(nome || "aluno")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "aluno"
  );
}

function getPastaAlunoRelativa(codigo, nome) {
  const codigoSeguro = sanitizarCodigoUpload(codigo);
  const nomeSeguro = slugifyNomeUpload(nome);
  return path.posix.join("alunos", codigoSeguro + "-" + nomeSeguro);
}

function resolverArquivoUpload(arquivo, subdirLegado) {
  const normalizado = normalizarArquivoUpload(arquivo);
  if (!normalizado || normalizado.includes("..")) return null;

  const baseDir = getUploadsBaseDir();
  const relativo = normalizado.includes("/")
    ? normalizado
    : [subdirLegado, normalizado].filter(Boolean).join("/");
  const finalPath = path.resolve(baseDir, relativo);
  const basePath = path.resolve(baseDir);

  if (finalPath !== basePath && !finalPath.startsWith(basePath + path.sep)) {
    return null;
  }

  return finalPath;
}

function getArquivoRelativoSalvo(file) {
  if (!file?.path) return null;
  return normalizarArquivoUpload(
    path.relative(getUploadsBaseDir(), file.path).split(path.sep).join("/")
  );
}

function removerArquivoUpload(arquivo, subdirLegado) {
  const arquivoPath = resolverArquivoUpload(arquivo, subdirLegado);
  if (arquivoPath && fs.existsSync(arquivoPath)) {
    fs.unlinkSync(arquivoPath);
  }
}

module.exports = {
  getArquivoRelativoSalvo,
  getPastaAlunoRelativa,
  getUploadsBaseDir,
  normalizarArquivoUpload,
  removerArquivoUpload,
  resolverArquivoUpload,
  sanitizarCodigoUpload,
  slugifyNomeUpload,
};
