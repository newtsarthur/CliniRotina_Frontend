import { NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CalendarClock, HeartHandshake, LogOut, Pill } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getUsuario, logout } from "@/services/api";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const usuario = getUsuario();

  const links = [
    { to: "/medicamentos", label: "Medicamentos", icon: Pill },
    { to: "/consultas", label: "Consultas e Exames", icon: CalendarClock },
    ...(usuario?.tipo_perfil === "CUIDADOR"
      ? [{ to: "/vinculos", label: "Meus Idosos", icon: HeartHandshake }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    toast.success("Você saiu da sua conta.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <Pill className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">CliniRotina</span>
          </div>
          <nav className="flex flex-wrap gap-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <div className="font-medium">{usuario?.nome}</div>
              <Badge variant="secondary">{usuario?.tipo_perfil}</Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
