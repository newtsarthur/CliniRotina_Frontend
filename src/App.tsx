import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/Login";
import MedicamentosPage from "./pages/Medicamentos";
import AmostraPage from "@/pages/Amostra";
import Register from "./pages/Register";
import RegisterDoctor from "./pages/RegisterDoctor";
import ForgotPassword from "./pages/ForgotPassword";
import NovaSenha from "./pages/NovaSenha";
import Terms from "./pages/Terms";
import Dashboard from "./pages/Dashboard";
import Plano from "./pages/Plano";
import Duvidas from "./pages/Duvidas";
import Perfil from "./pages/Perfil";
import MeusDados from "./pages/MeusDados";
import AlterarSenha from "./pages/AlterarSenha";
import Pacientes from "./pages/Pacientes";
import Prontuario from "./pages/Prontuario";
import Exames from "./pages/Exames";
import Agenda from "./pages/Agenda";
import AdminConvites from "./pages/AdminConvites";
import NotFound from "./pages/NotFound";
import { WhatsAppFAB } from "@/components/WhatsAppFAB";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/medicamentos" element={<ProtectedRoute><MedicamentosPage /></ProtectedRoute>} />
          <Route path="/amostra" element={<AmostraPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-doctor" element={<RegisterDoctor />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/nova-senha" element={<NovaSenha />} /> {/* <-- NOVA ROTA */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/termos" element={<Terms />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["patient"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/plano" element={<ProtectedRoute allowedRoles={["patient"]}><Plano /></ProtectedRoute>} />
          <Route path="/duvidas" element={<ProtectedRoute><Duvidas /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
          <Route path="/meus-dados" element={<ProtectedRoute><MeusDados /></ProtectedRoute>} />
          <Route path="/alterar-senha" element={<ProtectedRoute><AlterarSenha /></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
          <Route path="/pacientes" element={<ProtectedRoute allowedRoles={["doctor"]}><Pacientes /></ProtectedRoute>} />
          <Route path="/admin/convites" element={<ProtectedRoute allowedRoles={["doctor"]} requireAdmin><AdminConvites /></ProtectedRoute>} />
          <Route path="/prontuario/:id" element={<ProtectedRoute allowedRoles={["doctor"]}><Prontuario /></ProtectedRoute>} />
          <Route path="/exames" element={<ProtectedRoute allowedRoles={["patient"]}><Exames /></ProtectedRoute>} />
          {/* historico-tratamentos now lives inside /exames */}
          
          <Route path="*" element={<NotFound />} />
        </Routes>
        <WhatsAppFAB />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
