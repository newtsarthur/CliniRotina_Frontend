import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Save, ShieldCheck, User, Loader2, Eye, EyeOff, Lock, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatName } from "@/lib/utils";

export default function MeusDados() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"dados" | "seguranca">("dados");
  const [saving, setSaving] = useState(false);
  const [cpfError, setCpfError] = useState("");

  // Dados pessoais
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  
  // Privacy states
  const [showCpf, setShowCpf] = useState(false);

  // Segurança
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Populate fields from profile
  useEffect(() => {
    if (profile) {
      setFullName(formatName(profile.full_name) || "");
      setPhone(profile.phone || "");
      setBirthDate(profile.birth_date || "");
      setCpf(profile.cpf || "");
      setAddress(profile.address || "");
      setCity(profile.city || "");
      setState(profile.state || "");
    }
    if (user) {
      setEmail(user.email || "");
    }
  }, [profile, user]);

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 10) {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
        .slice(0, 14);
    } else {
      return digits
        .replace(/(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2")
        .slice(0, 15);
    }
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
    setCpfError("");
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  // Password strength check
  const hasMinLength = newPassword.length >= 8;
  const hasNumber = /[0-9]/.test(newPassword);
  const hasUppercase = /[A-Z]/.test(newPassword);
  const strengthScore = (hasMinLength ? 1 : 0) + (hasNumber ? 1 : 0) + (hasUppercase ? 1 : 0);

  const getStrengthLabel = () => {
    if (!newPassword) return "";
    if (strengthScore === 1) return "Senha fraca 🔴";
    if (strengthScore === 2) return "Senha média 🟡";
    return "Senha forte 🟢";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (activeTab === "dados") {
      const rawCpf = cpf.replace(/\D/g, "");
      if (rawCpf.length > 0 && rawCpf.length !== 11) {
        setCpfError("Informe um CPF válido de 11 dígitos.");
        return;
      }
    }

    setSaving(true);

    try {
      if (activeTab === "dados") {
        const { error } = await supabase
          .from("profiles")
          .update({
            full_name: fullName,
            phone,
            birth_date: birthDate || null,
            cpf,
            address,
            city,
            state,
          })
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Alterações salvas com sucesso! ✨");
      } else {
        let changed = false;

        // Alterar senha
        if (newPassword || confirmPassword) {
          if (!currentPassword) {
            toast.error("Por favor, digite sua senha atual para confirmação.");
            setSaving(false);
            return;
          }
          if (strengthScore < 3) {
            toast.error("A nova senha deve atender a todos os critérios de segurança.");
            setSaving(false);
            return;
          }
          if (newPassword !== confirmPassword) {
            toast.error("As novas senhas digitadas não coincidem.");
            setSaving(false);
            return;
          }

          // Verify current password first by doing a re-auth check
          const { error: verifyError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword,
          });

          if (verifyError) {
            toast.error("A Senha Atual digitada está incorreta.");
            setSaving(false);
            return;
          }

          // Update user password
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) throw updateError;
          
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          toast.success("Senha atualizada com sucesso! 🔒");
          changed = true;
        }

        if (!changed) {
          toast.success("Nenhuma alteração de segurança detectada.");
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar alterações.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const isCpfLocked = !!profile?.cpf;

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
      <header className="h-[80px] flex items-center px-6 bg-transparent relative gap-3">
        <button 
          onClick={() => navigate("/profile")} 
          className="p-2.5 -ml-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
        >
          <ChevronLeft size={22} className="text-[#1C1917]" />
        </button>
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Meus Dados</h1>
      </header>

      <main className="px-6 pt-2 max-w-md mx-auto">
        
        {/* Tab Selector */}
        <div className="flex bg-white/40 backdrop-blur-md border border-white/70 p-1.5 rounded-full w-full shadow-sm mb-8">
          <button 
            type="button"
            onClick={() => setActiveTab("dados")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[14px] font-bold rounded-full transition-all duration-300 ${activeTab === "dados" ? "bg-white text-[#1C1917] shadow-md scale-[1.01]" : "text-[#9e837a] hover:text-[#1C1917]"}`}
          >
            <User size={18} /> Dados Pessoais
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("seguranca")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[14px] font-bold rounded-full transition-all duration-300 ${activeTab === "seguranca" ? "bg-white text-[#1C1917] shadow-md scale-[1.01]" : "text-[#9e837a] hover:text-[#1C1917]"}`}
          >
            <ShieldCheck size={18} /> Segurança
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* ABA: DADOS PESSOAIS */}
          {activeTab === "dados" && (
            <div className="space-y-6">
              <div 
                className="w-full rounded-[32px] p-6 backdrop-blur-md border border-white/70 shadow-sm"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] rounded-2xl flex items-center justify-center shadow-sm">
                    <User size={20} className="text-[#8B3D5A]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1C1917]">Informações Básicas</h3>
                    <p className="text-[12px] text-[#7a5d56] font-medium">Seus dados de identificação</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={saving}
                      placeholder="Seu nome completo"
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all disabled:opacity-50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">Telefone</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={handlePhoneChange}
                      disabled={saving}
                      placeholder="(81) 99999-9999"
                      maxLength={15}
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all disabled:opacity-50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">CPF</label>
                    <div className="relative flex items-center">
                      <input 
                        type={showCpf ? "text" : "password"}
                        inputMode="numeric"
                        value={cpf}
                        onChange={handleCpfChange}
                        disabled={saving || isCpfLocked}
                        placeholder="000.000.000-00"
                        className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl pl-4 pr-12 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all disabled:opacity-50 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCpf(!showCpf)}
                        className="absolute right-4 p-1.5 hover:bg-black/5 rounded-lg text-[#9e837a] transition-colors"
                        title={showCpf ? "Ocultar CPF" : "Mostrar CPF"}
                      >
                        {showCpf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {isCpfLocked && (
                      <p className="text-[11px] text-[#9e837a] mt-2 ml-1 font-medium">
                        CPF verificado. Para alterá-lo, fale com a equipe de suporte.
                      </p>
                    )}
                    {cpfError && (
                      <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{cpfError}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: SEGURANÇA */}
          {activeTab === "seguranca" && (
            <div className="space-y-6">
              <div 
                className="w-full rounded-[32px] p-6 backdrop-blur-md border border-white/70 shadow-sm"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FFF5F8] to-[#FCE7EC] rounded-2xl flex items-center justify-center shadow-sm">
                    <ShieldCheck size={20} className="text-[#8B3D5A]" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-bold text-[#1C1917]">Segurança da Conta</h3>
                    <p className="text-[12px] text-[#7a5d56] font-medium">Gerencie seu acesso e proteção</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">E-mail de Acesso</label>
                    <div className="relative flex items-center">
                      <input 
                        type="email" 
                        value={email}
                        readOnly={true}
                        disabled={true}
                        className="w-full bg-[#FAF7F2]/60 backdrop-blur-sm border border-white/80 rounded-2xl pl-4 pr-12 py-3.5 text-[15px] text-[#7a5d56] transition-all cursor-not-allowed font-medium"
                      />
                      <Lock size={16} className="absolute right-4 text-[#9e837a]" />
                    </div>
                    <p className="text-[11px] text-[#9e837a] mt-2 ml-1 font-medium">
                      O e-mail de login é sua identidade de acesso única e não pode ser alterado diretamente.
                    </p>
                  </div>
                </div>
              </div>

              <div 
                className="w-full rounded-[32px] p-6 backdrop-blur-md border border-white/70 shadow-sm"
                style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)" }}
              >
                <h3 className="text-[17px] font-bold text-[#1C1917] mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-[#E5859A] rounded-full"></span>
                  Alterar Senha
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">Senha Atual *</label>
                    <input 
                      type="password" 
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={saving}
                      placeholder="Digite sua senha atual"
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">Nova Senha *</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={saving}
                      placeholder="Digite a nova senha"
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all font-medium"
                    />
                    
                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-3 space-y-2 px-1">
                        <div className="flex items-center justify-between text-xs font-bold text-[#7a5d56]">
                          <span>Força da senha:</span>
                          <span>{getStrengthLabel()}</span>
                        </div>
                        {/* Progress Strength Bar */}
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              strengthScore === 1 ? "bg-red-500 w-1/3" :
                              strengthScore === 2 ? "bg-yellow-500 w-2/3" :
                              strengthScore === 3 ? "bg-green-500 w-full" : "w-0"
                            }`}
                          />
                        </div>
                        {/* Rules checklist */}
                        <div className="text-[11px] space-y-1 pt-1 font-medium">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            {hasMinLength ? <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
                            <span className={hasMinLength ? "text-green-700 font-bold" : ""}>Mínimo de 8 caracteres</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            {hasNumber ? <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
                            <span className={hasNumber ? "text-green-700 font-bold" : ""}>Pelo menos um número (0-9)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            {hasUppercase ? <Check className="w-3.5 h-3.5 text-green-600" strokeWidth={3} /> : <X className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
                            <span className={hasUppercase ? "text-green-700 font-bold" : ""}>Pelo menos uma letra maiúscula (A-Z)</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-[#7a5d56] mb-1.5 ml-1">Confirmar Nova Senha *</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={saving}
                      placeholder="Repita a nova senha"
                      className="w-full bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl px-4 py-3.5 text-[15px] text-[#1C1917] placeholder:text-[#9e837a]/50 focus:outline-none focus:ring-4 focus:ring-[#E5859A]/10 focus:border-[#E5859A]/30 transition-all font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOTÃO DE SALVAR */}
          <div className="pt-6">
            <button 
              type="submit"
              disabled={saving}
              className="w-full bg-[#E5859A] text-white font-bold text-[17px] flex items-center justify-center gap-2 py-4.5 rounded-[20px] shadow-lg shadow-[#E5859A]/20 hover:bg-[#D47489] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:hover:scale-100"
              style={{ minHeight: '60px' }}
            >
              {saving ? <Loader2 size={22} className="animate-spin" /> : <Save size={22} />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
          
        </form>
      </main>
    </div>
  );
}
