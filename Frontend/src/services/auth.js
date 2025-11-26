import api from "./api";

// Função para fazer login
export const login = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  const { token, usuario } = response.data;
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
  return response.data;
};

// Função para fazer logout
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  // window.location.href = '/login'; // Redirecionar para login
};

// Função para verificar se está autenticado
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token;
};

// Função para obter o token
export const getToken = () => {
  return localStorage.getItem("token");
};

// Função para obter dados do usuário logado
export const getUsuario = () => {
  const usuario = localStorage.getItem("usuario");
  return usuario ? JSON.parse(usuario) : null;
};

// Função para verificar se o usuário é Administrador
export const isAdmin = () => {
  const usuario = getUsuario();
  return usuario && usuario.grupo === "Administrador";
};

// Função para verificar se o usuário pertence ao grupo Alunos
export const isAluno = () => {
  const usuario = getUsuario();
  return usuario && usuario.grupo === "Alunos";
};
