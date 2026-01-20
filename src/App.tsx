import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CycleProvider } from "@/contexts/CycleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";
import Index from "./pages/Index";
import Nutricao from "./pages/Nutricao";
import Corpo from "./pages/Corpo";
import Mente from "./pages/Mente";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CycleProvider>
        <SelectedDateProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/nutricao" element={<Nutricao />} />
                  <Route path="/corpo" element={<Corpo />} />
                  <Route path="/mente" element={<Mente />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </BrowserRouter>
          </TooltipProvider>
        </SelectedDateProvider>
      </CycleProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
