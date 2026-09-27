import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, ArrowLeft, ArrowRight, Calendar } from "lucide-react";

export default function AmostraPage() {
  const navigate = useNavigate();
  const whatsappNumber = "558183105992";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Vim pelo site e gostaria de agendar uma consulta.")}`;

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-start px-6 py-10 font-sans text-[#1A1416] overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FBF1F2 0%, #FAF6F3 45%, #F7F2EE 100%)",
      }}
    >
      {/* Decorative glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#E5859A]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#E8C5B8]/25 blur-3xl" />

      {/* Top Bar with Voltar */}
      <div 
        className="relative w-full max-w-[400px] flex items-center justify-between mb-4"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#7A6E72] hover:text-[#1A1416] transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar ao login
        </button>
      </div>

      {/* Logo */}
      <div className="relative w-full flex justify-center mb-6">
        <img
          src="/images/logo-clinirotrina.png"
          alt="CliniRotina"
          className="h-24 object-contain"
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[400px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_4px_30px_-8px_rgba(229,133,154,0.12),0_1px_2px_rgba(26,20,22,0.04)] border border-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-6 text-center">
          <span className="inline-flex items-center gap-1.5 bg-[#FBEDF1] text-[#E5859A] text-[10.5px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5" />
            Atendimento Inicial
          </span>
          <h1 className="text-[24px] font-semibold tracking-tight leading-tight mt-3 text-[#1A1416]">
            Conheça nossa plataforma
          </h1>
          <p className="text-[13.5px] text-[#7A6E72] mt-1.5 leading-relaxed">
            Escolha como deseja prosseguir com seu atendimento.
          </p>
        </div>

        {/* WhatsApp Agendamento Box */}
        <div className="bg-[#FAF7F5] border border-[#EDE5E1] rounded-2xl p-6 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center mb-4 shadow-sm">
            <MessageCircle size={30} />
          </div>
          <h3 className="text-[17px] font-semibold text-[#1A1416] mb-1.5">
            Desejo agendar minha consulta
          </h3>
          <p className="text-[13px] text-[#7A6E72] leading-relaxed mb-5">
            Fale diretamente conosco via WhatsApp para marcar seu horário de forma rápida e segura.
          </p>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-full bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_8px_20px_-8px_rgba(26,20,22,0.4)]"
          >
            Agendar agora
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>

      {/* Footer link */}
      <div className="relative mt-7 text-center animate-in fade-in duration-700">
        <p className="text-[13px] text-[#7A6E72]">
          Já possui um cadastro?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-[#1A1416] font-semibold hover:text-[#E5859A] transition-colors"
          >
            Faça login
          </button>
        </p>
      </div>
    </div>
  );
}
