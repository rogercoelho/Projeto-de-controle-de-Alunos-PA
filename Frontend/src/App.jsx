import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./components/security/Login";
import StudentForm from "./components/students/StudentForm";
import StudentSearch from "./components/students/StudentSearch";
import { UsersComponents } from "./components/Security/Users";
import PackagesForm from "./components/Packages/PackagesForm";
import PackagesSearch from "./components/Packages/PackagesSearch";
import Financeiro from "./components/Financeiro";
import Faturamento from "./components/Billing/Faturamento";
import RegistrarPagamento from "./components/Billing/RegistrarPagamento";
import ExtratoAluno from "./components/Billing/ExtratoAluno";
import ProtectedRoute from "./components/Security/ProtectedRoute";
import AdminDelete from "./components/Security/AdminDelete";
import MobileMenu from "./components/miscellaneous/MobileMenu";
import { logout, getUsuario, isAdmin } from "./services/auth";

import useToast from "./hooks/useToast";
import MessageToast from "./components/miscellaneous/MessageToast";

function App() {
  const [activeComponent, setActiveComponent] = useState(null);
  const [activeComponent2, setActiveComponent2] = useState(null);
  const [showAdminDelete, setShowAdminDelete] = useState(false);
  const [userListKey, setUserListKey] = useState(0);
  const [studentSearchKey, setStudentSearchKey] = useState(0);
  const [packagesSearchKey, setPackagesSearchKey] = useState(0);
  const [registrarPagamentoKey, setRegistrarPagamentoKey] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [usuario, setUsuario] = useState(() => getUsuario());
  // eslint-disable-next-line no-unused-vars
  const [ehAdmin, setEhAdmin] = useState(() => isAdmin());
  const [messageToast, showToast] = useToast();

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      logout();
      window.location.reload();
    }
  };
  // Logout automático (token expirado)
  useEffect(() => {
    // Atualiza usuario e ehAdmin ao montar e após login/logout
    const updateUserState = () => {
      setUsuario(getUsuario());
      setEhAdmin(isAdmin());
    };
    window.addEventListener("login", updateUserState);
    window.addEventListener("logout", updateUserState);
    updateUserState();

    const handleTokenExpired = (e) => {
      showToast({ type: "error", text: e.detail });
      setTimeout(() => {
        window.dispatchEvent(new Event("logout"));
      }, 4000); // tempo da mensagem toast antes de redirecionar
    };
    window.addEventListener("token-expired", handleTokenExpired);

    const handleLogout = () => {
      logout(); // remove o token
      window.location.href = "/security/login"; // redireciona para login
    };
    window.addEventListener("logout", handleLogout);

    return () => {
      window.removeEventListener("login", updateUserState);
      window.removeEventListener("logout", updateUserState);
      window.removeEventListener("token-expired", handleTokenExpired);
      window.removeEventListener("logout", handleLogout);
    };
  }, [showToast]);

  const handleNavigate = (component, subComponent) => {
    setActiveComponent(component);
    setActiveComponent2(subComponent);
    // Incrementa a key quando UserList é selecionado para forçar remontagem
    if (subComponent === "UserList") {
      setUserListKey((prev) => prev + 1);
    }
    // Incrementa a key quando StudentSearch é selecionado para forçar remontagem
    if (subComponent === "StudentSearch") {
      setStudentSearchKey((prev) => prev + 1);
    }
    // Incrementa a key quando PackagesSearck é selecionado para forçar remontagem
    if (subComponent === "PackagesSearch") {
      setPackagesSearchKey((prev) => prev + 1);
    }
    // Incrementa a key quando RegistrarPagamento é selecionado para forçar remontagem
    if (component === "Financeiro" && subComponent === "RegistrarPagamento") {
      setRegistrarPagamentoKey((prev) => prev + 1);
    }
  };

  return (
    <>
      <MessageToast messageToast={messageToast} />
      <Routes>
        <Route path="/security/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="w-full h-auto min-h-screen mx-auto flex flex-col justify-start p-6 bg-gray-900 text-white border-8 border-red-900 rounded-4xl">
                <div className="relative">
                  {/* Botão de Logout e informações do usuário - Desktop */}
                  <div className="hidden md:flex absolute top-0 right-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Bem-vindo(a),</p>
                      <button
                        onClick={() =>
                          ehAdmin && setShowAdminDelete(!showAdminDelete)
                        }
                        className={`font-bold ${
                          ehAdmin
                            ? "hover:text-red-500 cursor-pointer"
                            : "cursor-default"
                        }`}
                        disabled={!ehAdmin}
                      >
                        {usuario?.nome}
                      </button>
                      <p className="text-xs text-gray-400">
                        {usuario?.grupo === "Administrador"
                          ? "👑 Administrador"
                          : "👤 Aluno"}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                    >
                      Sair
                    </button>
                  </div>

                  <h1 className="font-circus1 text-red-500 text-center text-4xl mb-4">
                    Plantando Alegria
                  </h1>
                  <h1 className="font-circus1 text-red-500 text-center text-3xl mb-4">
                    Escola de Circo e Producoes
                  </h1>

                  {/* Bem-vindo e Logout - Mobile */}
                  <div className="md:hidden flex flex-col gap-3 mt-4">
                    <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <div className="flex-1">
                        <p className="text-xs text-gray-400">Bem-vindo(a),</p>
                        <button
                          onClick={() =>
                            ehAdmin && setShowAdminDelete(!showAdminDelete)
                          }
                          className={`font-bold text-white ${
                            ehAdmin
                              ? "hover:text-red-500 cursor-pointer"
                              : "cursor-default"
                          }`}
                          disabled={!ehAdmin}
                        >
                          {usuario?.nome}
                        </button>
                        <p className="text-xs text-gray-400">
                          {usuario?.grupo === "Administrador"
                            ? "👑 Administrador"
                            : "👤 Aluno"}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors text-sm"
                      >
                        Sair
                      </button>
                    </div>
                  </div>
                </div>

                {/* Menu Mobile */}
                <div className="mb-6">
                  <MobileMenu onNavigate={handleNavigate} ehAdmin={ehAdmin} />
                </div>

                {/* Painel de Admin Delete */}
                {showAdminDelete && ehAdmin && (
                  <div className="mb-6">
                    <AdminDelete />
                  </div>
                )}

                {activeComponent2 && (
                  <div className="flex justify-center w-full">
                    <div className="w-full border-2 rounded-xl border-b-gray-500 p-3 m-3">
                      {activeComponent2 === "StudentForm" && (
                        <StudentForm key="student-form" />
                      )}
                      {activeComponent2 === "StudentSearch" && (
                        <StudentSearch
                          key={`student-search-${studentSearchKey}`}
                        />
                      )}
                      {activeComponent2 === "UserForm" && (
                        <UsersComponents.UserForm key="user-form" />
                      )}
                      {activeComponent2 === "UserList" && (
                        <UsersComponents.UserList
                          key={`user-list-${userListKey}`}
                        />
                      )}
                      {activeComponent2 === "PackagesForm" && (
                        <PackagesForm key={`packages-form`} />
                      )}
                      {activeComponent2 === "PackagesSearch" && (
                        <PackagesSearch
                          key={`packages-search-${packagesSearchKey}`}
                        />
                      )}
                      {activeComponent === "Financeiro" &&
                        activeComponent2 === "Faturamento" && (
                          <Faturamento key="faturamento" />
                        )}
                      {activeComponent === "Financeiro" &&
                        activeComponent2 === "RegistrarPagamento" && (
                          <RegistrarPagamento
                            key={`registrar-pagamento-${registrarPagamentoKey}`}
                          />
                        )}
                      {activeComponent === "Financeiro" &&
                        activeComponent2 === "ExtratoAluno" && (
                          <ExtratoAluno key="extrato-aluno" />
                        )}
                      {activeComponent === "Financeiro" &&
                        (!activeComponent2 ||
                          activeComponent2 === "Financeiro") && (
                          <Financeiro key="financeiro" />
                        )}
                    </div>
                  </div>
                )}
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
