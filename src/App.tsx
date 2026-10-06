import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import LoginPage from "./pages/Login";
import Register from "./pages/Register";
import MedicamentosPage from "./pages/Medicamentos";
import ConsultasPage from "./pages/Consultas";
import VinculosPage from "./pages/Vinculos";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Sonner richColors position="top-center" />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/medicamentos" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />

        <Route path="/medicamentos" element={<ProtectedRoute><MedicamentosPage /></ProtectedRoute>} />
        <Route path="/consultas" element={<ProtectedRoute><ConsultasPage /></ProtectedRoute>} />
        <Route
          path="/vinculos"
          element={<ProtectedRoute allowedRoles={["CUIDADOR"]}><VinculosPage /></ProtectedRoute>}
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
