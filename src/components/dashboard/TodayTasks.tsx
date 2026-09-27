import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, Clock, Check, Droplets, SmilePlus } from "lucide-react";

const MOODS = [
  { emoji: "😊", label: "Bem", value: "bem" },
  { emoji: "🥺", label: "Sensível", value: "sensivel" },
  { emoji: "😣", label: "Cólicas", value: "colicas" },
  { emoji: "😤", label: "Estressada", value: "estressada" },
];

interface MedItem {
  id: string;
  title: string;
  scheduled_time: string | null;
  status: string | null;
}

interface CheckinFields {
  mood?: string;
  water_completed?: boolean;
}

export function TodayTasks({ userId }: { userId: string }) {
  const [mood, setMood] = useState<string | null>(null);
  const [waterDone, setWaterDone] = useState(false);
  const [meds, setMeds] = useState<MedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [savingWater, setSavingWater] = useState(false);
  const [togglingMed, setTogglingMed] = useState<string | null>(null);

  const today = new Date().toLocaleDateString("en-CA");

  const fetchAll = useCallback(async () => {
    const [checkinRes, medsRes] = await Promise.all([
      supabase
        .from("daily_checkins")
        .select("mood, water_completed")
        .eq("user_id", userId)
        .eq("checkin_date", today)
        .maybeSingle(),
      supabase
        .from("protocol_items")
        .select("id, title, scheduled_time, status")
        .eq("patient_id", userId)
        .eq("scheduled_date", today)
        .eq("event_type", "Medicamento")
        .order("scheduled_time", { ascending: true }),
    ]);

    if (checkinRes.data) {
      setMood(checkinRes.data.mood);
      setWaterDone(!!checkinRes.data.water_completed);
    }
    if (medsRes.data) setMeds(medsRes.data);
    setLoading(false);
  }, [userId, today]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const upsertCheckin = async (fields: CheckinFields) => {
    const { data: existing } = await supabase
      .from("daily_checkins")
      .select("id")
      .eq("user_id", userId)
      .eq("checkin_date", today)
      .maybeSingle();

    if (existing) {
      await supabase.from("daily_checkins").update(fields).eq("id", existing.id);
    } else {
      await supabase.from("daily_checkins").insert({
        user_id: userId,
        checkin_date: today,
        mood: fields.mood || "bem",
        water_completed: fields.water_completed ?? false,
        ...fields,
      });
    }
  };

  const handleMood = async (val: string) => {
    if (savingMood) return;
    setSavingMood(true);
    setMood(val);
    try {
      await upsertCheckin({ mood: val });
      toast.success("Humor registrado!");
    } catch {
      setMood(null);
      toast.error("Erro ao salvar humor.");
    }
    setSavingMood(false);
  };

  const handleWater = async () => {
    if (savingWater) return;
    setSavingWater(true);
    const next = !waterDone;
    setWaterDone(next);
    try {
      await upsertCheckin({ water_completed: next });
      if (next) toast.success("Meta de água concluída! 💧");
    } catch {
      setWaterDone(!next);
      toast.error("Erro ao salvar.");
    }
    setSavingWater(false);
  };

  const toggleMed = async (item: MedItem) => {
    if (togglingMed) return;
    setTogglingMed(item.id);
    const newStatus = item.status === "completed" ? "pending" : "completed";
    setMeds((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: newStatus } : m)));
    try {
      await supabase
        .from("protocol_items")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("id", item.id);
    } catch {
      setMeds((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: item.status } : m)));
      toast.error("Erro ao atualizar.");
    }
    setTogglingMed(null);
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </section>
    );
  }

  const moodData = mood ? MOODS.find((m) => m.value === mood) : null;

  return (
    <section>
      <h3 className="text-lg font-bold text-[#171213] leading-7 tracking-[-0.45px] mb-3">
        Tarefas de Hoje
      </h3>

      <div className="rounded-3xl border border-[#F3F4F6] bg-white shadow-[0_4px_20px_-2px_rgba(229,133,154,0.08)] p-5 space-y-5">
        {/* Mood Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <SmilePlus className="w-4 h-4 text-[#E5859A]" />
            <span className="text-sm font-semibold text-[#171213]">Como você está?</span>
          </div>
          {mood ? (
            <div className="rounded-2xl bg-[#FDF2F4] px-4 py-3 flex items-center justify-between">
              <p className="text-sm text-[#171213] font-medium">
                Sentindo-se: {moodData?.emoji} {moodData?.label}
              </p>
              <button
                onClick={() => setMood(null)}
                className="text-xs text-[#E5859A] font-semibold hover:underline"
              >
                Alterar
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMood(m.value)}
                  disabled={savingMood}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl bg-[#F8F6F6] hover:bg-[#FDF2F4] hover:ring-1 hover:ring-[#E5859A]/30 transition-all disabled:opacity-50"
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[11px] font-semibold text-[#434343]">{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Water Section */}
        <button
          onClick={handleWater}
          disabled={savingWater}
          className="w-full flex items-center gap-3 rounded-2xl bg-[#F8F6F6] p-3.5 transition-all hover:bg-[#EFF6FF]/60 active:scale-[0.99]"
        >
          <div
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              waterDone ? "bg-[#60A5FA] border-[#60A5FA]" : "border-[#D1D5DB]"
            }`}
          >
            {waterDone && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
          </div>
          <Droplets className={`w-5 h-5 shrink-0 ${waterDone ? "text-[#60A5FA]" : "text-[#93C5FD]"}`} />
          <div className="flex-1 text-left min-w-0">
            <p className={`text-[15px] font-semibold leading-5 ${waterDone ? "line-through text-[#C4C4C4]" : "text-[#171213]"}`}>
              Meta de Água (2L)
            </p>
            <p className={`text-xs mt-0.5 ${waterDone ? "text-[#D1D5DB]" : "text-[#85666D]"}`}>
              {waterDone ? "Parabéns! Hidratação em dia 💧" : "Beba pelo menos 2 litros hoje"}
            </p>
          </div>
        </button>

        {/* Medications Section */}
        {meds.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-[#E5859A]" />
              <span className="text-sm font-semibold text-[#171213]">Medicamentos</span>
              <span className="text-xs text-[#85666D] ml-auto">
                {meds.filter((m) => m.status === "completed").length}/{meds.length}
              </span>
            </div>
            <div className="space-y-2">
              {meds.map((med) => {
                const done = med.status === "completed";
                return (
                  <div key={med.id} className="flex items-center gap-3 rounded-2xl bg-[#F8F6F6] p-3.5">
                    <button
                      onClick={() => toggleMed(med)}
                      disabled={togglingMed === med.id}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        done ? "bg-[#E5859A] border-[#E5859A]" : "border-[#D1D5DB] hover:border-[#E5859A]"
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-5 truncate ${done ? "line-through text-[#C4C4C4]" : "text-[#171213]"}`}>
                        {med.title}
                      </p>
                      {med.scheduled_time && (
                        <div className={`flex items-center gap-1 mt-0.5 ${done ? "text-[#D1D5DB]" : "text-[#85666D]"}`}>
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">{med.scheduled_time.slice(0, 5)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
