import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Droplet, Pill,
  CheckCircle2, Circle, FileText, MessageCircle, User,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatName } from "@/lib/utils";
import { TreatmentProgress } from "@/components/dashboard/TreatmentProgress";
import { JourneyTimeline } from "@/components/dashboard/JourneyTimeline";
import { MenstrualCalendar } from "@/components/dashboard/MenstrualCalendar";
import { WhatsAppOptInModal } from "@/components/WhatsAppOptInModal";

const MOODS = [
  { id: "bem", emoji: "😊", label: "Bem" },
  { id: "sensivel", emoji: "🥺", label: "Sensível" },
  { id: "colicas", emoji: "😫", label: "Cólicas" },
  { id: "estressada", emoji: "😡", label: "Estressada" },
];

interface PrescriptionItem {
  id: string;
  medication_name: string;
}

interface PrescriptionWithStart extends PrescriptionItem {
  start_date: string | null;
}

interface ProtocolMedicationItem {
  title: string;
  scheduled_date: string;
}

export default function Dashboard() {
  const { profile, user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [greeting, setGreeting] = useState("Olá");
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Task states
  const [mood, setMood] = useState<string | null>(null);
  const [waterDone, setWaterDone] = useState(false);
  const [meds, setMeds] = useState<PrescriptionItem[]>([]);
  const [completedMedIds, setCompletedMedIds] = useState<Set<string>>(new Set());
  const [tasksLoading, setTasksLoading] = useState(true);
  const [savingMood, setSavingMood] = useState(false);
  const [savingWater, setSavingWater] = useState(false);
  const [togglingMed, setTogglingMed] = useState<string | null>(null);

  const todayDate = new Date().toLocaleDateString("en-CA"); // yyyy-MM-dd

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");

    const quotes = [
      "Cada dia é um novo passo na sua jornada. Você é mais forte do que imagina. 🌸",
      "A esperança é a âncora da alma. Um dia de cada vez. ✨",
      "Respire fundo. O seu corpo está fazendo um trabalho incrível. 💖",
      "Sinta a força que habita em você e honre o seu próprio ritmo. 🌿",
      "A paciência é a semente de onde brotam as mais belas flores. 🌷",
      "O seu caminho é único e precioso. Confie no processo. 🌈",
      "Cada ciclo é uma oportunidade de se reconectar com a sua essência. ✨",
      "Seu corpo é um templo sagrado. Cuide dele com carinho e gratidão. 🕊️",
      "A jornada para um sonho começa com o amor por si mesma. 💕",
      "Mantenha o coração aberto e a mente serena. O melhor está por vir. 🌅",
      "Você é a protagonista da sua história. Siga com coragem. 👑",
      "A beleza da vida está na renovação constante de cada ciclo. 🌕",
      "Deixe a sua luz interior guiar cada passo da sua jornada. 🕯️",
      "Pequenas vitórias diárias constroem grandes destinos. 🏆",
      "Escute o que o seu corpo diz; ele é o seu guia mais sábio. 🧘‍♀️",
      "A jornada é tão importante quanto a chegada. Aproveite o agora. 🍃",
      "Você merece todo o cuidado e acolhimento do mundo. 🫂",
      "A natureza não tem pressa, e ainda assim tudo se realiza. 🌳",
      "Sua determinação é a bússola que te leva além. 🧭",
      "Cultive a esperança como quem cuida de um jardim precioso. 🌻",
      "A cada amanhecer, uma nova chance de florescer. ☀️",
      "O seu bem-estar é o alicerce de todos os seus sonhos. 🏗️",
      "Celebre a sua feminilidade e a potência do seu ser. 🔥",
      "A quietude da alma traz a clareza para o coração. 🌊",
      "Você não está sozinha; o universo conspira a seu favor. 🌌",
      "Acredite na magia dos novos começos. 🪄",
      "Seu esforço é admirável e sua jornada é inspiradora. ⭐",
      "Transforme cada desafio em um degrau para o seu crescimento. 🪜",
      "Honre a sua história e confie na sabedoria do tempo. ⏳",
      "O amor-próprio é o combustível que ilumina o seu caminho. ⛽",
      "Respire, confie e receba as bençãos de cada novo dia. 🙌",
      "Sua intuição é a voz da sua verdade mais profunda. 🗣️",
      "Cada fase tem seu propósito; viva intensamente cada uma delas. 🌓",
    ];
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  // Fetch today's actions + prescriptions
  const fetchTasks = useCallback(async () => {
    if (!user?.id) return;
    setTasksLoading(true);

    const [medsRes, logsRes, protocolMedsRes] = await Promise.all([
      supabase
        .from("prescriptions")
        .select("id, medication_name, start_date")
        .eq("patient_id", user.id)
        .eq("status", "active"),
      supabase
        .from("patient_logs")
        .select("type, value, prescription_id, created_at, taken_at")
        .eq("patient_id", user.id)
        .gte("created_at", `${todayDate}T00:00:00`),
      supabase
        .from("protocol_items")
        .select("title, scheduled_date")
        .eq("patient_id", user.id)
        .eq("event_type", "Medicamento"),
    ]);

    if (logsRes.data) {
      const moodLog = logsRes.data.find((l) => l.type === "mood");
      if (moodLog?.value) setMood(moodLog.value);

      const waterLog = logsRes.data.find((l) => l.type === "water");
      if (waterLog) setWaterDone(waterLog.value === "true");

      const medIdsFromLogs = new Set(
        logsRes.data
          .filter((l) => l.type === "medication" && l.prescription_id)
          .map((l) => l.prescription_id!)
      );
      setCompletedMedIds(medIdsFromLogs);
    }

    if (medsRes.data) {
      const protocolItems = (protocolMedsRes.data || []) as ProtocolMedicationItem[];
      const medsWithProtocol = new Set(
        protocolItems.map((p) => p.title.toLowerCase())
      );
      const medsScheduledToday = new Set(
        protocolItems
          .filter((p) => p.scheduled_date === todayDate)
          .map((p) => p.title.toLowerCase())
      );

      const filtered = (medsRes.data as PrescriptionWithStart[]).filter((m) => {
        if (m.start_date && m.start_date > todayDate) return false;
        const nameKey = m.medication_name?.toLowerCase();
        if (medsWithProtocol.has(nameKey)) {
          return medsScheduledToday.has(nameKey);
        }
        return true;
      });
      setMeds(filtered);
    }
    setTasksLoading(false);
  }, [user?.id, todayDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (profile && profile.user_type === "patient") {
      const alreadyAsked = localStorage.getItem("whatsapp_optin_asked");
      if (!alreadyAsked && !profile.notifications_enabled) {
        setShowWhatsAppModal(true);
      }
    }
  }, [profile]);

  const upsertAction = async (type: string, value: string, medicationId?: string) => {
    if (!user?.id) return;

    let query = supabase
      .from("patient_logs")
      .select("id")
      .eq("patient_id", user.id)
      .eq("type", type)
      .gte("created_at", `${todayDate}T00:00:00`);

    if (medicationId) {
      query = query.eq("prescription_id", medicationId);
    }

    const { data } = await query;

    if (data && data.length > 0) {
      await supabase
        .from("patient_logs")
        .update({ value })
        .eq("id", data[0].id);
    } else {
      await supabase.from("patient_logs").insert({
        patient_id: user.id,
        type: type,
        value,
        prescription_id: medicationId || null,
        taken_at: new Date().toISOString(),
        status: "taken",
      });
    }
  };

  const deleteAction = async (type: string, medicationId: string) => {
    if (!user?.id) return;
    await supabase
      .from("patient_logs")
      .delete()
      .eq("patient_id", user.id)
      .eq("type", type)
      .gte("created_at", `${todayDate}T00:00:00`)
      .eq("prescription_id", medicationId);
  };

  const handleMood = async (mId: string) => {
    if (savingMood) return;
    setSavingMood(true);
    const newMood = mood === mId ? null : mId;
    setMood(newMood);

    if (newMood) {
      await upsertAction("mood", newMood);
      toast.success("Humor registrado com sucesso!");
    } else {
      if (user?.id) {
        await supabase
          .from("patient_logs")
          .delete()
          .eq("patient_id", user.id)
          .eq("type", "mood")
          .gte("created_at", `${todayDate}T00:00:00`);
      }
    }
    setSavingMood(false);
  };

  const handleWater = async () => {
    if (savingWater) return;
    setSavingWater(true);
    const next = !waterDone;
    setWaterDone(next);
    await upsertAction("water", String(next));
    if (next) toast.success("Meta de hidratação concluída! 💧");
    setSavingWater(false);
  };

  const handleMedToggle = async (medId: string) => {
    if (togglingMed) return;
    setTogglingMed(medId);

    const isDone = completedMedIds.has(medId);

    setCompletedMedIds((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(medId);
      else next.add(medId);
      return next;
    });

    if (isDone) {
      await deleteAction("medication", medId);
    } else {
      await upsertAction("medication", "taken", medId);
    }

    queryClient.invalidateQueries({ queryKey: ["daily-actions"] });
    setTogglingMed(null);
  };

  const handleFalarComClinica = async () => {
    setShowProfileMenu(false);
    let message = "Olá! Gostaria de falar sobre o meu tratamento.";
    let doctorPhone: string | null = null;

    if (user?.id) {
      const { data } = await supabase.rpc("get_my_doctor");

      if (data && data.length > 0) {
        const doctor = data[0];
        doctorPhone = doctor.phone ? doctor.phone.replace(/\D/g, "") : null;
        const name = doctor.full_name || "Doutor(a)";
        message = `Olá ${name}! Sou a paciente ${profile?.full_name || ""}, gostaria de tirar uma dúvida sobre o meu acompanhamento.`;
      }
    }

    const targetPhone = doctorPhone || "558183105992";
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${targetPhone}?text=${encoded}`, "_blank");
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen pb-28 font-sans text-[#1C1917] antialiased"
        style={{ background: "linear-gradient(170deg, #fdf8f5 0%, #f9ede8 55%, #f3dfd8 100%)" }}
      >
        <header className="px-6 pt-12 pb-2">
          <Skeleton className="h-8 w-40 rounded-xl bg-white/60 mb-2" />
          <Skeleton className="h-4 w-24 rounded-lg bg-white/40" />
        </header>
        <div className="px-5 mt-6 space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl bg-white/60" />
          <Skeleton className="h-44 w-full rounded-3xl bg-white/60" />
        </div>
        <BottomNav />
      </div>
    );
  }

  const moodData = MOODS.find((m) => m.id === mood);

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
      {/* CABEÇALHO FLUIDO */}
      <header className="px-6 pt-12 pb-2">
        <div className="flex justify-between items-start relative">
          <div className="space-y-0.5">
            <p className="text-[14px] text-[#5C4D49] font-medium leading-relaxed">{greeting},</p>
            <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">
              {formatName(profile?.full_name?.split(" ")[0]) || ""}
            </h1>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-11 h-11 rounded-full overflow-hidden ring-1 ring-[#E5859A]/30 ring-offset-2 ring-offset-transparent shadow-sm hover:shadow-md focus:outline-none transition-all duration-200"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#FAF6F3] to-[#e8c5b8]/40 flex items-center justify-center text-[#5C4D49] font-bold text-sm">
                  {profile?.full_name?.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase() || "U"}
                </div>
              )}
            </button>
            <div
              className={`absolute top-14 right-0 w-60 rounded-2xl p-1.5 z-50 backdrop-blur-xl border border-white/60 transition-all duration-300 ease-out origin-top-right ${
                showProfileMenu
                  ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                  : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
              }`}
              style={{
                background: "rgba(255,255,255,0.85)",
                boxShadow: "0 20px 50px -15px rgba(139, 61, 90, 0.18), 0 4px 12px rgba(0,0,0,0.04)",
              }}
            >
              <div className="px-3 py-2 mb-0.5">
                <p className="text-[10px] font-semibold text-[#9e837a] uppercase tracking-[0.12em]">Acesso Rápido</p>
              </div>
              {[
                { icon: User, label: "Editar Perfil", action: () => navigate("/profile") },
                { icon: FileText, label: "Meus Exames", action: () => navigate("/exames") },
                { icon: MessageCircle, label: "Falar com a Clínica", action: handleFalarComClinica },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex items-center gap-3 w-full px-2.5 py-2.5 hover:bg-[#FFF5F8] rounded-xl text-[13px] font-medium text-[#1C1917] transition-colors duration-150"
                >
                  <div className="w-8 h-8 rounded-full bg-[#FFF5F8] flex items-center justify-center">
                    <item.icon size={15} className="text-[#8B3D5A]" />
                  </div>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="px-5 mt-6 space-y-5">
        {/* HUMOR & MOTIVAÇÃO — card glass compacto */}
        <section
          className="rounded-[24px] p-3.5 sm:p-4 backdrop-blur-md border border-white/70 animate-fade-in animation-delay-75"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)",
            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)",
          }}
        >
          <p className="text-[#5C4D49] text-[13.5px] font-medium leading-relaxed text-center mb-3 px-2">
            {motivationalQuote}
          </p>
          <div className="border-t border-[#E5859A]/15 pt-3">
            <div className="flex flex-col items-center">
              <p className="text-[10px] text-[#9e837a] uppercase tracking-[0.12em] font-bold mb-2.5 text-center">
                Como você está hoje?
              </p>
              <div className="flex justify-center items-center gap-3.5 bg-white/40 backdrop-blur-sm py-2 px-4 rounded-full border border-white/60 w-fit shadow-sm">
                {MOODS.map((m) => {
                  const isSelected = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMood(m.id)}
                      disabled={savingMood}
                      className={`group relative flex flex-col items-center transition-all duration-300 ease-out disabled:opacity-50 px-1.5 ${
                        isSelected 
                          ? "scale-125" 
                          : "hover:scale-105"
                      }`}
                    >
                      <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#1C1917]/90 text-white text-[9.5px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-xl z-10">
                        {m.label}
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-[#1C1917]/90"></span>
                      </span>
                      
                      <span className={`text-[24px] leading-none drop-shadow-sm transition-all duration-300 ease-out origin-bottom ${
                        isSelected ? "animate-bounce-once" : ""
                      }`}>
                        {m.emoji}
                      </span>
                      <span className={`mt-1 text-[9.5px] transition-opacity ${
                        isSelected ? "text-[#8B3D5A] opacity-100 font-bold" : "text-[#9e837a] opacity-75 group-hover:opacity-100"
                      }`}>
                        {m.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {mood && (
                <p className="mt-2 text-[12px] font-bold text-[#8B3D5A] tracking-wide animate-pulse">
                  Anotado com carinho! 💛
                </p>
              )}
            </div>
          </div>
        </section>

        {/* CALENDÁRIO MENSTRUAL INTERATIVO */}
        {user?.id && <MenstrualCalendar userId={user.id} />}

        {/* TAREFAS HOJE */}
        <section>
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h3 className="text-[15px] font-semibold text-[#1C1917] tracking-tight">Tarefas de hoje</h3>
            <span className="text-[11px] text-[#9e837a] font-medium">
              {(waterDone ? 1 : 0) + completedMedIds.size}/{1 + meds.length} concluídas
            </span>
          </div>

          {tasksLoading ? (
            <div
              className="h-44 w-full rounded-3xl animate-pulse animate-fade-in animation-delay-150"
              style={{ background: "linear-gradient(110deg, rgba(255,255,255,0.6) 30%, rgba(252,231,236,0.7) 50%, rgba(255,255,255,0.6) 70%)" }}
            />
          ) : (
            <div
              className="rounded-3xl p-2 border border-white/70 animate-fade-in animation-delay-150"
              style={{
                background: "rgba(255,255,255,0.85)",
                boxShadow: "0 8px 30px -15px rgba(139, 61, 90, 0.12)",
              }}
            >
              {/* Água */}
              <button
                onClick={handleWater}
                disabled={savingWater}
                className={`w-full flex items-center justify-between px-3 py-3.5 rounded-2xl transition-all duration-300 ${
                  waterDone ? "bg-transparent" : "hover:bg-[#FFF5F8]/60"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      waterDone
                        ? "bg-[#60A5FA]/15 text-[#3B82F6]"
                        : "bg-[#60A5FA]/10 text-[#60A5FA]"
                    }`}
                  >
                    <Droplet size={18} className={waterDone ? "fill-[#3B82F6]" : ""} />
                  </div>
                  <div className="text-left">
                    <p
                      className={`text-[14px] font-medium transition-all duration-300 ${
                        waterDone ? "line-through text-[#9e837a]" : "text-[#1C1917]"
                      }`}
                    >
                      Hidratação · 2L
                    </p>
                    <p className="text-[11px] text-[#9e837a] font-light">Fundamental para o ciclo</p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                    waterDone ? "bg-[#3B82F6] text-white scale-110" : "border border-[#9e837a]/30"
                  }`}
                >
                  {waterDone && <CheckCircle2 size={14} />}
                </div>
              </button>

              {/* Medicamentos */}
              {meds.length > 0 ? (
                <div className="border-t border-[#E5859A]/10 mt-1 pt-1">
                  {meds.map((med) => {
                    const done = completedMedIds.has(med.id);
                    return (
                      <button
                        key={med.id}
                        onClick={() => handleMedToggle(med.id)}
                        disabled={togglingMed === med.id}
                        className={`w-full flex items-center justify-between px-3 py-3.5 rounded-2xl transition-all duration-300 ${
                          done ? "bg-transparent" : "hover:bg-[#FFF5F8]/60"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                              done
                                ? "bg-[#E5859A]/15 text-[#8B3D5A]"
                                : "bg-[#E5859A]/10 text-[#E5859A]"
                            }`}
                          >
                            <Pill size={18} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-[14px] font-medium transition-all duration-300 ${
                                done ? "line-through text-[#9e837a]" : "text-[#1C1917]"
                              }`}
                            >
                              {med.medication_name}
                            </p>
                            <p className="text-[11px] text-[#9e837a] font-light">
                              {done ? "Confirmado hoje" : "Clique para confirmar"}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
                            done
                              ? "bg-[#8B3D5A] text-white scale-110"
                              : "border border-[#9e837a]/30"
                          }`}
                        >
                          {done ? <CheckCircle2 size={14} /> : <Circle size={14} className="text-[#9e837a]/30" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 border-t border-[#E5859A]/10 mt-1">
                  <p className="text-[12px] text-[#9e837a] font-light">
                    Nenhum medicamento ativo no momento.
                  </p>
                  <p className="text-[11px] text-[#9e837a]/60 font-light mt-0.5">
                    Aproveite para descansar. 🌿
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* PROGRESSO E ETAPAS LADO A LADO */}
        {user?.id && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TreatmentProgress userId={user.id} />
            <JourneyTimeline userId={user.id} />
          </div>
        )}
      </div>

      <BottomNav />

      {/* WhatsApp Opt-in Modal */}
      {profile?.id && (
        <WhatsAppOptInModal
          open={showWhatsAppModal}
          onOpenChange={setShowWhatsAppModal}
          userId={profile.id}
        />
      )}
    </div>
  );
}
