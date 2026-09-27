import { useNavigate } from "react-router-dom";
import { FileText, MessageCircle } from "lucide-react";

export function QuickAccess() {
  const navigate = useNavigate();

  const items = [
    {
      label: "Meus\nExames",
      icon: FileText,
      iconColor: "#3B82F6",
      iconBg: "#EFF6FF",
      onClick: () => navigate("/exames"),
    },
    {
      label: "Dúvidas? Clique aqui\npara falar com a clínica",
      icon: MessageCircle,
      iconColor: "#22C55E",
      iconBg: "#F0FDF4",
      onClick: () => window.open("https://wa.me/558183105992", "_blank"),
    },
  ];

  return (
    <section>
      <h3 className="text-lg font-bold text-[#171213] leading-7 tracking-[-0.45px] mb-2.5">
        Acesso Rápido
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_2px_10px_0_rgba(0,0,0,0.03)] p-4 flex flex-col items-center justify-center gap-3 hover:shadow-md transition-shadow aspect-square"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: item.iconBg }}
            >
              <item.icon size={24} color={item.iconColor} strokeWidth={1.5} />
            </div>
            <span className="text-xs font-bold text-[#171213] text-center leading-[15px] whitespace-pre-line">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
