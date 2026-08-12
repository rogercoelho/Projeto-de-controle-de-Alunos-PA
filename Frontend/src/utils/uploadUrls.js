const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br";

function normalizeUploadPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function encodePathSegments(relativePath) {
  return relativePath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getUploadUrl(filePath, legacySubdir = "", options = {}) {
  const normalized = normalizeUploadPath(filePath);
  if (!normalized) return "";

  if (normalized.startsWith("http") || normalized.startsWith("blob:")) {
    return normalized;
  }

  const relativePath = normalized.includes("/")
    ? normalized
    : [legacySubdir, normalized].filter(Boolean).join("/");

  const cacheBust = options.cacheBust ? `?t=${Date.now()}` : "";
  return `${API_BASE_URL}/uploads/${encodePathSegments(relativePath)}${cacheBust}`;
}
