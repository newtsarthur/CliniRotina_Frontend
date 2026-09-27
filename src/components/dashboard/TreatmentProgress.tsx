import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Stethoscope, TestTube, Pill, CheckCircle2, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

interface ActivityItem {
  id: string;
  title: string;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
}

interface ProgressRow {
  protocol_item_id: string | null;
  status: string | null;
  completed_at: string | null;
}

interface MedicationLogRow {
  prescription_id: string | null;
  taken_at: string | null;
  taken_date: string | null;
}

interface MedicationActionRow {
  medication_id: string | null;
  created_at: string | null;
  action_date: string | null;
}

interface PrescriptionRow {
  id: string;
  medication_name: string;
}

function typeIcon(eventType: string) {
  switch (eventType) {
    case "Exame":
      return <TestTube className="w-4 h-4 text-[#E5859A]" />;
    case "Consulta":
    case "Retorno":
      return <Stethoscope className="w-4 h-4 text-[#E5859A]" />;
    default:
      return <Pill className="w-4 h-4 text-[#E5859A]" />;
  }
}

function typeLabel(eventType: string) {
  switch (eventType) {
    case "Exame": return "Exame";
    case "Consulta": return "Consulta";
    case "Retorno": return "Retorno";
    default: return "Medicamento";
  }
}

