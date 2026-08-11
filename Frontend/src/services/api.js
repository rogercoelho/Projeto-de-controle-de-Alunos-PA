import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "https://api2.plantandoalegria.com.br";

if (import.meta.env.DEV) {
  console.log("Modo:", import.meta.env.MODE);
  console.log("API URL:", API_URL);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestToken = String(
        error.config?.headers?.Authorization || "",
      ).replace(/^Bearer\s+/i, "");

      window.dispatchEvent(
        new CustomEvent("token-expired", {
          detail: {
            message:
              error.response.data?.Mensagem ||
              "Token expirado. Por favor, faca login novamente.",
            token: requestToken || null,
          },
        }),
      );
    }

    return Promise.reject(error);
  },
);

export default api;
