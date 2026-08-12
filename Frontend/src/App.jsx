import { useState, useEffect, useRef } from "react";
import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/security/ProtectedRoute";
import MobileMenu from "./components/miscellaneous/MobileMenu";
import { logout, getUsuario, isAdmin, getToken } from "./services/auth";
import api from "./services/api";
import ExpiringModal from "./components/miscellaneous/ExpiringModal";
import SessionWarningModal from "./components/miscellaneous/SessionWarningModal";

import useToast from "./hooks/useToast";
import MessageToast from "./components/miscellaneous/MessageToast";

const Login = lazy(() => import("./components/security/Login"));
const StudentForm = lazy(() => import("./components/students/StudentForm"));
const StudentSearch = lazy(() => import("./components/students/StudentSearch"));
const UserForm = lazy(() =>
  import("./components/security/Users").then(({ UsersComponents }) => ({
    default: UsersComponents.UserForm,
  })),
);
const UserList = lazy(() =>
  import("./components/security/Users").then(({ UsersComponents }) => ({
    default: UsersComponents.UserList,
  })),
);
const PackagesForm = lazy(() => import("./components/Packages/PackagesForm"));
const PackagesSearch = lazy(() =>
  import("./components/Packages/PackagesSearch"),
);
const Financeiro = lazy(() => import("./components/Financeiro"));
const Faturamento = lazy(() => import("./components/Billing/Faturamento"));
const RegistrarPagamento = lazy(() =>
  import("./components/Billing/RegistrarPagamento"),
);
const ExtratoAluno = lazy(() => import("./components/Billing/ExtratoAluno"));
const Relatorio_PA = lazy(() => import("./components/Billing/Relatorio_PA"));
const Relatorio_WET = lazy(() => import("./components/Billing/Relatorio_WET"));
const Relatorio_Cancelados = lazy(() =>
  import("./components/Billing/Relatorio_Cancelados"),
);
const RenovacoesPendentes = lazy(() =>
  import("./components/Billing/RenovacoesPendentes"),
);
const RegistrarPresenca = lazy(() =>
  import("./components/Attendance/RegistrarPresenca"),
);
const RelatorioPresenca = lazy(() =>
  import("./components/Attendance/RelatorioPresenca"),
);
const ControleHorarios = lazy(() =>
  import("./components/Classes/ControleHorarios"),
);
const AgendamentoAulas = lazy(() =>
  import("./components/Classes/AgendamentoAulas"),
);
const AdminDelete = lazy(() => import("./components/security/AdminDelete"));

const loadingFallback = (
  <div className="w-full p-6 text-center text-sm text-gray-300">
    Carregando...
  </div>
);

function decodeTokenExpiration(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64));
    return json.exp ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

function getTokenExpiredDetail(detail) {
  if (detail && typeof detail === "object") {
    return {
      message: detail.message || detail.Mensagem || "Sua sessao expirou.",
      token: detail.token || null,
    };
  }

  return {
    message: detail || "Sua sessao expirou.",
    token: null,
  };
}

