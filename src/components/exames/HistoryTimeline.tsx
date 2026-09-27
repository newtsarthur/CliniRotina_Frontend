import { useCallback, useEffect, useState } from "react";
import { FileText, Calendar, Pill, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TimelineItem {
  id: string;
  type: "exam" | "appointment" | "medication";
  title: string;
  subtitle: string;
  date: Date;
  filePath?: string;
  fileType?: string;
  isMissed?: boolean;
}

interface HistoryTimelineProps {
  patientId: string;
}

export function HistoryTimeline({ patientId }: HistoryTimelineProps) {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, apptRes, logsRes, rxRes, protocolRes] = await Promise.all([
        supabase
          .from("documents")
          .select("id, title, file_path, file_type, created_at, category")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("id, appointment_date, start_time, status, doctor_id, doctor_name")
          .eq("patient_id", patientId)
          .order("appointment_date", { ascending: false }),
        supabase
          .from("patient_logs")
          .select("id, type, value, status, medication_id, prescription_id, created_at, taken_at, taken_date")
          .eq("patient_id", patientId)
          .eq("type", "medication")
          .order("created_at", { ascending: false }),
        supabase
          .from("prescriptions")
          .select("id, medication_name")
          .eq("patient_id", patientId),
        supabase
          .from("protocol_items")
          .select("id, title, scheduled_date, event_type")
          .eq("patient_id", patientId)
          .eq("event_type", "Medicamento")
          .order("scheduled_date", { ascending: false }),
      ]);

      const timeline: TimelineItem[] = [];

      // --- Documents ---
      (docsRes.data || []).forEach((d) => {
        const catLabel = d.category || (d.file_type === "application/pdf" ? "PDF" : "Imagem");
        timeline.push({
          id: `doc-${d.id}`,
          type: "exam",
          title: d.title,
          subtitle: catLabel,
          date: d.created_at ? new Date(d.created_at) : new Date(),
          filePath: d.file_path,
          fileType: d.file_type,
        });
      });

      // --- Appointments ---
      (apptRes.data || []).forEach((a) => {
        const statusLabel =
          a.status === "confirmed" || a.status === "completed"
            ? "Realizada"
            : a.status === "cancelled" || a.status === "rejected"
            ? "Cancelada"
            : "Agendada";
        timeline.push({
          id: `appt-${a.id}`,
          type: "appointment",
          title: a.doctor_name || "Consulta Médica",
          subtitle: `${statusLabel} · ${a.start_time?.slice(0, 5) || "Horário a definir"}`,
          date: parseISO(a.appointment_date),
        });
      });

      // --- Medication logs ---
      const rxMap: Record<string, string> = {};
      (rxRes.data || []).forEach((r) => {
        rxMap[r.id] = r.medication_name;
      });

      const todayStr = new Date().toLocaleDateString("en-CA");

      // Track taken medications by prescription_id and date
      const takenMeds = new Set<string>(); // "prescId-date"
      
      (logsRes.data || []).forEach((l) => {
        const prescId = l.prescription_id || l.medication_id;
        const takenAt = l.taken_at || l.created_at;
        const takenDay = l.taken_date || takenAt?.substring(0, 10);
        if (prescId && takenDay) {
          takenMeds.add(`${prescId}-${takenDay}`);
        }

        const rawName = prescId ? rxMap[prescId] || null : null;
        const displayName = rawName || (l.value && !["taken", "pending", "completed", "scheduled", "cancelled"].includes(l.value.toLowerCase()) ? l.value : null) || "Medicamento";
        const logDate = takenAt ? new Date(takenAt) : new Date();
        const statusLabel = l.status ? {
          taken: "Tomado",
          pending: "Pendente",
          completed: "Concluído",
          scheduled: "Agendado",
          cancelled: "Cancelado",
        }[l.status.toLowerCase()] || l.status : "Tomado";
        
        timeline.push({
          id: `med-${l.id}`,
          type: "medication",
          title: displayName,
          subtitle: `${statusLabel} · ${format(logDate, "HH:mm")}`,
          date: logDate,
        });
      });

      // --- Missed medications grouped by month and name ---
      const nameToId: Record<string, string> = {};
      (rxRes.data || []).forEach((r) => {
        nameToId[r.medication_name.toLowerCase()] = r.id;
      });

      const missedGrouped: Record<string, { title: string; dates: string[] }> = {};

      (protocolRes.data || []).forEach((p) => {
        const prescId = nameToId[p.title.toLowerCase()];
        const key = `${prescId}-${p.scheduled_date}`;
        
        // If it's a past date and not in takenMeds, mark as missed
        if (p.scheduled_date < todayStr && !takenMeds.has(key)) {
          const monthKey = p.scheduled_date.substring(0, 7); // "YYYY-MM"
          const groupKey = `${p.title.toLowerCase()}-${monthKey}`;
          
          if (!missedGrouped[groupKey]) {
            missedGrouped[groupKey] = { title: p.title, dates: [] };
          }
          missedGrouped[groupKey].dates.push(p.scheduled_date);
        }
      });

      // Push grouped missed medications to timeline
      Object.values(missedGrouped).forEach((group) => {
        group.dates.sort();
        const latestDateStr = group.dates[group.dates.length - 1];
        const latestDate = new Date(`${latestDateStr}T23:59:59`);
        
        const days = group.dates.map((d) => parseInt(d.split("-")[2], 10));
        const monthLabel = format(latestDate, "MMM", { locale: ptBR });
        
        const count = group.dates.length;
        const subtitle = count === 1 
          ? `Não tomado em ${days[0]} de ${monthLabel}`
          : `${count} doses não tomadas: ${days.join(", ")} de ${monthLabel}`;

        timeline.push({
          id: `missed-group-${group.title.toLowerCase()}-${latestDateStr}`,
          type: "medication",
          title: group.title,
          subtitle: subtitle,
          date: latestDate,
          isMissed: true,
        });
      });

      // sort descending
      timeline.sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(timeline);
    } catch (err) {
      console.error("Timeline fetch error:", err);
      toast.error("Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpenDoc = async (item: TimelineItem) => {
    if (!item.filePath || downloadingId) return;
    setDownloadingId(item.id);
    try {
      const { data, error } = await supabase.storage
        .from("medical_records")
        .createSignedUrl(item.filePath, 300);
      if (error || !data?.signedUrl) throw error;
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Erro ao abrir documento.");
    } finally {
      setDownloadingId(null);
    }
  };

  const iconForType = (type: TimelineItem["type"]) => {
    switch (type) {
      case "exam":
        return <FileText className="w-5 h-5 text-[#8B3D5A]" />;
      case "appointment":
        return <Calendar className="w-5 h-5 text-[#8B3D5A]" />;
      case "medication":
        return <Pill className="w-5 h-5 text-[#8B3D5A]" />;
    }
  };

  // Group by month/year
  const grouped: Record<string, TimelineItem[]> = {};
  items.forEach((item) => {
    const key = format(item.date, "MMMM yyyy", { locale: ptBR });
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  if (loading) {
    return (
      <div className="space-y-6 pl-10 relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 relative">
            <div className="absolute -left-[30px] w-5 h-5 rounded-full bg-gray-200 border-4 border-white" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6 rounded-[32px] backdrop-blur-md border border-white/70"
        style={{ background: "rgba(255,255,255,0.6)" }}
      >
        <div className="w-14 h-14 rounded-full bg-white/50 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-[#9e837a]/40" />
        </div>
        <p className="text-sm text-[#9e837a] leading-relaxed max-w-[260px]">
          Seu histórico clínico ainda está vazio. Comece registrando suas atividades ou subindo um exame!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {Object.entries(grouped).map(([monthLabel, monthItems]) => (
        <div key={monthLabel} className="space-y-4">
          <p className="text-[11px] font-bold text-[#8B3D5A] uppercase tracking-[0.15em] mb-4 px-1 capitalize">
            {monthLabel}
          </p>
          
          <div className="relative pl-10 space-y-5">
            {/* Timeline vertical track line */}
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-[#E5859A]/20" />
            
            {monthItems.map((item) => {
              const isMissed = item.isMissed;
              
              return (
                <div key={item.id} className="relative">
                  {/* Timeline Chronological Dot */}
                  <div className={`absolute -left-[28px] top-7 w-[18px] h-[18px] rounded-full flex items-center justify-center border-4 bg-white z-10 shadow-sm transition-all duration-300 ${
                    isMissed ? "border-amber-400" : "border-[#E5859A]"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isMissed ? "bg-amber-500 animate-pulse" : "bg-[#8B3D5A]"
                    }`} />
                  </div>

                  {/* Card Container */}
                  <div
                    className={`rounded-3xl p-5 backdrop-blur-md border flex items-center gap-4 min-h-[104px] transition-all duration-300 ${
                      isMissed 
                        ? "bg-[#FAF7F2] border-amber-200/50 shadow-sm shadow-amber-500/5" 
                        : "bg-white/75 border-white/70 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)]"
                    }`}
                  >
                    {/* Icon frame */}
                    <div className={`h-11 w-11 flex items-center justify-center rounded-2xl shrink-0 ${
                      isMissed 
                        ? "bg-amber-50 text-amber-500" 
                        : "bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC]"
                    }`}>
                      {isMissed ? <AlertCircle className="w-5 h-5 text-amber-500" /> : iconForType(item.type)}
                    </div>

                    {/* Content text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[15px] font-bold truncate text-[#1C1917]">
                          {item.title}
                        </p>
                        {isMissed && (
                          <Badge className="bg-amber-100 text-amber-800 border-0 hover:bg-amber-100 text-[9px] font-bold px-2 py-0.5">
                            Não registrado
                          </Badge>
                        )}
                      </div>
                      <p className={`text-[13px] truncate font-medium mt-0.5 ${
                        isMissed ? "text-amber-800/80" : "text-[#9e837a]"
                      }`}>
                        {item.subtitle}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-[0.05em] mt-1.5 w-fit px-2 py-0.5 rounded-full border ${
                        isMissed 
                          ? "text-amber-700 bg-amber-50 border-amber-200/30" 
                          : "text-[#E5859A] bg-[#FFF5F8] border-[#E5859A]/10"
                      }`}>
                        {format(item.date, "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    {item.type === "exam" && item.filePath && (
                      <button
                        onClick={() => handleOpenDoc(item)}
                        disabled={downloadingId === item.id}
                        className="p-2.5 rounded-xl hover:bg-[#FFF5F8] transition-colors shrink-0 disabled:opacity-50 text-[#8B3D5A]"
                        title="Abrir documento"
                      >
                        {downloadingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
