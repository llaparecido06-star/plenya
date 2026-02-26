import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { CycleProvider } from "@/contexts/CycleContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { SelectedDateProvider } from "@/contexts/SelectedDateContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import NotificationPrompt from "@/components/notifications/NotificationPrompt";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Nutricao = lazy(() => import("./pages/Nutricao"));
const Corpo = lazy(() => import("./pages/Corpo"));
const Mente = lazy(() => import("./pages/Mente"));
const Perfil = lazy(() => import("./pages/Perfil"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Planos = lazy(() => import("./pages/Planos"));
const Instalar = lazy(() => import("./pages/Instalar"));
const Privacidade = lazy(() => import("./pages/Privacidade"));
const Termos = lazy(() => import("./pages/Termos"));
const Admin = lazy(() => import("./pages/Admin"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-pulse text-muted-foreground">Carregando...</div>
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CycleProvider>
        <SelectedDateProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotificationPrompt />
            <BrowserRouter>
              <AnimatePresence mode="wait">
                <Suspense fallback={<PageLoader />}>
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
                    <Route
                      path="/planos"
                      element={
                        <ProtectedRoute>
                          <Planos />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/instalar" element={<Instalar />} />
                    <Route path="/privacidade" element={<Privacidade />} />
                    <Route path="/termos" element={<Termos />} />
                    <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AnimatePresence>
            </BrowserRouter>
          </TooltipProvider>
        </SelectedDateProvider>
      </CycleProvider>
    </AuthProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
