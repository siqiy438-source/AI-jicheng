import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AIPoster from "./pages/AIPoster";
import AIDrawing from "./pages/AIDrawing";
import AIPPT from "./pages/AIPPT";
import AICopywriting from "./pages/AICopywriting";
import MyWorks from "./pages/MyWorks";
import MyMaterials from "./pages/MyMaterials";
import MoreFeatures from "./pages/MoreFeatures";
import Settings from "./pages/Settings";
import AIDisplay from "./pages/AIDisplay";
import AIOneClickOutfit from "./pages/AIOneClickOutfit";
import Auth from "./pages/Auth";
import Clothing from "./pages/Clothing";
import FashionOutfit from "./pages/FashionOutfit";
import FashionModelOutfit from "./pages/FashionModelOutfit";
import CreativeTools from "./pages/CreativeTools";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/ai-poster" element={<ProtectedRoute><AIPoster /></ProtectedRoute>} />
            <Route path="/ai-drawing" element={<ProtectedRoute><AIDrawing /></ProtectedRoute>} />
            <Route path="/ai-display" element={<ProtectedRoute><AIDisplay /></ProtectedRoute>} />
            <Route path="/ai-hangoutfit" element={<ProtectedRoute><AIOneClickOutfit /></ProtectedRoute>} />
            <Route path="/ai-ppt" element={<ProtectedRoute><AIPPT /></ProtectedRoute>} />
            <Route path="/ai-copywriting" element={<ProtectedRoute><AICopywriting /></ProtectedRoute>} />
            <Route path="/clothing" element={<ProtectedRoute><Clothing /></ProtectedRoute>} />
            <Route path="/fashion-outfit" element={<ProtectedRoute><FashionOutfit /></ProtectedRoute>} />
            <Route path="/fashion-model-outfit" element={<ProtectedRoute><FashionModelOutfit /></ProtectedRoute>} />
            <Route path="/creative-tools" element={<ProtectedRoute><CreativeTools /></ProtectedRoute>} />
            <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
            <Route path="/my-materials" element={<ProtectedRoute><MyMaterials /></ProtectedRoute>} />
            <Route path="/more-features" element={<ProtectedRoute><MoreFeatures /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
