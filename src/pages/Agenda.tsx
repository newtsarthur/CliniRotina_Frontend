import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { DoctorBottomNav } from "@/components/DoctorBottomNav";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, Stethoscope, ChevronLeft, Plus } from "lucide-react";
import { format, addHours, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DoctorTimeline } from "@/components/agenda/DoctorTimeline";
import { DoctorScheduleModal } from "@/components/agenda/DoctorScheduleModal";
import { PatientAppointments } from "@/components/agenda/PatientAppointments";

interface Doctor {
  id: string;
  full_name: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  patient_id?: string;
  patient?: {
    full_name: string;
  };
  doctor?: {
    full_name: string;
  };
}

// Time slots from 08:00 to 17:00
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export default function Agenda() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isDoctor = profile?.user_type === "doctor";
  const homeRoute = isDoctor ? "/pacientes" : "/profile";

  // Patient state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [patientAppointments, setPatientAppointments] = useState<Appointment[]>([]);

  // Doctor state
  const [isLoading, setIsLoading] = useState(true);
  const [doctorSelectedDate, setDoctorSelectedDate] = useState<Date>(new Date());
  const [doctorDayAppointments, setDoctorDayAppointments] = useState<Appointment[]>([]);
  const [doctorBookedSlots, setDoctorBookedSlots] = useState<string[]>([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>(undefined);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [patientCalendarDate, setPatientCalendarDate] = useState<Date>(new Date());
  const [filterByDate, setFilterByDate] = useState<Date | null>(new Date());

  const fetchDoctors = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_my_doctor");

    if (error) {
      console.error("Error fetching doctors:", error);
      toast.error("Erro ao carregar médicos");
      return;
    }

    setDoctors((data || []).map((doctor) => ({
      id: doctor.id,
      full_name: doctor.full_name || "Médico(a)",
    })));

    // Preselect doctor if only one is returned
    if (data && data.length === 1) {
      setSelectedDoctor(data[0].id);
    }
  }, []);

  const fetchPatientAppointments = useCallback(async () => {
    if (!user?.id || isDoctor) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("id, appointment_date, start_time, end_time, status, doctor_id")
      .eq("patient_id", user.id)
      .not("status", "in", '("cancelled","rejected")')
      .order("appointment_date", { ascending: true });

    if (!error && data) {
      setPatientAppointments(data);
    }
  }, [user?.id, isDoctor]);

  const fetchBookedSlots = useCallback(async () => {
    if (!selectedDoctor || !selectedDate) return;

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("appointments")
      .select("start_time")
      .eq("doctor_id", selectedDoctor)
      .eq("appointment_date", dateStr)
      .not("status", "in", '("cancelled","rejected")');

    if (error) {
      console.error("Error fetching booked slots:", error);
      return;
    }

    const booked = (data || []).map(apt => {
      const timeParts = apt.start_time.split(":");
      return `${timeParts[0]}:${timeParts[1]}`;
    });
    
    setBookedSlots(booked);
  }, [selectedDate, selectedDoctor]);

  const fetchDoctorAppointments = useCallback(async () => {
    setIsLoading(true);

    const dateStr = format(doctorSelectedDate, "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        patient_id
      `)
      .eq("doctor_id", user?.id)
      .eq("appointment_date", dateStr)
      .not("status", "in", '("cancelled","rejected")')
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Erro ao carregar agendamentos");
      setIsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const { data: patients } = await supabase.rpc("get_my_patients");

      const patientMap = new Map(patients?.map(p => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }]) || []);

      const appointmentsWithNames = data.map(apt => ({
        ...apt,
        patient: {
          full_name: patientMap.get(apt.patient_id)?.full_name || "Paciente",
          avatar_url: patientMap.get(apt.patient_id)?.avatar_url || null,
        }
      }));

      setDoctorDayAppointments(appointmentsWithNames);
      
      const booked = appointmentsWithNames.map(apt => {
        const parts = apt.start_time.split(":");
        return `${parts[0]}:${parts[1]}`;
      });
      setDoctorBookedSlots(booked);
    } else {
      setDoctorDayAppointments([]);
      setDoctorBookedSlots([]);
    }

    setIsLoading(false);
  }, [doctorSelectedDate, user?.id]);

  useEffect(() => {
    if (profile && !isDoctor) {
      fetchDoctors();
      fetchPatientAppointments();
    }
  }, [fetchDoctors, fetchPatientAppointments, isDoctor, profile]);

  useEffect(() => {
    if (isDoctor && user?.id) {
      fetchDoctorAppointments();
    }
  }, [fetchDoctorAppointments, isDoctor, user?.id]);

  useEffect(() => {
    if (!isDoctor && selectedDoctor && selectedDate) {
      fetchBookedSlots();
    }
  }, [fetchBookedSlots, isDoctor, selectedDate, selectedDoctor]);

  const handleBookAppointment = async (timeSlot: string) => {
    if (!user?.id || !selectedDoctor || !selectedDate) {
      toast.error("Por favor, selecione médico e data");
      return;
    }

    setIsBooking(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const startTime = timeSlot;
    
    const startDate = parse(timeSlot, "HH:mm", new Date());
    const endDate = addHours(startDate, 1);
    const endTime = format(endDate, "HH:mm");

    const { error } = await supabase
      .from("appointments")
      .insert({
        patient_id: user.id,
        doctor_id: selectedDoctor,
        appointment_date: dateStr,
        start_time: startTime,
        end_time: endTime,
        status: "scheduled"
      });

    if (error) {
      console.error("Error booking appointment:", error);
      toast.error("Erro ao agendar consulta. Tente novamente.");
      setIsBooking(false);
      return;
    }

    toast.success("Consulta agendada com sucesso! ✨");
    
    await fetchBookedSlots();
    await fetchPatientAppointments();
    setShowBookingForm(false);
    setIsBooking(false);
  };

  const handleTimelineSlotClick = (time: string) => {
    setPreselectedTime(time);
    setScheduleModalOpen(true);
  };

  const handleScheduleSuccess = () => {
    fetchDoctorAppointments();
  };

  const handleStartBooking = (date?: Date) => {
    const formattedDate = date ? format(date, "dd/MM/yyyy") : "";
    const textMsg = formattedDate 
      ? `Olá! Sou paciente e gostaria de agendar uma nova consulta para o dia ${formattedDate}.`
      : "Olá! Sou paciente e gostaria de agendar uma nova consulta.";
    
    toast.success("Redirecionando para o WhatsApp da clínica...", {
      style: { background: "#121212", color: "#fff", border: "none" },
    });
    
    const numeroClinica = "558183105992";
    const mensagem = encodeURIComponent(textMsg);
    setTimeout(() => window.open(`https://wa.me/${numeroClinica}?text=${mensagem}`, "_blank"), 1500);
  };

  // Modifier to highlight dates with consultations timezone-safely
  const appointmentDateKeys = new Set(patientAppointments.map(apt => apt.appointment_date));
  const isAppointment = (date: Date) => {
    const key = format(date, "yyyy-MM-dd");
    return appointmentDateKeys.has(key);
  };

  // DOCTOR VIEW
  if (isDoctor) {
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
        
        {/* Header */}
        <header className="px-6 pt-12 pb-2">
          <div className="max-w-md mx-auto flex justify-between items-center">
            <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">
              Agenda
            </h1>
            <Button
              onClick={() => { setPreselectedTime(undefined); setScheduleModalOpen(true); }}
              className="h-10 px-4 rounded-2xl bg-[#E5859A] hover:bg-[#D47489] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Agendar
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-md mx-auto pb-24 px-6 pt-6">
          <div className="flex flex-col gap-6">
            <div className="lg:w-auto shrink-0">
              <div className="bg-white/75 backdrop-blur-md rounded-[28px] border border-white/70 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] p-3">
                <Calendar
                  mode="single"
                  selected={doctorSelectedDate}
                  onSelect={(date) => date && setDoctorSelectedDate(date)}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                  classNames={{
                    day_selected: "bg-[#E5859A] text-white hover:bg-[#E5859A] hover:text-white focus:bg-[#E5859A] focus:text-white rounded-full",
                    day_today: "relative text-[#1C1917] font-bold after:content-[''] after:absolute after:bottom-[2px] after:left-1/2 after:-translate-x-1/2 after:w-3.5 after:h-[2px] after:bg-[#E5859A] after:rounded-full aria-selected:after:hidden",
                    day: "text-[#1C1917] hover:bg-[#E5859A]/10 focus:bg-[#E5859A]/10 rounded-full",
                  }}
                />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-bold text-[#1C1917]">
                  {format(doctorSelectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </h2>
                <span className="text-[11px] font-bold text-[#8B3D5A] bg-white/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-white/70 shadow-sm">
                  {doctorDayAppointments.length} consulta{doctorDayAppointments.length !== 1 ? "s" : ""}
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex-1 bg-white/60 rounded-2xl p-4 animate-pulse shadow-sm h-16" />
                  ))}
                </div>
              ) : (
                <DoctorTimeline
                  appointments={doctorDayAppointments}
                  onSlotClick={handleTimelineSlotClick}
                />
              )}
            </div>
          </div>
        </main>

        <DoctorScheduleModal
          open={scheduleModalOpen}
          onOpenChange={setScheduleModalOpen}
          selectedDate={doctorSelectedDate}
          preselectedTime={preselectedTime}
          doctorId={user?.id || ""}
          bookedSlots={doctorBookedSlots}
          onSuccess={handleScheduleSuccess}
        />

        <DoctorBottomNav />
      </div>
    );
  }

  // PATIENT VIEW
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

      {/* Header */}
      <header className="px-6 pt-12 pb-2">
        <div className="flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(homeRoute)}
              className="p-2.5 -ml-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
              aria-label="Voltar"
            >
              <ChevronLeft className="w-5 h-5 text-[#1C1917]" />
            </button>
            <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">
              Agenda
            </h1>
          </div>
          <Button
            onClick={() => handleStartBooking()}
            className="h-10 px-4 rounded-2xl bg-[#E5859A] hover:bg-[#D47489] text-white text-xs font-bold gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nova Consulta
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="pb-24 px-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Calendar */}
          <div className="lg:w-auto shrink-0 animate-fade-in">
            <div className="bg-white/75 backdrop-blur-md rounded-[28px] border border-white/70 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] p-3">
              <Calendar
                mode="single"
                selected={patientCalendarDate}
                onSelect={(date) => {
                  if (date) {
                    setPatientCalendarDate(date);
                    setFilterByDate(date);
                  }
                }}
                locale={ptBR}
                className="p-3 pointer-events-auto"
                modifiers={{
                  hasAppointment: isAppointment
                }}
                modifiersClassNames={{
                  hasAppointment: "underline decoration-2 decoration-[#E5859A] font-extrabold text-[#8B3D5A]"
                }}
                classNames={{
                  day_selected: "bg-[#E5859A] text-white hover:bg-[#E5859A] hover:text-white focus:bg-[#E5859A] focus:text-white rounded-full",
                  day_today: "relative text-[#1C1917] font-bold after:content-[''] after:absolute after:bottom-[2px] after:left-1/2 after:-translate-x-1/2 after:w-3.5 after:h-[2px] after:bg-[#E5859A] after:rounded-full aria-selected:after:hidden",
                  day: "text-[#1C1917] hover:bg-[#E5859A]/10 focus:bg-[#E5859A]/10 rounded-full",
                }}
              />
            </div>
          </div>

          {/* Right Column: Appointments */}
          <div className="flex-1 min-w-0 space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {user?.id && (
              <PatientAppointments
                userId={user.id}
                filterDate={filterByDate}
                onClearFilter={() => setFilterByDate(null)}
                onStartBooking={handleStartBooking}
              />
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
