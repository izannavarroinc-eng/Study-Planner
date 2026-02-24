import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import layout and pages
import { Layout } from "@/components/Layout";
import Home from "@/pages/Home";
import Subjects from "@/pages/Subjects";
import SubjectDetails from "@/pages/SubjectDetails";
import CalendarView from "@/pages/CalendarView";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/subjects/:id" component={SubjectDetails} />
        <Route path="/calendar" component={CalendarView} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
