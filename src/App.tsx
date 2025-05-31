
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProposalCategorization from "./pages/ProposalCategorization";
import DAOKanbanBoard from "./pages/DAOKanbanBoard";
import NotFound from "./pages/NotFound";
import { Web3Provider } from "./lib/Web3Provider";
const queryClient = new QueryClient();


const App = () => (
      <Web3Provider>

  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dao/:daoId" element={<ProposalCategorization />} />
          <Route path="/dao/:daoId/board" element={<DAOKanbanBoard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
      </Web3Provider>

);

export default App;
