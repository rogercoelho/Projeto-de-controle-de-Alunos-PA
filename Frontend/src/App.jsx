import { useState } from "react";
import { StudentsComponents } from "./components/Students";
import { UsersComponents } from "./components/Users";
import PlanosComponents from "./components/Planos";
import Classes from "./components/classes";
import Attendance from "./components/attendance";
import Financeiro from "./components/Financeiro";
import Faturamento from "./components/Faturamento";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminDelete from "./components/AdminDelete";
import MobileMenu from "./components/MobileMenu";
import { logout, getUsuario, isAdmin } from "./services/auth";

function App() {
  const [activeComponent, setActiveComponent] = useState(null);
  const [activeComponent2, setActiveComponent2] = useState(null);
  const [showAdminDelete, setShowAdminDelete] = useState(false);
  const [userListKey, setUserListKey] = useState(0);
  const [studentSearchKey, setStudentSearchKey] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [usuario, setUsuario] = useState(() => getUsuario());
  // eslint-disable-next-line no-unused-vars
  const [ehAdmin, setEhAdmin] = useState(() => isAdmin());

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      logout();
      window.location.reload();
    }
  };

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
  };

  return (
    <ProtectedRoute>
      <div className="w-full h-auto min-h-screen mx-auto flex flex-col justify-start p-6 bg-gray-900 text-white border-8 border-red-900 rounded-4xl">
        <div className="relative">
          {/* Botão de Logout e informações do usuário - Desktop */}
          <div className="hidden md:flex absolute top-0 right-0 items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-300">Bem-vindo(a),</p>
              <button
                onClick={() => ehAdmin && setShowAdminDelete(!showAdminDelete)}
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
                <StudentsComponents.StudentForm key="student-form" />
              )}
              {activeComponent2 === "StudentSearch" && (
                <StudentsComponents.StudentSearch
                  key={`student-search-${studentSearchKey}`}
                />
              )}
              {activeComponent2 === "StudentPlan" && (
                <StudentsComponents.StudentPlan key="student-plan" />
              )}
              {activeComponent2 === "UserForm" && (
                <UsersComponents.UserForm key="user-form" />
              )}
              {activeComponent2 === "UserList" && (
                <UsersComponents.UserList key={`user-list-${userListKey}`} />
              )}
              {activeComponent === "Classes" && <Classes key="classes" />}
              {activeComponent === "Attendance" && (
                <Attendance key="attendance" />
              )}
              {activeComponent === "Financeiro" &&
                activeComponent2 === "Faturamento" && (
                  <Faturamento key="faturamento" />
                )}
              {activeComponent === "Financeiro" &&
                (!activeComponent2 || activeComponent2 === "Financeiro") && (
                  <Financeiro key="financeiro" />
                )}
              {activeComponent2 === "PlanoForm" && (
                <PlanosComponents.PlanoForm key="plano-form" />
              )}
              {activeComponent2 === "PlanoSearch" && (
                <PlanosComponents.PlanoSearch key="plano-search" />
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;
