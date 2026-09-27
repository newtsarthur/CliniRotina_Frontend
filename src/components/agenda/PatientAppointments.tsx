import { useCallback, useEffect, useState } from "react";
import { CalendarIcon, Stethoscope, Clock, MessageSquare } from "lucide-react";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface PatientAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  doctor_name: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Agendada",
  pending: "Pendente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  rejected: "Rejeitada",
};

interface PatientAppointmentsProps {
  userId: string;
  filterDate?: Date | null;
  onClearFilter?: () => void;
  onStartBooking?: (date: Date) => void;
}

export function PatientAppointments({ userId, filterDate, onClearFilter, onStartBooking }: PatientAppointmentsProps) {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);

    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, start_time, end_time, status, doctor_id")
      .eq("patient_id", userId)
      .gte("appointment_date", today)
      .not("status", "in", '("cancelled","rejected")')
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching patient appointments:", error);
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const { data: doctors } = await supabase.rpc("get_my_doctor");
      const doctorMap = new Map(doctors?.map((d) => [d.id, d.full_name]) || []);

      setAppointments(
        data.map((a) => ({
          id: a.id,
          appointment_date: a.appointment_date,
          start_time: a.start_time,
          end_time: a.end_time,
          status: a.status || "scheduled",
          doctor_name: doctorMap.get(a.doctor_id) || "Médico(a)",
        }))
      );
    } else {
      setAppointments([]);
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchAppointments();
  }, [fetchAppointments, userId]);

  const formatTime = (time: string) => {
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  };

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s === "confirmed") {
      return "bg-emerald-50 text-emerald-700 border border-emerald-100/50";
    }
    if (s === "cancelled" || s === "rejected") {
      return "bg-red-50 text-red-700 border border-red-100/50";
    }
    return "bg-amber-50 text-amber-700 border border-amber-100/50";
  };

  // Filter appointments by selected date
  const filteredAppointments = filterDate
    ? appointments.filter(
        (apt) => apt.appointment_date === format(filterDate, "yyyy-MM-dd")
      )
    : appointments;

  // Dynamic header
  const getHeaderTitle = () => {
    if (!filterDate) return "Consultas Futuras";
    if (isToday(filterDate)) {
      return `Hoje, ${format(filterDate, "dd 'de' MMMM", { locale: ptBR })}`;
    }
    return format(filterDate, "dd 'de' MMMM", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-bold text-[#1C1917] flex items-center gap-2 px-1">
          <CalendarIcon className="w-4 h-4 text-[#8B3D5A]" />
          Minhas Consultas
        </h2>
        {[1, 2].map((i) => (
          <div key={i} className="bg-white/60 border border-white/70 rounded-2xl p-4 shadow-sm animate-pulse h-[80px]" />
        ))}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[11px] font-bold text-[#9e837a] uppercase tracking-[0.15em] flex items-center gap-2">
          <CalendarIcon className="w-3.5 h-3.5 text-[#8B3D5A]" />
          {getHeaderTitle()}
        </h2>
        {filterDate && onClearFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilter}
            className="text-xs font-bold text-[#8B3D5A] hover:text-[#E5859A] hover:bg-[#FFF5F8] h-7 px-2.5 rounded-xl transition-all"
          >
            Ver Todas
          </Button>
        )}
      </div>

      {filteredAppointments.length === 0 ? (
        <div 
          className="flex flex-col items-center justify-center py-10 px-6 rounded-3xl border border-white/70 shadow-sm text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(253,248,245,0.55) 100%)",
          }}
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] flex items-center justify-center mb-4 border border-[#E5859A]/15 shadow-inner">
            <CalendarIcon className="w-6 h-6 text-[#8B3D5A]" />
          </div>
          <h3 className="text-[15px] font-bold text-[#1C1917] mb-1">Agenda Livre ✨</h3>
          <p className="text-[12.5px] text-[#6A5A56] leading-relaxed max-w-[240px] font-semibold mb-5">
            {filterDate
              ? `Nenhuma consulta agendada para o dia ${format(filterDate, "dd/MM")}.`
              : "Você não possui nenhuma consulta médica agendada."}
          </p>
          {onStartBooking && (
            <Button
              onClick={() => onStartBooking(filterDate || new Date())}
              className="h-10 px-5 rounded-2xl bg-[#E5859A] hover:bg-[#d4748a] text-white text-xs font-bold gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Solicitar Agendamento
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/70 overflow-hidden flex shadow-sm transition-all duration-300 hover:scale-[1.01]"
              style={{
                boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.1)"
              }}
            >
              {/* Pink vertical indicator line */}
              <div className="w-1.5 bg-gradient-to-b from-[#E5859A] to-[#8B3D5A] shrink-0" />

              <div className="flex-1 p-5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Date & Time */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[15px] font-bold text-[#1C1917]">
                      {format(parseISO(apt.appointment_date), "dd 'de' MMMM", {
                        locale: ptBR,
                      })}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="text-[12px] text-[#7a5d56] font-bold flex items-center gap-1.5 bg-[#FFF5F8] border border-[#E5859A]/10 px-2 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5 text-[#8B3D5A]" />
                      {formatTime(apt.start_time)}
                    </span>
                  </div>

                  {/* Doctor */}
                  <p className="text-[13px] text-[#7a5d56] font-semibold flex items-center gap-2 truncate">
                    <Stethoscope className="w-4 h-4 text-[#E5859A] shrink-0" />
                    Dr(a). {apt.doctor_name}
                  </p>
                </div>

                {/* Status badge */}
                <Badge className={`border-0 text-[10.5px] font-bold shrink-0 rounded-xl px-3 py-1 hover:opacity-90 transition-opacity ${getStatusStyle(apt.status)}`}>
                  {STATUS_LABELS[apt.status] || apt.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
