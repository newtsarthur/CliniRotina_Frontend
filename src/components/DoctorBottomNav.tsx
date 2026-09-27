import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Users, Calendar, UserCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DoctorBottomNav() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem("sb_cached_is_admin") === "true";
  });

  useEffect(() => {
    let active = true;

    supabase.rpc("is_clinic_admin").then(({ data, error }) => {
      if (active) {
        const adminStatus = !error && data === true;
        setIsAdmin(adminStatus);
        localStorage.setItem("sb_cached_is_admin", String(adminStatus));
      }
    });

    return () => {
      active = false;
    };
  }, []);
  
  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white/70 shadow-[0_-8px_32px_-4px_rgba(139,61,90,0.12)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "calc(72px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto px-2">
        
        {/* Pacientes */}
        <Link to="/pacientes" className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-95">
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              isActive("/pacientes") ? "translate-y-[-2px] scale-105" : "opacity-55 hover:opacity-80"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive("/pacientes")
                  ? "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] text-[#8B3D5A] shadow-sm border border-[#E5859A]/20"
                  : "text-[#7A6E72]"
              }`}
            >
              <Users size={21} strokeWidth={isActive("/pacientes") ? 2.5 : 2} />
            </div>
            <span
              className={`text-[10.5px] mt-1 transition-colors text-center leading-tight tracking-tight ${
                isActive("/pacientes") ? "text-[#1C1917] font-bold" : "text-[#7A6E72] font-medium"
              }`}
            >
              Pacientes
            </span>
          </div>
        </Link>

        {/* Agenda */}
        <Link to="/agenda" className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-95">
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              isActive("/agenda") ? "translate-y-[-2px] scale-105" : "opacity-55 hover:opacity-80"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive("/agenda")
                  ? "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] text-[#8B3D5A] shadow-sm border border-[#E5859A]/20"
                  : "text-[#7A6E72]"
              }`}
            >
              <Calendar size={21} strokeWidth={isActive("/agenda") ? 2.5 : 2} />
            </div>
            <span
              className={`text-[10.5px] mt-1 transition-colors text-center leading-tight tracking-tight ${
                isActive("/agenda") ? "text-[#1C1917] font-bold" : "text-[#7A6E72] font-medium"
              }`}
            >
              Agenda
            </span>
          </div>
        </Link>

        {isAdmin && (
          <Link to="/admin/convites" className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-95">
            <div
              className={`flex flex-col items-center transition-all duration-300 ${
                isActive("/admin") ? "translate-y-[-2px] scale-105" : "opacity-55 hover:opacity-80"
              }`}
            >
              <div
                className={`p-2 rounded-2xl transition-all duration-300 ${
                  isActive("/admin")
                    ? "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] text-[#8B3D5A] shadow-sm border border-[#E5859A]/20"
                    : "text-[#7A6E72]"
                }`}
              >
                <ShieldCheck size={21} strokeWidth={isActive("/admin") ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10.5px] mt-1 transition-colors text-center leading-tight tracking-tight ${
                  isActive("/admin") ? "text-[#1C1917] font-bold" : "text-[#7A6E72] font-medium"
                }`}
              >
                Admin
              </span>
            </div>
          </Link>
        )}

        {/* Perfil */}
        <Link to="/profile" className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-95">
          <div
            className={`flex flex-col items-center transition-all duration-300 ${
              isActive("/profile") ? "translate-y-[-2px] scale-105" : "opacity-55 hover:opacity-80"
            }`}
          >
            <div
              className={`p-2 rounded-2xl transition-all duration-300 ${
                isActive("/profile")
                  ? "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] text-[#8B3D5A] shadow-sm border border-[#E5859A]/20"
                  : "text-[#7A6E72]"
              }`}
            >
              <UserCircle size={21} strokeWidth={isActive("/profile") ? 2.5 : 2} />
            </div>
            <span
              className={`text-[10.5px] mt-1 transition-colors text-center leading-tight tracking-tight ${
                isActive("/profile") ? "text-[#1C1917] font-bold" : "text-[#7A6E72] font-medium"
              }`}
            >
              Perfil
            </span>
          </div>
        </Link>
        
      </div>
    </nav>
  );
}
