import { useNavigate } from "react-router-dom";
import { ChevronLeft, ShieldAlert } from "lucide-react";

export default function AlterarSenha() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen pb-28 font-sans text-[#1C1917] antialiased relative overflow-x-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FBF1F2 0%, #FAF6F3 45%, #F7F2EE 100%)",
      }}
    >
      {/* Decorative glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#E5859A]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#E8C5B8]/20 blur-3xl" />

      <header className="h-[80px] flex items-center px-6 bg-transparent relative gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 -ml-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
          aria-label="Voltar"
        >
          <ChevronLeft size={22} className="text-[#1C1917]" />
        </button>
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Alterar Senha</h1>
      </header>

      <div className="px-6 py-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-white/60 backdrop-blur-md rounded-[24px] border border-white/80 flex items-center justify-center shadow-sm">
          <ShieldAlert size={40} className="text-[#E5859A]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#1C1917]">Ops!</h2>
          <p className="text-[#7a5d56] leading-relaxed">
            Para sua segurança, a alteração de senha deve ser feita diretamente nas configurações do seu perfil.
          </p>
        </div>

        <button 
          onClick={() => navigate("/meus-dados")}
          className="bg-[#E5859A] text-white font-bold py-4 px-8 rounded-2xl shadow-md hover:bg-[#D47489] active:scale-95 transition-all duration-300"
        >
          Ir para Meus Dados
        </button>
      </div>
    </div>
  );
}
