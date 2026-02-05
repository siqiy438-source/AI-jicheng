import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AIPoster from "./pages/AIPoster";
import AIDrawing from "./pages/AIDrawing";
import AICopywriting from "./pages/AICopywriting";
import MyWorks from "./pages/MyWorks";
import MyMaterials from "./pages/MyMaterials";
import CreativeCenter from "./pages/CreativeCenter";
import MoreFeatures from "./pages/MoreFeatures";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/ai-poster" element={<AIPoster />} />
          <Route path="/ai-drawing" element={<AIDrawing />} />
          <Route path="/ai-copywriting" element={<AICopywriting />} />
          <Route path="/my-works" element={<MyWorks />} />
          <Route path="/my-materials" element={<MyMaterials />} />
          <Route path="/creative-center" element={<CreativeCenter />} />
          <Route path="/more-features" element={<MoreFeatures />} />
          <Route path="/settings" element={<Settings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
