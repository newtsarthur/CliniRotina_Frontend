import { Navigate } from "react-router-dom";

import { getUsuario, type Perfil } from "@/services/api";
import AcessoNegado from "@/pages/AcessoNegado";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Perfil[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("access_token");
  const usuario = getUsuario();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(usuario.tipo_perfil)) {
    return <AcessoNegado />;
  }

  return <>{children}</>;
}
