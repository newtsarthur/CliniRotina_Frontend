import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  ShieldCheck,
  Heart,
  User,
  Mail,
  Phone,
  IdCard,
  Stethoscope,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
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

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [doctorCrm, setDoctorCrm] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showLgpdModal, setShowLgpdModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 2) value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    if (value.length > 10) value = `${value.slice(0, 10)}-${value.slice(10)}`;
    setPhone(value);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 3) value = `${value.slice(0, 3)}.${value.slice(3)}`;
    if (value.length > 7) value = `${value.slice(0, 7)}.${value.slice(7)}`;
    if (value.length > 11) value = `${value.slice(0, 11)}-${value.slice(11)}`;
    setCpf(value);
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Informe seu nome completo.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = "Informe um e-mail válido.";
    if (phone.replace(/\D/g, "").length < 11)
      newErrors.phone = "Informe um número de celular válido.";
    if (cpf.replace(/\D/g, "").length < 11) newErrors.cpf = "Informe um CPF válido.";
    if (!doctorCrm.trim()) newErrors.crm = "Informe o CRM do seu médico.";
    if (password.length < 6) newErrors.password = "A senha deve ter no mínimo 6 caracteres.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setShowLgpdModal(true);
  };

  const executeRegistration = async () => {
    setShowLgpdModal(false);
    setLoading(true);

    try {
      const { data: doctorMatches, error: doctorError } = await supabase.rpc(
        "find_doctor_by_crm",
        {
          p_crm: doctorCrm.trim(),
          p_uf: null,
        }
      );

      if (doctorError) throw doctorError;

      if (!doctorMatches || doctorMatches.length === 0) {
        toast.error("CRM não encontrado. Verifique com seu médico.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            cpf,
            doctor_crm_reference: doctorCrm.trim(),
          },
        },
      });

      if (authError) throw authError;

      if (authData.session) {
        const { error: profileError } = await supabase.rpc(
          "complete_patient_registration",
          {
            p_full_name: name,
            p_phone: phone,
            p_cpf: cpf,
            p_doctor_crm_reference: doctorCrm.trim(),
          }
        );

        if (profileError) throw profileError;
      }

      if (authData.session) {
        localStorage.setItem("userType", "patient");
        toast.success("Bem-vinda! Seu cadastro foi concluído e seu médico foi vinculado.");
        navigate("/dashboard");
      } else {
        toast.success("Conta criada! Verifique seu e-mail para confirmar antes de acessar.");
        navigate("/");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao criar conta.";
      toast.error(message);
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
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-80 h-80 rounded-full bg-[#E5859A]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-96 h-96 rounded-full bg-[#E8C5B8]/25 blur-3xl" />

      {/* Logo */}
      <div
        className="relative w-full flex justify-center mb-6"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <img
          src="/images/logo-clinirotrina.png"
          alt="CliniRotina"
          className="h-24 object-contain"
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[400px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_4px_30px_-8px_rgba(229,133,154,0.12),0_1px_2px_rgba(26,20,22,0.04)] border border-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 bg-[#FBEDF1] text-[#E5859A] text-[10.5px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
            <Heart className="w-3 h-3" fill="#E5859A" stroke="#E5859A" />
            Paciente
          </span>
          <h1 className="text-[24px] font-semibold tracking-tight leading-tight mt-3">
            Criar sua conta
          </h1>
          <p className="text-[13.5px] text-[#7A6E72] mt-1.5 leading-relaxed">
            Preencha seus dados para iniciar seu acompanhamento.
          </p>
        </div>

        <form onSubmit={handlePreSubmit} className="space-y-3.5">
          <FieldInput
            icon={<User className="w-[15px] h-[15px]" />}
            label="Nome completo"
            type="text"
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
          />
          <FieldInput
            icon={<Mail className="w-[15px] h-[15px]" />}
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <FieldInput
            icon={<Phone className="w-[15px] h-[15px]" />}
            label="Celular (WhatsApp)"
            type="tel"
            placeholder="(00) 90000-0000"
            value={phone}
            onChange={handlePhoneChange}
            error={errors.phone}
          />
          <FieldInput
            icon={<IdCard className="w-[15px] h-[15px]" />}
            label="CPF"
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            error={errors.cpf}
          />
          <FieldInput
            icon={<Stethoscope className="w-[15px] h-[15px]" />}
            label="CRM do seu médico"
            type="text"
            placeholder="Ex: 12345"
            value={doctorCrm}
            onChange={(e) => setDoctorCrm(e.target.value.replace(/\D/g, ""))}
            error={errors.crm}
            hint="Informe o número do CRM do médico que te acompanha."
          />
          <FieldInput
            icon={<Lock className="w-[15px] h-[15px]" />}
            label="Senha"
            type="password"
            placeholder="Mínimo de 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            isPassword
          />

          <button
            type="submit"
            disabled={loading}
            className="group w-full bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-[0_8px_20px_-8px_rgba(26,20,22,0.4)]"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Cadastrar
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="relative mt-7 text-center animate-in fade-in duration-700">
        <p className="text-[13px] text-[#7A6E72]">
          Já possui uma conta?{" "}
          <button
            onClick={() => navigate("/")}
            className="text-[#1A1416] font-semibold hover:text-[#E5859A] transition-colors"
          >
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
              Termos de Uso e Privacidade
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="my-4 text-[13px] text-[#7A6E72] space-y-3 bg-[#FAF7F5] p-4 rounded-2xl max-h-[40vh] overflow-y-auto leading-relaxed">
            <p>
              A <strong className="text-[#1A1416]">Lei Geral de Proteção de Dados (LGPD)</strong> estabelece diretrizes para o tratamento de dados pessoais, incluindo seu número de celular.
            </p>
            <p>
              Ao prosseguir, você concorda que a clínica <strong className="text-[#1A1416]">CliniRotina</strong> utilize seu número de WhatsApp cadastrado estritamente para o envio de notificações, lembretes de medicamentos e acompanhamento do seu ciclo de tratamento.
            </p>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2.5 mt-2">
            <AlertDialogCancel className="w-full h-12 rounded-2xl bg-[#FAF7F5] hover:bg-[#F2EBE7] border-none text-[#1A1416] font-medium mt-0">
              Não concordo
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeRegistration}
              className="w-full h-12 rounded-2xl bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium m-0"
            >
              Li e Aceito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ---------- Input field component ---------- */
interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  error?: string;
  hint?: string;
  isPassword?: boolean;
}

function FieldInput({
  label,
  icon,
  trailing,
  error,
  hint,
  isPassword,
  type,
  ...props
}: FieldInputProps) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const inputType = isPassword ? (show ? "text" : "password") : type;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 px-1">
        <label className="text-[11.5px] font-semibold tracking-wide uppercase text-[#7A6E72]">
          {label}
        </label>
        {trailing}
      </div>
      <div
        className={`flex items-center gap-2.5 bg-[#FAF7F5] border rounded-2xl px-4 h-[52px] transition-all ${
          focused
            ? "border-[#E5859A] bg-white shadow-[0_0_0_4px_rgba(229,133,154,0.12)]"
            : error
            ? "border-[#E5859A]/60"
            : "border-[#EDE5E1] hover:border-[#DDD2CC]"
        }`}
      >
        {icon && (
          <span
            className={`transition-colors ${
              focused ? "text-[#E5859A]" : "text-[#9A8E92]"
            }`}
          >
            {icon}
          </span>
        )}
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
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-[#9A8E92] hover:text-[#1A1416] transition-colors p-1 -mr-1"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            {show ? <EyeOff className="w-[16px] h-[16px]" /> : <Eye className="w-[16px] h-[16px]" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="text-[11px] text-[#9A8E92] mt-1 ml-1">{hint}</p>
      )}
      {error && <p className="text-[11px] text-[#E5859A] mt-1 ml-1">{error}</p>}
    </div>
  );
}
