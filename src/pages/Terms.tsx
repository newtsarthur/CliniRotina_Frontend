import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function Terms() {
  const navigate = useNavigate();

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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/profile")}
            className="p-2.5 -ml-2 bg-white/40 hover:bg-white/70 backdrop-blur-sm rounded-full transition-all active:scale-95 border border-white/60 shadow-sm"
            aria-label="Voltar"
          >
            <ChevronLeft className="w-5 h-5 text-[#1C1917]" />
          </button>
          <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight">
            Termos e LGPD
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-6 space-y-6 animate-fade-in animation-delay-75">
        <div 
          className="w-full rounded-[32px] p-6 backdrop-blur-md border border-white/70 space-y-6"
          style={{ 
            background: "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(255,245,248,0.55) 100%)", 
            boxShadow: "0 10px 40px -20px rgba(139, 61, 90, 0.15)" 
          }}
        >
          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">1. Compromisso com a Privacidade</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              Sua privacidade é nossa prioridade. Este documento estabelece como coletamos, tratamos e protegemos seus dados pessoais e informações de saúde no aplicativo, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">2. Dados Coletados e Finalidade</h2>
            <div className="text-[14px] text-[#5C4D49] leading-relaxed space-y-3">
              <p>Tratamos informações essenciais para viabilizar seu acompanhamento clínico:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Dados de Identificação:</strong> Nome completo, e-mail, CPF, telefone/WhatsApp, data de nascimento e endereço. Finalidade: identificação, cadastro seguro e faturamento.</li>
                <li><strong>Dados de Saúde (Dados Sensíveis):</strong> Sintomas diários (registro de humor, dor, cólicas), dados de ciclo menstrual, medicamentos prescritos, registros de consumo de água, arquivos de exames enviados e histórico de tratamentos. Finalidade: acompanhamento da jornada de saúde e comunicação com seu médico responsável.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">3. Base Legal e Consentimento</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              Ao utilizar este aplicativo, registrar seu humor, marcar medicamentos tomados ou fazer upload de exames, você fornece <strong>consentimento expresso</strong> (Art. 7, I e Art. 11, I, "a" da LGPD) para o tratamento de seus dados pessoais e dados de saúde sensíveis exclusivamente para fins de controle e suporte ao seu tratamento médico.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">4. Compartilhamento de Dados</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              Seus dados pessoais e informações clínicas são compartilhados <strong>única e exclusivamente</strong> com o seu médico responsável vinculado à clínica parceira e a infraestrutura segura de armazenamento de dados (Supabase). Seus dados nunca serão comercializados ou cedidos a terceiros sem autorização prévia.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">5. Notificações via WhatsApp</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              O aplicativo oferece o envio de lembretes de medicamentos e consultas via WhatsApp. Este recurso é <strong>opcional</strong>. Você pode ativar ou desativar o recebimento destas notificações a qualquer momento através do menu "Configurações".
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">6. Direitos do Titular de Dados</h2>
            <div className="text-[14px] text-[#5C4D49] leading-relaxed space-y-2">
              <p>Conforme o Artigo 18 da LGPD, você possui plenos direitos sobre suas informações cadastrais e médicas, incluindo:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Confirmar a existência de tratamento e acessar seus dados pessoais.</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados na aba "Meus Dados".</li>
                <li>Solicitar a exclusão de seus dados ou revogar o consentimento fornecido.</li>
                <li>Receber informações sobre compartilhamento de dados.</li>
              </ul>
              <p className="pt-1">A revogação de determinados consentimentos pode limitar o funcionamento das ferramentas de acompanhamento do app.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">7. Segurança da Informação</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              Implementamos medidas administrativas e tecnológicas para garantir a integridade dos dados, incluindo proteção com criptografia de ponta a ponta nas transferências de dados e regras rígidas de segurança em banco de dados (Row Level Security) para garantir que apenas você e seu médico acessem suas informações médicas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-[17px] font-bold text-[#1C1917]">8. Contato e Exclusão de Conta</h2>
            <p className="text-[14px] text-[#5C4D49] leading-relaxed">
              Para exercer seus direitos de privacidade, tirar dúvidas ou solicitar a exclusão definitiva dos seus dados de nosso servidor, <a href="https://wa.me/558183105992?text=Olá!%20Gostaria%20de%20falar%20sobre%20meus%20dados%20pessoais%20e%20privacidade." target="_blank" rel="noopener noreferrer" className="font-semibold text-[#8B3D5A] hover:underline">entre em contato conosco no WhatsApp</a> ou fale diretamente com a clínica associada.
            </p>
          </section>

          <p className="text-[12px] text-[#7a5d56]/70 text-center pt-4 border-t border-[#E5859A]/10">
            Última atualização oficial: Julho de 2026
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
