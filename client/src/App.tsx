import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AddPlant from "@/pages/add-plant";
import PlantDetail from "@/pages/plant-detail";
import IdentifyPlant from "@/pages/identify";
import Marketplace from "@/pages/marketplace";
import Chat from "@/pages/chat";
import MobileNav from "@/components/mobile-nav";
import RescueMissions from "@/pages/rescue-missions";
import Tutorial from "@/pages/tutorial";
import HealthScan from "@/pages/health-scan";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth"; // Assuming this component exists


function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/tutorial" component={Tutorial} />
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/add" component={AddPlant} />
      <ProtectedRoute path="/identify" component={IdentifyPlant} />
      <ProtectedRoute path="/plant/:id" component={PlantDetail} />
      <ProtectedRoute path="/marketplace" component={Marketplace} />
      <ProtectedRoute path="/chat" component={Chat} />
      <ProtectedRoute path="/rescue-missions" component={RescueMissions} />
      <ProtectedRoute path="/health-scan" component={HealthScan} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <main className="container mx-auto px-4 pb-20">
            <Router />
          </main>
          <MobileNav />
        </div>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;