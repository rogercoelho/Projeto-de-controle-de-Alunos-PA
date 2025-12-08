import axios from "axios";

// Usa variável de ambiente ou fallback para produção
const API_URL =
  import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br";

// Log para debug (só em desenvolvimento)
if (import.meta.env.DEV) {
  console.log("🔧 Modo:", import.meta.env.MODE);
  console.log("🌐 API URL:", API_URL);
}

// Crie uma instância do axios com a URL base da sua API
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use(
  (config) => {
    // Pega o token do localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido ou expirado - redirecionar para login
      window.dispatchEvent(
        new CustomEvent("token-expired", {
          detail:
            error.response.data?.Mensagem ||
            "Token expirado. Por favor, faça login novamente.",
        })
      );
    }
    return Promise.reject(error);
  }
);

export default api;
