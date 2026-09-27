import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Check,
  Clock,
  Copy,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
  UserPlus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DoctorBottomNav } from "@/components/DoctorBottomNav";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

interface DoctorInvitation {
  id: string;
  email: string;
  crm: string;
  uf: string;
  full_name: string | null;
  phone: string | null;
  expires_at: string | null;
  used_at: string | null;
  created_at: string | null;
}

interface GeneratedInvite {
  token: string;
  activationUrl: string;
  message: string;
}

export default function AdminConvites() {
  const navigate = useNavigate();
  
  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [crm, setCrm] = useState("");
  const [uf, setUf] = useState("PE");
  const [expiresInDays, setExpiresInDays] = useState("14");
  
  // Loading & Data states
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [invitations, setInvitations] = useState<DoctorInvitation[]>([]);
  const [generatedInvite, setGeneratedInvite] = useState<GeneratedInvite | null>(null);

  const pendingInvitations = useMemo(
    () => invitations.filter((invite) => {
      const expired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false;
      return !invite.used_at && !expired;
    }),
    [invitations]
  );

  useEffect(() => {
    void loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("doctor_invitations")
      .select("id,email,crm,uf,full_name,phone,expires_at,used_at,created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      toast.error("Não foi possível carregar os convites.");
    } else {
      setInvitations((data || []) as DoctorInvitation[]);
    }

    setLoadingList(false);
  };

  const handlePhoneChange = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.length > 11) digits = digits.slice(0, 11);
    if (digits.length > 2) digits = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length > 10) digits = `${digits.slice(0, 10)}-${digits.slice(10)}`;
    setPhone(digits);
  };

  const buildExpirationDate = () => {
    const days = Number(expiresInDays);
    if (!Number.isFinite(days) || days <= 0) return null;
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const handleCreateInvite = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanCrm = crm.replace(/\D/g, "");
    if (!fullName.trim()) return toast.error("Informe o nome do profissional.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Informe um e-mail válido.");
    if (cleanCrm.length < 4) return toast.error("Informe um CRM válido.");

    setLoading(true);
    setGeneratedInvite(null);

    const { data: token, error } = await supabase.rpc("create_doctor_invitation", {
      p_crm: cleanCrm,
      p_email: email.trim().toLowerCase(),
      p_expires_at: buildExpirationDate(),
      p_full_name: fullName.trim(),
      p_phone: phone.trim() || null,
      p_uf: uf,
    });

    setLoading(false);

    if (error || !token) {
      toast.error(error?.message || "Não foi possível gerar o convite.");
      return;
    }

    const activationUrl = `${window.location.origin}/register-doctor?invite=${encodeURIComponent(token)}`;
    const message = [
      `Olá, ${fullName.trim()}!`,
      "Seu convite profissional do CliniRotina foi criado.",
      `Link de ativação: ${activationUrl}`,
      `Código: ${token}`,
      "Use o mesmo e-mail, CRM e UF informados pela clínica.",
    ].join("\n");

    setGeneratedInvite({ token, activationUrl, message });
    setFullName("");
    setEmail("");
    setPhone("");
    setCrm("");
    setUf("PE");
    toast.success("Convite profissional gerado com sucesso! 🎉");
    void loadInvitations();
  };

  const handleRevokeInvite = async (id: string) => {
    if (confirm("Deseja realmente revogar este convite?")) {
      const { error } = await supabase
        .from("doctor_invitations")
        .update({ expires_at: new Date(0).toISOString() })
        .eq("id", id);

      if (error) {
        toast.error("Erro ao revogar convite.");
      } else {
        toast.success("Convite revogado com sucesso!");
        loadInvitations();
      }
    }
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  // Real-time validations calculations
  const isNameValid = fullName.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = phone.replace(/\D/g, "").length >= 10;
  const isCrmValid = crm.replace(/\D/g, "").length >= 4;

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

      {/* Header aligned, flat text background (like Pacientes page) */}
      <header className="px-6 pt-12 pb-2">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">Convites</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FBEDF1] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#E5859A] border border-[#E5859A]/15">
                <ShieldCheck size={11} />
                Admin
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#7a5d56] font-medium">
              Acesso restrito a médicos validados pela clínica.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF5F8] text-[#8B3D5A] border border-[#E5859A]/20 text-[11px] font-bold px-3 py-1 shadow-sm shrink-0">
            {pendingInvitations.length} Ativos
          </span>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-4 space-y-5">
        {/* Form container: card matching global style */}
        <section className="rounded-[28px] border border-white/70 bg-white/75 backdrop-blur-md p-5 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)]">
          <form onSubmit={handleCreateInvite} className="space-y-3.5">
            <FieldInput 
              icon={<User size={15} />} 
              label="Nome" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="Dra. Mariana Lima"
              isDirty={fullName.length > 0}
              isValid={isNameValid}
            />
            
            <FieldInput 
              icon={<Mail size={15} />} 
              label="E-mail" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="medico@clinica.com" 
              type="email" 
              isDirty={email.length > 0}
              isValid={isEmailValid}
            />
            
            <FieldInput 
              icon={<Phone size={15} />} 
              label="Celular" 
              value={phone} 
              onChange={(e) => handlePhoneChange(e.target.value)} 
              placeholder="(00) 90000-0000" 
              type="tel" 
              isDirty={phone.length > 0}
              isValid={isPhoneValid}
            />

            {/* CRM and UF Grid */}
            <div className="grid grid-cols-[1.4fr_1fr] gap-3">
              <FieldInput 
                icon={<Stethoscope size={15} />} 
                label="CRM" 
                value={crm} 
                onChange={(e) => setCrm(e.target.value.replace(/\D/g, ""))} 
                placeholder="12345" 
                inputMode="numeric" 
                isDirty={crm.length > 0}
                isValid={isCrmValid}
              />
              <div>
                <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block px-1">UF</label>
                <select
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="h-[46px] w-full rounded-2xl border border-white/80 bg-white/60 backdrop-blur-sm px-3 text-center text-[14px] font-bold text-[#1C1917] outline-none transition-all focus:border-[#E5859A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(229,133,154,0.12)] appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B3D5A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '14px'
                  }}
                >
                  {UF_LIST.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block px-1">Validade</label>
              <div className="grid grid-cols-3 gap-2">
                {["7", "14", "30"].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setExpiresInDays(days)}
                    className={`h-[40px] rounded-2xl border text-[13px] font-bold transition-all active:scale-[0.98] w-full ${
                      expiresInDays === days
                        ? "border-[#E5859A] bg-[#FBEDF1] text-[#8B3D5A]"
                        : "border-white/80 bg-white/60 text-[#7a5d56]"
                    }`}
                  >
                    {days} dias
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1.5 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#E5859A] hover:bg-[#D47489] px-4 font-bold text-white shadow-md shadow-[#E5859A]/10 transition-all active:scale-[0.98] disabled:opacity-50 text-[14.5px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Gerar convite
            </button>
          </form>
        </section>

        {generatedInvite && (
          <section className="rounded-[28px] border border-[#BFE8CF] bg-[#F3FFF7] p-5 shadow-[0_10px_40px_-24px_rgba(25,135,84,0.3)] animate-in fade-in duration-300">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-green-600 shadow-sm">
                <Check size={20} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold text-[#1C1917]">Convite pronto</h2>
                <p className="text-[12.5px] text-[#587465]">Copie e envie para o médico cadastrado.</p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-3.5 border border-[#BFE8CF]/50">
              <p className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-[#7a5d56]">Código</p>
              <p className="break-all font-mono text-[13px] text-[#1C1917] font-bold">{generatedInvite.token}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => copyText(generatedInvite.activationUrl, "Link copiado.")}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-white border border-[#BFE8CF] px-3 text-[13px] font-bold text-[#1C1917] active:scale-[0.98] shadow-sm"
              >
                <Copy size={15} />
                Link
              </button>
              <button
                type="button"
                onClick={() => copyText(generatedInvite.message, "Mensagem copiada.")}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-[#1C1917] px-3 text-[13px] font-bold text-white active:scale-[0.98] shadow-md"
              >
                <Copy size={15} />
                Mensagem
              </button>
            </div>
          </section>
        )}

        {/* Latest invites list */}
        <section className="space-y-3 pb-8">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[16px] font-bold text-[#1C1917]">Últimos convites</h2>
            <button
              type="button"
              onClick={() => void loadInvitations()}
              className="text-[12px] font-bold text-[#E5859A] hover:text-[#D47489]"
            >
              Atualizar
            </button>
          </div>

          {loadingList ? (
            <div className="rounded-[24px] bg-white/60 backdrop-blur-md p-5 text-center text-[13px] text-[#7a5d56]">Carregando...</div>
          ) : invitations.length === 0 ? (
            <div className="rounded-[24px] bg-white/60 backdrop-blur-md p-5 text-center text-[13px] text-[#7a5d56]">Nenhum convite gerado ainda.</div>
          ) : (
            <div className="space-y-3">
              {invitations.map((invite) => {
                const expired = invite.expires_at ? new Date(invite.expires_at).getTime() < Date.now() : false;
                const status = invite.used_at ? "Usado" : expired ? "Expirado" : "Ativo";
                return (
                  <div key={invite.id} className="rounded-[28px] border border-white/70 bg-white/75 backdrop-blur-md p-5 shadow-[0_10px_40px_-20px_rgba(139,61,90,0.15)] hover:border-[#E5859A]/30 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-[#1C1917]">{invite.full_name || invite.email}</p>
                        <p className="truncate text-[12.5px] text-[#7a5d56]">{invite.email}</p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-[#9e837a]">
                          CRM {invite.crm}/{invite.uf}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                          invite.used_at
                            ? "bg-[#EEF7F1] text-green-700"
                            : expired
                              ? "bg-[#FFF0EA] text-[#B45309]"
                              : "bg-[#FBEDF1] text-[#E5859A]"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Active/Revoke and Expired/Resend Actions */}
                    {status === "Ativo" && invite.expires_at ? (
                      <div className="mt-3.5 pt-3 border-t border-[#E5859A]/10 flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7a5d56]">
                          <Clock size={12} className="text-[#E5859A]" />
                          Expira em {new Date(invite.expires_at).toLocaleDateString("pt-BR")}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-600 active:scale-95 transition-colors"
                        >
                          Revogar
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3.5 pt-3 border-t border-gray-100/50 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setFullName(invite.full_name || "");
                            setEmail(invite.email || "");
                            setPhone(invite.phone || "");
                            setCrm(invite.crm || "");
                            setUf(invite.uf || "PE");
                            window.scrollTo({ top: 0, behavior: "smooth" });
                            toast.success("Dados carregados no formulário!");
                          }}
                          className="text-xs font-bold text-[#E5859A] hover:text-[#D47489] active:scale-95 transition-all"
                        >
                          Reenviar / Usar dados
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <DoctorBottomNav />
    </div>
  );
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  isValid?: boolean;
  isDirty?: boolean;
}

function FieldInput({ label, icon, isValid, isDirty, ...props }: FieldInputProps) {
  const [focused, setFocused] = useState(false);

  // Status visual check feedback in real-time
  const statusBorderClass = isDirty
    ? isValid
      ? "border-green-300 focus:border-green-400 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.12)] bg-green-50/5"
      : "border-red-200 focus:border-red-300 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.12)] bg-red-50/5"
    : focused
    ? "border-[#E5859A] bg-white shadow-[0_0_0_4px_rgba(229,133,154,0.12)]"
    : "border-white/80";

  return (
    <div>
      <label className="text-xs font-semibold text-[#7a5d56] mb-1.5 block px-1">{label}</label>
      <div
        className={`flex h-[46px] items-center gap-2.5 rounded-2xl border bg-white/60 backdrop-blur-sm px-4 transition-all ${statusBorderClass}`}
      >
        {icon && (
          <span className={isDirty ? (isValid ? "text-green-500" : "text-red-400") : focused ? "text-[#E5859A]" : "text-[#9e837a]"}>
            {icon}
          </span>
        )}
        <input
          {...props}
          onFocus={(event) => {
            setFocused(true);
            props.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            props.onBlur?.(event);
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#1C1917] outline-none placeholder:text-[#9e837a]/40"
        />
        {isDirty && (
          <span className="text-xs shrink-0 select-none">
            {isValid ? (
              <span className="text-green-500 font-extrabold">✓</span>
            ) : (
              <span className="text-red-400 font-extrabold">!</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
