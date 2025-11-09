import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import NewScan from "@/pages/NewScan";
import ScanResults from "@/pages/ScanResults";
import Settings from "@/pages/Settings";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Footer from "@/components/Footer";

const queryClient = new QueryClient();

function App() {
  const [showSubdomainPopup, setShowSubdomainPopup] = useState(true);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <AlertDialog open={showSubdomainPopup} onOpenChange={setShowSubdomainPopup}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>⚠️ Feature Under Development.</AlertDialogTitle>
                  <AlertDialogDescription>
                    We are working hard to bring you an awesome <b>subdomain</b> feature! It's currently under development and will be available in a future update. Please note that it may give errors for some users, so it's better to uncheck that one for now. Stay tuned for more! 🎉
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowSubdomainPopup(false)}>Awesome!</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <SidebarProvider>
              <div className="flex min-h-screen w-full">
                <AppSidebar />
                <SidebarInset className="flex-1 w-full min-w-0 flex flex-col">
                  <div className="flex-1">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/new-scan" element={<NewScan />} />
                      <Route path="/scan/:id" element={<ScanResults />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </div>
                  <Footer />
                </SidebarInset>
              </div>
            </SidebarProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;