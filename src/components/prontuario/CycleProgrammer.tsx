import { useState, useEffect } from "react";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, Loader2, Send, Repeat } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CatalogCombobox } from "@/components/catalog/CatalogCombobox";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface EventItem {
  id: string;
  event_type: string;
  title: string;
  scheduled_date: Date | undefined;
  scheduled_time: string;
  description: string;
  is_recurring: boolean;
  end_date: Date | undefined;
}

interface CatalogItem {
  id: string;
  name: string;
  category: string;
  dosage_unit: string | null;
}

type EventUpdateValue<K extends keyof EventItem> = EventItem[K];

interface ProtocolItemInsert {
  protocol_id: string;
  patient_id: string;
  event_type: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  description: string | null;
}

const createEmptyEvent = (): EventItem => ({
  id: crypto.randomUUID(),
  event_type: "",
  title: "",
  scheduled_date: undefined,
  scheduled_time: "",
  description: "",
  is_recurring: false,
  end_date: undefined,
});

const calendarClassNames = {
  caption_label: "text-sm font-bold text-[#E5859A]",
  nav_button: "h-7 w-7 bg-transparent p-0 flex items-center justify-center rounded-md text-gray-700 hover:text-[#E5859A] hover:bg-[#E5859A]/10 transition-colors",
  head_cell: "text-gray-700 rounded-md w-9 font-medium text-[0.8rem]",
  day: "h-9 w-9 p-0 font-normal text-gray-900 hover:bg-[#E5859A]/10 hover:text-[#E5859A] rounded-md",
  day_selected: "bg-[#E5859A] text-white hover:bg-[#E5859A]/90 hover:text-white focus:bg-[#E5859A] focus:text-white",
  day_today: "bg-gray-100 text-gray-900 font-semibold",
  day_outside: "text-gray-400 opacity-50",
  day_disabled: "text-gray-400 opacity-40",
};

const PHASE_OPTIONS = [
  "Avaliação Inicial",
  "Estimulação Ovariana",
  "Monitoramento",
  "Punção Folicular",
  "Fertilização",
  "Transferência",
  "Teste de Gravidez",
];

