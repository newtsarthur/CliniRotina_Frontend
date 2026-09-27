import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, Pill, BellRing } from "lucide-react";

interface Props {
  patientId: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  status: string;
  created_at: string;
}

export function MedicamentosAtivos({ patientId, hideTitle = false }: Props & { hideTitle?: boolean }) {
  const [newMed, setNewMed] = useState("");
  const queryClient = useQueryClient();

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ["prescriptions", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("patient_id", patientId)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Prescription[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("prescriptions").insert({
        patient_id: patientId,
        doctor_id: user.id,
        medication_name: name.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions", patientId] });
      setNewMed("");
      toast.success("Medicamento adicionado!");
    },
    onError: () => toast.error("Erro ao adicionar medicamento."),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "suspended" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions", patientId] });
      toast.success("Medicamento suspenso.");
    },
    onError: () => toast.error("Erro ao suspender medicamento."),
  });

  const handleAdd = () => {
    if (!newMed.trim()) return;
    addMutation.mutate(newMed);
  };

  return (
    <div className={hideTitle ? "" : "mt-6"}>
      {!hideTitle && (
        <div className="flex items-center gap-2 mb-4">
          <Pill className="w-5 h-5 text-[#E5859A]" />
          <h3 className="text-[16px] font-bold text-[#1C1917]">Medicamentos Ativos</h3>
        </div>
      )}

      {prescriptions.length > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
          <BellRing className="w-4 h-4 text-green-600" />
          <span className="text-[12px] font-bold text-green-700">
            🔔 Lembretes de WhatsApp Ativos
          </span>
        </div>
      )}

      {/* Input de adição */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMed}
            onChange={(e) => setNewMed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Nome do medicamento..."
            className="flex-1 bg-white/60 backdrop-blur-sm border border-white/60 rounded-2xl px-4 py-3.5 text-[14px] text-[#1C1917] placeholder:text-[#9e837a] focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all min-w-0"
          />
          <button
            onClick={handleAdd}
            disabled={addMutation.isPending || !newMed.trim()}
            className="bg-[#E5859A] text-white rounded-2xl px-4 py-3.5 font-bold text-[14px] hover:bg-[#D47489] transition-all duration-300 shadow-md shadow-[#E5859A]/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="whitespace-nowrap">Adicionar</span>
          </button>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-[#E5859A]" />
        </div>
      ) : prescriptions.length === 0 ? (
        <p className="text-[13px] text-gray-400 text-center py-6">
          Nenhum medicamento ativo.
        </p>
      ) : (
        <div className="space-y-2">
          {prescriptions.map((p) => (
            <div
              key={p.id}
              className="bg-white/70 backdrop-blur-md rounded-2xl px-4 py-4 border border-white/70 shadow-[0_4px_20px_rgba(139,61,90,0.05)] flex items-center justify-between group/item hover:border-[#E5859A]/30 transition-all"
            >
              <span className="text-[15px] font-semibold text-[#1C1917]">
                {p.medication_name}
              </span>
              <button
                onClick={() => removeMutation.mutate(p.id)}
                disabled={removeMutation.isPending}
                className="p-2.5 rounded-xl hover:bg-red-50 text-[#9e837a] hover:text-red-500 transition-all active:scale-90"
                title="Suspender medicamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
