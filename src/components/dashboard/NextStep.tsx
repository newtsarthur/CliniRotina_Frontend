import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Stethoscope, TestTube, Clock, Check } from "lucide-react";

interface StepItem {
  title: string;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  Medicamento: <Pill className="w-5 h-5 text-[#E5859A]" />,
  Consulta: <Stethoscope className="w-5 h-5 text-[#E5859A]" />,
  Exame: <TestTube className="w-5 h-5 text-[#E5859A]" />,
};

function formatDateLabel(dateStr: string) {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoje";
  if (isTomorrow(date)) return "Amanhã";
  return format(date, "dd 'de' MMM", { locale: ptBR });
}

export function NextStep({ userId }: { userId: string }) {
  const [todayItems, setTodayItems] = useState<StepItem[]>([]);
  const [nextItem, setNextItem] = useState<StepItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toLocaleDateString("en-CA");

      // Fetch ALL today's items (including completed) for the diary view
      const { data: todayData } = await supabase
        .from("protocol_items")
        .select("title, event_type, scheduled_date, scheduled_time, status")
        .eq("patient_id", userId)
        .eq("scheduled_date", today)
        .order("scheduled_time", { ascending: true });

      if (todayData && todayData.length > 0) {
        setTodayItems(todayData);
      }

      // Fetch the next pending item (today or future)
      const { data: nextData } = await supabase
        .from("protocol_items")
        .select("title, event_type, scheduled_date, scheduled_time, status")
        .eq("patient_id", userId)
        .eq("status", "pending")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true })
        .limit(1);

      if (nextData && nextData.length > 0) {
        setNextItem(nextData[0]);
      }

      setLoading(false);
    };
    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full rounded-[32px]" />
      </div>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-[#171213] leading-7 tracking-[-0.45px] mb-2.5">
        {todayItems.length > 0 ? "Tarefas de Hoje" : "Seu Próximo Passo"}
      </h3>

      {todayItems.length > 0 ? (
        <div className="space-y-2">
          {todayItems.map((item, i) => {
            const isDone = item.status === "completed";
            return (
              <div
                key={i}
                className="rounded-2xl border border-[#F3F4F6] bg-[#F8F6F6] p-3.5 flex items-center gap-3"
              >
                {/* Status indicator */}
                <div
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isDone ? "bg-[#E5859A] border-[#E5859A]" : "border-[#D1D5DB]"
                  }`}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </div>

                <div className="w-9 h-9 rounded-full bg-[#E5859A]/10 flex items-center justify-center shrink-0">
                  {typeIcons[item.event_type] || <Pill className="w-4 h-4 text-[#E5859A]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-5 truncate ${
                    isDone ? "line-through text-[#C4C4C4]" : "text-[#171213]"
                  }`}>
                    {item.title}
                  </p>
                  {item.scheduled_time && (
                    <div className={`flex items-center gap-1 mt-0.5 ${isDone ? "text-[#D1D5DB]" : "text-[#85666D]"}`}>
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-medium">{item.scheduled_time.slice(0, 5)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Show next future item if exists and is not today */}
          {nextItem && !isToday(parseISO(nextItem.scheduled_date)) && (
            <div className="pt-2">
              <p className="text-xs font-bold text-[#E5859A] uppercase tracking-wide mb-1.5">
                Próximo: {formatDateLabel(nextItem.scheduled_date)}
              </p>
              <div className="rounded-2xl border border-[#F3F4F6] bg-[#F8F6F6] p-3.5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#E5859A]/10 flex items-center justify-center shrink-0">
                  {typeIcons[nextItem.event_type] || <Pill className="w-4 h-4 text-[#E5859A]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#171213] truncate">{nextItem.title}</p>
                  {nextItem.scheduled_time && (
                    <div className="flex items-center gap-1 mt-0.5 text-[#85666D]">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs font-medium">{nextItem.scheduled_time.slice(0, 5)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : nextItem ? (
        <div className="rounded-[32px] border border-[#F3F4F6] bg-[#F8F6F6] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5859A]/10 flex items-center justify-center shrink-0">
            {typeIcons[nextItem.event_type] || <Pill className="w-5 h-5 text-[#E5859A]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#171213] leading-6 truncate">{nextItem.title}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#85666D] font-medium">{formatDateLabel(nextItem.scheduled_date)}</span>
              {nextItem.scheduled_time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#85666D]" />
                  <span className="text-sm text-[#85666D] font-medium">{nextItem.scheduled_time.slice(0, 5)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-[#D1D5DB] bg-[#F8F6F6] p-5 text-center">
          <p className="text-sm text-[#85666D] font-medium">
            Nenhum evento programado. Você está em dia! 🎉
          </p>
        </div>
      )}
    </section>
  );
}
