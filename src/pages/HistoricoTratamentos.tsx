import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ChevronLeft, FileText, Pill, Stethoscope, Eye, Download } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

// Tipos de Dados
interface RecordItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  type: "exam" | "prescription" | "consultation";
  status?: string;
}

// Dados Mockados
const examsData: RecordItem[] = [
  { id: "1", title: "Ultrassom Transvaginal", subtitle: "Contagem de folículos", date: "22 Out 2023", type: "exam" },
  { id: "2", title: "Estradiol Plasmático", subtitle: "Análise Hormonal", date: "15 Set 2023", type: "exam" },
  { id: "3", title: "Beta hCG", subtitle: "Resultado Qualitativo", date: "08 Ago 2023", type: "exam" },
  { id: "4", title: "Progesterona", subtitle: "Monitoramento", date: "01 Jul 2023", type: "exam" },
];

const prescriptionsData: RecordItem[] = [
  { id: "1", title: "Progesterona 200mg", subtitle: "1 cápsula via vaginal à noite", date: "22 Out 2023", type: "prescription" },
  { id: "2", title: "Ácido Fólico 5mg", subtitle: "1 comprimido via oral pela manhã", date: "20 Out 2023", type: "prescription" },
  { id: "3", title: "Ovidrel 250mcg", subtitle: "Injetável - Dose única", date: "15 Set 2023", type: "prescription" },
];

const consultationsData: RecordItem[] = [
  { id: "1", title: "Dra. Juliana Souto", subtitle: "Consulta de Rotina", date: "21 Out 2023", type: "consultation", status: "Realizada" },
  { id: "2", title: "Dr. Pedro Santos", subtitle: "Avaliação Embriológica", date: "10 Set 2023", type: "consultation", status: "Realizada" },
  { id: "3", title: "Dra. Juliana Souto", subtitle: "Retorno - Ultrassom", date: "01 Set 2023", type: "consultation", status: "Realizada" },
];

type TabType = "exames" | "receitas" | "consultas";

export default function HistoricoTratamentos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("exames");

  const getCurrentData = () => {
    switch (activeTab) {
      case "exames": return examsData;
      case "receitas": return prescriptionsData;
      case "consultas": return consultationsData;
      default: return [];
    }
  };

  const currentData = getCurrentData();

  const renderIcon = (type: string) => {
    switch (type) {
      case "exam": return <FileText className="text-[#E5859A]" />;
      case "prescription": return <Pill className="text-[#E5859A]" />;
      case "consultation": return <Stethoscope className="text-[#E5859A]" />;
      default: return <FileText className="text-[#E5859A]" />;
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter'] pb-24">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <header className="flex items-center justify-center bg-white px-4 py-6 relative sticky top-0 z-10 border-b border-gray-50">
          <button 
            onClick={() => navigate(-1)} 
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 -ml-2 hover:bg-gray-50 rounded-full transition-colors"
          >
            <ChevronLeft className="text-[#1C1B1F]" />
          </button>
          <h1 className="text-lg font-bold text-[#171212] font-['Spline_Sans']">
            Histórico Clínico
          </h1>
        </header>

        {/* Tab Bar */}
        <div className="px-4 py-4">
          <div className="flex items-center p-1 bg-[#F5F2F2] rounded-xl">
            {(["exames", "receitas", "consultas"] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white text-[#E5859A] shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="px-4 space-y-4">
          {currentData.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <p>Nenhum registro encontrado.</p>
            </div>
          ) : (
            currentData.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[#E5859A]/10 shrink-0 group-hover:bg-[#E5859A]/20 transition-colors">
                    {renderIcon(item.type)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-base font-bold text-[#171212] truncate leading-tight mb-1">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-500 truncate font-medium">
                      {item.subtitle}
                    </span>
                    <span className="text-[10px] text-[#E5859A] font-bold mt-1">
                      {item.date}
                    </span>
                  </div>
                </div>
                {/* Action Icon */}
                <button className="p-2 text-gray-300 hover:text-[#E5859A] transition-colors">
                  {activeTab === "receitas" ? <Download size={20} /> : <Eye size={20} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
