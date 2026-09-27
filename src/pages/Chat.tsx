import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/BottomNav";
import { DoctorBottomNav } from "@/components/DoctorBottomNav";
import { Search, Send, ChevronLeft, Phone, MoreVertical, Image as ImageIcon, Mic } from "lucide-react";

// Interfaces
interface Message {
  id: number;
  text: string;
  sender: "me" | "them";
  time: string;
}

interface Contact {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread?: number;
  online?: boolean;
}

// --- DADOS MOCKADOS (Separados por Tipo de Usuário) ---
const doctorContacts: Contact[] = [
  { id: 1, name: "Mariana Silva", role: "Paciente", avatar: "https://api.builder.io/api/v1/image/assets/TEMP/d3fab0e661892d0b54f1eec6cc0dc68291324bb8?width=80", lastMessage: "Doutora, o resultado saiu?", lastTime: "09:30", unread: 2, online: true },
  { id: 2, name: "Beatriz Costa", role: "Paciente", avatar: "https://api.builder.io/api/v1/image/assets/TEMP/dfb3b95120fcda5ebfc066b79afc2f3fcbdb9541?width=112", lastMessage: "Obrigada pela atenção!", lastTime: "Ontem", online: false },
  { id: 4, name: "Isabela Santos", role: "Paciente", avatar: "https://api.builder.io/api/v1/image/assets/TEMP/d99ecccc0eacea3be814c4bc4d1c79a486c2018d?width=112", lastMessage: "Podemos remarcar?", lastTime: "Terça", unread: 1 },
];

