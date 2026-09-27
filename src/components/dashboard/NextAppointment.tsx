import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock } from "lucide-react";

interface AppointmentData {
  appointment_date: string;
  start_time: string;
  doctor_name: string;
}

export function NextAppointment({ userId }: { userId: string }) {
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toLocaleDateString("en-CA");

      const { data } = await supabase
        .from("appointments")
        .select("appointment_date, start_time, doctor_id")
        .eq("patient_id", userId)
        .gte("appointment_date", today)
        .not("status", "in", '("cancelled","rejected")')
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(1);

      if (data && data.length > 0) {
        const apt = data[0];
        const { data: doctors } = await supabase.rpc("get_my_doctor");
        const doc = doctors?.find((doctor) => doctor.id === apt.doctor_id);

        setAppointment({
          appointment_date: apt.appointment_date,
          start_time: apt.start_time,
          doctor_name: doc?.full_name || "Médico(a)",
        });
      }
      setLoading(false);
    };
    fetch();
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
        Próxima Consulta
      </h3>

      {appointment ? (
        <div className="rounded-[32px] border border-[#F3F4F6] bg-[#F8F6F6] p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#E5859A]/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6 text-[#E5859A]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#171213] leading-6 truncate">
              Dr(a). {appointment.doctor_name}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-[#85666D] font-medium">
                {format(parseISO(appointment.appointment_date), "dd 'de' MMM", { locale: ptBR })}
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#85666D]" />
                <span className="text-sm text-[#85666D] font-medium">
                  {appointment.start_time.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-[32px] border border-dashed border-[#D1D5DB] bg-[#F8F6F6] p-5 text-center">
          <p className="text-sm text-[#85666D] font-medium">
            Nenhuma consulta próxima. Agende pelo menu <span className="font-bold text-[#E5859A]">Agenda</span>.
          </p>
        </div>
      )}
    </section>
  );
}
