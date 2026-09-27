import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const user = localStorage.getItem("user");

  useEffect(() => {
    if (!token || !user) {
      toast.error("Faça login para continuar.");
      navigate("/", { replace: true });
    }
  }, [token, user, navigate]);

  if (!token || !user) {
    return null;
  }

  return <>{children}</>;
}
