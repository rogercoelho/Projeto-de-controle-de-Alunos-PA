import { isAuthenticated } from "../../services/auth";
import Login from "./Login";

function ProtectedRoute({ children }) {
  // Verifica se o usuário está autenticado
  if (!isAuthenticated()) {
    return <Login />;
  }

  // Se autenticado, mostra o conteúdo protegido
  return children;
}

export default ProtectedRoute;

import PropTypes from "prop-types";

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