const patientContacts: Contact[] = [
  { id: 101, name: "Dra. Juliana Souto", role: "Ginecologista", avatar: "https://api.builder.io/api/v1/image/assets/TEMP/91cff98480153157225365ed48f52d3662e1b2b7?width=82", lastMessage: "Olá! Como está se sentindo hoje?", lastTime: "10:00", unread: 1, online: true },
  { id: 102, name: "Dr. Pedro Santos", role: "Embriologista", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d", lastMessage: "O relatório já está disponível.", lastTime: "Ontem", online: false },
  { id: 103, name: "Enf. Clara", role: "Suporte", avatar: "https://i.pravatar.cc/150?u=support_nurse", lastMessage: "Lembrete da medicação às 20h.", lastTime: "Segunda", online: true },
];

// Mock Data: Histórico de Mensagens
const initialMessages: Record<number, Message[]> = {
  1: [
    { id: 1, text: "Bom dia, Dra. Juliana!", sender: "them", time: "09:00" },
    { id: 2, text: "Bom dia, Mariana! Como está se sentindo?", sender: "me", time: "09:05" },
    { id: 3, text: "Estou um pouco ansiosa.", sender: "them", time: "09:10" },
    { id: 4, text: "Doutora, o resultado saiu?", sender: "them", time: "09:30" },
  ],
  101: [
    { id: 1, text: "Bom dia, Dra. Juliana!", sender: "me", time: "09:00" },
    { id: 2, text: "Bom dia, Mariana! Como está se sentindo?", sender: "them", time: "09:05" },
    { id: 3, text: "Estou um pouco ansiosa.", sender: "me", time: "09:10" },
    { id: 4, text: "Olá! Como está se sentindo hoje?", sender: "them", time: "10:00" },
  ]
};

export default function Chat() {
  const navigate = useNavigate();
  const userType = localStorage.getItem("userType");
  const isDoctor = userType === "doctor";
  const homeRoute = isDoctor ? "/pacientes" : "/dashboard";
  
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicializa contatos baseado no tipo de usuário
  const [contacts, setContacts] = useState<Contact[]>(isDoctor ? doctorContacts : patientContacts);
  const [messages, setMessages] = useState<Record<number, Message[]>>(initialMessages);

  const activeContact = contacts.find(c => c.id === activeChatId);
  const currentMessages = useMemo(
    () => (activeChatId ? messages[activeChatId] || [] : []),
    [activeChatId, messages]
  );

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentMessages, activeChatId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChatId) return;

    const newMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));
    
    setContacts(prev => prev.map(c => 
      c.id === activeChatId ? { ...c, lastMessage: inputText, lastTime: "Agora", unread: 0 } : c
    ));

    setInputText("");
  };

  // --- RENDERIZAÇÃO: TELA DE CHAT ATIVO ---
  if (activeChatId && activeContact) {
    return (
      <div className="flex flex-col h-screen bg-white font-['Inter']">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveChatId(null)} className="p-1 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={24} className="text-[#171212]" />
            </button>
            <img src={activeContact.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="font-['Spline_Sans'] font-semibold text-[#171212] text-sm">{activeContact.name}</p>
              <span className={`text-xs ${activeContact.online ? "text-green-500" : "text-gray-400"}`}>
                {activeContact.online ? "● Online" : activeContact.role}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Phone size={20} className="text-[#171212]" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MoreVertical size={20} className="text-[#171212]" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA] px-4 py-4">
           <div className="flex justify-center mb-4">
             <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">Hoje</span>
           </div>
           
           {currentMessages.map((msg) => (
             <div
               key={msg.id}
               className={`flex mb-3 ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
             >
               <div
                 className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                   msg.sender === "me"
                     ? "bg-[#E5859A] text-white rounded-br-md"
                     : "bg-white text-[#171212] rounded-bl-md"
                 }`}
               >
                 <p className="text-sm leading-relaxed">{msg.text}</p>
                 <span
                   className={`text-[10px] block text-right mt-1 ${
                     msg.sender === "me" ? "text-white/70" : "text-gray-400"
                   }`}
                 >
                   {msg.time}
                 </span>
               </div>
             </div>
           ))}
           <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-3 bg-white border-t border-gray-100">
           <button type="button" className="p-2 text-gray-400 hover:text-[#E5859A] transition-colors">
             <ImageIcon size={22} />
           </button>
           <div className="flex-1 flex items-center gap-2">
              <input
               type="text"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder="Digite uma mensagem..."
               className="flex-1 bg-[#F5F2F2] rounded-full px-4 py-3 text-sm text-[#171212] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E5859A]"
              />
              <button 
               type="submit"
               className="w-10 h-10 flex items-center justify-center rounded-full bg-[#E5859A] text-white hover:bg-[#d9758a] transition-colors"
              >
               {inputText.trim() ? <Send size={18} /> : <Mic size={18} />}
              </button>
           </div>
        </form>
      </div>
    );
  }

  // --- RENDERIZAÇÃO: LISTA DE CONTATOS ---
  return (
    <div className="flex flex-col min-h-screen bg-white pb-20 font-['Inter']">
      <div className="px-4 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(homeRoute)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Voltar"
          >
            <ChevronLeft size={24} className="text-[#171212]" />
          </button>
          <h1 className="text-2xl font-['Spline_Sans'] font-bold text-[#171212]">
            {isDoctor ? "Pacientes" : "Equipe Médica"}
          </h1>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical size={20} className="text-[#171212]" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isDoctor ? "Buscar paciente..." : "Buscar médico..."}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#F5F2F2] text-sm text-[#171212] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#E5859A]"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 px-4">
        {filteredContacts.length > 0 ? (
          filteredContacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setActiveChatId(contact.id)}
              className="flex items-center gap-4 py-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors -mx-4 px-4"
            >
              <div className="relative flex-shrink-0">
                <img src={contact.avatar} alt="" className="w-14 h-14 rounded-full object-cover" />
                {contact.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-['Spline_Sans'] font-semibold text-[#171212] truncate">{contact.name}</p>
                  <span className={`text-xs flex-shrink-0 ml-2 ${contact.unread ? "text-[#E5859A] font-semibold" : "text-gray-400"}`}>
                    {contact.lastTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 truncate pr-2">
                    {contact.lastMessage}
                  </p>
                  {contact.unread && contact.unread > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[#E5859A] text-white text-xs font-semibold">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={48} className="mb-4 opacity-50" />
            <p>Nenhuma conversa encontrada</p>
          </div>
        )}
      </div>

      {isDoctor ? <DoctorBottomNav /> : <BottomNav />}
    </div>
  );
}
