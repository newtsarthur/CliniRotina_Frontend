import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, ChevronDown, ChevronUp,
  ClipboardList, Syringe, ScanSearch, Egg,
  FlaskConical, Baby, HeartPulse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FIV_PHASES = [
  {
    key: "Avaliação Inicial",
    label: "Avaliação Inicial",
    description: "Consulta inicial e exames de rotina",
    icon: ClipboardList,
  },
  {
    key: "Estimulação Ovariana",
    label: "Estimulação Ovariana",
    description: "Início dos medicamentos para estimulação",
    icon: Syringe,
  },
  {
    key: "Monitoramento",
    label: "Monitoramento",
    description: "Ultrassons de acompanhamento",
    icon: ScanSearch,
  },
  {
    key: "Punção Folicular",
    label: "Punção Folicular",
    description: "Coleta de óvulos",
    icon: Egg,
  },
  {
    key: "Fertilização",
    label: "Fertilização",
    description: "Processo de fertilização em laboratório",
    icon: FlaskConical,
  },
  {
    key: "Transferência",
    label: "Transferência",
    description: "Transferência de embrião",
    icon: Baby,
  },
  {
    key: "Teste de Gravidez",
    label: "Teste de Gravidez",
    description: "Confirmação de gravidez",
    icon: HeartPulse,
  },
];

type StepStatus = "concluido" | "em_andamento" | "pendente";

function getPhaseStatuses(currentPhaseName: string | null): StepStatus[] {
  if (!currentPhaseName) return FIV_PHASES.map(() => "pendente");

  const currentIndex = FIV_PHASES.findIndex(
    (p) => p.key.toLowerCase() === currentPhaseName.toLowerCase()
  );

  if (currentIndex === -1) return FIV_PHASES.map(() => "pendente");

  return FIV_PHASES.map((_, i) => {
    if (i < currentIndex) return "concluido";
    if (i === currentIndex) return "em_andamento";
    return "pendente";
  });
}

