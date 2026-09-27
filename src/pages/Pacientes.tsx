import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DoctorBottomNav } from "../components/DoctorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { PatientAvatar } from "@/components/PatientAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  ChevronRight, 
  Pill, 
  FlaskConical, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Trash2,
  Droplet,
  Scan,
  SlidersHorizontal,
  ArrowUpDown
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PatientProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
}

interface ActiveProtocol {
  patient_id: string;
}

interface CatalogItem {
  id: string;
  name: string;
  item_type: string | null;
  dosage_unit: string | null;
}

// Dynamically select exam icons by keywords
function getExamIcon(name: string) {
  const lowercaseName = name.toLowerCase();
  if (
    lowercaseName.includes("sangue") || 
    lowercaseName.includes("hemograma") || 
    lowercaseName.includes("beta") || 
    lowercaseName.includes("hcg") || 
    lowercaseName.includes("hormônio") || 
    lowercaseName.includes("dosagem") ||
    lowercaseName.includes("sorologia")
  ) {
    return <Droplet size={18} className="text-[#E5859A]" />;
  }
  if (
    lowercaseName.includes("ultrassom") || 
    lowercaseName.includes("ultrassonografia") || 
    lowercaseName.includes("ecografia") || 
    lowercaseName.includes("imagem") || 
    lowercaseName.includes("ressonância") || 
    lowercaseName.includes("raio")
  ) {
    return <Scan size={18} className="text-[#E5859A]" />;
  }
  return <FlaskConical size={18} className="text-[#E5859A]" />;
}

