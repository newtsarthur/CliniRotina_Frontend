import { useCallback, useEffect, useState } from "react";
import { format, subDays, isToday, isYesterday, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, CheckCircle2, Circle, Droplets, Smile, Pill, Clock, ChevronDown, HelpCircle, XCircle, Calendar as CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

const MOOD_MAP: Record<string, { emoji: string; label: string }> = {
  bem: { emoji: "😊", label: "Bem" },
  sensivel: { emoji: "🥺", label: "Sensível" },
  colicas: { emoji: "😖", label: "Cólicas" },
  estressada: { emoji: "😤", label: "Estressada" },
};

interface Prescription {
  id: string;
  medication_name: string;
}

interface DayAction {
  action_type: string;
  value: string | null;
  medication_id: string | null;
  created_at: string | null;
  action_date: string | null;
}

interface DayData {
  date: string;
  mood: string | null;
  waterDone: boolean;
  menstrualLog: { type: string; intensity?: string } | null;
  prescriptions: Prescription[];
  completedMedIds: Set<string>;
  actions: DayAction[];
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  if (isToday(date)) return "Hoje, " + format(date, "d 'de' MMMM", { locale: ptBR });
  if (isYesterday(date)) return "Ontem, " + format(date, "d 'de' MMMM", { locale: ptBR });
  return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
}

export function PatientMonitoring({ patientId }: { patientId: string }) {
  const [days, setDays] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    const startDate = subDays(today, 13);
    const startDay = format(startDate, "yyyy-MM-dd");

    const [logsRes, medsRes] = await Promise.all([
      supabase
        .from("patient_logs")
        .select("id, type, value, created_at, taken_at, prescription_id")
        .eq("patient_id", patientId)
        .gte("created_at", `${startDay}T00:00:00`)
        .order("created_at", { ascending: false }),
      supabase
        .from("prescriptions")
        .select("id, medication_name")
        .eq("patient_id", patientId)
        .eq("status", "active"),
    ]);

    const logs = (logsRes.data || []) as { type: string; value: string | null; created_at: string | null; taken_at: string | null; prescription_id: string | null }[];
    const prescriptions = (medsRes.data || []) as Prescription[];

    const logsByDate = new Map<string, typeof logs>();
    logs.forEach((l) => {
      const dateKey = l.taken_at?.substring(0, 10) || l.created_at?.substring(0, 10);
      if (!dateKey) return;
      const list = logsByDate.get(dateKey) || [];
      list.push(l);
      logsByDate.set(dateKey, list);
    });

    const result: DayData[] = [];
    for (let i = 0; i < 14; i++) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      const dayLogs = logsByDate.get(d) || [];

      const moodLog = dayLogs.find((l) => l.type === "mood");
      const waterLog = dayLogs.find((l) => l.type === "water");
      const menstrualLogEntry = dayLogs.find((l) => l.type === "menstrual_log");
      const medLogs = dayLogs.filter((l) => l.type === "medication" && l.prescription_id);
      const completedMedIds = new Set(medLogs.map((l) => l.prescription_id!));

      let menstrualLog: DayData["menstrualLog"] = null;
      if (menstrualLogEntry?.value) {
        try {
          menstrualLog = JSON.parse(menstrualLogEntry.value);
        } catch {
          menstrualLog = { type: menstrualLogEntry.value };
        }
      }

      if (dayLogs.length > 0 || isToday(new Date(d + "T12:00:00"))) {
        result.push({
          date: d,
          mood: moodLog?.value || null,
          waterDone: waterLog?.value === "true",
          menstrualLog,
          prescriptions,
          completedMedIds,
          actions: [],
        });
      }
    }

    setDays(result);
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#9e837a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5859A]" />
        <span className="text-sm font-medium">Carregando dados de monitoramento...</span>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/60 text-center shadow-sm">
        <p className="text-sm text-[#7a5d56] font-medium">
          Nenhum registro encontrado nos últimos 14 dias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {days.map((day, idx) => {
        const totalMeds = day.prescriptions.length;
        const completedMeds = day.prescriptions.filter((p) => day.completedMedIds.has(p.id)).length;
        const allMedsDone = totalMeds > 0 && completedMeds === totalMeds;
        const allDone = allMedsDone && day.waterDone && !!day.mood;
        const hasPending = !allDone && (day.actions.length > 0 || totalMeds > 0);
        const dayDate = new Date(day.date + "T12:00:00");
        const isTodayCard = isToday(dayDate);
        const isPast = isBefore(startOfDay(dayDate), startOfDay(new Date()));

        return (
          <Collapsible key={day.date} defaultOpen={isTodayCard || idx === 0}>
            <div className="bg-white/60 backdrop-blur-md rounded-[28px] border border-white/70 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] overflow-hidden">
              <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-white/40 transition-all active:scale-[0.99]">
                <span className="text-[15px] font-bold text-[#1C1917] capitalize">
                  {formatDayLabel(day.date)}
                </span>
                <div className="flex items-center gap-2">
                  {day.menstrualLog?.type === "d1" && (
                    <Badge className="bg-[#8B3D5A] text-white border-none text-[10px] font-bold px-2 py-0.5">
                      D1 do Ciclo
                    </Badge>
                  )}
                  {allDone ? (
                    <Badge className="bg-green-500/10 text-green-700 border-green-500/20 text-[10px] font-bold px-2 py-0.5">
                      100% Concluído
                    </Badge>
                  ) : hasPending ? (
                    <Badge className="bg-[#E5859A]/10 text-[#8B3D5A] border-[#E5859A]/20 text-[10px] font-bold px-2 py-0.5">
                      Pendências
                    </Badge>
                  ) : isPast ? (
                    <Badge className="bg-gray-100 text-[#9e837a] border-gray-200 text-[10px] font-bold px-2 py-0.5">
                      Sem registros
                    </Badge>
                  ) : null}
                  <ChevronDown size={18} className="text-[#9e837a] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-5 pb-5 space-y-4">
                  {/* Hábitos e Ciclo Menstrual */}
                  <div className="bg-white/40 rounded-2xl p-4 border border-white/60 space-y-3">
                    <p className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1 px-1">
                      Ciclo & Bem-estar
                    </p>

                    {/* Ciclo Menstrual */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
                        <CalendarIcon size={16} className={day.menstrualLog ? "text-[#8B3D5A]" : "text-[#9e837a]/40"} />
                      </div>
                      {day.menstrualLog ? (
                        <span className="text-[14px] text-[#1C1917] font-semibold">
                          Ciclo: {day.menstrualLog.type === "d1" ? "🔴 Início do Ciclo (D1)" : day.menstrualLog.type === "menstruation" ? "🩸 Menstruação" : day.menstrualLog.type === "spotting" ? "💧 Escape / Borra" : "🥚 Período Fértil / Ovulação"}
                        </span>
                      ) : (
                        <span className="text-[14px] text-[#9e837a]/50 italic">Ciclo: Sem registro no dia</span>
                      )}
                    </div>

                    {/* Humor */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
                        <Smile size={16} className={day.mood ? "text-[#8B3D5A]" : "text-[#9e837a]/40"} />
                      </div>
                      {day.mood && MOOD_MAP[day.mood] ? (
                        <span className="text-[14px] text-[#1C1917] font-medium">
                          Humor: {MOOD_MAP[day.mood].emoji}{" "}
                          <span className="text-[#7a5d56]">{MOOD_MAP[day.mood].label}</span>
                        </span>
                      ) : isPast ? (
                        <div className="flex items-center gap-2 text-[#9e837a]/60">
                          <HelpCircle size={14} />
                          <span className="text-[14px] italic">Humor: Não informou</span>
                        </div>
                      ) : (
                        <span className="text-[14px] text-[#9e837a]/40 italic">Humor: Aguardando registro</span>
                      )}
                    </div>

                    {/* Água */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
                        <Droplets size={16} className={day.waterDone ? "text-[#60A5FA]" : "text-[#9e837a]/40"} />
                      </div>
                      {day.waterDone ? (
                        <span className="text-[14px] text-[#60A5FA] font-bold">Água: Meta atingida (2L)</span>
                      ) : isPast ? (
                        <div className="flex items-center gap-2 text-[#9e837a]/60">
                          <XCircle size={14} />
                          <span className="text-[14px] italic">Água: Não registrou</span>
                        </div>
                      ) : (
                        <span className="text-[14px] text-[#9e837a]/40 italic">Água: Pendente</span>
                      )}
                    </div>
                  </div>

                  {/* Tarefas do Protocolo (Medicamentos) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1 px-1">
                      <p className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider">
                        Medicamentos
                      </p>
                      {totalMeds > 0 && (
                        <span className={`text-[11px] font-bold ${allMedsDone ? "text-green-600" : "text-[#E5859A]"}`}>
                          {completedMeds}/{totalMeds}
                        </span>
                      )}
                    </div>
                    
                    {day.prescriptions.length > 0 ? (
                      <div className="space-y-2">
                        {day.prescriptions.map((med) => {
                          const done = day.completedMedIds.has(med.id);
                          return (
                            <div
                              key={med.id}
                              className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                                done 
                                  ? "bg-green-500/5 border-green-500/10" 
                                  : isPast
                                  ? "bg-gray-50/50 border-gray-100 opacity-60"
                                  : "bg-white/60 border-white/70"
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {done ? (
                                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle2 size={14} className="text-white" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 min-w-0">
                                <Pill size={14} className={done ? "text-green-600" : "text-[#E5859A]"} />
                                <span className={`text-[14px] font-semibold truncate ${
                                  done ? "text-[#7a5d56] line-through opacity-70" : isPast ? "text-[#9e837a]" : "text-[#1C1917]"
                                }`}>
                                  {med.medication_name}
                                </span>
                                {!done && isPast && (
                                  <span className="text-[10px] font-bold text-[#E5859A] uppercase ml-1">Não Tomado</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-[12px] text-[#9e837a]/60 italic pl-1">
                        Nenhum medicamento agendado.
                      </p>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}
