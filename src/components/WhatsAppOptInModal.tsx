import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppOptInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function WhatsAppOptInModal({ open, onOpenChange, userId, onSuccess }: WhatsAppOptInModalProps) {
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notifications_enabled: true })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao salvar preferência.");
    } else {
      toast.success("Notificações ativadas! 🎉");
      if (onSuccess) onSuccess();
    }
    setSaving(false);
    onOpenChange(false);
  };

  const handleDismiss = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-3xl max-w-[340px] mx-auto p-0 border-none shadow-2xl [&>button]:hidden">
        <div className="flex flex-col items-center text-center px-6 pt-8 pb-6">
          <div className="w-16 h-16 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-5">
            <MessageCircle className="w-8 h-8 text-[#25D366]" />
          </div>

          <h2 className="text-lg font-bold text-[#121212] mb-2 font-['Spline_Sans']">
            Ativar Notificações?
          </h2>

          <p className="text-sm text-[#434343] leading-relaxed mb-6">
            Você gostaria de receber lembretes de medicamentos e notificações do seu ciclo diretamente no seu WhatsApp?
          </p>

          <div className="w-full space-y-2.5">
            <Button
              onClick={handleAccept}
              disabled={saving}
              className="w-full h-12 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold shadow-md shadow-[#25D366]/20 transition-all active:scale-95"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sim, quero receber"}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full h-10 rounded-2xl text-[#7a5d56] text-xs font-semibold hover:bg-gray-100"
            >
              Agora não
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
