import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIPoster = lazy(() => import("./pages/AIPoster"));
const AIDrawing = lazy(() => import("./pages/AIDrawing"));
const AIPPT = lazy(() => import("./pages/AIPPT"));
const AICopywriting = lazy(() => import("./pages/AICopywriting"));
const MyWorks = lazy(() => import("./pages/MyWorks"));
const MyMaterials = lazy(() => import("./pages/MyMaterials"));
const MoreFeatures = lazy(() => import("./pages/MoreFeatures"));
const Settings = lazy(() => import("./pages/Settings"));
const AIDisplay = lazy(() => import("./pages/AIDisplay"));
const AIOneClickOutfit = lazy(() => import("./pages/AIOneClickOutfit"));
const Auth = lazy(() => import("./pages/Auth"));
const Clothing = lazy(() => import("./pages/Clothing"));
const FashionOutfit = lazy(() => import("./pages/FashionOutfit"));
const FashionModelOutfit = lazy(() => import("./pages/FashionModelOutfit"));
const FashionDetailFocus = lazy(() => import("./pages/FashionDetailFocus"));
const CreativeTools = lazy(() => import("./pages/CreativeTools"));
const GenerativeReport = lazy(() => import("./pages/GenerativeReport"));
const Recharge = lazy(() => import("./pages/Recharge"));
const PaymentResult = lazy(() => import("./pages/PaymentResult"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CreditsProvider>
          <Suspense
            fallback={
              <div className="app-shell flex flex-col items-center justify-center gap-4 bg-gradient-main">
                <div className="w-10 h-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin-slow" />
                <span className="text-sm text-muted-foreground">加载中...</span>
              </div>
            }
          >
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
              <Route path="/fashion-detail-focus" element={<ProtectedRoute><FashionDetailFocus /></ProtectedRoute>} />
              <Route path="/creative-tools" element={<ProtectedRoute><CreativeTools /></ProtectedRoute>} />
              <Route path="/generative-report" element={<ProtectedRoute><GenerativeReport /></ProtectedRoute>} />
              <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
              <Route path="/my-materials" element={<ProtectedRoute><MyMaterials /></ProtectedRoute>} />
              <Route path="/more-features" element={<ProtectedRoute><MoreFeatures /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
              <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </CreditsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
