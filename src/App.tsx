import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import InvoicesIn from "./pages/InvoicesIn";
import InvoicesOut from "./pages/InvoicesOut";
import Inventory from "./pages/Inventory";
import Employees from "./pages/Employees";
import Payroll from "./pages/Payroll";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Partners from "./pages/Partners";
import Alerts from "./pages/Alerts";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/invoices-in">{() => <ProtectedRoute component={InvoicesIn} />}</Route>
      <Route path="/invoices-out">{() => <ProtectedRoute component={InvoicesOut} />}</Route>
      <Route path="/inventory">{() => <ProtectedRoute component={Inventory} />}</Route>
      <Route path="/employees">{() => <ProtectedRoute component={Employees} />}</Route>
      <Route path="/payroll">{() => <ProtectedRoute component={Payroll} />}</Route>
      <Route path="/reports">{() => <ProtectedRoute component={Reports} />}</Route>
      <Route path="/users">{() => <ProtectedRoute component={Users} />}</Route>
      <Route path="/partners">{() => <ProtectedRoute component={Partners} />}</Route>
      <Route path="/alerts">{() => <ProtectedRoute component={Alerts} />}</Route>
      <Route path="/subscription">{() => <ProtectedRoute component={Subscription} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={Profile} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

