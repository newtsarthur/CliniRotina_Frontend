import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Droplets, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function WaterGoal({ userId }: { userId: string }) {
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const fetchToday = async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("water_completed")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle();

      if (data) setCompleted(!!data.water_completed);
      setLoading(false);
    };
    fetchToday();
  }, [userId, today]);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    const newVal = !completed;
    setCompleted(newVal); // optimistic

    try {
      const { data: existing } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_checkins")
          .update({ water_completed: newVal })
          .eq("id", existing.id);
      } else {
        // Create checkin row with default mood if none exists yet
        await supabase
          .from("daily_checkins")
          .insert({ user_id: userId, checkin_date: today, mood: "bem", water_completed: newVal });
      }

      if (newVal) toast.success("Meta de água concluída! 💧");
    } catch {
      setCompleted(!newVal); // rollback
      toast.error("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-16 w-full rounded-2xl" />;
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="w-full flex items-center gap-4 rounded-2xl border border-[#F3F4F6] bg-[#F8F6F6] p-4 transition-all hover:shadow-sm active:scale-[0.99]"
    >
      {/* Check circle */}
      <div
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
          completed
            ? "bg-[#60A5FA] border-[#60A5FA]"
            : "border-[#D1D5DB] hover:border-[#60A5FA]"
        }`}
      >
        {completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
      </div>

      {/* Icon */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        completed ? "bg-[#60A5FA]/10" : "bg-[#60A5FA]/5"
      }`}>
        <Droplets className={`w-5 h-5 ${completed ? "text-[#60A5FA]" : "text-[#93C5FD]"}`} />
      </div>

      {/* Text */}
      <div className="flex-1 text-left min-w-0">
        <p className={`text-[15px] font-semibold leading-5 ${
          completed ? "line-through text-[#C4C4C4]" : "text-[#171213]"
        }`}>
          Meta de Água (2L)
        </p>
        <p className={`text-xs mt-0.5 ${completed ? "text-[#D1D5DB]" : "text-[#85666D]"}`}>
          {completed ? "Parabéns! Hidratação em dia 💧" : "Beba pelo menos 2 litros hoje"}
        </p>
      </div>
    </button>
  );
}
