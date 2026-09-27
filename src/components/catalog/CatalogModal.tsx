import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatalogModalProps {
  onItemAdded?: () => void;
}

export function CatalogModal({ onItemAdded }: CatalogModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("");
  const [dosageVal, setDosageVal] = useState("");
  const [dosageUnitType, setDosageUnitType] = useState("mg");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    if (!itemType) {
      toast.error("Selecione o tipo do item.");
      return;
    }

    setSaving(true);
    try {
      const category = itemType === "medication" ? "medication" : "exam";
      
      // Enforce clean, structured dosage unit string: "[value] [unit]"
      let finalDosageUnit = null;
      if (itemType === "medication" && dosageVal.trim()) {
        finalDosageUnit = `${dosageVal.trim().toLowerCase()} ${dosageUnitType}`;
      }

      const { error } = await supabase.from("clinic_catalog").insert({
        name: name.trim(),
        item_type: itemType,
        category,
        dosage_unit: finalDosageUnit,
        is_custom: true,
      });

      if (error) throw error;

      toast.success("Item adicionado ao catálogo com sucesso!");
      setName("");
      setItemType("");
      setDosageVal("");
      setDosageUnitType("mg");
      setOpen(false);
      onItemAdded?.();
    } catch (err) {
      console.error("Catalog insert error:", err);
      toast.error("Erro ao salvar item. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Softer premium outline button instead of aggressive solid pink */}
        <Button
          size="lg"
          className="w-full mt-4 bg-[#E5859A]/10 hover:bg-[#E5859A]/20 text-[#8B3D5A] border border-[#E5859A]/25 rounded-2xl h-[56px] font-bold active:scale-95 transition-all duration-300 shadow-sm"
        >
          <Plus size={20} className="mr-2" />
          Novo Item no Catálogo
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[360px] translate-x-[-50%] translate-y-[-50%] rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_20px_50px_-15px_rgba(139,61,90,0.18)] p-6 outline-none animate-in fade-in-0 zoom-in-95 data-[state=open]:duration-200">
        <DialogHeader>
          <DialogTitle className="text-[#1C1917] text-xl font-bold">
            Adicionar ao Catálogo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block">
              Nome do Item <span className="text-[#E5859A]">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Progesterona, Ultrassom..."
              className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a]/60 focus-visible:ring-[#E5859A]/30 focus-visible:border-[#E5859A]/50 rounded-2xl h-12"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block">
              Tipo <span className="text-[#E5859A]">*</span>
            </label>
            <Select value={itemType} onValueChange={(val) => {
              setItemType(val);
              setDosageVal(""); // Reset dose values if changed
            }}>
              <SelectTrigger className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus:ring-[#E5859A]/30 rounded-2xl h-12">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 backdrop-blur-md border-white/60 text-[#1C1917] shadow-xl rounded-2xl">
                <SelectItem value="medication" className="!text-[#1C1917] focus:bg-[#E5859A]/10 focus:!text-[#8B3D5A] rounded-lg cursor-pointer">
                  Medicamento
                </SelectItem>
                <SelectItem value="exam" className="!text-[#1C1917] focus:bg-[#E5859A]/10 focus:!text-[#8B3D5A] rounded-lg cursor-pointer">
                  Exame
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Structured Dosage input: Only visible for medications */}
          {itemType === "medication" && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block">
                  Dose / Valor
                </label>
                <Input
                  type="text"
                  value={dosageVal}
                  onChange={(e) => setDosageVal(e.target.value)}
                  placeholder="Ex: 100, 2.5..."
                  className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 placeholder:text-[#9e837a]/40 focus-visible:ring-[#E5859A]/30 focus-visible:border-[#E5859A]/50 rounded-2xl h-12"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block">
                  Unidade
                </label>
                <Select value={dosageUnitType} onValueChange={setDosageUnitType}>
                  <SelectTrigger className="bg-white/60 backdrop-blur-sm text-[#1C1917] border-white/60 focus:ring-[#E5859A]/30 rounded-2xl h-12">
                    <SelectValue placeholder="mg" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border-white/60 text-[#1C1917] shadow-xl rounded-2xl">
                    {["mg", "mcg", "g", "ml", "UI", "comprimido(s)", "gota(s)", "flaconete(s)"].map((unit) => (
                      <SelectItem key={unit} value={unit} className="!text-[#1C1917] focus:bg-[#E5859A]/10 focus:!text-[#8B3D5A] rounded-lg cursor-pointer">
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-[52px] rounded-2xl bg-[#E5859A] hover:bg-[#D47489] text-white font-bold text-[15px] shadow-lg shadow-[#E5859A]/20 active:scale-95 transition-all duration-300 border-none mt-2"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : null}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
