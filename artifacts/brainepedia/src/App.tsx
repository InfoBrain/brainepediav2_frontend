import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { ProblemPage } from "@/pages/Problem";
import { SolutionPage } from "@/pages/Solution";
import { HowItWorksPage } from "@/pages/HowItWorks";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import VerifyOtp from "@/pages/auth/VerifyOtp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import ChangePassword from "@/pages/auth/ChangePassword";

// Dashboard pages
import UserDashboard from "@/pages/dashboard/UserDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import EmployerDashboard from "@/pages/dashboard/EmployerDashboard";
import { RequireAuth } from "@/components/dashboard/RequireAuth";
import { ForbiddenWatcher } from "@/components/dashboard/ForbiddenWatcher";

// Admin content management pages
import AdminProfessions from "@/pages/admin/AdminProfessions";
import AdminDistricts from "@/pages/admin/AdminDistricts";
import AdminProblemNodes from "@/pages/admin/AdminProblemNodes";

// Profile pages
import ViewProfile from "@/pages/profile/ViewProfile";
import EditProfile from "@/pages/profile/EditProfile";
import CreateProfile from "@/pages/profile/CreateProfile";

// User sub-pages
import BadgesPage from "@/pages/user/BadgesPage";
import SubscriptionSuccess from "@/pages/user/SubscriptionSuccess";

// Profession journey
import SelectProfession from "@/pages/profession/SelectProfession";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/problem" component={ProblemPage} />
      <Route path="/solution" component={SolutionPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/verify-otp" component={VerifyOtp} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/auth/change-password" component={ChangePassword} />

      <Route path="/user/subscription/success">
        <RequireAuth allow={["User"]}>
          <SubscriptionSuccess />
        </RequireAuth>
      </Route>
      <Route path="/user/:rest*">
        <RequireAuth allow={["User"]}>
          <UserDashboard />
        </RequireAuth>
      </Route>
      <Route path="/user/badges">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <BadgesPage />
        </RequireAuth>
      </Route>
      <Route path="/user/profile/create">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <CreateProfile />
        </RequireAuth>
      </Route>
      <Route path="/admin/professions">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminProfessions />
        </RequireAuth>
      </Route>
      <Route path="/admin/districts">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminDistricts />
        </RequireAuth>
      </Route>
      <Route path="/admin/problem-nodes">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminProblemNodes />
        </RequireAuth>
      </Route>
      <Route path="/admin/:rest*">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminDashboard />
        </RequireAuth>
      </Route>
      <Route path="/employer/:rest*">
        <RequireAuth allow={["Employer"]}>
          <EmployerDashboard />
        </RequireAuth>
      </Route>

      <Route path="/profile/edit">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <EditProfile />
        </RequireAuth>
      </Route>
      <Route path="/profile/create">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <CreateProfile />
        </RequireAuth>
      </Route>
      <Route path="/profile/:userId" component={ViewProfile} />

      <Route path="/profession/select">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <SelectProfession />
        </RequireAuth>
      </Route>
      <Route path="/profession/:professionId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <SelectProfession />
        </RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ForbiddenWatcher />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
