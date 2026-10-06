import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-muted p-4 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground">Página não encontrada</p>
      <Button asChild>
        <Link to="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
