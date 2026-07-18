import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "@/pages/Index";
import LandingPage from "@/pages/LandingPage";
import StatusPage from "@/pages/StatusPage";
import LegalPage from "@/pages/LegalPage";
import DocsPage from "@/pages/DocsPage";
import ModernLogin from "@/components/ModernLogin";
import NotFound from "@/pages/NotFound";
import NewScan from "@/pages/NewScan";
import ScanResults from "@/pages/ScanResults";
import AppSettings from "@/pages/AppSettings";
import AccountSettings from "@/pages/AccountSettings";
import AllScans from "@/pages/AllScans";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import RequireAuth from "@/components/RequireAuth";
import { useEffect } from "react"; // Import useEffect
import { cleanupStuckScans, getRunningScanCount } from "@/services/scanService"; // Import new functions
import { supabase } from "@/SupabaseClient"; // For auth state listening
import ScanNotificationBar from "@/components/ScanNotificationBar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  useEffect(() => {
    // Wait for Supabase to restore the session before running cleanup.
    // INITIAL_SESSION fires once the client has loaded the persisted session
    // (or determined there is none), avoiding 400 errors from unauthenticated calls.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        cleanupStuckScans();
        subscription.unsubscribe(); // Only need this once
      }
    });

    // Add event listener for beforeunload
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (getRunningScanCount() > 0) {
        const message = "You have active ABSpider reconnaissance scans running. Closing this page will stop all ongoing scans. Are you sure you want to leave?";
        event.returnValue = message; // Standard for browser warning
        return message; // For older browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
            <TooltipProvider>
              <BrowserRouter>
                <Toaster />
                <Sonner />
                <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="/terms" element={<LegalPage kind="terms" />} />
                <Route path="/privacy" element={<LegalPage kind="privacy" />} />
                <Route path="/docs/*" element={<DocsPage />} />
                <Route path="/app" element={<Index />} />
                <Route path="/login" element={<Navigate to="/" replace />} />
                
                {/* Protected Routes */}
                <Route path="*" element={
                  <RequireAuth>
                    <LegalDisclaimer />
                                        <SidebarProvider>
                      <div className="flex min-h-screen w-full surface-main">
                        <AppSidebar />
                        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
                          <ScanNotificationBar />
                          {/* Removed global header. Individual pages will now manage their own headers. */}
                          <div className="flex-1">
                            <Routes>
                              <Route path="/dashboard" element={<DashboardPage />} />
                              <Route path="/new-scan" element={<NewScan />} />
                              <Route path="/all-scans" element={<AllScans />} />
                              <Route path="/reports" element={<ReportsPage />} />
                              <Route path="/scan/:id" element={<ScanResults />} />
                              <Route path="/settings" element={<AppSettings />} />
                              <Route path="/account-settings" element={<AccountSettings />} />
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