export default function Pacientes() {
  const navigate = useNavigate();
  const [patientSearch, setPatientSearch] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [showMeds, setShowMeds] = useState(true);
  const [showExams, setShowExams] = useState(true);
  
  // Filtering & Sorting States
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name"); // name, date, status

  const { data: currentUser } = useQuery({
    queryKey: ["current-doctor"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", currentUser?.id],
    queryFn: async () => {
      if (!currentUser?.id) return [];
      const { data, error } = await supabase.rpc("get_my_patients");
      if (error) throw error;
      return (data || []) as PatientProfile[];
    },
    enabled: !!currentUser?.id,
  });

  // Fetch active protocols for all patients
  const { data: activeProtocols = [] } = useQuery({
    queryKey: ["active-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("protocols")
        .select("patient_id")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as ActiveProtocol[];
    },
  });

  const activePatientIds = new Set(activeProtocols.map((p) => p.patient_id));

  // Fetch patient logs to determine dynamic status
  const { data: latestLogs = [] } = useQuery({
    queryKey: ["patients-latest-logs", currentUser?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_logs")
        .select("patient_id, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentUser?.id,
  });

  // Map last activity dates per patient
  const patientLastActivityMap = new Map<string, string>();
  latestLogs.forEach((log) => {
    if (log.patient_id && !patientLastActivityMap.has(log.patient_id)) {
      patientLastActivityMap.set(log.patient_id, log.created_at);
    }
  });

  const getPatientStatus = (patientId: string) => {
    const hasActiveCycle = activePatientIds.has(patientId);
    const lastActivity = patientLastActivityMap.get(patientId);
    
    if (hasActiveCycle) {
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const diffHours = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
        if (diffHours > 48) {
          return { label: "Atrasado", color: "text-amber-500", dot: "bg-amber-500" };
        }
      }
      return { label: "Em Ciclo", color: "text-green-500", dot: "bg-green-500" };
    } else {
      if (lastActivity) {
        return { label: "Alta", color: "text-blue-500", dot: "bg-blue-500" };
      }
      return { label: "Acompanhamento", color: "text-gray-400", dot: "bg-gray-400" };
    }
  };

  const { data: catalogItems = [], isLoading: isLoadingCatalog, refetch: refetchCatalog } = useQuery({
    queryKey: ["catalog-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_catalog")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as CatalogItem[];
    },
  });

  // Helper component for catalog items with delete action
  const CatalogItemCard = ({ item }: { item: CatalogItem }) => (
    <div 
      className="flex items-center justify-between gap-3 bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-white/70 shadow-sm hover:shadow-md hover:border-[#E5859A]/30 transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-[#FFF5F8] flex items-center justify-center shrink-0">
          {item.item_type === "medication" ? (
            <Pill size={18} className="text-[#E5859A]" />
          ) : (
            getExamIcon(item.name)
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-bold text-[#1C1917] truncate">
            {item.name}
          </h3>
          {item.dosage_unit && (
            <p className="text-[11px] font-bold text-[#9e837a] uppercase tracking-wider mt-0.5">
              {item.dosage_unit}
            </p>
          )}
        </div>
      </div>
      <button
        onClick={async (e) => {
          e.stopPropagation();
          if (confirm(`Deseja realmente remover "${item.name}" do catálogo?`)) {
            const { error } = await supabase
              .from("clinic_catalog")
              .delete()
              .eq("id", item.id);
            if (error) {
              toast.error("Erro ao remover item do catálogo.");
            } else {
              toast.success("Item removido com sucesso!");
              refetchCatalog();
            }
          }
        }}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 text-[#9e837a]/50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Remover do catálogo"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );

  return (
    <div 
      className="min-h-screen pb-32 font-sans text-[#1C1917] antialiased relative overflow-x-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FBF1F2 0%, #FAF6F3 45%, #F7F2EE 100%)",
      }}
    >
      {/* Decorative glowing orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#E5859A]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#E8C5B8]/20 blur-3xl" />

      {/* Header (No redundancy, clean title) */}
      <header className="px-6 pt-12 pb-2">
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Pacientes</h1>
      </header>

      <div className="max-w-md mx-auto px-6 pt-4">
        <Tabs defaultValue="pacientes" className="w-full">
          <TabsList className="w-full bg-white/40 backdrop-blur-sm border border-white/60 p-1.5 rounded-full h-auto flex shadow-sm mb-6">
            <TabsTrigger 
              value="pacientes" 
              className="flex-1 rounded-full py-2.5 text-[13px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]"
            >
              Meus Pacientes
            </TabsTrigger>
            <TabsTrigger 
              value="catalogo" 
              className="flex-1 rounded-full py-2.5 text-[13px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]"
            >
              Catálogo
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: MEUS PACIENTES */}
          <TabsContent value="pacientes" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {/* Scoped Patient Search */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e837a] group-focus-within:text-[#E5859A] transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar pacientes por nome..."
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm text-[#1C1917] placeholder:text-[#9e837a]/60 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all text-sm"
              />
            </div>

            {/* Filter and Sort Row */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full h-10 bg-white/40 border-white/60 text-xs font-semibold text-[#7a5d56] rounded-xl">
                    <SlidersHorizontal size={13} className="mr-1.5 text-[#E5859A]" />
                    <SelectValue placeholder="Filtrar por Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md text-xs border-white/60 text-[#1C1917] rounded-xl shadow-xl">
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="em ciclo">Em Ciclo</SelectItem>
                    <SelectItem value="atrasado">Atrasados</SelectItem>
                    <SelectItem value="alta">Altas</SelectItem>
                    <SelectItem value="acompanhamento">Acompanhamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full h-10 bg-white/40 border-white/60 text-xs font-semibold text-[#7a5d56] rounded-xl">
                    <ArrowUpDown size={13} className="mr-1.5 text-[#E5859A]" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md text-xs border-white/60 text-[#1C1917] rounded-xl shadow-xl">
                    <SelectItem value="name">Nome (A-Z)</SelectItem>
                    <SelectItem value="date">Mais Recentes</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/60 backdrop-blur-md rounded-[28px] p-4 border border-white/70 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)]">
                    <Skeleton className="w-[60px] h-[60px] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {patients
                  .filter((p) => (p.full_name || "").toLowerCase().includes(patientSearch.toLowerCase()))
                  .map((p) => ({ ...p, status: getPatientStatus(p.id) }))
                  .filter((p) => statusFilter === "all" || p.status.label.toLowerCase() === statusFilter)
                  .sort((a, b) => {
                    if (sortBy === "name") return (a.full_name || "").localeCompare(b.full_name || "");
                    if (sortBy === "date") return (b.created_at || "").localeCompare(a.created_at || "");
                    if (sortBy === "status") return a.status.label.localeCompare(b.status.label);
                    return 0;
                  })
                  .map((patient) => (
                    <button
                      key={patient.id}
                      onClick={() => navigate(`/prontuario/${patient.id}`)}
                      className="w-full flex items-center gap-4 bg-white/70 backdrop-blur-md rounded-[28px] p-4 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] border border-white/70 hover:border-[#E5859A]/30 hover:scale-[1.02] transition-all active:scale-[0.98] text-left group"
                    >
                      <div className="relative shrink-0">
                        {/* Crop consistency: PatientAvatar handles standard styling */}
                        <PatientAvatar
                          avatarUrl={patient.avatar_url}
                          fullName={patient.full_name}
                          className="w-[60px] h-[60px] rounded-full border-none shadow-sm"
                          fallbackClassName="text-lg"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${patient.status.dot} border-2 border-white rounded-full transition-colors duration-300`}></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-[17px] font-bold text-[#1C1917] truncate group-hover:text-[#E5859A] transition-colors">
                          {patient.full_name || "Sem nome"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] font-bold text-[#7a5d56] uppercase tracking-wider">
                             {patient.created_at
                              ? `Desde ${format(new Date(patient.created_at), "MMM yyyy", { locale: ptBR })}`
                              : "Recente"}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className={`text-[11px] font-bold uppercase ${patient.status.color}`}>
                            {patient.status.label}
                          </span>
                        </div>
                      </div>

                      {/* Higher contrast chevron */}
                      <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center group-hover:bg-[#E5859A]/10 transition-colors">
                        <ChevronRight size={20} className="text-[#8B3D5A]/50 group-hover:text-[#E5859A]" />
                      </div>
                    </button>
                  ))}

                {patients.filter((p) => (p.full_name || "").toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[#9e837a] text-sm">Nenhum paciente encontrado.</p>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-center text-[12px] text-[#9e837a] pt-6 opacity-50 font-medium">Painel do Profissional • Gestão de Pacientes</p>
          </TabsContent>

          {/* TAB 2: CATÁLOGO */}
          <TabsContent value="catalogo" className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
            {/* Scoped Catalog Search */}
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e837a] group-focus-within:text-[#E5859A] transition-colors">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Buscar itens no catálogo..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-4 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/60 shadow-sm text-[#1C1917] placeholder:text-[#9e837a]/60 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all text-sm"
              />
            </div>

            {/* Premium prefilled soft CTA button */}
            <div className="mb-2">
              <CatalogModal onItemAdded={refetchCatalog} />
            </div>

            {isLoadingCatalog ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-[28px]" />
                ))}
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {/* Seção de Medicamentos */}
                <Collapsible open={showMeds} onOpenChange={setShowMeds} className="space-y-3">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between bg-white/40 backdrop-blur-sm border border-white/60 px-4 py-3.5 rounded-2xl hover:bg-white/60 transition-all group">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#7a5d56] uppercase tracking-wider">
                        <Pill size={14} className="text-[#E5859A]" />
                        Medicamentos ({catalogItems.filter((item) => item.item_type === "medication").length})
                      </div>
                      
                      {/* Affordance: styled button chevron indicator */}
                      <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-[#9e837a] group-hover:text-[#8B3D5A] group-hover:bg-[#E5859A]/10 transition-all duration-200 shadow-sm">
                        {showMeds ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {catalogItems
                      .filter((item) => item.item_type === "medication" && item.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map((item) => (
                        <CatalogItemCard key={item.id} item={item} />
                      ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Seção de Exames */}
                <Collapsible open={showExams} onOpenChange={setShowExams} className="space-y-3">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between bg-white/40 backdrop-blur-sm border border-white/60 px-4 py-3.5 rounded-2xl hover:bg-white/60 transition-all group">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-[#7a5d56] uppercase tracking-wider">
                        <FlaskConical size={14} className="text-[#E5859A]" />
                        Exames ({catalogItems.filter((item) => item.item_type === "exam").length})
                      </div>
                      
                      {/* Affordance: styled button chevron indicator */}
                      <div className="w-6 h-6 rounded-full bg-white/60 flex items-center justify-center text-[#9e837a] group-hover:text-[#8B3D5A] group-hover:bg-[#E5859A]/10 transition-all duration-200 shadow-sm">
                        {showExams ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="grid grid-cols-1 gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {catalogItems
                      .filter((item) => item.item_type === "exam" && item.name.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map((item) => (
                        <CatalogItemCard key={item.id} item={item} />
                      ))}
                  </CollapsibleContent>
                </Collapsible>

                {catalogItems.filter((item) => item.name.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-[#9e837a] text-sm">Nenhum item cadastrado no catálogo.</p>
                  </div>
                )}
              </div>
            )}
            
            <p className="text-center text-[12px] text-[#9e837a] pt-4 opacity-50 font-medium">Painel do Profissional • Gestão de Catálogo</p>
          </TabsContent>
        </Tabs>
      </div>

      <DoctorBottomNav />
    </div>
  );
}
