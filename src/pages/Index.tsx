import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { withTimeout } from "@/lib/asyncTimeout";
import { Heart, Stethoscope, ArrowRight, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";

type Mode = "patient" | "doctor";

function friendlyAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "Erro ao entrar";
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  return message;
}

export default function Index() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [mode, setMode] = useState<Mode>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const role = profile?.user_type;
    if (role) {
      navigate(role === "doctor" ? "/pacientes" : "/dashboard", { replace: true });
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error, data } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        30000,
        "login"
      );
      if (error) throw error;
      if (data.user) {
        const { data: profileData, error: profileError } = await withTimeout(
          supabase
            .from("profiles")
            .select("user_type")
            .eq("id", data.user.id)
            .maybeSingle(),
          30000,
          "carregamento do perfil"
        );

        if (profileError) throw profileError;

        const realType = profileData?.user_type;
        if (realType !== "doctor" && realType !== "patient") {
          await supabase.auth.signOut();
          localStorage.removeItem("userType");
          throw new Error("Conta sem perfil válido. Fale com a clínica para revisar seu acesso.");
        }

        localStorage.setItem("userType", realType);
        navigate(realType === "doctor" ? "/pacientes" : "/dashboard", { replace: true });
      }
    } catch (error: unknown) {
      toast.error(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Por favor, digite seu e-mail.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/nova-senha`,
        }),
        30000,
        "recuperação de senha"
      );
      if (error) throw error;
      toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      setIsResetting(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar e-mail de recuperação.");
    } finally {
      setLoading(false);
    }
  };

  const isPatient = mode === "patient";

  const copy = isPatient
    ? {
        headline: "Acompanhe sua jornada",
        subheadline: "Consultas, exames e evolução do tratamento em um só lugar.",
      }
    : {
        headline: "Portal profissional",
        subheadline: "Gerencie pacientes e acompanhe tratamentos com eficiência.",
      };

  return (
    <div
      className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10 font-sans text-[#1A1416] overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #FBF1F2 0%, #FAF6F3 45%, #F7F2EE 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="relative w-full flex justify-center mb-6"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <img
          src="/images/logo-clinirotrina.png"
          alt="CliniRotina"
          className="h-32 object-contain"
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-[400px] bg-white rounded-[28px] p-7 sm:p-8 shadow-[0_4px_30px_-8px_rgba(229,133,154,0.12),0_1px_2px_rgba(26,20,22,0.04)] border border-white animate-in fade-in slide-in-from-bottom-2 duration-500">
        {isResetting ? (
          <>
            <h2 className="text-[22px] font-semibold tracking-tight mb-1.5">Recuperar senha</h2>
            <p className="text-[13.5px] text-[#7A6E72] mb-7 leading-relaxed">
              Enviaremos um link seguro para o seu e-mail cadastrado.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <FieldInput
                icon={<Mail className="w-[15px] h-[15px]" />}
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1416] hover:bg-[#2A2024] text-white font-medium py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link"}
              </button>
              <button
                type="button"
                onClick={() => setIsResetting(false)}
                className="w-full text-[13px] font-medium text-[#7A6E72] hover:text-[#1A1416] transition-colors pt-1"
              >
                Voltar ao login
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Segmented control */}
            <div
              role="tablist"
              className="relative grid grid-cols-2 p-1 bg-[#F6F1ED] rounded-2xl mb-7"
            >
              <span
                aria-hidden
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-[0_2px_8px_-2px_rgba(26,20,22,0.08)] transition-all duration-300 ease-out"
                style={{ left: isPatient ? "4px" : "calc(50% + 0px)" }}
              />
              <button
                role="tab"
                aria-selected={isPatient}
                onClick={() => setMode("patient")}
                className={`relative z-10 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  isPatient ? "text-[#1A1416]" : "text-[#7A6E72]"
                }`}
              >
                <Heart className="w-[14px] h-[14px]" fill={isPatient ? "#E5859A" : "none"} stroke={isPatient ? "#E5859A" : "currentColor"} />
                Paciente
              </button>
              <button
                role="tab"
                aria-selected={!isPatient}
                onClick={() => setMode("doctor")}
                className={`relative z-10 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${
                  !isPatient ? "text-[#1A1416]" : "text-[#7A6E72]"
                }`}
              >
                <Stethoscope className="w-[14px] h-[14px]" />
                Profissional
              </button>
            </div>

            {/* Contextual headline */}
            <div key={mode} className="mb-6 animate-in fade-in slide-in-from-bottom-1 duration-300">
              <h1 className="text-[24px] font-semibold tracking-tight leading-tight">
                {copy.headline}
              </h1>
              <p className="text-[13.5px] text-[#7A6E72] mt-1.5 leading-relaxed">
                {copy.subheadline}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <FieldInput
                icon={<Mail className="w-[15px] h-[15px]" />}
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <FieldInput
                icon={<Lock className="w-[15px] h-[15px]" />}
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                isPassword
                trailing={
                  <button
                    type="button"
                    onClick={() => setIsResetting(true)}
                    className="text-[11.5px] font-medium text-[#7A6E72] hover:text-[#E5859A] transition-colors"
                  >
                    Esqueci
                  </button>
                }
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
                    {isPatient ? "Entrar" : "Acessar portal"}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer link */}
      {!isResetting && (
        <div className="relative mt-7 text-center animate-in fade-in duration-700 space-y-3">
          <p className="text-[13px] text-[#7A6E72]">
            {isPatient ? "Ainda não tem uma conta?" : "Recebeu convite profissional?"}{" "}
            <button
              onClick={() => navigate(isPatient ? "/register" : "/register-doctor")}
              className="text-[#1A1416] font-semibold hover:text-[#E5859A] transition-colors"
            >
              {isPatient ? "Cadastre-se" : "Ativar acesso"}
            </button>
          </p>
          {isPatient && (
            <p className="text-[13px] text-[#7A6E72]">
              Ainda não se consultou?{" "}
              <button
                onClick={() => navigate("/amostra")}
                className="text-[#1A1416] font-semibold hover:text-[#E5859A] transition-colors"
              >
                Agendar pelo WhatsApp
              </button>
            </p>
          )}
          {!isPatient && (
            <p className="text-[12.5px] text-[#8E8387] max-w-[320px] mx-auto leading-relaxed">
              O acesso profissional é liberado somente por convite da clínica.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Input field component ---------- */
interface FieldInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  isPassword?: boolean;
}

function FieldInput({ label, icon, trailing, className, isPassword, type, ...props }: FieldInputProps) {
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
            : "border-[#EDE5E1] hover:border-[#DDD2CC]"
        }`}
      >
        {icon && (
          <span className={`transition-colors ${focused ? "text-[#E5859A]" : "text-[#9A8E92]"}`}>
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
    </div>
  );
}