function App() {
  const [activeComponent, setActiveComponent] = useState(null);
  const [activeComponent2, setActiveComponent2] = useState(null);
  const [showAdminDelete, setShowAdminDelete] = useState(false);
  const [userListKey, setUserListKey] = useState(0);
  const [studentSearchKey, setStudentSearchKey] = useState(0);
  const [packagesSearchKey, setPackagesSearchKey] = useState(0);
  const [registrarPagamentoKey, setRegistrarPagamentoKey] = useState(0);
  const [faturamentoKey, setFaturamentoKey] = useState(0);
  const [registrarPresencaKey, setRegistrarPresencaKey] = useState(0);
  const [usuario, setUsuario] = useState(() => getUsuario());
  const [ehAdmin, setEhAdmin] = useState(() => isAdmin());
  const [messageToast, showToast] = useToast();
  const [expiringList, setExpiringList] = useState([]);
  const [showExpiring, setShowExpiring] = useState(false);
  const [extratoAlunoInicial, setExtratoAlunoInicial] = useState(null);
  const [faturamentoInicial, setFaturamentoInicial] = useState(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [renewingSession, setRenewingSession] = useState(false);
  const [sessionRemaining, setSessionRemaining] = useState(null);
  const sessionWarningFiredRef = useRef(false);
  const sessionExpiredFiredRef = useRef(false);
  const logoutTimerRef = useRef(null);

  const handleRenewSession = async () => {
    setRenewingSession(true);
    try {
      const res = await api.post("/auth/refresh");
      const { token } = res.data;
      localStorage.setItem("token", token);
      sessionWarningFiredRef.current = false;
      sessionExpiredFiredRef.current = false;
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      setShowSessionWarning(false);
      setSessionRemaining(
        Math.max(0, Math.floor((decodeTokenExpiration(token) - Date.now()) / 1000)),
      );
      showToast({ type: "success", text: "Sessão renovada por mais 1 hora!" });
      window.dispatchEvent(new Event("session-renewed"));
    } catch {
      showToast({ type: "error", text: "Erro ao renovar sessão." });
    } finally {
      setRenewingSession(false);
    }
  };

  useEffect(() => {
    const atualizarContadorSessao = () => {
      const token = getToken();
      const expMs = decodeTokenExpiration(token);

      if (!expMs) {
        setSessionRemaining(null);
        setShowSessionWarning(false);
        return;
      }

      sessionWarningFiredRef.current = false;
      sessionExpiredFiredRef.current = false;

      const update = () => {
        if (getToken() !== token) return;

        const diff = Math.max(0, Math.floor((expMs - Date.now()) / 1000));
        setSessionRemaining(diff);

        if (diff <= 0 && !sessionExpiredFiredRef.current) {
          sessionExpiredFiredRef.current = true;
          window.dispatchEvent(
            new CustomEvent("token-expired", {
              detail: { message: "Sua sessao expirou.", token },
            }),
          );
        } else if (diff <= 180 && !sessionWarningFiredRef.current) {
          sessionWarningFiredRef.current = true;
          setShowSessionWarning(true);
        }
      };

      update();
      return setInterval(update, 1000);
    };

    let intervalId = atualizarContadorSessao();

    const reiniciarContadorSessao = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = atualizarContadorSessao();
    };

    const limparContadorSessao = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = null;
      sessionWarningFiredRef.current = false;
      sessionExpiredFiredRef.current = false;
      setShowSessionWarning(false);
      setSessionRemaining(null);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };

    window.addEventListener("login", reiniciarContadorSessao);
    window.addEventListener("session-renewed", reiniciarContadorSessao);
    window.addEventListener("logout", limparContadorSessao);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener("login", reiniciarContadorSessao);
      window.removeEventListener("session-renewed", reiniciarContadorSessao);
      window.removeEventListener("logout", limparContadorSessao);
    };
  }, []);

  const sessionRemainingLabel =
    sessionRemaining === null
      ? null
      : `${String(Math.floor(sessionRemaining / 60)).padStart(2, "0")}:${String(
          sessionRemaining % 60,
        ).padStart(2, "0")}`;

  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      logout();
      window.location.reload();
    }
  };
  // Logout automatico (token expirado)
  useEffect(() => {
    // Atualiza usuario e ehAdmin ao montar e apos login/logout
    const updateUserState = () => {
      setUsuario(getUsuario());
      setEhAdmin(isAdmin());
    };
    window.addEventListener("login", updateUserState);
    // Ao logar, buscar alunos com planos vencendo no mes e pagamentos pendentes
    const handleLoginFetchExpiring = async () => {
      try {
        const resExp = await api.get("/faturamento/expirando");
        const combined = resExp.data?.alunos || [];
        if (combined.length > 0) {
          setExpiringList(combined);
          setShowExpiring(true);
        }
      } catch (err) {
        // nao bloquear o login por erro na busca
        console.error("Erro ao buscar expirando:", err);
      }
    };
    window.addEventListener("login", handleLoginFetchExpiring);
    // Se ja estiver logado ao montar, busca tambem
    if (getToken()) {
      handleLoginFetchExpiring();
    }
    window.addEventListener("logout", updateUserState);
    updateUserState();

    const handleTokenExpired = (e) => {
      const { message, token } = getTokenExpiredDetail(e.detail);
      if (token && token !== getToken()) return;

      showToast({ type: "error", text: message });
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
      logoutTimerRef.current = setTimeout(() => {
        if (!token || token === getToken()) {
          window.dispatchEvent(new Event("logout"));
        }
        logoutTimerRef.current = null;
      }, 4000); // tempo da mensagem toast antes de redirecionar
    };
    window.addEventListener("token-expired", handleTokenExpired);

    const handleLogoutEvent = () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      logout(); // remove o token
      window.location.href = "/security/login"; // redireciona para login
    };
    window.addEventListener("logout", handleLogoutEvent);

    return () => {
      window.removeEventListener("login", updateUserState);
      window.removeEventListener("logout", updateUserState);
      window.removeEventListener("token-expired", handleTokenExpired);
      window.removeEventListener("logout", handleLogoutEvent);
      window.removeEventListener("login", handleLoginFetchExpiring);
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    };
  }, [showToast]);

  const handleNavigate = (component, subComponent, options = {}) => {
    setActiveComponent(component);
    setActiveComponent2(subComponent);

    if (!options.preservarFaturamentoInicial) {
      setFaturamentoInicial(null);
    }
    // Incrementa a key quando UserList e selecionado para forcar remontagem
    if (subComponent === "UserList") {
      setUserListKey((prev) => prev + 1);
    }
    // Incrementa a key quando StudentSearch e selecionado para forcar remontagem
    if (subComponent === "StudentSearch") {
      setStudentSearchKey((prev) => prev + 1);
    }
    // Incrementa a key quando PackagesSearck e selecionado para forcar remontagem
    if (subComponent === "PackagesSearch") {
      setPackagesSearchKey((prev) => prev + 1);
    }
    if (component === "Financeiro" && subComponent === "Faturamento") {
      setFaturamentoKey((prev) => prev + 1);
    }
    // Incrementa a key quando RegistrarPagamento e selecionado para forcar remontagem
    if (component === "Financeiro" && subComponent === "RegistrarPagamento") {
      setRegistrarPagamentoKey((prev) => prev + 1);
    }
    if (component === "Presenca" && subComponent === "RegistrarPresenca") {
      setRegistrarPresencaKey((prev) => prev + 1);
    }
  };

  return (
    <>
      <MessageToast messageToast={messageToast} />
      <ExpiringModal
        open={showExpiring}
        onClose={() => setShowExpiring(false)}
        items={expiringList}
      />
      <SessionWarningModal
        open={showSessionWarning}
        onClose={() => setShowSessionWarning(false)}
        onRenew={handleRenewSession}
        loading={renewingSession}
      />
      <Suspense fallback={loadingFallback}>
        <Routes>
          <Route path="/security/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
              <div className="w-full h-auto min-h-screen mx-auto flex flex-col justify-start p-3 sm:p-6 bg-gray-900 text-white border-8 border-red-900 rounded-4xl">
                <div className="relative">
                  {/* Botao de Logout e informacoes do usuario - Desktop */}
                  <div className="hidden md:flex absolute top-0 right-0 items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-300">Bem-vindo(a),</p>
                      <div className="flex items-center justify-end gap-2">
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
                      </div>
                      <p className="text-xs text-gray-400">
                        {usuario?.grupo === "Administrador"
                          ? "Administrador"
                          : "Aluno"}
                      </p>
                      {sessionRemainingLabel && (
                        <span className="text-xs text-gray-400 ml-2">
                          expira em - {sessionRemainingLabel}
                        </span>
                      )}
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
                        <div className="flex items-center gap-2">
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
                        </div>
                        <p className="text-xs text-gray-400">
                          {usuario?.grupo === "Administrador"
                            ? "Administrador"
                            : "Aluno"}
                        </p>
                        {sessionRemainingLabel && (
                          <span className="text-xs text-gray-400 ml-2">
                            expira em - {sessionRemainingLabel}
                          </span>
                        )}
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
                        <UserForm key="user-form" />
                      )}
                      {activeComponent2 === "UserList" && (
                        <UserList key={`user-list-${userListKey}`} />
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
                          <Faturamento
                            key={`faturamento-${faturamentoKey}-${JSON.stringify(faturamentoInicial)}`}
                            initialData={faturamentoInicial}
                          />
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
                        activeComponent2 === "RelatorioMensalPA" && (
                          <Relatorio_PA key="relatorio-mensal-pa" />
                        )}
                      {activeComponent === "Financeiro" &&
                        activeComponent2 === "RelatorioMensalWET" && (
                          <Relatorio_WET key="relatorio-mensal-wet" />
                        )}
                      {activeComponent === "Financeiro" &&
                        (!activeComponent2 ||
                          activeComponent2 === "Financeiro") && (
                          <Financeiro key="financeiro" />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "RelatorioPresenca" && (
                          <RelatorioPresenca key="relatorio-presenca" />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "RelatorioMensalPA" && (
                          <Relatorio_PA key="relatorio-mensal-pa" />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "RelatorioMensalWET" && (
                          <Relatorio_WET key="relatorio-mensal-wet" />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "RelatorioCancelados" && (
                          <Relatorio_Cancelados key="relatorio-cancelados" />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "RenovacoesPendentes" && (
                          <RenovacoesPendentes
                            key="renovacoes-pendentes"
                            onAbrirExtrato={(codigo) => {
                              setExtratoAlunoInicial(codigo);
                              handleNavigate("Relatorios", "ExtratoAluno");
                            }}
                            onRenovar={(dados) => {
                              setFaturamentoInicial(dados);
                              handleNavigate("Financeiro", "Faturamento", {
                                preservarFaturamentoInicial: true,
                              });
                            }}
                          />
                        )}
                      {activeComponent === "Relatorios" &&
                        activeComponent2 === "ExtratoAluno" && (
                          <ExtratoAluno
                            key={`extrato-aluno-${extratoAlunoInicial}`}
                            initialAlunoCodigo={extratoAlunoInicial}
                          />
                        )}
                      {activeComponent === "Presenca" &&
                        activeComponent2 === "RegistrarPresenca" && (
                          <RegistrarPresenca
                            key={`registrar-presenca-${registrarPresencaKey}`}
                          />
                        )}
                      {activeComponent === "Aulas" &&
                        activeComponent2 === "ControleHorarios" && (
                          <ControleHorarios key="controle-horarios" />
                        )}
                      {activeComponent === "Aulas" &&
                        activeComponent2 === "AgendamentoAulas" && (
                          <AgendamentoAulas key="agendamento-aulas" />
                        )}
                    </div>
                  </div>
                )}
              </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
