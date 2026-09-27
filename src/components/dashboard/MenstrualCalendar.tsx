import { useState, useEffect, useCallback } from "react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isToday, parseISO, differenceInDays 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ChevronLeft, ChevronRight, Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MenstrualRecord {
  id?: string;
  action_date: string;
  type: "menstruation" | "d1" | "spotting" | "ovulation";
  intensity?: "leve" | "medio" | "intenso";
  notes?: string;
}

// Robust timezone-safe extraction of YYYY-MM-DD string without UTC shifting
function getLocalDateKey(dateStrOrIso: string | null | undefined): string | null {
  if (!dateStrOrIso) return null;
  const match = dateStrOrIso.match(/(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  try {
    const d = new Date(dateStrOrIso);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

export function MenstrualCalendar({ userId }: { userId: string }) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [records, setRecords] = useState<Map<string, MenstrualRecord>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);

  // Fetch all menstrual records for the patient across all possible cycle types
  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("patient_logs")
      .select("id, created_at, taken_at, value, type, status")
      .eq("patient_id", userId);

    if (error) {
      console.error("Error fetching menstrual logs:", error);
    } else {
      const recordMap = new Map<string, MenstrualRecord>();
      (data || []).forEach((item) => {
        // Skip explicitly deleted or cleared records
        if (item.status === "deleted" || !item.value || item.value === "null") return;

        const isCycleType = ["menstrual_log", "d1", "menstruation", "spotting", "ovulation"].includes(item.type) ||
          (item.value && (item.value.includes("d1") || item.value.includes("menstruation") || item.value.includes("spotting") || item.value.includes("ovulation")));
        
        if (!isCycleType) return;

        const dateKey = getLocalDateKey(item.taken_at || item.created_at);
        if (dateKey && item.value) {
          try {
            const parsed = JSON.parse(item.value);
            recordMap.set(dateKey, {
              id: item.id,
              action_date: dateKey,
              ...parsed,
            });
          } catch {
            recordMap.set(dateKey, {
              id: item.id,
              action_date: dateKey,
              type: item.value as MenstrualRecord["type"],
            });
          }
        } else if (dateKey && item.type) {
          recordMap.set(dateKey, {
            id: item.id,
            action_date: dateKey,
            type: item.type as MenstrualRecord["type"],
          });
        }
      });
      setRecords(recordMap);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const daysInCalendar = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate current cycle day based on latest D1 or menstruation start
  const latestD1Date = Array.from(records.values())
    .filter((r) => r.type === "d1" || (r.type === "menstruation" && r.intensity === "intenso"))
    .map((r) => r.action_date)
    .sort()
    .pop();

  const cycleDayNumber = latestD1Date
    ? differenceInDays(new Date(), parseISO(latestD1Date)) + 1
    : null;

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setModalOpen(true);
  };

  const handleSaveType = async (type: MenstrualRecord["type"], intensity?: MenstrualRecord["intensity"]) => {
    if (!selectedDate || !userId || saving) return;
    setSaving(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const valueObj = { type, intensity: intensity || "medio" };
    const valueStr = JSON.stringify(valueObj);

    try {
      // 1. Find and clear any existing cycle entries on dateStr in patient_logs
      const { data: logs } = await supabase
        .from("patient_logs")
        .select("id, taken_at, created_at, type, value")
        .eq("patient_id", userId);

      const existingLogIds = (logs || [])
        .filter((l) => {
          const isCycle = ["menstrual_log", "d1", "menstruation", "spotting", "ovulation"].includes(l.type) ||
            (l.value && (l.value.includes("d1") || l.value.includes("menstruation") || l.value.includes("spotting") || l.value.includes("ovulation")));
          if (!isCycle) return false;
          const keyTaken = getLocalDateKey(l.taken_at);
          const keyCreated = getLocalDateKey(l.created_at);
          return keyTaken === dateStr || keyCreated === dateStr;
        })
        .map((l) => l.id);

      if (existingLogIds.length > 0) {
        await supabase.from("patient_logs").delete().in("id", existingLogIds);
        await supabase.from("patient_logs").update({ value: null, status: "deleted" }).in("id", existingLogIds);
      }

      // Also clean patient_daily_actions
      try {
        const { data: dailyActions } = await supabase
          .from("patient_daily_actions")
          .select("id, created_at, action_date, action_type, value")
          .eq("patient_id", userId);

        const dailyActionIdsToDelete = (dailyActions || [])
          .filter((a) => {
            const isCycle = ["menstrual_log", "d1", "menstruation", "spotting", "ovulation"].includes(a.action_type) ||
              (a.value && (a.value.includes("d1") || a.value.includes("menstruation") || a.value.includes("spotting") || a.value.includes("ovulation")));
            if (!isCycle) return false;
            const keyAction = getLocalDateKey(a.action_date);
            const keyCreated = getLocalDateKey(a.created_at);
            return keyAction === dateStr || keyCreated === dateStr;
          })
          .map((a) => a.id);

        if (dailyActionIdsToDelete.length > 0) {
          await supabase.from("patient_daily_actions").delete().in("id", dailyActionIdsToDelete);
        }
      } catch {
        // ignore legacy table errors
      }

      // 2. Insert single clean record with fixed local ISO timestamp string
      const { error: insertErr } = await supabase
        .from("patient_logs")
        .insert({
          patient_id: userId,
          type: "menstrual_log",
          value: valueStr,
          taken_at: `${dateStr}T12:00:00`,
          status: "completed",
        });

      if (insertErr) throw insertErr;

      // 3. Update local state map immediately
      setRecords((prev) => {
        const next = new Map(prev);
        next.set(dateStr, {
          action_date: dateStr,
          type,
          intensity: intensity || "medio",
        });
        return next;
      });

      toast.success(
        type === "d1"
          ? "Primeiro dia do ciclo (D1) registrado com sucesso! 🔴"
          : "Registro menstrual atualizado! 🩸"
      );
      setModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      console.error("Error saving menstrual log:", err);
      toast.error(err?.message || "Erro ao salvar registro.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveRecord = async () => {
    if (!selectedDate || !userId || saving) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");

    setSaving(true);
    try {
      // 1. Find ALL cycle rows matching this dateStr across patient_logs
      const { data: logs } = await supabase
        .from("patient_logs")
        .select("id, taken_at, created_at, type, value")
        .eq("patient_id", userId);

      const logIdsToDelete = (logs || [])
        .filter((l) => {
          const isCycle = ["menstrual_log", "d1", "menstruation", "spotting", "ovulation"].includes(l.type) ||
            (l.value && (l.value.includes("d1") || l.value.includes("menstruation") || l.value.includes("spotting") || l.value.includes("ovulation")));
          if (!isCycle) return false;

          const keyTaken = getLocalDateKey(l.taken_at);
          const keyCreated = getLocalDateKey(l.created_at);
          return keyTaken === dateStr || keyCreated === dateStr;
        })
        .map((l) => l.id);

      if (logIdsToDelete.length > 0) {
        // Attempt DELETE
        await supabase
          .from("patient_logs")
          .delete()
          .in("id", logIdsToDelete);

        // Fallback UPDATE to clear value if DELETE is restricted by RLS
        await supabase
          .from("patient_logs")
          .update({ value: null, status: "deleted" })
          .in("id", logIdsToDelete);
      }

      // 2. Also cleanup patient_daily_actions if any old legacy records exist
      try {
        const { data: dailyActions } = await supabase
          .from("patient_daily_actions")
          .select("id, created_at, action_date, action_type, value")
          .eq("patient_id", userId);

        const dailyActionIdsToDelete = (dailyActions || [])
          .filter((a) => {
            const isCycle = ["menstrual_log", "d1", "menstruation", "spotting", "ovulation"].includes(a.action_type) ||
              (a.value && (a.value.includes("d1") || a.value.includes("menstruation") || a.value.includes("spotting") || a.value.includes("ovulation")));
            if (!isCycle) return false;

            const keyAction = getLocalDateKey(a.action_date);
            const keyCreated = getLocalDateKey(a.created_at);
            return keyAction === dateStr || keyCreated === dateStr;
          })
          .map((a) => a.id);

        if (dailyActionIdsToDelete.length > 0) {
          await supabase
            .from("patient_daily_actions")
            .delete()
            .in("id", dailyActionIdsToDelete);
        }
      } catch {
        // ignore legacy table errors
      }

      // 3. Optimistic local state removal
      setRecords((prev) => {
        const next = new Map(prev);
        next.delete(dateStr);
        return next;
      });

      toast.success("Registro removido.");
      setModalOpen(false);
      await fetchRecords();
    } catch (err: any) {
      console.error("Error removing menstrual log:", err);
      toast.error(err?.message || "Erro ao remover.");
    } finally {
      setSaving(false);
    }
  };

  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const currentSelectedRecord = records.get(selectedDateStr);

  return (
    <section>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">
            Calendário Menstrual
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FBEDF1] text-[#E5859A]">
            Ciclo
          </span>
        </div>
        {cycleDayNumber && cycleDayNumber > 0 && cycleDayNumber <= 45 && (
          <span className="text-[11px] font-bold text-[#8B3D5A] bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/70 shadow-sm">
            Dia {cycleDayNumber} do ciclo
          </span>
        )}
      </div>

      <div
        className="rounded-[32px] p-5 backdrop-blur-md border-2 border-[#E5859A]/20 shadow-md relative overflow-hidden animate-fade-in animation-delay-100"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(251,241,242,0.85) 100%)",
        }}
      >
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4 px-1">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-[#8B3D5A] transition-all border border-white/70 shadow-sm active:scale-95"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[15px] font-bold text-[#1C1917] capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="w-9 h-9 rounded-full bg-white/60 hover:bg-white flex items-center justify-center text-[#8B3D5A] transition-all border border-white/70 shadow-sm active:scale-95"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 text-center mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dayName) => (
            <span key={dayName} className="text-[10.5px] font-bold uppercase tracking-wider text-[#9e837a]">
              {dayName}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {daysInCalendar.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const record = records.get(dateStr);
            const inCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            let dayStyle = "bg-white/40 text-[#1C1917] hover:bg-white/70";
            let indicator: React.ReactNode = null;

            if (record) {
              if (record.type === "d1") {
                dayStyle = "bg-[#8B3D5A] text-white font-bold ring-2 ring-[#8B3D5A]/30 shadow-sm";
                indicator = <span className="text-[8px] leading-none block font-extrabold mt-0.5">D1</span>;
              } else if (record.type === "menstruation") {
                dayStyle = "bg-[#E5859A] text-white font-semibold shadow-sm";
                indicator = <span className="text-[9px] leading-none block mt-0.5">🩸</span>;
              } else if (record.type === "spotting") {
                dayStyle = "bg-[#FCE7EC] text-[#8B3D5A] font-medium border border-[#E5859A]/30";
                indicator = <span className="text-[9px] leading-none block mt-0.5">💧</span>;
              } else if (record.type === "ovulation") {
                dayStyle = "bg-[#EEF7F1] text-green-700 font-medium border border-green-200";
                indicator = <span className="text-[9px] leading-none block mt-0.5">🥚</span>;
              }
            } else if (isCurrentDay) {
              dayStyle = "bg-white text-[#8B3D5A] font-bold border-2 border-[#E5859A]";
            } else if (!inCurrentMonth) {
              dayStyle = "bg-transparent text-gray-300";
            }

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={`h-11 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 active:scale-90 ${dayStyle}`}
              >
                <span className="text-[12.5px] leading-none">{format(day, "d")}</span>
                {indicator}
              </button>
            );
          })}
        </div>

        {/* Legend Footer (Collapsible) */}
        <div className="mt-4 pt-3 border-t border-[#E5859A]/15 flex items-center justify-between">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-[11px] font-bold text-[#8B3D5A] hover:text-[#E5859A] flex items-center gap-1 transition-colors"
          >
            {showLegend ? "Ocultar legenda do ciclo" : "Ver legenda do ciclo"}
          </button>
          {!showLegend && (
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-[#8B3D5A]" />
              <span className="w-2 h-2 rounded-full bg-[#E5859A]" />
              <span className="w-2 h-2 rounded-full bg-[#FCE7EC] border border-[#E5859A]/40" />
              <span className="w-2 h-2 rounded-full bg-green-200" />
            </div>
          )}
        </div>

        {showLegend && (
          <div className="mt-2.5 p-2.5 bg-white/40 rounded-2xl border border-white/60 grid grid-cols-2 gap-2 text-[10.5px] font-semibold text-[#7a5d56] animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8B3D5A]" />
              D1 (Início do Ciclo)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5859A]" />
              Menstruação
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCE7EC] border border-[#E5859A]/40" />
              Escape / Spotting
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-200" />
              Período Fértil
            </div>
          </div>
        )}
      </div>

      {/* Modal com Paleta e Background idênticos ao App */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="border border-white/80 rounded-[32px] p-6 shadow-[0_20px_60px_-15px_rgba(139,61,90,0.25)] max-w-[360px] backdrop-blur-xl"
          style={{
            background: "linear-gradient(170deg, rgba(253, 248, 245, 0.97) 0%, rgba(249, 237, 232, 0.97) 100%)",
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-[19px] font-bold text-[#1C1917] text-center">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Registrar Ciclo"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <p className="text-[12px] text-[#7a5d56] text-center font-medium mb-3">
              Selecione o evento deste dia para compartilhar com sua médica:
            </p>

            <button
              onClick={() => handleSaveType("d1", "intenso")}
              disabled={saving}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all ${
                currentSelectedRecord?.type === "d1"
                  ? "bg-[#8B3D5A] text-white ring-2 ring-[#8B3D5A]/40"
                  : "bg-white/80 hover:bg-white text-[#8B3D5A] border border-[#E5859A]/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#8B3D5A]/15 flex items-center justify-center text-xs">🔴</span>
                <span>Início do Ciclo (D1)</span>
              </div>
              {currentSelectedRecord?.type === "d1" && <Check size={18} />}
            </button>

            <button
              onClick={() => handleSaveType("menstruation", "medio")}
              disabled={saving}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all ${
                currentSelectedRecord?.type === "menstruation"
                  ? "bg-[#E5859A] text-white ring-2 ring-[#E5859A]/40"
                  : "bg-white/80 hover:bg-[#FBEDF1] text-[#8B3D5A] border border-[#E5859A]/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#E5859A]/20 flex items-center justify-center text-sm">🩸</span>
                <span>Menstruação</span>
              </div>
              {currentSelectedRecord?.type === "menstruation" && <Check size={18} />}
            </button>

            <button
              onClick={() => handleSaveType("spotting", "leve")}
              disabled={saving}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-all ${
                currentSelectedRecord?.type === "spotting"
                  ? "bg-[#FCE7EC] text-[#8B3D5A] border-2 border-[#E5859A]"
                  : "bg-white/80 hover:bg-white text-[#1C1917] border border-white/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-sm">💧</span>
                <span>Escape / Borra</span>
              </div>
              {currentSelectedRecord?.type === "spotting" && <Check size={18} />}
            </button>

            <button
              onClick={() => handleSaveType("ovulation")}
              disabled={saving}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-all ${
                currentSelectedRecord?.type === "ovulation"
                  ? "bg-[#EEF7F1] text-green-800 border-2 border-green-400"
                  : "bg-white/80 hover:bg-[#EEF7F1]/80 text-green-800 border border-green-200/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center text-sm">🥚</span>
                <span>Período Fértil / Mucofilo</span>
              </div>
              {currentSelectedRecord?.type === "ovulation" && <Check size={18} />}
            </button>

            {currentSelectedRecord && (
              <button
                onClick={handleRemoveRecord}
                disabled={saving}
                className="w-full py-3 mt-2 text-xs text-[#8B3D5A] font-bold bg-[#FBEDF1] hover:bg-[#FCE7EC] rounded-2xl border border-[#E5859A]/30 transition-all active:scale-95"
              >
                Remover registro deste dia
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
