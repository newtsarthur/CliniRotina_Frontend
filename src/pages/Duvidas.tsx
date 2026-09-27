import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  HelpCircle, 
  Search, 
  MessageSquare, 
  Sparkles, 
  Activity, 
  Pill, 
  Heart, 
  AlertCircle 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BottomNav } from "@/components/BottomNav";

const categories = [
  { id: "all", label: "Todas", icon: Sparkles },
  { id: "hormonios", label: "Hormônios", icon: Activity },
  { id: "medicacao", label: "Medicação", icon: Pill },
  { id: "procedimento", label: "Procedimento", icon: Heart },
  { id: "sintomas", label: "Sintomas", icon: AlertCircle },
];

const faqs = [
  {
    question: "Uso de medicamentos pode causar ganho de peso?",
    answer:
      "É comum notar um leve inchaço (1 a 2 kg) devido à retenção de líquidos causada pelos hormônios, mas não é gordura. Após a medicação, o corpo costuma voltar ao normal rapidamente.",
    category: "hormonios",
  },
  {
    question: "Dói para aplicar as injeções?",
    answer:
      "A maioria relata que o medo é pior que a dor. As agulhas usadas são extremamente finas (tipo insulina). É mais um leve incômodo ou ardência.",
    category: "medicacao",
  },
  {
    question: "Preciso fazer repouso absoluto após a transferência?",
    answer:
      "Não! A vida normal é recomendada para a circulação. Evite apenas exercícios de alto impacto e relações sexuais nos primeiros dias.",
    category: "procedimento",
  },
  {
    question: "Tive um leve sangramento. É sinal de falha?",
    answer:
      "Nem sempre. Pode ser o sangramento de nidação (implantação do embrião) ou efeito da progesterona. Comunique sempre seu médico e não entre em pânico.",
    category: "sintomas",
  },
  {
    question: "Posso tomar café ou pintar o cabelo?",
    answer:
      "Reduza o café para 1 a 2 xícaras pequenas por dia. Evite tinturas com amônia ou metais pesados. Converse com seu médico para opções seguras.",
    category: "procedimento",
  },
];

export default function Duvidas() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "all" || faq.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
      
      {/* Header */}
      <header className="px-6 pt-12 pb-2">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/profile")}
            className="p-2.5 -ml-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
            aria-label="Voltar"
          >
            <ChevronLeft size={22} className="text-[#1C1917]" />
          </button>
          <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">
            Central de Dúvidas
          </h1>
        </div>
        
        {/* Support Header Card */}
        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/70 shadow-[0_8px_30px_-15px_rgba(139,61,90,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center shrink-0 border border-[#E5859A]/15 shadow-inner">
            <HelpCircle size={20} className="text-[#8B3D5A]" />
          </div>
          <p className="text-[13px] text-[#7a5d56] leading-relaxed font-semibold">
            Esclareça suas dúvidas rápidas sobre medicamentos, rotinas de cuidado e tratamento em tempo real.
          </p>
        </div>
      </header>

      {/* FAQ Content */}
      <main className="px-6 pt-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palavras-chave ou sintomas..."
            className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 text-[14px] focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all text-[#1C1917] placeholder:text-[#9e837a]/50 font-medium shadow-sm"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e837a]" />
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? "bg-[#E5859A] text-white shadow-sm"
                    : "bg-white/50 text-[#9e837a] border border-white/60 hover:bg-white/80"
                }`}
              >
                <Icon size={13} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion list */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 px-6 rounded-3xl border border-white/70 bg-white/40 backdrop-blur-md">
            <HelpCircle className="w-12 h-12 text-[#9e837a]/30 mx-auto mb-3" />
            <p className="text-sm text-[#9e837a] font-bold">Nenhuma pergunta encontrada.</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="mt-2 text-xs text-[#8B3D5A] hover:text-[#E5859A] font-bold"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-3">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-white/65 backdrop-blur-md rounded-2xl border border-white/70 px-5 shadow-[0_8px_30px_-15px_rgba(139,61,90,0.06)] hover:-translate-y-[1px] transition-all duration-300 overflow-hidden border-none data-[state=open]:bg-white data-[state=open]:border-[#E5859A]/20 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left text-[#1C1917] text-[14.5px] font-bold hover:no-underline hover:text-[#8B3D5A] transition-all py-4 [&[data-state=open]]:text-[#8B3D5A] [&[data-state=open]>svg]:text-[#8B3D5A] [&>svg]:text-[#9e837a]">
                  <span className="flex items-center gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5859A]/60" />
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-[#6A5A56] text-[13.5px] leading-relaxed pb-5 pt-1 font-medium border-t border-[#E5859A]/5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Global Support Card at bottom */}
        <div 
          className="rounded-3xl p-6 border border-[#E5859A]/15 shadow-sm text-center relative overflow-hidden mt-6 animate-fade-in"
          style={{
            background: "linear-gradient(135deg, rgba(255,245,248,0.95) 0%, rgba(253,235,240,0.7) 100%)",
          }}
        >
          {/* Decorative designs */}
          <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full bg-[#E5859A]/5 blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-[#E8C5B8]/10 blur-xl pointer-events-none" />

          <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-sm border border-[#E5859A]/10">
            <MessageSquare size={22} className="text-[#8B3D5A]" />
          </div>
          
          <h3 className="text-base font-bold text-[#1C1917] mb-1">Ainda ficou com alguma dúvida?</h3>
          <p className="text-[13px] text-[#7a5d56] max-w-[280px] mx-auto font-medium leading-relaxed mb-5">
            Se precisar de apoio médico imediato ou esclarecimentos específicos, nossa equipe está sempre a postos.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.open("https://wa.me/558183105992?text=Ol%C3%A1!%20Tenho%20uma%20d%C3%BAvida%20sobre%20o%20meu%20tratamento.", "_blank")} 
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#E5859A] hover:bg-[#d4748a] py-3.5 px-4 rounded-xl transition-all shadow-sm shadow-[#E5859A]/10 active:scale-[0.98]"
            >
              Falar no WhatsApp
            </button>
            <button 
              onClick={() => navigate("/agenda")} 
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#8B3D5A] bg-white border border-[#E5859A]/20 hover:bg-[#FFF5F8] py-3.5 px-4 rounded-xl transition-all active:scale-[0.98]"
            >
              Agendar Consulta
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
