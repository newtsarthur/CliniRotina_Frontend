import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, Loader2, CheckCircle2, Pill, ChevronDown, ChevronUp, Edit3 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { DoctorBottomNav } from "@/components/DoctorBottomNav";
import { DocumentList } from "@/components/documents/DocumentList";
import { CycleProgrammer } from "@/components/prontuario/CycleProgrammer";
import { TreatmentManager } from "@/components/prontuario/TreatmentManager";
import { MedicamentosAtivos } from "@/components/prontuario/MedicamentosAtivos";
import { PatientMonitoring } from "@/components/prontuario/PatientMonitoring";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PatientAvatar } from "@/components/PatientAvatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PatientProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default function Prontuario() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // End cycle dialog states
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(null);
  const [showEndCycleAlert, setShowEndCycleAlert] = useState(false);
  const [isEndingCycle, setIsEndingCycle] = useState(false);
  const [showMeds, setShowMeds] = useState(false);

  // Edit patient profile dialog states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const fetchPatient = useCallback(async () => {
    if (!patientId) return;
    setIsLoading(true);
    const { data, error } = await supabase.rpc("get_linked_patient", {
      p_patient_id: patientId,
    });

    if (error) console.error("Error fetching patient:", error);
    const pat = data?.[0] || null;
    setPatient(pat);
    
    if (pat) {
      setEditName(pat.full_name || "");
      setEditEmail(pat.email || "");
      setEditPhone(pat.phone || "");
    }
    
    setIsLoading(false);
  }, [patientId]);

  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);

  // Fetch last patient activity date
  const fetchLastActivity = useCallback(async () => {
    if (!patientId) return;
    const { data } = await supabase
      .from("patient_logs")
      .select("created_at")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) setLastActivityDate(data.created_at);
  }, [patientId]);

  // Checks for active protocol on mount
  const checkActiveProtocol = useCallback(async () => {
    if (!patientId) return;
    const { data } = await supabase
      .from("protocols")
      .select("id")
      .eq("patient_id", patientId)
      .eq("is_active", true)
      .maybeSingle();
      
    if (data) setActiveProtocolId(data.id);
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatient();
      checkActiveProtocol();
      fetchLastActivity();
    }
  }, [checkActiveProtocol, fetchLastActivity, fetchPatient, patientId]);

  const handleEndCycle = async () => {
    if (!activeProtocolId) return;
    setIsEndingCycle(true);

    const { error } = await supabase
      .from("protocols")
      .update({ is_active: false })
      .eq("id", activeProtocolId);

    if (error) {
      toast.error("Erro ao encerrar o tratamento.");
    } else {
      toast.success("Tratamento encerrado com sucesso! 🎉");
      setActiveProtocolId(null);
      setShowEndCycleAlert(false);
    }
    setIsEndingCycle(false);
  };

  const handleUpdateProfile = async () => {
    if (!patientId || isSavingProfile) return;
    if (!editName.trim()) {
      toast.error("O nome do paciente é obrigatório.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editName.trim(),
          email: editEmail.trim() || null,
          phone: editPhone.trim() || null,
        })
        .eq("id", patientId);

      if (error) throw error;

      toast.success("Dados do paciente atualizados!");
      setIsEditModalOpen(false);
      fetchPatient();
    } catch (err) {
      console.error("Error updating patient profile:", err);
      toast.error("Erro ao atualizar dados. Tente novamente.");
    } finally {
      setIsSavingProfile(false);
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF1F2] font-sans flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#E5859A]" />
      </div>
    );
  }

  if (!patient) return null;

  const getStatus = () => {
    const hasActiveCycle = !!activeProtocolId;
    
    if (hasActiveCycle) {
      if (lastActivityDate) {
        const lastDate = new Date(lastActivityDate);
        const diffHours = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
        if (diffHours > 48) {
          return { label: "Atrasado", badgeClass: "bg-amber-50 text-amber-600 border-amber-200" };
        }
      }
      return { label: "Em Ciclo", badgeClass: "bg-green-50 text-green-600 border-green-200" };
    } else {
      if (lastActivityDate) {
        return { label: "Alta", badgeClass: "bg-blue-50 text-blue-600 border-blue-200" };
      }
      return { label: "Acompanhamento", badgeClass: "bg-gray-50 text-gray-500 border-gray-200" };
    }
  };

  const patientStatus = getStatus();

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

      <header className="sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/40">
        <div className="max-w-md mx-auto h-[80px] flex items-center px-4 relative gap-3">
          <button
            onClick={() => navigate("/pacientes")}
            className="p-2.5 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 text-[#1C1917]" />
          </button>
          <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Prontuário</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6">
        
        {/* CARD DA PACIENTE (Structured, clear actions & status) */}
        <div className="mt-6 bg-white/60 backdrop-blur-md rounded-[32px] p-6 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] border border-white/70 flex flex-col gap-4 relative">
          <div className="flex items-center gap-4">
            <PatientAvatar
              avatarUrl={patient.avatar_url}
              fullName={patient.full_name}
              className="w-[64px] h-[64px] rounded-full border-none shadow-sm"
              fallbackClassName="text-xl"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[19px] font-bold text-[#1C1917] truncate">
                  {patient.full_name || "Paciente"}
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${patientStatus.badgeClass}`}>
                  {patientStatus.label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-1 text-[13px] text-[#7a5d56] font-medium">
                {patient.email && <p className="truncate">{patient.email}</p>}
                {patient.phone && <p>{patient.phone}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#E5859A]/10">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              size="sm"
              className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-[#7a5d56]/15 text-[#7a5d56] bg-[#7a5d56]/5 hover:bg-[#7a5d56]/10 active:scale-95 transition-all"
            >
              <Edit3 size={14} />
              Editar Dados
            </Button>

            {activeProtocolId && (
              <Button
                onClick={() => setShowEndCycleAlert(true)}
                variant="outline"
                size="sm"
                className="h-9 px-3 text-xs font-bold gap-1.5 rounded-xl border-green-200 text-green-600 bg-green-50/50 hover:bg-green-100/50 active:scale-95 transition-all ml-auto"
              >
                <CheckCircle2 size={14} />
                Finalizar Ciclo
              </Button>
            )}
          </div>
        </div>

        {/* MEDICAMENTOS ATIVOS (Accordion Estilo Premium) */}
        <div className="mt-4 overflow-hidden bg-white/40 backdrop-blur-sm border border-white/60 rounded-3xl transition-all duration-300">
          <button 
            onClick={() => setShowMeds(!showMeds)}
            className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-white/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#E5859A]" />
              <span className="text-[14px] font-bold text-[#1C1917]">Medicamentos Ativos</span>
            </div>
            {showMeds ? <ChevronUp size={18} className="text-[#9e837a]" /> : <ChevronDown size={18} className="text-[#9e837a]" />}
          </button>
          <div className={`transition-all duration-300 ease-in-out ${showMeds ? "max-h-[1000px] opacity-100 px-5 pb-5" : "max-h-0 opacity-0 px-5 pb-0"}`}>
            <MedicamentosAtivos patientId={patient.id} hideTitle />
          </div>
        </div>

        {/* ESTRUTURA DE ABAS */}
        <Tabs defaultValue="documentos" className="mt-6">
          <div className="sticky top-[80px] z-20 bg-transparent backdrop-blur-md pt-4 pb-4 px-0">
            <TabsList className="w-full bg-white/40 backdrop-blur-sm border border-white/60 p-1.5 rounded-full h-auto flex shadow-sm">
              <TabsTrigger value="documentos" className="flex-1 rounded-full py-2.5 text-[12px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]">Docs</TabsTrigger>
              <TabsTrigger value="ciclo" className="flex-1 rounded-full py-2.5 text-[12px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]">Programa</TabsTrigger>
              <TabsTrigger value="tratamento" className="flex-1 rounded-full py-2.5 text-[12px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]">Gestão</TabsTrigger>
              <TabsTrigger value="monitoramento" className="flex-1 rounded-full py-2.5 text-[12px] font-bold transition-all data-[state=active]:bg-white data-[state=active]:text-[#8B3D5A] data-[state=active]:shadow-sm text-[#9e837a]">Monitorar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="documentos" className="mt-2 animate-in fade-in"><DocumentList patientId={patient.id} canUpload /></TabsContent>
          <TabsContent value="ciclo" className="mt-2 animate-in fade-in"><CycleProgrammer patientId={patient.id} /></TabsContent>
          <TabsContent value="tratamento" className="mt-2 animate-in fade-in"><TreatmentManager patientId={patient.id} /></TabsContent>
          <TabsContent value="monitoramento" className="mt-2 animate-in fade-in"><PatientMonitoring patientId={patient.id} /></TabsContent>
        </Tabs>
      </main>

      <DoctorBottomNav />

      {/* EDIT PATIENT DIALOG */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_-15px_rgba(139,61,90,0.18)] p-6 outline-none animate-in fade-in-0 zoom-in-95 data-[state=open]:duration-200">
          <DialogHeader>
            <DialogTitle className="text-[#1C1917] text-xl font-bold">
              Editar Dados da Paciente
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#7a5d56] block">Nome da Paciente *</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Alcione Cabral"
                className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a]/50 rounded-2xl h-12 focus-visible:ring-[#E5859A]/30 focus-visible:border-[#E5859A]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#7a5d56] block">E-mail</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Ex: alcione.cabral@gmail.com"
                className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a]/50 rounded-2xl h-12 focus-visible:ring-[#E5859A]/30 focus-visible:border-[#E5859A]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#7a5d56] block">Telefone / WhatsApp</label>
              <Input
                type="text"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Ex: (81) 99678-9101"
                className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a]/50 rounded-2xl h-12 focus-visible:ring-[#E5859A]/30 focus-visible:border-[#E5859A]/50"
              />
            </div>

            <Button
              onClick={handleUpdateProfile}
              disabled={isSavingProfile}
              className="w-full h-12 mt-2 rounded-2xl bg-[#E5859A] hover:bg-[#D47489] text-white font-bold text-[15px] shadow-lg shadow-[#E5859A]/20 active:scale-95 transition-all duration-300 border-none"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONFIRMAÇÃO DE ENCERRAMENTO */}
      <AlertDialog open={showEndCycleAlert} onOpenChange={setShowEndCycleAlert}>
        <AlertDialogContent className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_-15px_rgba(139,61,90,0.18)] max-w-[360px] p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-[#1C1917] text-center">Encerrar Tratamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#7a5d56] text-center mt-2 leading-relaxed">
              Tem certeza que deseja marcar o ciclo atual como concluído? O histórico de tarefas será mantido para consulta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full h-12 rounded-2xl bg-white/60 hover:bg-white/80 border-white/60 text-[#1C1917] font-bold mt-0" disabled={isEndingCycle}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndCycle}
              disabled={isEndingCycle}
              className="w-full h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-bold m-0 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
            >
              {isEndingCycle ? "Encerrando..." : "Sim, Encerrar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
