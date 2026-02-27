import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CreditsProvider } from "@/contexts/CreditsContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { AppShellSkeleton } from "@/components/AppShellSkeleton";
import { WechatBonusDialog } from "@/components/WechatBonusDialog";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIDrawing = lazy(() => import("./pages/AIDrawing"));
const AIPPT = lazy(() => import("./pages/AIPPT"));
const AICopywriting = lazy(() => import("./pages/AICopywriting"));
const Copywriting = lazy(() => import("./pages/Copywriting"));
const CopywritingOpinion = lazy(() => import("./pages/CopywritingOpinion"));
const CopywritingKnowledge = lazy(() => import("./pages/CopywritingKnowledge"));
const CopywritingProcess = lazy(() => import("./pages/CopywritingProcess"));
const CopywritingStory = lazy(() => import("./pages/CopywritingStory"));
const CopywritingTopic = lazy(() => import("./pages/CopywritingTopic"));
const CopywritingStoreVisit = lazy(() => import("./pages/CopywritingStoreVisit"));
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
const Tutorials = lazy(() => import("./pages/Tutorials"));
const OutfitRecommend = lazy(() => import("./pages/OutfitRecommend"));
const FabricAnalysis = lazy(() => import("./pages/FabricAnalysis"));
const PixelArt = lazy(() => import("./pages/PixelArt"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg">跳转到主要内容</a>
        <AuthProvider>
          <CreditsProvider>
          <WechatBonusDialog />
          <Suspense fallback={<AppShellSkeleton />}>
            <Routes>
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/ai-drawing" element={<ProtectedRoute><AIDrawing /></ProtectedRoute>} />
              <Route path="/ai-display" element={<ProtectedRoute><AIDisplay /></ProtectedRoute>} />
              <Route path="/ai-hangoutfit" element={<ProtectedRoute><AIOneClickOutfit /></ProtectedRoute>} />
              <Route path="/ai-ppt" element={<ProtectedRoute><AIPPT /></ProtectedRoute>} />
              <Route path="/ai-copywriting" element={<Navigate to="/copywriting" replace />} />
              <Route path="/copywriting" element={<ProtectedRoute><Copywriting /></ProtectedRoute>} />
              <Route path="/copywriting-opinion" element={<ProtectedRoute><CopywritingOpinion /></ProtectedRoute>} />
              <Route path="/copywriting-knowledge" element={<ProtectedRoute><CopywritingKnowledge /></ProtectedRoute>} />
              <Route path="/copywriting-process" element={<ProtectedRoute><CopywritingProcess /></ProtectedRoute>} />
              <Route path="/copywriting-story" element={<ProtectedRoute><CopywritingStory /></ProtectedRoute>} />
              <Route path="/copywriting-topic" element={<ProtectedRoute><CopywritingTopic /></ProtectedRoute>} />
              <Route path="/copywriting-store-visit" element={<ProtectedRoute><CopywritingStoreVisit /></ProtectedRoute>} />
              <Route path="/clothing" element={<ProtectedRoute><Clothing /></ProtectedRoute>} />
              <Route path="/fashion-outfit" element={<ProtectedRoute><FashionOutfit /></ProtectedRoute>} />
              <Route path="/fashion-model-outfit" element={<ProtectedRoute><FashionModelOutfit /></ProtectedRoute>} />
              <Route path="/fashion-detail-focus" element={<ProtectedRoute><FashionDetailFocus /></ProtectedRoute>} />
              <Route path="/outfit-recommend" element={<ProtectedRoute><OutfitRecommend /></ProtectedRoute>} />
              <Route path="/fabric-analysis" element={<ProtectedRoute><FabricAnalysis /></ProtectedRoute>} />
              <Route path="/creative-tools" element={<ProtectedRoute><CreativeTools /></ProtectedRoute>} />
              <Route path="/generative-report" element={<ProtectedRoute><GenerativeReport /></ProtectedRoute>} />
              <Route path="/pixel-art" element={<ProtectedRoute><PixelArt /></ProtectedRoute>} />
              <Route path="/my-works" element={<ProtectedRoute><MyWorks /></ProtectedRoute>} />
              <Route path="/my-materials" element={<ProtectedRoute><MyMaterials /></ProtectedRoute>} />
              <Route path="/more-features" element={<ProtectedRoute><MoreFeatures /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/recharge" element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
              <Route path="/payment-result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />
              <Route path="/tutorials" element={<ProtectedRoute><Tutorials /></ProtectedRoute>} />
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