export function CycleProgrammer({ patientId }: { patientId: string }) {
  const { user } = useAuth();
  const [phaseName, setPhaseName] = useState("");
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load catalog items for search/suggestions
  useEffect(() => {
    supabase
      .from("clinic_catalog")
      .select("id, name, category, dosage_unit")
      .then(({ data }) => {
        if (data) setCatalog(data as CatalogItem[]);
      });
  }, []);

  // Prefill phaseName and message if patient has an active protocol in progress
  useEffect(() => {
    if (!patientId) return;
    
    supabase
      .from("protocols")
      .select("phase_name, message")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.phase_name) setPhaseName(data.phase_name);
          if (data.message) setMessage(data.message);
        }
      });
  }, [patientId]);

  const addEvent = () => setEvents((prev) => [...prev, createEmptyEvent()]);

  const removeEvent = (id: string) =>
    setEvents((prev) => prev.filter((e) => e.id !== id));

  const updateEvent = <K extends keyof EventItem>(id: string, field: K, value: EventUpdateValue<K>) =>
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );

  const getSuggestions = (type: string) => {
    const categoryMap: Record<string, string> = {
      Medicamento: "medication",
      Exame: "exam",
      Consulta: "appointment",
    };
    return catalog
      .filter((c) => c.category === categoryMap[type])
      .map((c) => ({ name: c.name, dosage_unit: c.dosage_unit }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!phaseName) {
      toast.error("Selecione a Fase do Tratamento.");
      return;
    }

    if (events.length === 0) {
      toast.error("Adicione pelo menos uma tarefa/evento.");
      return;
    }

    const invalid = events.find((e) => {
      if (!e.event_type || !e.title || !e.scheduled_date) return true;
      if (e.is_recurring && !e.end_date) return true;
      return false;
    });
    if (invalid) {
      toast.error("Preencha todos os campos obrigatórios de cada evento.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Deactivate existing active protocols for this patient to transition/overwrite
      await supabase
        .from("protocols")
        .update({ is_active: false })
        .eq("patient_id", patientId)
        .eq("is_active", true);

      // 2. Insert new protocol
      const { data: protocol, error: protocolError } = await supabase
        .from("protocols")
        .insert({
          patient_id: patientId,
          doctor_id: user.id,
          message: message || null,
          phase_name: phaseName,
          is_active: true
        })
        .select("id")
        .single();

      if (protocolError) throw protocolError;

      // 3. Expand recurring events into individual items
      const items: ProtocolItemInsert[] = [];
      for (const e of events) {
        if (e.is_recurring && e.end_date) {
          const days = eachDayOfInterval({ start: e.scheduled_date!, end: e.end_date });
          for (const day of days) {
            items.push({
              protocol_id: protocol.id,
              patient_id: patientId,
              event_type: e.event_type,
              title: e.title,
              scheduled_date: format(day, "yyyy-MM-dd"),
              scheduled_time: e.scheduled_time || null,
              description: e.description || null,
            });
          }
        } else {
          items.push({
            protocol_id: protocol.id,
            patient_id: patientId,
            event_type: e.event_type,
            title: e.title,
            scheduled_date: format(e.scheduled_date!, "yyyy-MM-dd"),
            scheduled_time: e.scheduled_time || null,
            description: e.description || null,
          });
        }
      }

      const { error: itemsError } = await supabase
        .from("protocol_items")
        .insert(items);

      if (itemsError) throw itemsError;

      // 4. Also create prescriptions for medication-type events
      const medicationEvents = events.filter((e) => e.event_type === "Medicamento");
      if (medicationEvents.length > 0) {
        const prescriptionRows = medicationEvents.map((e) => ({
          patient_id: patientId,
          doctor_id: user.id,
          medication_name: e.title,
          status: "active",
        }));

        const { error: prescError } = await supabase
          .from("prescriptions")
          .insert(prescriptionRows);

        if (prescError) {
          console.error("Error creating prescriptions:", prescError);
        }
      }

      toast.success(`Protocolo salvo! ${items.length} evento(s) criado(s).`);
      setEvents([]);
    } catch (err) {
      console.error("Error saving protocol:", err);
      toast.error("Erro ao salvar protocolo. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Phase Select */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)]">
        <label className="text-[13px] font-bold text-[#1C1917] block mb-2">
          Fase do Tratamento <span className="text-[#E5859A]">*</span>
        </label>
        <Select value={phaseName} onValueChange={setPhaseName}>
          <SelectTrigger className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus:ring-[#E5859A]/30 rounded-xl h-12">
            <SelectValue placeholder="Selecione a fase" />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-gray-900 shadow-md">
            {PHASE_OPTIONS.map((phase) => (
              <SelectItem key={phase} value={phase} className="text-gray-800 focus:bg-[#E5859A]/10 focus:text-gray-900">
                {phase}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Message */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)]">
        <label className="text-[13px] font-bold text-[#1C1917] block mb-2">
          Mensagem / Recado para o Paciente
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Olá! Segue a programação do seu ciclo..."
          className="min-h-[100px] bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a] focus-visible:ring-[#E5859A]/30 rounded-xl resize-none"
        />
      </div>

      {/* Events */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#1C1917]">
            Tarefas / Eventos ({events.length})
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={addEvent}
            className="bg-[#E5859A] text-white hover:bg-[#D47489] transition-all rounded-xl font-bold shadow-md active:scale-95"
          >
            <Plus size={16} className="mr-1" />
            Adicionar
          </Button>
        </div>

        {events.length === 0 && (
          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-8 border border-white/40 text-center">
            <p className="text-sm text-[#7a5d56] font-medium">
              Clique em "+ Adicionar" para programar tarefas do ciclo.
            </p>
          </div>
        )}

        {events.map((event, index) => (
          <EventCard
            key={event.id}
            event={event}
            index={index}
            onRemove={removeEvent}
            onUpdate={updateEvent}
            suggestions={event.event_type ? getSuggestions(event.event_type) : []}
          />
        ))}
      </div>

      {/* Save Button */}
      {events.length > 0 && (
        <div className="space-y-2 pb-6">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-[52px] rounded-2xl bg-[#E5859A] hover:bg-[#D47489] text-white font-bold text-[15px] shadow-lg shadow-[#E5859A]/20 active:scale-95 transition-all duration-300"
          >
            {isSaving ? (
              <Loader2 size={20} className="animate-spin mr-2" />
            ) : (
              <Send size={18} className="mr-2" />
            )}
            {isSaving ? "Salvando..." : "Salvar e Atualizar Protocolo"}
          </Button>
          <p className="text-center text-[10.5px] font-bold text-[#9e837a] px-4 leading-relaxed">
            * As alterações serão salvas no prontuário e atualizadas no aplicativo do paciente. (Não envia mensagens automáticas no WhatsApp do paciente).
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Event Card (extracted for readability) ── */

function EventCard({
  event,
  index,
  onRemove,
  onUpdate,
  suggestions,
}: {
  event: EventItem;
  index: number;
  onRemove: (id: string) => void;
  onUpdate: <K extends keyof EventItem>(id: string, field: K, value: EventUpdateValue<K>) => void;
  suggestions: { name: string; dosage_unit?: string | null }[];
}) {
  const getTitlePlaceholder = (type: string) => {
    if (type === "Medicamento") return "Nome do medicamento (ex: Progesterona)";
    if (type === "Exame") return "Nome do exame (ex: Ultrassom de Controle)";
    if (type === "Consulta") return "Finalidade da consulta (ex: Retorno de Exames)";
    return "Escolha o tipo primeiro...";
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] space-y-4 relative">
      <div className="flex items-center justify-between border-b border-[#E5859A]/10 pb-2">
        <span className="text-xs font-bold text-[#E5859A] uppercase tracking-wider">
          Evento {index + 1} {event.title ? `— ${event.title}` : ""}
        </span>
        <button
          onClick={() => onRemove(event.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-[#9e837a] hover:text-red-500 transition-all active:scale-90"
          aria-label="Remover evento"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Type */}
      <div>
        <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Tipo</label>
        <Select
          value={event.event_type}
          onValueChange={(v) => {
            onUpdate(event.id, "event_type", v);
            onUpdate(event.id, "title", ""); // Reset title on type changes to avoid mismatch
          }}
        >
          <SelectTrigger className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus:ring-[#E5859A]/30 rounded-xl h-12">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-md border-white/60 text-[#1C1917] shadow-xl rounded-xl">
            <SelectItem value="Medicamento" className="text-[#1C1917] focus:bg-[#E5859A]/10 focus:text-[#8B3D5A] rounded-lg cursor-pointer">Medicamento</SelectItem>
            <SelectItem value="Exame" className="text-[#1C1917] focus:bg-[#E5859A]/10 focus:text-[#8B3D5A] rounded-lg cursor-pointer">Exame</SelectItem>
            <SelectItem value="Consulta" className="text-[#1C1917] focus:bg-[#E5859A]/10 focus:text-[#8B3D5A] rounded-lg cursor-pointer">Consulta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Title */}
      <div>
        <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Título</label>
        <CatalogCombobox
          value={event.title}
          onChange={(v) => onUpdate(event.id, "title", v)}
          suggestions={suggestions}
          placeholder={getTitlePlaceholder(event.event_type)}
          disabled={!event.event_type}
        />
      </div>

      {/* Recurring toggle */}
      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => onUpdate(event.id, "is_recurring", !event.is_recurring)}
          className={cn(
            "flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-xl border transition-all w-full active:scale-[0.98]",
            event.is_recurring
              ? "bg-[#E5859A]/10 border-[#E5859A]/30 text-[#E5859A]"
              : "bg-white/40 border-white/60 text-[#7a5d56] hover:border-[#E5859A]/30"
          )}
        >
          <div
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
              event.is_recurring
                ? "bg-[#E5859A] border-[#E5859A]"
                : "border-gray-300"
            )}
          >
            {event.is_recurring && <Repeat size={12} className="text-white" />}
          </div>
          Repetir todos os dias
        </button>
        {event.is_recurring && (
          <p className="text-[10px] font-medium text-[#9e837a] px-1">
            * Ao ativar, selecione a Data Final abaixo para limitar o intervalo de repetição diária.
          </p>
        )}
      </div>

      {/* Date(s) + Time */}
      <div className={cn("grid gap-3", event.is_recurring ? "grid-cols-1" : "grid-cols-2")}>
        <div className={event.is_recurring ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">
              {event.is_recurring ? "Data Início" : "Data"}
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-semibold rounded-xl bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60",
                    !event.scheduled_date && "text-gray-400"
                  )}
                >
                  <CalendarIcon size={16} className="mr-2 text-gray-500" />
                  {event.scheduled_date
                    ? format(event.scheduled_date, "dd/MM/yyyy")
                    : "Selecionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                <Calendar
                  mode="single"
                  selected={event.scheduled_date}
                  onSelect={(d) => onUpdate(event.id, "scheduled_date", d)}
                  locale={ptBR}
                  className="p-3 pointer-events-auto bg-white text-gray-900"
                  classNames={calendarClassNames}
                />
              </PopoverContent>
            </Popover>
          </div>

          {event.is_recurring && (
            <div>
              <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-11 justify-start text-left font-semibold rounded-xl bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60",
                      !event.end_date && "text-gray-400"
                    )}
                  >
                    <CalendarIcon size={16} className="mr-2 text-gray-500" />
                    {event.end_date
                      ? format(event.end_date, "dd/MM/yyyy")
                      : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={event.end_date}
                    onSelect={(d) => onUpdate(event.id, "end_date", d)}
                    locale={ptBR}
                    disabled={(date) =>
                      event.scheduled_date ? date < event.scheduled_date : false
                    }
                    className="p-3 pointer-events-auto bg-white text-gray-900"
                    classNames={calendarClassNames}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {!event.is_recurring && (
          <div>
            <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Hora (opc.)</label>
            <Input
              type="time"
              value={event.scheduled_time}
              onChange={(e) => onUpdate(event.id, "scheduled_time", e.target.value)}
              className="h-11 bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus-visible:ring-[#E5859A]/30 rounded-xl"
            />
          </div>
        )}
      </div>

      {event.is_recurring && (
        <div>
          <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Hora (opc.)</label>
          <Input
            type="time"
            value={event.scheduled_time}
            onChange={(e) => onUpdate(event.id, "scheduled_time", e.target.value)}
            className="h-11 bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus-visible:ring-[#E5859A]/30 rounded-xl"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mb-1.5 block">Observação</label>
        <Input
          value={event.description}
          onChange={(e) => onUpdate(event.id, "description", e.target.value)}
          placeholder="Ex: 150 UI na barriga"
          className="h-11 bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a] focus-visible:ring-[#E5859A]/30 rounded-xl"
        />
      </div>
    </div>
  );
}
