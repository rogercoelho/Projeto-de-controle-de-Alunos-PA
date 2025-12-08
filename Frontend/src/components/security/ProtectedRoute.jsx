import { isAuthenticated } from "../../services/auth";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";

function ProtectedRoute({ children }) {
  // Verifica se o usuário está autenticado
  if (!isAuthenticated()) {
    return <Navigate to="/security/login" replace />;
  }

  // Se autenticado, mostra o conteúdo protegido
  return children;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
