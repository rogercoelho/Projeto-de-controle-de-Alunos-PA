import { useState } from "react";
import { login } from "../../services/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [formData, setFormData] = useState({
    usuario: "",
    senha: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Hook para navegação

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await login(formData);
      setMessage({
        type: "success",
        text: "Login realizado com sucesso!",
      });
      window.dispatchEvent(new Event("login"));
      // Redirecionar após login bem-sucedido
      setTimeout(() => {
        navigate("/"); // Recarrega a página para atualizar o estado
      }, 2500);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Erro ao fazer login. Verifique suas credenciais.",
      });
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-auto min-h-screen mx-auto flex flex-col justify-center items-center p-6 bg-gray-900 text-white border-8 border-red-900 rounded-4xl">
      <div className="w-full max-w-md">
        <h1 className="font-circus1 text-red-500 text-center text-4xl mb-4">
          Plantando Alegria
        </h1>
        <h1 className="font-circus1 text-red-500 text-center text-3xl mb-6">
          Escola de Circo e Producoes
        </h1>

        {/* Mensagem de feedback - Float no rodapé à direita */}
        {message.text && (
          <div
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-md w-auto border-2 ${
              message.type === "success"
                ? "bg-green-100 text-green-700 border-green-500"
                : "bg-red-100 text-red-700 border-red-500"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-800 p-6 rounded-xl border-2 border-gray-700"
        >
          {/* Usuário */}
          <div>
            <label className="block text-white mb-2">Usuário:</label>
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleChange}
              className="w-full border border-gray-600 bg-gray-700 text-white rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Senha */}
          <div>
            <label className="block text-white mb-2">Senha:</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="w-full border border-gray-600 bg-gray-700 text-white rounded-md p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-2 rounded-md hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
