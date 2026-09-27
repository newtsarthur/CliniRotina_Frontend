import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const MOODS = [
  { emoji: "😊", label: "Bem", value: "bem" },
  { emoji: "🥺", label: "Sensível", value: "sensivel" },
  { emoji: "😫", label: "Cólicas", value: "colicas" },
  { emoji: "😡", label: "Estressada", value: "estressada" },
];

export function EmotionalCheckin({ userId }: { userId: string }) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    const fetchToday = async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("mood")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle();

      if (data) setSelectedMood(data.mood);
      setLoading(false);
    };
    fetchToday();
  }, [userId, today]);

  const handleMoodClick = async (mood: string) => {
    if (saving) return;
    setSaving(true);

    try {
      // Try update first, if no rows affected then insert
      const { data: existing } = await supabase
        .from("daily_checkins")
        .select("id")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("daily_checkins")
          .update({ mood })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("daily_checkins")
          .insert({ user_id: userId, checkin_date: today, mood });
      }

      setSelectedMood(mood);
      toast.success("Registro salvo! 💜");
    } catch {
      toast.error("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-20 w-full rounded-[32px]" />
      </div>
    );
  }

  return (
    <section>
      <h3 className="text-lg font-bold text-[#171213] leading-7 tracking-[-0.45px] mb-2.5">
        {selectedMood ? "Obrigado por registrar seu dia! 💜" : "Como você está hoje?"}
      </h3>

      <div className="grid grid-cols-4 gap-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            onClick={() => handleMoodClick(m.value)}
            disabled={saving}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all ${
              selectedMood === m.value
                ? "border-[#E5859A] bg-[#E5859A]/10 shadow-sm"
                : "border-[#F3F4F6] bg-[#F8F6F6] hover:border-[#E5859A]/40"
            } ${saving ? "opacity-50" : ""}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-[11px] font-semibold text-[#171213] leading-none">{m.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
