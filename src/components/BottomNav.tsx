import { Link, useLocation } from "react-router-dom";
import { Home, ClipboardList, FolderOpen, UserCircle } from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/profile") {
      return (
        currentPath === "/profile" ||
        currentPath.startsWith("/profile/") ||
        currentPath === "/meus-dados" ||
        currentPath === "/duvidas" ||
        currentPath === "/agenda" ||
        currentPath === "/termos" ||
        currentPath === "/terms"
      );
    }
    return path === "/dashboard"
      ? currentPath === path
      : currentPath === path || currentPath.startsWith(path + "/");
  };

  const tabs = [
    { path: "/dashboard", label: "Início", icon: Home },
    { path: "/plano", label: "Atividades", icon: ClipboardList },
    { path: "/exames", label: "Exames", icon: FolderOpen },
    { path: "/profile", label: "Perfil", icon: UserCircle },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-white/70 shadow-[0_-8px_32px_-4px_rgba(139,61,90,0.12)]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        height: "calc(72px + env(safe-area-inset-bottom))",
      }}
    >
      <div className="flex items-center justify-around h-full max-w-md mx-auto px-2">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 active:scale-95"
            >
              <div
                className={`flex flex-col items-center transition-all duration-300 ${
                  active ? "translate-y-[-2px] scale-105" : "opacity-55 hover:opacity-80"
                }`}
              >
                <div
                  className={`p-2 rounded-2xl transition-all duration-300 ${
                    active
                      ? "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] text-[#8B3D5A] shadow-sm border border-[#E5859A]/20"
                      : "text-[#7A6E72]"
                  }`}
                >
                  <Icon size={21} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10.5px] mt-1 transition-colors text-center leading-tight tracking-tight ${
                    active ? "text-[#1C1917] font-bold" : "text-[#7A6E72] font-medium"
                  }`}
                >
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
