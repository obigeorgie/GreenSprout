import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import AddPlant from "@/pages/add-plant";
import PlantDetail from "@/pages/plant-detail";
import IdentifyPlant from "@/pages/identify";
import MobileNav from "@/components/mobile-nav";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/add" component={AddPlant} />
      <Route path="/identify" component={IdentifyPlant} />
      <Route path="/plant/:id" component={PlantDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 pb-20">
          <Router />
        </main>
        <MobileNav />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;