import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/asyncTimeout";
import {
  ArrowRight,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  User,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

function getActivationErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro ao ativar conta profissional.";
  const normalized = message.toLowerCase();

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "Este e-mail já tem uma conta. Informe a senha dessa conta para concluir a ativação.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "Credenciais inválidas. Confira o e-mail e a senha.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de concluir a ativação.";
  }

  if (normalized.includes("invitation email does not match")) {
    return "Este convite pertence a outro e-mail. Use exatamente o e-mail informado pela clínica.";
  }

  if (normalized.includes("crm/uf do not match")) {
    return "CRM ou UF não conferem com o convite.";
  }

  if (normalized.includes("invalid or expired invitation")) {
    return "Convite inválido ou expirado. Peça um novo convite à clínica.";
  }

  return message;
}

export default function RegisterDoctor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [crm, setCrm] = useState("");
  const [uf, setUf] = useState("PE");
  const [inviteCode, setInviteCode] = useState(searchParams.get("invite") || "");
  const [password, setPassword] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setHasSession(!!session);
      if (session?.user.email) setEmail(session.user.email);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`;
    if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`;
    setCpf(value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setPhone(value);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe seu nome completo.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Informe um e-mail válido.");
    if (phone.replace(/\D/g, "").length < 11) return toast.error("Informe um celular válido com DDD.");
    if (cpf.replace(/\D/g, "").length !== 11) return toast.error("Informe um CPF válido.");
    if (crm.length < 4) return toast.error("Informe um CRM válido.");
    if (!inviteCode.trim()) return toast.error("Informe o código de convite da clínica.");
    if (!hasSession && password.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
    setShowLgpdModal(true);
  };

  const completeDoctorProfile = async () => {
    const { error: profileError } = await supabase.rpc("complete_doctor_registration", {
      p_cpf: cpf,
      p_crm: crm,
      p_full_name: name,
      p_invite_token: inviteCode.trim(),
      p_phone: phone,
      p_uf: uf,
    });

    if (profileError) throw profileError;

    localStorage.setItem("userType", "doctor");
    toast.success("Cadastro profissional ativado com segurança.");
    navigate("/pacientes", { replace: true });
  };

  const executeRegistration = async () => {
    setShowLgpdModal(false);
    setLoading(true);

    try {
      if (hasSession) {
        await completeDoctorProfile();
        return;
      }

      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/register-doctor?invite=${encodeURIComponent(inviteCode.trim())}`,
            data: {
              full_name: name,
              phone,
            },
          },
        }),
        30000,
        "criação da conta"
      );

      if (authError) {
        const alreadyRegistered = authError.message.toLowerCase().includes("already registered");

        if (!alreadyRegistered) throw authError;

        const { error: signInError } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password }),
          30000,
          "login da conta existente"
        );

        if (signInError) throw signInError;

        await completeDoctorProfile();
        return;
      }

      if (authData.session) {
        await completeDoctorProfile();
      } else {
        toast.success("Conta criada. Confirme seu e-mail e depois volte ao link do convite para concluir.");
        navigate("/", { replace: true });
      }
    } catch (error: unknown) {
      toast.error(getActivationErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-start px-6 py-10 font-sans text-[#1A1416] overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FBF1F2 0%, #FAF6F3 45%, #F7F2EE 100%)",
      }}
    >
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#E5859A]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#E8C5B8]/25 blur-3xl" />

      <div className="relative w-full flex justify-center mb-6" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <img src="/images/logo-clinirotrina.png" alt="CliniRotina" className="h-24 object-contain" />
      </div>

      <div className="relative w-full max-w-[400px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_4px_30px_-8px_rgba(229,133,154,0.12),0_1px_2px_rgba(26,20,22,0.04)] border border-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 bg-[#FBEDF1] text-[#E5859A] text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            <Stethoscope className="w-3 h-3" />
            Acesso profissional
          </span>
          <h1 className="text-[24px] font-semibold tracking-tight leading-tight mt-3">Ativação de conta</h1>
          <p className="text-[13.5px] text-[#7A6E72] mt-1.5 leading-relaxed">
            {hasSession
              ? "Confirme seus dados para concluir a ativação profissional."
              : "Use o convite emitido pela clínica para ativar sua conta profissional."}
          </p>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-3.5">
          <FieldInput icon={<User className="w-[15px] h-[15px]" />} label="Nome completo" type="text" placeholder="Ex: Juliana Souto" value={name} onChange={(e) => setName(e.target.value)} required />
          <FieldInput icon={<Mail className="w-[15px] h-[15px]" />} label="E-mail profissional" type="email" placeholder="dr@clinica.com" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={hasSession} />
          <FieldInput icon={<Phone className="w-[15px] h-[15px]" />} label="Celular" type="tel" placeholder="(00) 90000-0000" value={phone} onChange={handlePhoneChange} required />
          <FieldInput icon={<IdCard className="w-[15px] h-[15px]" />} label="CPF" type="text" placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} required />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FieldInput icon={<Stethoscope className="w-[15px] h-[15px]" />} label="CRM" type="text" placeholder="Apenas números" value={crm} onChange={(e) => setCrm(e.target.value.replace(/\D/g, ""))} maxLength={10} required />
            </div>
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <label className="text-[11.5px] font-semibold tracking-wide uppercase text-[#7A6E72]">UF</label>
              </div>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full bg-[#FAF7F5] border border-[#EDE5E1] hover:border-[#DDD2CC] focus:border-[#E5859A] focus:bg-white focus:shadow-[0_0_0_4px_rgba(229,133,154,0.12)] rounded-2xl px-3 h-[52px] text-[14.5px] text-[#1A1416] outline-none transition-all appearance-none text-center"
                required
              >
                {UF_LIST.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FieldInput icon={<KeyRound className="w-[15px] h-[15px]" />} label="Código de convite" type="text" placeholder="Enviado pela clínica" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
          {!hasSession && (
            <FieldInput icon={<Lock className="w-[15px] h-[15px]" />} label="Senha" type="password" placeholder="Mínimo de 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required isPassword />
          )}

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-[0_8px_20px_-8px_rgba(26,20,22,0.4)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{hasSession ? "Concluir ativação" : "Ativar conta profissional"}<ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" /></>}
          </button>
        </form>
      </div>

      <div className="relative mt-7 text-center animate-in fade-in duration-700">
        <p className="text-[13px] text-[#7A6E72]">
          Já é cadastrado?{" "}
          <button onClick={() => navigate("/")} className="text-[#1A1416] font-semibold hover:text-[#E5859A] transition-colors">
            Faça login
          </button>
        </p>
      </div>

      <AlertDialog open={showLgpdModal} onOpenChange={setShowLgpdModal}>
        <AlertDialogContent className="bg-white rounded-[24px] border-none max-w-md p-6 shadow-2xl overflow-hidden">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-[#FBEDF1] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6 text-[#E5859A]" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-[#1A1416] text-center tracking-tight">
              Termos de Responsabilidade e LGPD
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="my-4 text-[13px] text-[#7A6E72] space-y-3 bg-[#FAF7F5] p-4 rounded-2xl max-h-[40vh] overflow-y-auto leading-relaxed">
            <p>
              Como profissional utilizando a plataforma <strong className="text-[#1A1416]">CliniRotina</strong>, você se compromete a tratar dados sensíveis de saúde com sigilo e finalidade clínica.
            </p>
            <p>
              O acesso profissional é liberado somente por convite da clínica, e suas ações ficam vinculadas à sua conta.
            </p>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2.5 mt-2">
            <AlertDialogCancel className="w-full h-12 rounded-2xl bg-[#FAF7F5] hover:bg-[#F2EBE7] border-none text-[#1A1416] font-medium mt-0" disabled={loading}>
              Não concordo
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeRegistration} className="w-full h-12 rounded-2xl bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium m-0" disabled={loading}>
              Li e Aceito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

function FieldInput({ label, icon, trailing, error, hint, isPassword, type, ...props }: FieldInputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <label className="text-[11.5px] font-semibold tracking-wide uppercase text-[#7A6E72]">{label}</label>
        {trailing}
      </div>
      <div
        className={`flex items-center gap-2.5 bg-[#FAF7F5] border rounded-2xl px-4 h-[52px] transition-all ${
          focused ? "border-[#E5859A] bg-white shadow-[0_0_0_4px_rgba(229,133,154,0.12)]" : error ? "border-[#E5859A]/60" : "border-[#EDE5E1] hover:border-[#DDD2CC]"
        }`}
      >
        {icon && <span className={`transition-colors ${focused ? "text-[#E5859A]" : "text-[#9A8E92]"}`}>{icon}</span>}
        <input
          {...props}
          type={inputType}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          className="flex-1 bg-transparent outline-none text-[14.5px] text-[#1A1416] placeholder:text-[#B5A8AC]"
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)} className="text-[#9A8E92] hover:text-[#1A1416] transition-colors p-1 -mr-1" aria-label={show ? "Ocultar senha" : "Mostrar senha"}>
            {show ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-[11px] text-[#9A8E92] mt-1 ml-1">{hint}</p>}
      {error && <p className="text-[11px] text-[#E5859A] mt-1 ml-1">{error}</p>}
    </div>
  );
}
