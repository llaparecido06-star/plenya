import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CycleProvider } from "@/contexts/CycleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Nutricao from "./pages/Nutricao";
import Corpo from "./pages/Corpo";
import Mente from "./pages/Mente";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
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
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/nutricao"
                    element={
                      <ProtectedRoute>
                        <Nutricao />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/corpo"
                    element={
                      <ProtectedRoute>
                        <Corpo />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mente"
                    element={
                      <ProtectedRoute>
                        <Mente />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/perfil"
                    element={
                      <ProtectedRoute>
                        <Perfil />
                      </ProtectedRoute>
                    }
                  />
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
