import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import BotManagement from "./pages/BotManagement";
import PineScriptEditor from "./pages/PineScriptEditor";
import Portfolio from "./pages/Portfolio";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import Settings from "./pages/Settings";
import AdvancedOrders from "./pages/AdvancedOrders";
import AlertsAutomation from "./pages/AlertsAutomation";
import SocialTrading from "./pages/SocialTrading";
import PortfolioAnalytics from "./pages/PortfolioAnalytics";
import PriceTracking from "./pages/PriceTracking";
import AIAssistant from "./pages/AIAssistant";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/bots"} component={BotManagement} />
      <Route path={"/pine"} component={PineScriptEditor} />
      <Route path={"/portfolio"} component={Portfolio} />
      <Route path={"/notifications"} component={Notifications} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/advanced-orders"} component={AdvancedOrders} />
      <Route path={"/alerts"} component={AlertsAutomation} />
      <Route path={"/social-trading"} component={SocialTrading} />
      <Route path={"/portfolio-analytics"} component={PortfolioAnalytics} />
      <Route path={"/price-tracking"} component={PriceTracking} />
      <Route path={"/ai-assistant"} component={AIAssistant} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
