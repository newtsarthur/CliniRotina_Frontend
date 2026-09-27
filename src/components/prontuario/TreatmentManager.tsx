import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Loader2, ClipboardList, Calendar as CalendarIcon,
  Circle, Clock, CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface Protocol {
  id: string;
  phase_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

interface ProtocolItem {
  id: string;
  title: string;
  event_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string | null;
  description: string | null;
}

interface ProgressRow {
  id: string;
  protocol_item_id: string | null;
  status: string | null;
  completed_at: string | null;
}

const STATUS_OPTIONS = [
  { value: "pendente", label: "Pendente", color: "bg-gray-100 text-gray-600" },
  { value: "em_andamento", label: "Em andamento", color: "bg-amber-50 text-amber-600" },
  { value: "concluido", label: "Concluído", color: "bg-green-50 text-green-600" },
];

function statusIcon(status: string | null) {
  if (status === "concluido") return <CheckCircle2 size={18} className="text-green-500 hover:scale-110 transition-transform" />;
  if (status === "em_andamento") return <Clock size={18} className="text-amber-500 hover:scale-110 transition-transform" />;
  return <Circle size={18} className="text-gray-300 hover:text-green-500 hover:scale-110 transition-colors transition-transform" />;
}

export function TreatmentManager({ patientId }: { patientId: string }) {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [items, setItems] = useState<ProtocolItem[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, ProgressRow>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);

  const loadProtocols = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("protocols")
      .select("id, phase_name, is_active, created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar protocolos.");
    }
    setProtocols((data || []) as Protocol[]);
    setLoading(false);
  }, [patientId]);

  const loadItems = useCallback(async (protocolId: string) => {
    setLoadingItems(true);
    const [itemsRes, progressRes] = await Promise.all([
      supabase
        .from("protocol_items")
        .select("id, title, event_type, scheduled_date, scheduled_time, status, description")
        .eq("protocol_id", protocolId)
        .eq("patient_id", patientId)
        .order("scheduled_date", { ascending: true }),
      supabase
        .from("patient_protocol_progress")
        .select("id, protocol_item_id, status, completed_at")
        .eq("patient_id", patientId),
    ]);

    setItems((itemsRes.data || []) as ProtocolItem[]);

    const map = new Map<string, ProgressRow>();
    ((progressRes.data || []) as ProgressRow[]).forEach((row) => {
      if (row.protocol_item_id) map.set(row.protocol_item_id, row);
    });
    setProgressMap(map);
    setLoadingItems(false);
  }, [patientId]);

  // Load protocols for this patient
  useEffect(() => {
    loadProtocols();
  }, [loadProtocols]);

  useEffect(() => {
    if (protocols.length > 0 && !selectedProtocolId) {
      const active = protocols.find((p) => p.is_active);
      setSelectedProtocolId(active?.id || protocols[0].id);
    }
  }, [protocols, selectedProtocolId]);

  // Load items when protocol selected
  useEffect(() => {
    if (selectedProtocolId) {
      loadItems(selectedProtocolId);
    } else {
      setItems([]);
      setProgressMap(new Map());
    }
  }, [loadItems, selectedProtocolId]);

  const handleAssignProtocol = async (protocolId: string) => {
    setSelectedProtocolId(protocolId);

    const { error } = await supabase
      .from("profiles")
      .update({ current_protocol_id: protocolId })
      .eq("id", patientId);

    if (error) {
      toast.error("Erro ao atribuir protocolo.");
      console.error(error);
    } else {
      toast.success("Protocolo atribuído com sucesso!");
      loadProtocols(); // Reload to update labels/active badge
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    setSavingItemId(itemId);
    const existing = progressMap.get(itemId);
    const completedAt = newStatus === "concluido" ? new Date().toISOString() : null;

    if (existing) {
      const { error } = await supabase
        .from("patient_protocol_progress")
        .update({ status: newStatus, completed_at: completedAt })
        .eq("id", existing.id);

      if (error) {
        toast.error("Erro ao atualizar status.");
      } else {
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(itemId, { ...existing, status: newStatus, completed_at: completedAt });
          return next;
        });
      }
    } else {
      const { data, error } = await supabase
        .from("patient_protocol_progress")
        .insert({
          patient_id: patientId,
          protocol_item_id: itemId,
          status: newStatus,
          completed_at: completedAt,
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao salvar progresso.");
      } else if (data) {
        setProgressMap((prev) => {
          const next = new Map(prev);
          next.set(itemId, data as ProgressRow);
          return next;
        });
      }
    }
    setSavingItemId(null);
  };

  const handleDateChange = async (itemId: string, newDate: Date) => {
    const formatted = format(newDate, "yyyy-MM-dd");
    const { error } = await supabase
      .from("protocol_items")
      .update({ scheduled_date: formatted })
      .eq("id", itemId);

    if (error) {
      toast.error("Erro ao atualizar data.");
    } else {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, scheduled_date: formatted } : it))
      );
      toast.success("Data atualizada! 📅");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5859A]" />
      </div>
    );
  }

  if (protocols.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] text-center">
        <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-[#7a5d56] font-medium">
          Nenhum protocolo encontrado para esta paciente.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Crie um protocolo na aba "Programa" primeiro.
        </p>
      </div>
    );
  }

  const completedCount = items.filter((it) => progressMap.get(it.id)?.status === "concluido").length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Protocol Selector */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] animate-in fade-in">
        <div className="flex justify-between items-center mb-1">
          <p className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider">
            Protocolo Ativo / Fase
          </p>
        </div>
        <p className="text-[10px] text-[#9e837a] mb-3 font-semibold leading-relaxed">
          * Selecione o protocolo ativo atual ou consulte o histórico de ciclos anteriores da paciente.
        </p>
        
        <Select
          value={selectedProtocolId || ""}
          onValueChange={handleAssignProtocol}
        >
          <SelectTrigger className="w-full h-12 rounded-xl border-white/60 bg-white/40 backdrop-blur-sm text-[#1C1917] text-sm font-semibold shadow-sm">
            <SelectValue placeholder="Selecione um protocolo..." />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-md border-white/60 text-[#1C1917] shadow-xl rounded-xl">
            {protocols.map((p) => (
              <SelectItem key={p.id} value={p.id} className="text-[#1C1917] focus:bg-[#E5859A]/10 focus:text-[#8B3D5A] rounded-lg cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>{p.phase_name || "Sem fase"}</span>
                  {p.is_active && (
                    <Badge className="bg-green-50 text-green-600 border-none text-[9px] font-extrabold px-1.5 py-0.5 ml-1">
                      Ativo
                    </Badge>
                  )}
                  {p.created_at && (
                    <span className="text-[10px] text-[#9e837a] font-medium ml-1">
                      ({format(new Date(p.created_at), "dd/MM/yy")})
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Progress bar (Only shown when there are multiple items) */}
        {items.length > 1 && (
          <div className="mt-4 border-t border-[#E5859A]/10 pt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider">
                Progresso do Ciclo
              </span>
              <span className="text-[11px] font-bold text-[#E5859A]">
                {completedCount}/{items.length} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/40 rounded-full overflow-hidden border border-white/60">
              <div
                className="h-full bg-[#E5859A] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Protocol Items */}
      {loadingItems ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#E5859A]" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] text-center animate-in fade-in">
          <p className="text-sm text-gray-400">Nenhuma etapa ou medicamento neste protocolo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const progress = progressMap.get(item.id);
            const currentStatus = progress?.status || "pendente";

            return (
              <div
                key={item.id}
                className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white/60 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] space-y-4 hover:border-[#E5859A]/20 transition-all animate-in fade-in"
              >
                {/* Header with interactive check circle toggler */}
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleStatusChange(item.id, currentStatus === "concluido" ? "pendente" : "concluido")}
                    className="mt-0.5 p-1 -m-1 hover:bg-gray-100/50 rounded-full transition-colors shrink-0"
                    title={currentStatus === "concluido" ? "Marcar como pendente" : "Marcar como concluído"}
                    disabled={savingItemId === item.id}
                  >
                    {statusIcon(currentStatus)}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-bold text-[#1C1917] leading-tight">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge className="bg-[#FFF5F8] text-[#E5859A] border border-[#E5859A]/10 text-[9px] font-extrabold">
                        {item.event_type}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-[12px] text-[#7a5d56] font-medium mt-1.5 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 pt-4 border-t border-white/40">
                  {/* Date picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white/60 backdrop-blur-sm border border-white/60 text-[12px] font-bold text-[#1C1917] transition-all hover:bg-white/80 active:scale-95 shadow-sm">
                        <CalendarIcon size={14} className="text-[#85666E]" />
                        {format(new Date(item.scheduled_date + "T12:00:00"), "dd MMM yyyy", { locale: ptBR })}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(item.scheduled_date + "T12:00:00")}
                        onSelect={(date) => date && handleDateChange(item.id, date)}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Status selector (Only source of status selection, no duplicate text) */}
                  <Select
                    value={currentStatus}
                    onValueChange={(val) => handleStatusChange(item.id, val)}
                    disabled={savingItemId === item.id}
                  >
                    <SelectTrigger className="h-10 w-auto min-w-[130px] rounded-xl border-white/60 bg-white/60 backdrop-blur-sm text-[12px] font-bold text-[#1C1917] shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md border-white/60 text-[#1C1917] shadow-xl rounded-xl">
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-[#1C1917] focus:bg-[#E5859A]/10 focus:text-[#8B3D5A] rounded-lg cursor-pointer text-[12px] font-bold">
                          <div className="flex items-center gap-2">
                            {opt.value === "concluido" && <CheckCircle2 size={12} className="text-green-500" />}
                            {opt.value === "em_andamento" && <Clock size={12} className="text-amber-500" />}
                            {opt.value === "pendente" && <Circle size={12} className="text-gray-400" />}
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {savingItemId === item.id && (
                    <Loader2 size={14} className="animate-spin text-[#E5859A]" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
