import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, User, FileText, MessageCircle } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatName } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardHeader() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-[#F5F2F2] backdrop-blur-md border-b border-[#F3F4F6]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 h-full">
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex items-center gap-1 focus:outline-none group">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm group-hover:ring-2 group-hover:ring-[#E5859A]/30 transition-all">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt="Avatar" className="object-cover" />
                  )}
                  <AvatarFallback className="bg-[#FFF5F8] text-[#E5859A] font-bold text-sm">
                    {profile?.full_name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-1 w-3 h-3 bg-[#4ADE80] border-2 border-white rounded-full" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={8}
              className="w-56 bg-white text-[#171213] border border-[#F3F4F6] shadow-lg rounded-xl z-50"
            >
              <DropdownMenuItem
                onClick={() => navigate("/profile")}
                className="gap-2 cursor-pointer hover:bg-[#F5F2F2]"
              >
                <User className="w-4 h-4 text-[#E5859A]" />
                Editar Perfil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/exames")}
                className="gap-2 cursor-pointer hover:bg-[#F5F2F2]"
              >
                <FileText className="w-4 h-4 text-[#3B82F6]" />
                Meus Exames
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#F3F4F6]" />
              <DropdownMenuItem
                onClick={() => window.open("https://wa.me/558183105992", "_blank")}
                className="gap-2 cursor-pointer hover:bg-[#F5F2F2]"
              >
                <MessageCircle className="w-4 h-4 text-[#22C55E]" />
                Dúvidas? Clique aqui para falar com a clínica
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div>
            <p className="text-xs text-[#85666D] font-medium leading-4">{getGreeting()},</p>
            {loading ? (
              <Skeleton className="h-[25px] w-24" />
            ) : (
              <h2 className="text-xl font-bold text-[#171213] leading-[25px]">
                Olá, {formatName(profile?.full_name?.split(" ")[0]) || "Usuário"}
              </h2>
            )}
          </div>
        </div>

        <button className="relative w-10 h-10 rounded-full bg-[#F8F6F6] flex items-center justify-center hover:bg-[#F3F4F6] transition-colors">
          <Bell className="w-5 h-5 text-[#171213]" />
          <div className="absolute top-2 right-2 w-2 h-2 bg-[#E5859A] border-2 border-white rounded-full" />
        </button>
      </div>
    </header>
  );
}
