import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function NovaSenha() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Link inválido ou expirado. Por favor, solicite a recuperação novamente.");
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("A senha precisa ter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem. Digite novamente.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Senha atualizada com sucesso! Você já pode fazer login.");
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro ao atualizar a senha.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2F2] flex flex-col items-center justify-center px-5 py-8">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/423558778cfc23f49e2cad3f49d832c1f7436d42?width=462"
          alt="Juliana Souto"
          className="w-[180px] h-auto"
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-7">
        <h1 className="text-xl font-bold text-[#121212] text-center mb-1">
          Criar nova senha
        </h1>
        <p className="text-sm text-[#85666E] text-center mb-6">
          Quase lá! Digite sua nova senha de acesso.
        </p>

        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#434343] ml-1">
              Nova Senha
            </label>
            <input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-[#121212] text-sm focus:outline-none focus:ring-2 focus:ring-[#E5859A]/20 focus:border-[#E5859A] transition-all"
              required
              disabled={loading}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#434343] ml-1">
              Confirmar Senha
            </label>
            <input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-[#121212] text-sm focus:outline-none focus:ring-2 focus:ring-[#E5859A]/20 focus:border-[#E5859A] transition-all"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E5859A] hover:bg-[#d4748a] text-white font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
