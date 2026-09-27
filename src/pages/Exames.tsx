import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatName } from "@/lib/utils";
import { DocumentList } from "@/components/documents/DocumentList";
import { HistoryTimeline } from "@/components/exames/HistoryTimeline";

type Tab = "documentos" | "historico";

export default function Exames() {
  const { user, profile, loading } = useAuth();
  const firstName = formatName(profile?.full_name?.split(" ")[0]) || "Paciente";
  const [tab, setTab] = useState<Tab>("documentos");

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
        <h1 className="text-[26px] leading-tight font-semibold text-[#1C1917] tracking-tight mb-1">
          Exames e Histórico
        </h1>
        <p className="text-[14px] text-[#5C4D49] font-medium leading-relaxed mb-6">
          Gerencie seus documentos e histórico clínico, {firstName}.
        </p>

        {/* Tab bar */}
        <div className="flex bg-white/40 backdrop-blur-sm border border-white/60 p-1.5 rounded-full w-full shadow-sm">
          {([
            { key: "documentos" as Tab, label: "Documentos" },
            { key: "historico" as Tab, label: "Histórico Clínico" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-sm rounded-full transition-all duration-300 ${
                tab === key
                  ? "bg-white text-[#1C1917] shadow-md scale-[1.01] font-bold"
                  : "text-[#9e837a] hover:text-[#1C1917] font-medium"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="px-6 pt-6">
        {loading || !user?.id ? (
          <div className="flex items-center justify-center py-12 text-[#9e837a] text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando...
          </div>
        ) : tab === "documentos" ? (
          <div 
            key="documentos-tab" 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <DocumentList patientId={user.id} canUpload />
          </div>
        ) : (
          <div 
            key="historico-tab" 
            className="animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <HistoryTimeline patientId={user.id} />
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
