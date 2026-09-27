import { Clock, Plus } from "lucide-react";
import { PatientAvatar } from "@/components/PatientAvatar";
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  patient?: { full_name: string; avatar_url?: string | null };
}

interface DoctorTimelineProps {
  appointments: Appointment[];
  onSlotClick: (time: string) => void;
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

const formatTime = (time: string) => {
  const parts = time.split(":");
  return `${parts[0]}:${parts[1]}`;
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    scheduled: "Agendada",
    confirmed: "Confirmada",
    cancelled: "Cancelada",
    completed: "Concluída",
  };
  return map[status] || "Agendada";
};

export function DoctorTimeline({ appointments, onSlotClick }: DoctorTimelineProps) {
  const appointmentMap = new Map<string, Appointment>();
  appointments.forEach((apt) => {
    const key = formatTime(apt.start_time);
    appointmentMap.set(key, apt);
  });

  return (
    <div className="space-y-2">
      {TIME_SLOTS.map((slot) => {
        const apt = appointmentMap.get(slot);
        const isOccupied = !!apt;

        if (isOccupied) {
          return (
            <div
              key={slot}
              className="flex items-stretch gap-3 group"
            >
              {/* Time label */}
              <div className="w-14 shrink-0 flex items-center justify-end pr-2">
                <span className="text-xs font-semibold text-[#434343]">{slot}</span>
              </div>

              {/* Occupied card */}
              <div className="flex-1 bg-[#E5859A] rounded-xl px-4 py-3 shadow-[0_2px_8px_rgba(229,133,154,0.25)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <PatientAvatar
                      avatarUrl={apt.patient?.avatar_url}
                      fullName={apt.patient?.full_name}
                      className="w-8 h-8"
                      fallbackClassName="text-xs bg-white/20 text-white"
                    />
                    <div>
                      <p className="text-sm font-bold text-white font-['Spline_Sans']">
                        {apt.patient?.full_name || "Paciente"}
                      </p>
                      <p className="text-xs text-white/70">
                        {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold bg-white/20 text-white px-2 py-0.5 rounded-full">
                    {getStatusLabel(apt.status || "scheduled")}
                  </span>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={slot}
            className="flex items-stretch gap-3 group cursor-pointer"
            onClick={() => onSlotClick(slot)}
          >
            {/* Time label */}
            <div className="w-14 shrink-0 flex items-center justify-end pr-2">
              <span className="text-xs font-semibold text-[#434343]">{slot}</span>
            </div>

            {/* Available card */}
            <div className={cn(
              "flex-1 border-2 border-dashed border-[#434343]/15 rounded-xl px-4 py-3",
              "hover:border-[#E5859A] hover:bg-[#E5859A]/5 transition-all"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#434343]/60 font-medium">Disponível</span>
                <Plus className="w-4 h-4 text-[#434343]/30 group-hover:text-[#E5859A] transition-colors" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
