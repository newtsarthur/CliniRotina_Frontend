import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Por favor, informe seu e-mail");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/nova-senha`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setEmailSent(true);
      toast.success("Se este e-mail existir, enviaremos um link de recuperação.");
    } catch (error: unknown) {
      toast.error("Erro ao processar solicitação. Tente novamente.");
      console.error("Password reset error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-white flex flex-col px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          {/* Back button */}
          <div className="w-full flex items-start mb-16">
            <button
              onClick={() => navigate("/")}
              className="p-2 -ml-2 hover:opacity-70 transition-opacity"
              aria-label="Voltar"
            >
              <svg
                width="15"
                height="25"
                viewBox="0 0 15 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.707 2.16797L12.4805 0L0 12.4805L12.4805 24.9609L14.707 22.793L4.45312 12.4805L14.707 2.16797Z"
                  fill="#1C1B1F"
                />
              </svg>
            </button>
          </div>

          {/* Success content */}
          <div className="flex flex-col gap-6 items-center text-center">
            {/* Success icon */}
            <div className="w-20 h-20 rounded-full bg-[#E5859A]/10 flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                  fill="#E5859A"
                />
              </svg>
            </div>

            <h1 className="text-[32px] font-bold text-[#1C1B1F] leading-tight">
              E-mail Enviado!
            </h1>

            <p className="text-base text-[#49454F] leading-6">
              Se o e-mail <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha.
            </p>

            <p className="text-sm text-[#79747E] leading-5">
              Verifique também sua caixa de spam.
            </p>

            <Link
              to="/"
              className="w-full h-[60px] mt-8 rounded-[32px] bg-[#E5859A] text-white text-lg font-bold leading-7 hover:bg-[#E5859A]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5859A] focus:ring-offset-2 focus:ring-offset-white flex items-center justify-center"
            >
              Voltar para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Back button */}
        <div className="w-full flex items-start mb-16">
          <button
            onClick={() => navigate("/")}
            className="p-2 -ml-2 hover:opacity-70 transition-opacity"
            aria-label="Voltar"
          >
            <svg
              width="15"
              height="25"
              viewBox="0 0 15 25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.707 2.16797L12.4805 0L0 12.4805L12.4805 24.9609L14.707 22.793L4.45312 12.4805L14.707 2.16797Z"
                fill="#1C1B1F"
              />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="flex flex-col gap-6">
          {/* Heading */}
          <h1 className="text-[32px] font-bold text-[#1C1B1F] leading-tight">
            Recuperar Acesso
          </h1>

          {/* Description */}
          <p className="text-base text-[#49454F] leading-6">
            Insira seu e-mail cadastrado para receber as instruções de redefinição de senha.
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col mt-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-[#E5859A]">
                E-mail
              </label>
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[56px] px-4 py-4 rounded-[32px] border border-[#C8C5CA] bg-white text-[#1C1B1F] placeholder:text-[#79747E] text-base focus:outline-none focus:ring-2 focus:ring-[#E5859A] focus:border-transparent transition-all"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[60px] mt-12 rounded-[32px] bg-[#E5859A] text-white text-lg font-bold leading-7 hover:bg-[#E5859A]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[#E5859A] focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Enviando...
                </>
              ) : (
                "Enviar link de recuperação"
              )}
            </button>

            <Link
              to="/"
              className="text-sm font-semibold text-[#49454F] hover:text-[#E5859A] transition-colors text-center mt-6"
            >
              Voltar para Login
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
