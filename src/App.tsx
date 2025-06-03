
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { 
  NotificationProvider, 
  TransactionPopupProvider 
} from "@blockscout/app-sdk";
import Index from "./pages/Index";
import MemberRoleAllocation from "./pages/MemberRoleAllocation";
import DAOKanbanBoard from "./pages/DAOKanbanBoard";
import MemberProfile from "./pages/MemberProfile";
import ProposalCategorization from "./pages/ProposalCategorization";
import MetadataDashboard from "./pages/MetadataDashboard";
import NotFound from "./pages/NotFound";
import { Web3Provider } from "./lib/Web3Provider";

const queryClient = new QueryClient();

const App = () => (
  <Web3Provider>
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TransactionPopupProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dao/:daoId" element={<MemberRoleAllocation />} />
                <Route path="/dao/:daoId/board" element={<DAOKanbanBoard />} />
                <Route path="/dao/:daoId/categorization" element={<ProposalCategorization />} />
                <Route path="/metadata" element={<MetadataDashboard />} />
                <Route path="/profile" element={<MemberProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </TransactionPopupProvider>
      </NotificationProvider>
    </QueryClientProvider>
  </Web3Provider>
);

export default App;
