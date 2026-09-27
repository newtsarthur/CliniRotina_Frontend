import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Calendar as CalendarIcon, Clock, User, Plus, Pill, FlaskConical } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatName } from "@/lib/utils";

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  status: string;
}

interface TodayLog {
  prescription_id: string | null;
}

interface ProtocolMedItem {
  title: string;
  scheduled_date: string;
}

interface AppointmentRow {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  type: string | null;
  notes: string | null;
  doctor_id: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string | null;
  type: string | null;
  notes: string | null;
  doctor_id: string;
  doctor?: { full_name: string | null };
}


export default function Plano() {
  const { profile, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"medicamentos" | "consultas">("medicamentos");
  const [doctorName, setDoctorName] = useState<string | null>(() => {
    return localStorage.getItem("sb_cached_doctor_name") || null;
  });

  const firstName = formatName(profile?.full_name?.split(" ")[0]) || "Paciente";
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch doctor name from protocol
  useEffect(() => {
    if (!user) return;
    const fetchDoctor = async () => {
      const { data } = await supabase.rpc("get_my_doctor");
      const doc = data?.[0];
      if (doc?.full_name) {
        const formatted = formatName(doc.full_name);
        setDoctorName(formatted);
        localStorage.setItem("sb_cached_doctor_name", formatted);
      }
    };
    fetchDoctor();
  }, [user]);

  // Fetch protocol medication items to know which meds are date-specific
  const { data: protocolMedItems } = useQuery({
    queryKey: ["protocol-med-items", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_items")
        .select("title, scheduled_date")
        .eq("patient_id", user!.id)
        .eq("event_type", "Medicamento");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch active prescriptions
  const { data: allPrescriptions, isLoading: loadingMeds } = useQuery({
    queryKey: ["prescriptions-active", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, medication_name, dosage, frequency, status, start_date")
        .eq("patient_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Prescription & { start_date: string | null })[];
    },
    enabled: !!user,
  });

  // Fetch today's logs to know which meds were taken
  const { data: todayLogs } = useQuery({
    queryKey: ["patient-logs-today", user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_logs")
        .select("prescription_id")
        .eq("patient_id", user!.id)
        .eq("type", "medication")
        .eq("taken_date", today);
      if (error) throw error;
      return data as TodayLog[];
    },
    enabled: !!user,
  });

  // Fetch appointments (Consultas + Retornos)
  const { data: consultas, isLoading: loadingConsultas } = useQuery({
    queryKey: ["patient-consultas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, start_time, end_time, status, type, notes, doctor_id")
        .eq("patient_id", user!.id)
        .in("type", ["Consulta", "Retorno"])
        .order("appointment_date", { ascending: true });
      if (error) throw error;
      const appointments = (data || []) as AppointmentRow[];
      const { data: doctors } = await supabase.rpc("get_my_doctor");
      const linkedDoctor = doctors?.[0];
      return appointments.map((a) => ({
        ...a,
        doctor: {
          full_name: a.doctor_id === linkedDoctor?.id ? formatName(linkedDoctor.full_name) : null,
        },
      })) as Appointment[];
    },
    enabled: !!user,
  });

  // Fetch exams from protocol_items (event_type = Exame)
  const { data: exames, isLoading: loadingExames } = useQuery({
    queryKey: ["patient-exames-protocol", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocol_items")
        .select("id, title, event_type, scheduled_date, scheduled_time, status")
        .eq("patient_id", user!.id)
        .eq("event_type", "Exame")
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Mark medication as taken through the transactional database routine.
  const markTakenMutation = useMutation({
    mutationFn: async (prescriptionId: string) => {
      const { error } = await supabase.rpc("record_medication_check", {
        p_prescription_id: prescriptionId,
        p_taken: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Medicamento marcado como tomado!", {
        style: { background: "#10B981", color: "#fff", border: "none" },
      });
      queryClient.invalidateQueries({ queryKey: ["patient-logs-today", user?.id, today] });
      queryClient.invalidateQueries({ queryKey: ["patient-actions"] });
    },
    onError: () => {
      toast.error("Erro ao registrar medicamento. Tente novamente.");
    },
  });

  // Filter prescriptions: only show meds scheduled for today (or general meds without protocol entries)
  const prescriptions = (() => {
    if (!allPrescriptions) return [];
    const protocolItems = (protocolMedItems || []) as ProtocolMedItem[];
    const medsWithProtocol = new Set(protocolItems.map((p) => p.title.toLowerCase()));
    const medsScheduledToday = new Set(
      protocolItems.filter((p) => p.scheduled_date === today).map((p) => p.title.toLowerCase())
    );
    return allPrescriptions.filter((m) => {
      if (m.start_date && m.start_date > today) return false;
      const nameKey = m.medication_name?.toLowerCase();
      if (medsWithProtocol.has(nameKey)) return medsScheduledToday.has(nameKey);
      return true;
    });
  })();

  const takenIds = new Set(todayLogs?.map((l) => l.prescription_id) || []);
  const totalMeds = prescriptions.length;
  const takenCount = prescriptions.filter((p) => takenIds.has(p.id)).length;
  const pendingCount = totalMeds - takenCount;

  const upcomingConsultas = consultas?.filter((a) => a.status !== "cancelled" && a.appointment_date >= today) || [];
  const upcomingExames = exames?.filter((a) => a.status !== "cancelled" && a.scheduled_date >= today) || [];
  const pastConsultas = consultas?.filter((a) => a.appointment_date < today) || [];

  const handleAgendarWhatsApp = () => {
    toast.success("Redirecionando para o WhatsApp da clínica...", {
      style: { background: "#121212", color: "#fff", border: "none" },
    });
    const numeroClinica = "558183105992";
    const mensagem = encodeURIComponent("Olá! Sou paciente e gostaria de agendar uma nova consulta.");
    setTimeout(() => window.open(`https://wa.me/${numeroClinica}?text=${mensagem}`, "_blank"), 1500);
  };

  const isLoading = activeTab === "medicamentos" ? loadingMeds : (loadingConsultas || loadingExames);

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
      <header className="px-6 pt-12 pb-2">
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight mb-1">Meu Plano</h1>
        <p className="text-[14px] text-[#5C4D49] font-medium leading-relaxed mb-6">
          {activeTab === "medicamentos"
            ? (doctorName
              ? `Aqui estão os medicamentos prescritos pelo Dr(a). ${doctorName} para você, ${firstName}.`
              : `Aqui estão os medicamentos prescritos para você, ${firstName}.`)
            : `Acompanhe seus agendamentos de rotina, ${firstName}.`}
        </p>
        <div className="flex bg-white/40 backdrop-blur-sm border border-white/60 p-1.5 rounded-full w-full shadow-sm">
          <button
            onClick={() => setActiveTab("medicamentos")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
              activeTab === "medicamentos" 
                ? "bg-white text-[#1C1917] shadow-md scale-[1.01]" 
                : "text-[#9e837a] hover:text-[#1C1917]"
            }`}
          >
            Medicamentos
          </button>
          <button
            onClick={() => setActiveTab("consultas")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all duration-300 ${
              activeTab === "consultas" 
                ? "bg-white text-[#1C1917] shadow-md scale-[1.01]" 
                : "text-[#9e837a] hover:text-[#1C1917]"
            }`}
          >
            Consultas e Exames
          </button>
        </div>
      </header>

      <main className="px-5 mt-6 space-y-5">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-40 w-full rounded-3xl" />
          </div>
        ) : (
          <>
            {/* ===== ABA MEDICAMENTOS ===== */}
            {activeTab === "medicamentos" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Dashboard */}
                <div 
                  className="rounded-3xl p-5 backdrop-blur-md border border-white/70 flex justify-between items-center text-center"
                  style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 30px -15px rgba(139, 61, 90, 0.12)" }}
                >
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Hoje</p>
                    <p className="text-2xl font-bold text-[#1C1917]">{totalMeds}</p>
                    <p className="text-[10px] text-[#9e837a] mt-1">itens</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5859A]/15" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Pendentes</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${pendingCount > 0 ? "text-[#E5859A]" : "text-[#9e837a]"}`}>
                      {pendingCount}
                    </p>
                    <p className="text-[10px] text-[#9e837a] mt-1">para hoje</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5859A]/15" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Tomados</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${takenCount > 0 ? "text-[#10B981]" : "text-[#9e837a]"}`}>
                      {takenCount}
                    </p>
                    <p className="text-[10px] text-[#9e837a] mt-1">concluídos</p>
                  </div>
                </div>

                {/* Medication cards */}
                <div className="space-y-4">
                  {prescriptions && prescriptions.length > 0 ? (
                    prescriptions.map((med) => {
                      const isTaken = takenIds.has(med.id);
                      return (
                        <div 
                          key={med.id} 
                          className="rounded-[32px] p-5 backdrop-blur-md border border-white/70"
                          style={{ 
                            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
                            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
                          }}
                        >
                          <div className="flex items-center gap-3 mb-1">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center">
                              <Pill size={20} className="text-[#8B3D5A]" />
                            </div>
                            <div>
                              <h3 className="text-[17px] font-bold text-[#1C1917]">{med.medication_name}</h3>
                              <p className="text-[13px] text-[#9e837a]">
                                {[med.dosage, med.frequency].filter(Boolean).join(" • ") || "Uso conforme prescrição"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-4 mb-5">
                            <span className={`text-[10px] uppercase tracking-[0.1em] font-bold px-3 py-1 rounded-full ${isTaken ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" : "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20"}`}>
                              {isTaken ? "Tomado" : "Pendente"}
                            </span>
                          </div>

                          {isTaken ? (
                            <div className="bg-[#10B981]/5 text-[#10B981] font-bold text-sm text-center py-3.5 rounded-2xl flex items-center justify-center gap-2 border border-[#10B981]/10">
                              <Check size={18} strokeWidth={3} /> Tomado com sucesso
                            </div>
                          ) : (
                            <button
                              disabled={markTakenMutation.isPending}
                              onClick={() => markTakenMutation.mutate(med.id)}
                              className="w-full bg-[#E5859A] text-white font-bold text-sm text-center py-4 rounded-2xl shadow-sm hover:bg-[#D47489] active:scale-[0.97] transition-all disabled:opacity-60"
                            >
                              Marcar como Tomado
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      className="text-center py-10 px-6 rounded-[32px] backdrop-blur-md border border-white/70 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(253,248,245,0.55) 100%)",
                      }}
                    >
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center mx-auto mb-4 border border-[#E5859A]/20 shadow-inner">
                        <Pill size={28} className="text-[#8B3D5A]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#1C1917] mb-2">Seu plano está sendo preparado ✨</h3>
                      <p className="text-[#6A5A56] text-[13px] leading-relaxed max-w-[280px] mx-auto font-medium">
                        Seu médico ainda não prescreveu medicações. Isso é super normal nesta fase ou antes da primeira consulta. Caso tenha dúvidas, fale conosco pelo WhatsApp.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== ABA CONSULTAS E EXAMES ===== */}
            {activeTab === "consultas" && (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Dashboard */}
                <div 
                  className="rounded-3xl p-5 backdrop-blur-md border border-white/70 flex justify-between items-center text-center"
                  style={{ background: "rgba(255,255,255,0.85)", boxShadow: "0 8px 30px -15px rgba(139, 61, 90, 0.12)" }}
                >
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Consultas</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${upcomingConsultas.length > 0 ? "text-[#8B3D5A]" : "text-[#9e837a]"}`}>
                      {upcomingConsultas.length}
                    </p>
                    <p className="text-[10px] text-[#9e837a] mt-1">agendadas</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5859A]/15" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Exames</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${upcomingExames.length > 0 ? "text-[#8B3D5A]" : "text-[#9e837a]"}`}>
                      {upcomingExames.length}
                    </p>
                    <p className="text-[10px] text-[#9e837a] mt-1">agendados</p>
                  </div>
                  <div className="w-px h-10 bg-[#E5859A]/15" />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#9e837a] font-medium mb-1">Realizadas</p>
                    <p className={`text-2xl font-bold transition-colors duration-300 ${pastConsultas.length > 0 ? "text-[#10B981]" : "text-[#9e837a]"}`}>
                      {pastConsultas.length}
                    </p>
                    <p className="text-[10px] text-[#9e837a] mt-1">anteriores</p>
                  </div>
                </div>
                
                <button
                  onClick={handleAgendarWhatsApp}
                  className="w-full bg-[#E5859A] text-white font-extrabold text-[16px] flex items-center justify-center gap-2 py-5 rounded-[24px] shadow-lg shadow-pink-500/10 hover:bg-[#D47489] active:scale-[0.97] transition-all border border-white/20"
                >
                  <Plus size={22} strokeWidth={3} /> Agendar Nova Consulta
                </button>

                {/* Box 1 — Consultas */}
                <div className="space-y-4">
                  <h2 className="text-[11px] font-bold text-[#9e837a] uppercase tracking-[0.15em] px-1">Consultas</h2>
                  {upcomingConsultas.length > 0 ? (
                    upcomingConsultas.map((appt) => {
                      const dateLabel = format(parseISO(appt.appointment_date), "dd MMM yyyy", { locale: ptBR });
                      const statusLabel = appt.status === "confirmed" ? "Confirmada" : appt.status === "cancelled" ? "Cancelada" : "Agendada";
                      return (
                        <div 
                          key={appt.id} 
                          className="rounded-[32px] p-5 backdrop-blur-md border border-white/70"
                          style={{ 
                            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
                            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-[17px] font-bold text-[#1C1917]">{appt.type || "Consulta"}</h3>
                            <span className="text-[10px] uppercase tracking-[0.05em] font-bold px-3 py-1.5 rounded-full bg-[#E5859A] text-white">
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon size={14} className="text-[#8B3D5A]" />
                              <span className="text-sm text-[#9e837a]">{dateLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-[#8B3D5A]" />
                              <span className="text-sm text-[#9e837a]">
                                {appt.start_time?.toString().slice(0, 5) || "A definir"}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-[#E5859A]/15 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#FFF5F8] flex items-center justify-center">
                              <User size={12} className="text-[#8B3D5A]" />
                            </div>
                            <p className="text-sm text-[#1C1917] font-medium">
                              {appt.doctor?.full_name || "Médica responsável"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      className="text-center py-10 px-6 rounded-[32px] backdrop-blur-md border border-white/70 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(253,248,245,0.55) 100%)",
                      }}
                    >
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center mx-auto mb-4 border border-[#E5859A]/20 shadow-inner">
                        <CalendarIcon size={28} className="text-[#8B3D5A]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#1C1917] mb-2">Tudo tranquilo por aqui</h3>
                      <p className="text-[#6A5A56] text-[13px] leading-relaxed max-w-[280px] mx-auto font-medium">
                        Você não tem nenhuma consulta agendada para os próximos dias. Agende uma consulta para dar início ou sequência ao seu ciclo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Box 2 — Exames */}
                <div className="space-y-4">
                  <h2 className="text-[11px] font-bold text-[#9e837a] uppercase tracking-[0.15em] px-1">Exames</h2>
                  {upcomingExames.length > 0 ? (
                    upcomingExames.map((exam) => {
                      const dateLabel = format(parseISO(exam.scheduled_date), "dd MMM yyyy", { locale: ptBR });
                      const statusLabel = exam.status === "concluido" ? "Concluído" : exam.status === "cancelled" ? "Cancelado" : "Agendada";
                      return (
                        <div 
                          key={exam.id} 
                          className="rounded-[32px] p-5 backdrop-blur-md border border-white/70"
                          style={{ 
                            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
                            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center">
                                <FlaskConical size={20} className="text-[#8B3D5A]" />
                              </div>
                              <h3 className="text-[17px] font-bold text-[#1C1917]">{exam.title || "Exame"}</h3>
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.05em] font-bold px-3 py-1.5 rounded-full bg-[#E5859A] text-white">
                              {statusLabel}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon size={14} className="text-[#8B3D5A]" />
                              <span className="text-sm text-[#9e837a]">{dateLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} className="text-[#8B3D5A]" />
                              <span className="text-sm text-[#9e837a]">
                                {exam.scheduled_time?.toString().slice(0, 5) || "A definir"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      className="text-center py-10 px-6 rounded-[32px] backdrop-blur-md border border-white/70 shadow-sm"
                      style={{
                        background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(253,248,245,0.55) 100%)",
                      }}
                    >
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center mx-auto mb-4 border border-[#E5859A]/20 shadow-inner">
                        <FlaskConical size={28} className="text-[#8B3D5A]" />
                      </div>
                      <h3 className="text-[16px] font-bold text-[#1C1917] mb-2">Nenhum exame pendente</h3>
                      <p className="text-[#6A5A56] text-[13px] leading-relaxed max-w-[280px] mx-auto font-medium">
                        Seus exames prescritos e solicitações laboratoriais aparecerão aqui assim que solicitados pela equipe médica.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
