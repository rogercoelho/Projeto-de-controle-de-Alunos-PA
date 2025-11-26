import { useState } from "react";
import PropTypes from "prop-types";

function MobileMenu({ onNavigate, ehAdmin }) {
  const [menuAlunosAberto, setMenuAlunosAberto] = useState(false);
  const [menuAulasAberto, setMenuAulasAberto] = useState(false);
  const [menuPresencaAberto, setMenuPresencaAberto] = useState(false);
  const [menuUsuariosAberto, setMenuUsuariosAberto] = useState(false);
  const [menuFinanceiroAberto, setMenuFinanceiroAberto] = useState(false);
  const [menuPlanosAberto, setMenuPlanosAberto] = useState(false);

  const handleNavigation = (component, subComponent) => {
    if (onNavigate) {
      onNavigate(component, subComponent);
    }
  };

  const toggleMenu = (menu) => {
    // Limpa o componente ativo ao clicar em qualquer menu principal
    if (onNavigate) {
      onNavigate(null, null);
    }

    // Primeiro fecha todos os outros menus
    if (menu !== "alunos") setMenuAlunosAberto(false);
    if (menu !== "aulas") setMenuAulasAberto(false);
    if (menu !== "presenca") setMenuPresencaAberto(false);
    if (menu !== "usuarios") setMenuUsuariosAberto(false);
    if (menu !== "financeiro") setMenuFinanceiroAberto(false);
    if (menu !== "planos") setMenuPlanosAberto(false);

    // Depois de um pequeno delay, alterna o menu clicado
    setTimeout(() => {
      switch (menu) {
        case "alunos":
          setMenuAlunosAberto((prev) => !prev);
          break;
        case "aulas":
          setMenuAulasAberto((prev) => !prev);
          break;
        case "presenca":
          setMenuPresencaAberto((prev) => !prev);
          break;
        case "usuarios":
          setMenuUsuariosAberto((prev) => !prev);
          break;
        case "financeiro":
          setMenuFinanceiroAberto((prev) => !prev);
          break;
        case "planos":
          setMenuPlanosAberto((prev) => !prev);
          break;
        default:
          break;
      }
    }, 150);
    // Nenhuma mensagem de erro é exibida neste componente. Nenhuma alteração funcional necessária.
  };

  return (
    <div className="w-full bg-linear-to-r from-gray-800 to-gray-900 shadow-lg rounded-lg">
      <div className="max-w-7xl mx-auto px-4 py-2 space-y-1">
        {/* CONTROLE DE ALUNOS */}
        <div className="border-b border-gray-700">
          <button
            onClick={() => toggleMenu("alunos")}
            className="w-full flex items-center justify-between py-3 text-white font-semibold text-base active:bg-gray-700 transition-colors rounded-lg px-2"
          >
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 26 }} role="img" aria-label="aluno">
                👨‍🎓
              </span>
              <span>Controle de Alunos</span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${
                menuAlunosAberto ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              menuAlunosAberto ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="pb-3 space-y-2 pl-2">
              {ehAdmin && (
                <button
                  onClick={() => handleNavigation("Students", "StudentForm")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <span
                    style={{ fontSize: 20 }}
                    role="img"
                    aria-label="cadastrar"
                  >
                    🙋
                  </span>
                  <span className="font-medium">Cadastrar Aluno</span>
                </button>
              )}

              <button
                onClick={() => handleNavigation("Students", "StudentSearch")}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
              >
                <span
                  style={{ fontSize: 20 }}
                  role="img"
                  aria-label="pesquisar"
                >
                  🧐
                </span>
                <span className="font-medium">Pesquisar Alunos</span>
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLE DE PLANOS */}
        {ehAdmin && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleMenu("planos")}
              className="w-full flex items-center justify-between py-3 text-white font-semibold text-base active:bg-gray-700 transition-colors rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 26 }} role="img" aria-label="planos">
                  🎁
                </span>
                <span>Controle de Planos</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  menuPlanosAberto ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                menuPlanosAberto ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="pb-3 space-y-2 pl-2">
                <button
                  onClick={() => handleNavigation("Planos", "PlanoForm")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <span
                    style={{ fontSize: 20 }}
                    role="img"
                    aria-label="cadastrar-plano"
                  >
                    🎁➕
                  </span>
                  <span className="font-medium">Cadastrar Plano</span>
                </button>

                <button
                  onClick={() => handleNavigation("Planos", "PlanoSearch")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <span
                    style={{ fontSize: 20 }}
                    role="img"
                    aria-label="pesquisar-planos"
                  >
                    🔍
                  </span>
                  <span className="font-medium">Pesquisar Planos</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLE DE AULAS */}
        {ehAdmin && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleMenu("aulas")}
              className="w-full flex items-center justify-between py-3 text-white font-semibold text-base active:bg-gray-700 transition-colors rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 26 }} role="img" aria-label="aulas">
                  📅
                </span>
                <span>Controle de Aulas</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  menuAulasAberto ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                menuAulasAberto ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="pb-3 space-y-2 pl-2">
                <button
                  onClick={() => handleNavigation("Classes", null)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="font-medium">Criar Aula</span>
                </button>

                <button
                  onClick={() => handleNavigation("Classes", null)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <span className="font-medium">Listar Aulas</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTROLE DE PRESENÇA */}
        {ehAdmin && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleMenu("presenca")}
              className="w-full flex items-center justify-between py-3 text-white font-semibold text-base active:bg-gray-700 transition-colors rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 26 }} role="img" aria-label="presenca">
                  📝
                </span>
                <span>Controle de Presença</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  menuPresencaAberto ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                menuPresencaAberto
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="pb-3 space-y-2 pl-2">
                <button
                  onClick={() => handleNavigation("Attendance", null)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Registrar Presença</span>
                </button>

                <button
                  onClick={() => handleNavigation("Attendance", null)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span className="font-medium">Relatório de Presença</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        {ehAdmin && (
          <div className="border-b border-gray-700">
            <button
              onClick={() => toggleMenu("financeiro")}
              className="w-full flex items-center justify-between py-3 text-white font-semibold text-base active:bg-gray-700 transition-colors rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span
                  style={{ fontSize: 26 }}
                  role="img"
                  aria-label="financeiro"
                >
                  💰
                </span>
                <span>Financeiro</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  menuFinanceiroAberto ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                menuFinanceiroAberto
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="pb-3 space-y-2 pl-2">
                <button
                  onClick={() => handleNavigation("Financeiro", "Financeiro")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">Gestão Financeira</span>
                </button>
                <button
                  onClick={() => handleNavigation("Financeiro", "Faturamento")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-900/30 hover:bg-blue-800/40 active:bg-blue-700/50 rounded-lg text-white text-left transition-all border border-blue-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M9 16h6M12 4v4m0 8v4"
                    />
                  </svg>
                  <span className="font-medium">Faturamento</span>
                </button>
                <button
                  onClick={() =>
                    handleNavigation("Financeiro", "RegistrarPagamento")
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-900/30 hover:bg-green-800/40 active:bg-green-700/50 rounded-lg text-white text-left transition-all border border-green-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">Registrar Pagamento</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* GERENCIAR USUÁRIOS - Em Vermelho */}
        {ehAdmin && (
          <div>
            <button
              onClick={() => toggleMenu("usuarios")}
              className="w-full flex items-center justify-between py-3 bg-red-900 text-white font-semibold text-base active:bg-red-900/30 transition-colors rounded-lg px-2"
            >
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 26 }} role="img" aria-label="usuarios">
                  👤
                </span>
                <span className="text-white">Gerenciar Usuários</span>
              </div>
              <svg
                className={`w-5 h-5 transition-transform duration-300 ${
                  menuUsuariosAberto ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                menuUsuariosAberto
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="pb-3 space-y-2 pl-2">
                <button
                  onClick={() => handleNavigation("Users", "UserForm")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                  <span className="font-medium">Cadastrar Usuário</span>
                </button>

                <button
                  onClick={() => handleNavigation("Users", "UserList")}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-900/30 hover:bg-red-800/40 active:bg-red-700/50 rounded-lg text-white text-left transition-all border border-red-800/50"
                >
                  <svg
                    className="w-5 h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">Listar Usuários</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MobileMenu;

MobileMenu.propTypes = {
  onNavigate: PropTypes.func,
  ehAdmin: PropTypes.bool,
};
