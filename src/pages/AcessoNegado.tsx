import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getUsuario } from "@/services/api";

export default function AcessoNegado() {
  const usuario = getUsuario();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted p-4 text-center">
      <ShieldAlert className="h-16 w-16 text-destructive" />
      <h1 className="text-4xl font-bold">403</h1>
      <p className="text-xl font-semibold">Acesso negado</p>
      <p className="max-w-md text-muted-foreground">
        O perfil <strong>{usuario?.tipo_perfil}</strong> não tem permissão para acessar esta página.
      </p>
      <Button asChild>
        <Link to="/medicamentos">Voltar ao início</Link>
      </Button>
    </div>
  );
}