export function TreatmentProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<(ActivityItem & { stepStatus: string; completedAt: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasItems, setHasItems] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [itemsRes, progressRes, allLogsRes] = await Promise.all([
        supabase
          .from("protocol_items")
          .select("id, title, event_type, scheduled_date, scheduled_time")
          .eq("patient_id", user.id)
          .order("scheduled_date", { ascending: true }),
        supabase
          .from("patient_protocol_progress")
          .select("protocol_item_id, status, completed_at")
          .eq("patient_id", user.id),
        supabase
          .from("patient_logs")
          .select("prescription_id, taken_at, taken_date")
          .eq("patient_id", user.id)
          .eq("type", "medication"),
      ]);

      const fetchedItems = (itemsRes.data || []) as ActivityItem[];
      const progressRows = (progressRes.data || []) as ProgressRow[];

      const medTakenDates = new Map<string, Set<string>>();
      const addTakenDate = (id: string, dateStr: string) => {
        if (!medTakenDates.has(id)) medTakenDates.set(id, new Set());
        medTakenDates.get(id)!.add(dateStr);
      };

      ((allLogsRes.data || []) as MedicationLogRow[]).forEach((l) => {
        if (l.prescription_id && (l.taken_date || l.taken_at)) {
          const day = l.taken_date || l.taken_at!.substring(0, 10);
          addTakenDate(l.prescription_id, day);
        }
      });

      const progressMap = new Map<string, ProgressRow>();
      progressRows.forEach((r) => {
        if (r.protocol_item_id) progressMap.set(r.protocol_item_id, r);
      });

      const { data: prescriptions } = await supabase
        .from("prescriptions")
        .select("id, medication_name")
        .eq("patient_id", user.id)
        .eq("status", "active");

      const prescriptionMap = new Map<string, string>();
      ((prescriptions || []) as PrescriptionRow[]).forEach((p) => {
        prescriptionMap.set(p.medication_name.toLowerCase(), p.id);
      });

      const todayStr = new Date().toLocaleDateString("en-CA");

      const merged = fetchedItems.map((item) => {
        const progress = progressMap.get(item.id);
        let stepStatus = progress?.status || "pendente";
        let completedAt = progress?.completed_at || null;

        if (item.event_type === "Medicamento" && stepStatus !== "concluido") {
          const prescId = prescriptionMap.get(item.title?.toLowerCase());
          if (prescId) {
            const takenDates = medTakenDates.get(prescId);
            if (takenDates && takenDates.has(item.scheduled_date)) {
              stepStatus = "concluido";
              completedAt = completedAt || `${item.scheduled_date}T12:00:00`;
            }
          }
        }

        if (stepStatus !== "concluido" && item.scheduled_date < todayStr) {
          stepStatus = "nao_tomado";
        }

        return {
          ...item,
          stepStatus,
          completedAt,
        };
      });

      setItems(merged);
      setHasItems(merged.length > 0);
      setLoading(false);
    };

    fetchAll();

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === "updated" && event.query.queryKey[0] === "patient-actions") {
        fetchAll();
      }
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  if (loading) {
    return (
      <section>
        <Skeleton className="h-5 w-40 mb-2.5" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </section>
    );
  }

  if (!hasItems) {
    return (
      <section>
        <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight mb-3 px-1">
          Atividades e Medicações
        </h3>
        <div
          className="rounded-3xl px-6 py-10 border border-white/70 text-center"
          style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 30px -15px rgba(139, 61, 90, 0.12)" }}
        >
          <svg viewBox="0 0 64 64" className="w-14 h-14 mx-auto mb-5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="12" y="14" width="40" height="42" rx="6" fill="#FFF5F8" stroke="#E5859A" strokeWidth="1.4" />
            <path d="M12 24 L52 24" stroke="#E5859A" strokeWidth="1.4" />
            <path d="M22 10 L22 18" stroke="#8B3D5A" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M42 10 L42 18" stroke="#8B3D5A" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="22" cy="36" r="2" fill="#E5859A" />
            <path d="M28 36 L44 36" stroke="#E5859A" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <circle cx="22" cy="46" r="2" fill="#E5859A" opacity="0.5" />
            <path d="M28 46 L40 46" stroke="#E5859A" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
          </svg>
          <h4 className="text-[18px] font-semibold text-[#1C1917] mb-2 leading-snug tracking-tight">
            Nenhuma atividade agendada
          </h4>
          <p className="text-[13px] text-[#9e837a] leading-relaxed max-w-[260px] mx-auto font-light">
            Suas consultas, exames e medicamentos do protocolo aparecerão aqui em ordem.
          </p>
        </div>
      </section>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-CA");
  const totalItems = items.length;
  const itemsDueSoFar = items.filter(i => i.scheduled_date <= todayStr);
  const totalDueCount = itemsDueSoFar.length;
  const completedCount = items.filter((i) => i.stepStatus === "concluido").length;
  
  const progressPercent = totalDueCount > 0 
    ? Math.min(100, Math.round((completedCount / totalDueCount) * 100)) 
    : 0;

  return (
    <section>
      {/* Header Padronizado */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
          Atividades e Medicações
        </h3>
        <span className="text-[11px] text-[#9e837a] font-medium">
          {completedCount} de {totalItems} concluídas
        </span>
      </div>

      {/* Card Glassmorphic do Tratamento */}
      <div className="bg-white/75 backdrop-blur-md rounded-[28px] p-5 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] border border-white/70 space-y-4 animate-fade-in animation-delay-200">
        {/* Progress summary */}
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-[#7a5d56] font-semibold">Atividades do protocolo</p>
          <span className="text-lg font-bold text-[#E5859A] leading-7">{progressPercent}%</span>
        </div>

        <Progress
          value={progressPercent}
          className="h-2.5 bg-[#FFF5F8] [&>div]:bg-[#E5859A] [&>div]:transition-all [&>div]:duration-700"
        />

        {/* Botão Expansível / Ver todas as atividades */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full pt-2.5 border-t border-[#E5859A]/15 flex items-center justify-between text-[12.5px] font-bold text-[#8B3D5A] hover:text-[#E5859A] transition-colors active:scale-[0.99]"
        >
          <span>
            {expanded
              ? "Recolher atividades do protocolo"
              : `Ver todas as ${totalItems} atividades do protocolo`}
          </span>
          <div className="w-6 h-6 rounded-full bg-[#FBEDF1] flex items-center justify-center text-[#8B3D5A]">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {/* Activity list (Expansível) */}
        {expanded && (
          <div className="space-y-3 max-h-[320px] overflow-y-auto scrollbar-hide pt-2 border-t border-[#E5859A]/10 animate-in fade-in duration-300">
            {items.map((item) => {
              const done = item.stepStatus === "concluido";
              const missed = item.stepStatus === "nao_tomado";
              const inProgress = item.stepStatus === "em_andamento";
              const isFuture = item.scheduled_date > todayStr;
              const dateLabel = done && item.completedAt
                ? format(parseISO(item.completedAt), "dd MMM yyyy", { locale: ptBR })
                : format(parseISO(item.scheduled_date), "dd MMM yyyy", { locale: ptBR });

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-3.5 flex items-center gap-3 transition-all duration-300 ${
                    done ? "bg-[#F0FDF4]" : 
                    missed ? "bg-[#FAF7F2] opacity-80" :
                    isFuture ? "bg-[#F8F6F6] opacity-50" : 
                    inProgress ? "bg-[#FDF2F4]" : "bg-[#F8F6F6]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    done ? "bg-green-100" : 
                    missed ? "bg-amber-50" :
                    "bg-[#E5859A]/10"
                  }`}>
                    {done ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                     missed ? <AlertCircle className="w-4 h-4 text-amber-500" /> :
                     typeIcon(item.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${
                        done ? "text-green-700" : 
                        missed ? "text-[#7a5d56]" :
                        "text-[#171213]"
                      }`}>
                        {item.title}
                      </p>
                      {done && (
                        <Badge className="bg-[#DCFCE7] text-[#16A34A] text-[10px] font-bold border-0 px-2 py-0.5 hover:bg-[#DCFCE7]">
                          Concluído
                        </Badge>
                      )}
                      {inProgress && (
                        <Badge className="bg-[#FDF2F4] text-[#E5859A] text-[10px] font-bold border-0 px-2 py-0.5 animate-pulse hover:bg-[#FDF2F4]">
                          Em andamento
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[#85666D] font-medium">{typeLabel(item.event_type)}</span>
                      <span className="text-[#C4C4C4]">•</span>
                      <span className={`text-[11px] font-medium ${
                        done ? "text-green-600" : 
                        missed ? "text-[#9e837a]" :
                        isFuture ? "text-[#C4C4C4]" : 
                        "text-[#85666D]"
                      }`}>
                        {done ? "✅ Concluído — " : 
                         missed ? "⏳ Não registrado: " :
                         isFuture ? "🔒 Agendado: " : 
                         "⏳ Previsto: "}{dateLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All done message */}
        {completedCount === totalItems && totalItems > 0 && (
          <div className="rounded-2xl bg-[#F0FDF4] p-3.5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <p className="text-sm font-medium text-[#171213]">
              Todas as atividades concluídas! 🎉
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
