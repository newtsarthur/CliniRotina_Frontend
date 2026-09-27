import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { DoctorBottomNav } from "@/components/DoctorBottomNav";
import { 
  Camera, 
  User, 
  FileText, 
  ChevronRight, 
  LogOut, 
  Loader2, 
  MessageCircle, 
  Calendar, 
  HelpCircle 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { formatName } from "@/lib/utils";
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

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function Perfil() {
  const navigate = useNavigate();
  const { profile, user, loading, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDoctor = profile?.user_type === "doctor";
  const displayAvatar = avatarUrl || profile?.avatar_url || null;

  // Sync notifications toggles with profile
  useEffect(() => {
    if (profile?.notifications_enabled !== undefined && profile?.notifications_enabled !== null) {
      setNotificationsEnabled(!!profile.notifications_enabled);
    }
  }, [profile]);

  const handleToggleNotifications = async (checked: boolean) => {
    if (!user || togglingNotif) return;
    setTogglingNotif(true);
    const prev = notificationsEnabled;
    setNotificationsEnabled(checked);

    const { error } = await supabase
      .from("profiles")
      .update({ notifications_enabled: checked })
      .eq("id", user.id);

    if (error) {
      setNotificationsEnabled(prev);
      toast.error("Erro ao atualizar preferência.");
    } else {
      toast.success(checked ? "Notificações ativadas! 🎉" : "Notificações desativadas.");
    }
    setTogglingNotif(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.clear();
    navigate("/");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG, WebP ou GIF.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Imagem muito grande. Máximo de 5MB.");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto atualizada com sucesso!");
    } catch (err: unknown) {
      console.error("Upload error:", err);
      toast.error("Erro ao enviar foto. Tente novamente.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Configurações</h1>
      </header>

      {/* Profile Section */}
      <div className="flex flex-col items-center pt-2 pb-4">
        <div className="relative inline-block">
          <Avatar className="w-[90px] h-[90px] border border-[#E5859A]/30 shadow-sm">
            {displayAvatar ? (
              <AvatarImage src={displayAvatar} alt="Foto de perfil" className="object-cover" />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-[#FAF6F3] to-[#e8c5b8]/30 text-[#8B3D5A] text-2xl font-bold">
              {getInitials(profile?.full_name)}
            </AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 bg-[#E5859A] w-8 h-8 flex items-center justify-center rounded-full cursor-pointer hover:bg-[#d9758a] transition-colors shadow-sm border-2 border-white">
            {uploading ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Camera size={14} className="text-white" />
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/jpeg,image/png,image/webp,image/gif" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center mt-4 space-y-2">
            <div className="h-6 w-32 bg-white/40 rounded-md animate-pulse" />
            <div className="h-4 w-48 bg-white/40 rounded-md animate-pulse" />
          </div>
        ) : (
          <div className="text-center mt-3">
            <h2 className="text-[20px] font-bold text-[#1C1917] tracking-tight">
              {formatName(profile?.full_name) || 'Usuário'}
            </h2>
            <p className="text-[14px] text-[#7a5d56] font-medium mt-0.5">
              {profile?.email || user?.email || ''}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 text-[11.5px] text-[#7a5d56]/70 hover:text-[#8B3D5A] font-semibold tracking-wide transition-all hover:underline"
            >
              Alterar foto de perfil
            </button>
          </div>
        )}
      </div>

      <div className="px-6 space-y-4">
        {/* Menu de Opções */}
        <div 
          className="w-full rounded-[32px] overflow-hidden backdrop-blur-md border border-white/70 shadow-sm"
          style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
          }}
        >
          <Link to="/meus-dados" className="flex items-center justify-between p-5 group active:bg-white/40 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#FFF5F8] text-[#8B3D5A] rounded-2xl flex items-center justify-center shrink-0 border border-[#E5859A]/15 shadow-sm">
                <User size={23} strokeWidth={1.8} />
              </div>
              <span className="text-[#1C1917] font-semibold text-[15.5px]">Meus Dados</span>
            </div>
            <ChevronRight size={20} className="text-[#E5859A]" />
          </Link>

          {!isDoctor && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5859A]/10 to-transparent mx-5" />

              <Link to="/agenda" className="flex items-center justify-between p-5 group active:bg-white/40 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#EEF2FF] text-[#4F46E5] rounded-2xl flex items-center justify-center shrink-0 border border-[#4F46E5]/15 shadow-sm">
                    <Calendar size={23} strokeWidth={1.8} />
                  </div>
                  <span className="text-[#1C1917] font-semibold text-[15.5px]">Agenda & Consultas</span>
                </div>
                <ChevronRight size={20} className="text-[#E5859A]" />
              </Link>
            </>
          )}

          {!isDoctor && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5859A]/10 to-transparent mx-5" />

              <Link to="/duvidas" className="flex items-center justify-between p-5 group active:bg-white/40 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#FFFBEB] text-[#D97706] rounded-2xl flex items-center justify-center shrink-0 border border-[#D97706]/15 shadow-sm">
                    <HelpCircle size={23} strokeWidth={1.8} />
                  </div>
                  <span className="text-[#1C1917] font-semibold text-[15.5px]">Central de Dúvidas</span>
                </div>
                <ChevronRight size={20} className="text-[#E5859A]" />
              </Link>
            </>
          )}

          <div className="h-px bg-gradient-to-r from-transparent via-[#E5859A]/10 to-transparent mx-5" />

          <Link to="/termos" className="flex items-center justify-between p-5 group active:bg-white/40 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-[#ECFDF5] text-[#059669] rounded-2xl flex items-center justify-center shrink-0 border border-[#059669]/15 shadow-sm">
                <FileText size={23} strokeWidth={1.8} />
              </div>
              <span className="text-[#1C1917] font-semibold text-[15.5px]">Termos de Uso</span>
            </div>
            <ChevronRight size={20} className="text-[#E5859A]" />
          </Link>

          {!isDoctor && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[#E5859A]/10 to-transparent mx-5" />

              <div className="flex items-center justify-between p-5 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#E8F8F5] text-[#075E54] rounded-2xl flex items-center justify-center shrink-0 border border-[#075E54]/15 shadow-sm">
                    <MessageCircle size={23} strokeWidth={1.8} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[#1C1917] font-semibold text-[15.5px]">Notificações WhatsApp</span>
                    <span className="text-[12px] text-[#5C4D49] font-medium mt-0.5">Lembretes e atualizações</span>
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleToggleNotifications}
                  disabled={togglingNotif}
                  className="data-[state=checked]:bg-[#E5859A]"
                />
              </div>
            </>
          )}
        </div>

        {/* Botão de Sair */}
        <div className="pt-2 pb-2">
          <button 
            onClick={() => setShowLogoutAlert(true)} 
            className="w-full rounded-[28px] p-5 backdrop-blur-md border border-red-200/40 flex items-center justify-center gap-3 group hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            style={{ 
              background: "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(254,242,242,0.55) 100%)", 
              boxShadow: "0 10px 30px -15px rgba(220, 38, 38, 0.08)" 
            }}
          >
            <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300">
              <LogOut size={20} className="text-red-500" />
            </div>
            <span className="text-red-600 font-bold text-[16px]">Sair da conta</span>
          </button>
          <p className="text-center text-[12px] text-[#9e837a] mt-4 opacity-50 font-medium">Versão 1.1 • © 2026</p>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent className="bg-white/85 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_20px_50px_-15px_rgba(139,61,90,0.18)] max-w-[360px] p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-[#1C1917] text-center">Sair da Conta?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-[#7a5d56] text-center mt-2 leading-relaxed">
              Você precisará digitar suas credenciais de login para entrar novamente no aplicativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <AlertDialogCancel className="w-full h-12 rounded-2xl bg-white/60 hover:bg-white/80 border-white/60 text-[#1C1917] font-bold mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="w-full h-12 rounded-2xl bg-[#ED2B54] hover:bg-[#d11a43] text-white font-bold m-0 shadow-lg shadow-[#ED2B54]/20 active:scale-95 transition-all"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isDoctor ? <DoctorBottomNav /> : <BottomNav />}
    </div>
  );
}
