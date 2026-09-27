import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Patient {
  id: string;
  full_name: string | null;
  cpf: string | null;
  email: string | null;
}

interface DoctorScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date;
  preselectedTime?: string;
  doctorId: string;
  bookedSlots: string[];
  onSuccess: () => void;
}

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

export function DoctorScheduleModal({
  open,
  onOpenChange,
  selectedDate,
  preselectedTime,
  doctorId,
  bookedSlots,
  onSuccess,
}: DoctorScheduleModalProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedTime, setSelectedTime] = useState(preselectedTime || "");
  const [isSaving, setIsSaving] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTime(preselectedTime || "");
      setSelectedPatient("");
      fetchPatients();
    }
  }, [open, preselectedTime]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    const { data, error } = await supabase.rpc("get_my_patients");

    if (error) {
      console.error("Error fetching patients:", error);
      toast.error("Erro ao carregar pacientes");
    } else {
      setPatients([...(data || [])].sort((a, b) => (a.full_name || "").localeCompare(b.full_name || "")));
    }
    setLoadingPatients(false);
  };

  const isTimeConflict = bookedSlots.includes(selectedTime);

  const handleSave = async () => {
    if (!selectedPatient || !selectedTime) {
      toast.error("Selecione paciente e horário");
      return;
    }

    if (isTimeConflict) {
      toast.error("Horário indisponível");
      return;
    }

    setIsSaving(true);

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const [hours, minutes] = selectedTime.split(":");
    const endHour = String(Number(hours) + 1).padStart(2, "0");
    const endTime = `${endHour}:${minutes}`;

    const { error } = await supabase.from("appointments").insert({
      doctor_id: doctorId,
      patient_id: selectedPatient,
      appointment_date: dateStr,
      start_time: selectedTime,
      end_time: endTime,
      status: "scheduled",
    });

    if (error) {
      console.error("Error scheduling:", error);
      toast.error("Erro ao agendar consulta. Verifique conflitos.");
    } else {
      toast.success("Consulta agendada com sucesso! ✨");
      onSuccess();
      onOpenChange(false);
    }

    setIsSaving(false);
  };

  const availableSlots = TIME_SLOTS.filter((s) => !bookedSlots.includes(s));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-[#434343]/10 rounded-2xl max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-[#121212] font-['Spline_Sans']">
            Agendar Consulta para Paciente
          </DialogTitle>
          <DialogDescription className="text-sm text-[#434343]">
            Preencha os dados abaixo para criar um agendamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Date (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#E5859A] flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              Data
            </label>
            <div className="h-12 rounded-xl bg-[#F5F2F2] border border-[#434343]/10 flex items-center px-4 text-sm font-medium text-[#121212]">
              {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
          </div>

          {/* Patient Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#E5859A] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Paciente
            </label>
            <Select value={selectedPatient} onValueChange={setSelectedPatient}>
              <SelectTrigger className="w-full h-12 rounded-xl bg-white border-[#434343]/20 text-[#121212] focus:ring-2 focus:ring-[#E5859A] focus:border-[#E5859A]">
                <SelectValue placeholder={loadingPatients ? "Carregando..." : "Selecione o paciente"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#434343]/20 shadow-lg rounded-xl max-h-60 z-[100]">
                {patients.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="text-[#121212] hover:bg-[#F5F2F2] focus:bg-[#E5859A]/10 focus:text-[#E5859A] cursor-pointer"
                  >
                    <span className="font-medium">{p.full_name || "Paciente"}</span>
                    {p.cpf && (
                      <span className="text-[#434343] text-xs ml-2">CPF: {p.cpf}</span>
                    )}
                    {!p.cpf && p.email && (
                      <span className="text-[#434343] text-xs ml-2">{p.email}</span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#E5859A] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Horário
            </label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger className="w-full h-12 rounded-xl bg-white border-[#434343]/20 text-[#121212] focus:ring-2 focus:ring-[#E5859A] focus:border-[#E5859A]">
                <SelectValue placeholder="Selecione o horário" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#434343]/20 shadow-lg rounded-xl z-[100]">
                {TIME_SLOTS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <SelectItem
                      key={slot}
                      value={slot}
                      disabled={isBooked}
                      className={
                        isBooked
                          ? "text-[#434343] opacity-50 cursor-not-allowed"
                          : "text-[#121212] hover:bg-[#F5F2F2] focus:bg-[#E5859A]/10 focus:text-[#E5859A] cursor-pointer"
                      }
                    >
                      {slot} {isBooked ? "(Ocupado)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedTime && isTimeConflict && (
              <p className="text-xs text-[#ED2B54] font-medium mt-1">
                ⚠ Horário indisponível. Selecione outro.
              </p>
            )}
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!selectedPatient || !selectedTime || isTimeConflict || isSaving}
            className="w-full h-12 rounded-xl bg-[#E5859A] hover:bg-[#d4748a] text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Confirmar Agendamento"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
