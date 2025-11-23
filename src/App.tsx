import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "@/pages/Index";
import Login from "@/components/Login";
import NotFound from "@/pages/NotFound";
import NewScan from "@/pages/NewScan";
import ScanResults from "@/pages/ScanResults";
import AppSettings from "@/pages/AppSettings";
import AccountSettings from "@/pages/AccountSettings";
import AllScans from "@/pages/AllScans";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"; // Import SidebarTrigger
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import RequireAuth from "@/components/RequireAuth";
import ProfileCardPopover from "@/components/ProfileCardPopover"; // Import ProfileCardPopover
import CurrentDateTime from "@/components/CurrentDateTime"; // Import CurrentDateTime
import { Button } from "@/components/ui/button"; // Import Button
import { PlusCircle, Shield } from "lucide-react"; // Import icons

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
                    <LegalDisclaimer />
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full bg-background dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                        <AppSidebar />
                        <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
                          {/* Global Header for Protected Routes */}
                          <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-border bg-background/95 backdrop-blur-md px-6 py-4 dark:bg-gradient-to-r dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 shadow-2xl">
                            <SidebarTrigger />
                            <div className="flex-1">
                              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                                <Shield className="h-7 w-7 text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                                ABSpider Dashboard
                              </h1>
                              <p className="text-sm text-muted-foreground mt-1">Overview of your reconnaissance activities</p>
                            </div>
                            <CurrentDateTime className="hidden md:flex" />
                            <div className="flex items-center gap-2">
                              <ProfileCardPopover />
                              <Button asChild className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-primary/30">
                                <Link to="/new-scan">
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  New Scan
                                </Link>
                              </Button>
                            </div>
                          </header>
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