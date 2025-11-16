import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "@/pages/Index"; // New Index for redirection
import Login from "@/components/Login"; // Login component
import NotFound from "@/pages/NotFound";
import NewScan from "@/pages/NewScan";
import ScanResults from "@/pages/ScanResults";
import Settings from "@/pages/Settings";
import AllScans from "@/pages/AllScans";
import DashboardPage from "@/pages/DashboardPage"; // Renamed Dashboard
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="*" element={
                  <RequireAuth>
                    <LegalDisclaimer /> {/* Moved here */}
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                        <AppSidebar />
                        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
                          <div className="flex-1">
                            <Routes>
                              <Route path="/dashboard" element={<DashboardPage />} />
                              <Route path="/new-scan" element={<NewScan />} />
                              <Route path="/all-scans" element={<AllScans />} />
                              <Route path="/scan/:id" element={<ScanResults />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </div>
                          <Footer />
                        </SidebarInset>
                      </div>
                    </SidebarProvider>
                  </RequireAuth>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;