export function JourneyTimeline() {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProtocol, setHasProtocol] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchPhase = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_protocol_id")
        .eq("id", user.id)
        .maybeSingle();

      const protocolId = profile?.current_protocol_id;

      let phaseName: string | null = null;
      let doctorId: string | null = null;

      if (protocolId) {
        const { data: proto } = await supabase
          .from("protocols")
          .select("phase_name, doctor_id")
          .eq("id", protocolId)
          .maybeSingle();
        phaseName = proto?.phase_name || null;
        doctorId = proto?.doctor_id || null;
      } else {
        const { data: activeProto } = await supabase
          .from("protocols")
          .select("phase_name, doctor_id")
          .eq("patient_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        phaseName = activeProto?.phase_name || null;
        doctorId = activeProto?.doctor_id || null;
      }

      if (doctorId) {
        const { data: doctorProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", doctorId)
          .maybeSingle();
        if (doctorProfile?.full_name) {
          setDoctorName(doctorProfile.full_name);
        }
      }

      if (phaseName) {
        setHasProtocol(true);
        setCurrentPhase(phaseName);
      }

      setLoading(false);
    };

    fetchPhase();
  }, [user]);

  if (loading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-32 w-full rounded-3xl" />
      </section>
    );
  }

  const statuses = getPhaseStatuses(currentPhase);
  const completedCount = statuses.filter((s) => s === "concluido").length;
  const total = FIV_PHASES.length;
  const currentIndex = statuses.findIndex((s) => s === "em_andamento");
  const activePhase = currentIndex >= 0 ? FIV_PHASES[currentIndex] : FIV_PHASES[0];
  const progressPercent = Math.round((completedCount / total) * 100);

  if (!hasProtocol) {
    return (
      <section>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
            Etapas do Tratamento
          </h3>
          <span className="text-[11px] text-[#9e837a] font-medium">0 de {total} concluídas</span>
        </div>
        <div
          className="rounded-[28px] border border-white/70 p-5 backdrop-blur-md shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] bg-white/75 animate-fade-in animation-delay-200"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] text-[#7a5d56] font-semibold">Fase Atual</p>
            <span className="text-lg font-bold text-[#9e837a] leading-7">0%</span>
          </div>
          {/* Horizontal Mini Stepper (Grey) */}
          <div className="relative flex items-center justify-between py-2 px-1 mb-2">
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
            {FIV_PHASES.map((_, i) => (
              <div 
                key={i} 
                className="w-3.5 h-3.5 rounded-full bg-white border border-gray-300 z-10"
              />
            ))}
          </div>
          <p className="text-[13px] text-[#6A5A56] leading-relaxed max-w-[280px] font-medium mt-3">
            Sua jornada está sendo preparada pela equipe médica. Em breve as etapas aparecerão aqui. ✨
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header Padronizado */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
          Etapas do Tratamento
        </h3>
        <span className="text-[11px] text-[#9e837a] font-medium">
          {completedCount} de {total} concluídas
        </span>
      </div>

      {/* Card Glassmorphic da Jornada - Mesma Padronização de Cores e Estilo */}
      <div className="bg-white/75 backdrop-blur-md rounded-[28px] p-5 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] border border-white/70 space-y-4 animate-fade-in animation-delay-200">
        {/* Progress summary com cores idênticas ao "Seu Tratamento" */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#FBEDF1] text-[#E5859A] flex items-center justify-center font-bold text-[11px]">
              {currentIndex >= 0 ? currentIndex + 1 : 1}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#9e837a] font-bold">Fase Atual</p>
              <p className="text-[13.5px] font-semibold text-[#1C1917] leading-tight">{activePhase.label}</p>
            </div>
          </div>
          <span className="text-lg font-bold text-[#E5859A] leading-7">
            {progressPercent}%
          </span>
        </div>

        {/* Horizontal Mini Stepper */}
        <div className="relative flex items-center justify-between py-2.5 px-1 bg-white/40 rounded-2xl border border-white/60">
          {/* Connecting line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200" />
          {/* Active progress line connecting completed ones */}
          <div 
            className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-[#8B3D5A] transition-all duration-500" 
            style={{ 
              width: `${(Math.max(0, completedCount - 1) / (total - 1)) * 100}%` 
            }}
          />
          {/* Dots */}
          {FIV_PHASES.map((_, i) => {
            const status = statuses[i];
            const isCurrent = i === currentIndex;
            const isCompleted = status === "concluido";
            
            let dotClass = "bg-white border-2 border-gray-300";
            if (isCompleted) {
              dotClass = "bg-[#8B3D5A] border-2 border-[#8B3D5A]";
            } else if (isCurrent) {
              dotClass = "bg-white border-4 border-[#E5859A] ring-2 ring-[#E5859A]/20 scale-110 shadow-sm animate-pulse";
            }
            
            return (
              <div 
                key={i} 
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${dotClass}`}
                title={_.label}
              >
                {isCompleted && <span className="text-[7px] text-white">✓</span>}
              </div>
            );
          })}
        </div>

        {doctorName && (
          <p className="text-[11.5px] text-[#7a5d56] font-medium pt-0.5">
            Médico(a) responsável: <span className="font-semibold text-[#1C1917]">Dr(a). {doctorName}</span>
          </p>
        )}

        {/* Botão Expansível */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full pt-2.5 border-t border-[#E5859A]/15 flex items-center justify-between text-[12.5px] font-bold text-[#8B3D5A] hover:text-[#E5859A] transition-colors active:scale-[0.99]"
        >
          <span>{expanded ? "Recolher etapas do tratamento" : "Ver todas as 7 etapas do tratamento"}</span>
          <div className="w-6 h-6 rounded-full bg-[#FBEDF1] flex items-center justify-center text-[#8B3D5A]">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Lista Expansível das 7 Etapas */}
        {expanded && (
          <div className="mt-4 pt-3 border-t border-[#E5859A]/15 space-y-4 animate-in fade-in duration-300">
            {FIV_PHASES.map((phase, i) => {
              const isLast = i === total - 1;
              const status = statuses[i];
              const Icon = phase.icon;

              let circleClasses: string;
              let circleContent: React.ReactNode;
              let textColor: string;
              let descColor: string;

              if (status === "concluido") {
                circleClasses = "bg-green-50 border border-green-500/30 text-green-700 shadow-sm";
                circleContent = <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />;
                textColor = "text-[#1C1917] font-semibold";
                descColor = "text-[#7a5d56]";
              } else if (status === "em_andamento") {
                circleClasses = "bg-[#8B3D5A] text-white ring-4 ring-[#8B3D5A]/15 shadow-md font-bold";
                circleContent = <span className="text-[12px] font-extrabold leading-none">{i + 1}</span>;
                textColor = "text-[#8B3D5A] font-bold";
                descColor = "text-[#7a5d56]";
              } else {
                circleClasses = "bg-white border border-gray-300 text-gray-400";
                circleContent = <span className="text-[11px] font-medium leading-none">{i + 1}</span>;
                textColor = "text-[#9e837a] font-medium";
                descColor = "text-[#9e837a]/60";
              }

              return (
                <div key={phase.key} className="flex gap-3.5 relative">
                  <div className="flex flex-col items-center w-7 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${circleClasses}`}>
                      {circleContent}
                    </div>
                    {!isLast && <div className="w-px flex-1 min-h-[32px] bg-gray-200/80 my-1" />}
                  </div>

                  <div className={`pt-0.5 pb-3 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className={`w-4 h-4 ${status === "pendente" ? "text-[#9e837a]/50" : "text-[#8B3D5A]"}`} />
                      <p className={`text-[13.5px] leading-snug ${textColor}`}>{phase.label}</p>
                      {status === "concluido" && (
                        <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[9px] font-bold border-0 px-2 py-0.5 hover:bg-[#DCFCE7]">Concluído</Badge>
                      )}
                      {status === "em_andamento" && (
                        <Badge className="bg-[#FDF2F4] text-[#E5859A] text-[9px] font-bold border-0 px-2 py-0.5 animate-pulse hover:bg-[#FDF2F4]">Em andamento</Badge>
                      )}
                    </div>
                    <p className={`text-[11.5px] mt-0.5 font-normal ${descColor}`}>{phase.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
