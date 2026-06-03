import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useSessionTimeout } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { RequireAuth } from "@/components/dashboard/RequireAuth";
import { ForbiddenWatcher } from "@/components/dashboard/ForbiddenWatcher";

// Global widget
import { BrainiacWidget } from "@/components/app/BrainiacWidget";
import { OnboardingGuide } from "@/components/app/OnboardingGuide";

const queryClient = new QueryClient();

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/Home"));
const ProblemPage = lazy(() => import("@/pages/Problem").then((m) => ({ default: m.ProblemPage })));
const SolutionPage = lazy(() => import("@/pages/Solution").then((m) => ({ default: m.SolutionPage })));
const HowItWorksPage = lazy(() => import("@/pages/HowItWorks").then((m) => ({ default: m.HowItWorksPage })));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const Terms = lazy(() => import("@/pages/Terms"));
const Login = lazy(() => import("@/pages/auth/Login"));
const Register = lazy(() => import("@/pages/auth/Register"));
const VerifyOtp = lazy(() => import("@/pages/auth/VerifyOtp"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("@/pages/auth/ChangePassword"));
const LoginSuccess = lazy(() => import("@/pages/auth/LoginSuccess"));
const UserDashboard = lazy(() => import("@/pages/dashboard/UserDashboard"));
const AdminDashboard = lazy(() => import("@/pages/dashboard/AdminDashboard"));
const AdminProfessions = lazy(() => import("@/pages/admin/AdminProfessions"));
const AdminDistricts = lazy(() => import("@/pages/admin/AdminDistricts"));
const AdminProblemNodes = lazy(() => import("@/pages/admin/AdminProblemNodes"));
const AdminUsers = lazy(() => import("@/pages/admin/AdminUsers"));
const AdminUserProfile = lazy(() => import("@/pages/admin/AdminUserProfile"));
const AdminUserDossier = lazy(() => import("@/pages/admin/AdminUserDossier"));
const AdminEmployers = lazy(() => import("@/pages/admin/AdminEmployers"));
const AdminEmployerDetails = lazy(() => import("@/pages/admin/AdminEmployerDetails"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminSubscriptions = lazy(() => import("@/pages/admin/AdminSubscriptions"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));
const EmployerOverview = lazy(() => import("@/pages/employer/EmployerOverview"));
const CompanyProfile = lazy(() => import("@/pages/employer/CompanyProfile"));
const TeamMembers = lazy(() => import("@/pages/employer/TeamMembers"));
const PrivateChallenges = lazy(() => import("@/pages/employer/PrivateChallenges"));
const CandidateAssessments = lazy(() => import("@/pages/employer/CandidateAssessments"));
const TeamAnalytics = lazy(() => import("@/pages/employer/TeamAnalytics"));
const BillingSeats = lazy(() => import("@/pages/employer/BillingSeats"));
const EmployerSettings = lazy(() => import("@/pages/employer/EmployerSettings"));
const CandidateExplorer = lazy(() => import("@/pages/employer/CandidateExplorer"));
const CandidateDossier = lazy(() => import("@/pages/employer/CandidateDossier"));
const SavedCandidates = lazy(() => import("@/pages/employer/SavedCandidates"));
const CreateJob = lazy(() => import("@/pages/employer/CreateJob"));
const MyJobPostings = lazy(() => import("@/pages/employer/MyJobPostings"));
const Applications = lazy(() => import("@/pages/employer/Applications"));
const ViewProfile = lazy(() => import("@/pages/profile/ViewProfile"));
const EditProfile = lazy(() => import("@/pages/profile/EditProfile"));
const CreateProfile = lazy(() => import("@/pages/profile/CreateProfile"));
const BadgesPage = lazy(() => import("@/pages/user/BadgesPage"));
const ActivityFeed = lazy(() => import("@/pages/user/ActivityFeed"));
const SubscriptionSuccess = lazy(() => import("@/pages/user/SubscriptionSuccess"));
const AchievementsPage = lazy(() => import("@/pages/user/AchievementsPage"));
const PublicPortfolioRedirect = lazy(() => import("@/pages/user/PublicPortfolioRedirect"));
const UserMissions = lazy(() => import("@/pages/user/UserMissions"));
const XPProgress = lazy(() => import("@/pages/user/XPProgress"));
const VXProgress = lazy(() => import("@/pages/user/VXProgress"));
const ExperienceSessionsPage = lazy(() => import("@/pages/user/ExperienceSessionsPage"));
const UserSettings = lazy(() => import("@/pages/user/UserSettings"));
const SubscriptionCenter = lazy(() => import("@/pages/subscription/SubscriptionCenter"));
const VerifyPayment = lazy(() => import("@/pages/subscription/VerifyPayment"));
const SelectProfession = lazy(() => import("@/pages/profession/SelectProfession"));
const DistrictMap = lazy(() => import("@/pages/profession/DistrictMap"));
const MissionListPage = lazy(() => import("@/pages/app/MissionListPage"));
const MissionDetailPage = lazy(() => import("@/pages/app/MissionDetailPage"));
const SolvePage = lazy(() => import("@/pages/app/SolvePage"));
const EvaluationPage = lazy(() => import("@/pages/app/EvaluationPage"));
const ResultPage = lazy(() => import("@/pages/app/ResultPage"));
const MissionEvaluatingPage = lazy(() => import("@/pages/app/MissionEvaluatingPage"));
const MissionResultPage = lazy(() => import("@/pages/app/MissionResultPage"));
const NodeResultPage = lazy(() => import("@/pages/app/NodeResultPage"));
const UserProgressPage = lazy(() => import("@/pages/app/UserProgressPage"));
const PublicProfilePage = lazy(() => import("@/pages/public/PublicProfilePage"));
const ForumDashboardPage = lazy(() => import("@/pages/forum/ForumDashboardPage"));
const ForumCategoryPage = lazy(() => import("@/pages/forum/ForumCategoryPage"));
const ForumThreadPage = lazy(() => import("@/pages/forum/ForumThreadPage"));
const JobFeed = lazy(() => import("@/pages/jobs/JobFeed"));
const JobDetails = lazy(() => import("@/pages/jobs/JobDetails"));
const UserApplications = lazy(() => import("@/pages/jobs/UserApplications"));
const UserAssessments = lazy(() => import("@/pages/jobs/UserAssessments"));

function LegacyRedirect({ to }: { to: string }) {
  const [, setLocation] = useLocation();
  useEffect(() => { setLocation(to, { replace: true }); }, [to, setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/problem" component={ProblemPage} />
      <Route path="/solution" component={SolutionPage} />
      <Route path="/how-it-works" component={HowItWorksPage} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={Terms} />

      {/* Legacy auth aliases — many pages navigate("/login") without the /auth/ prefix */}
      <Route path="/login"><LegacyRedirect to="/auth/login" /></Route>
      <Route path="/register"><LegacyRedirect to="/auth/register" /></Route>
      <Route path="/forgot-password"><LegacyRedirect to="/auth/forgot-password" /></Route>
      <Route path="/reset-password"><LegacyRedirect to="/auth/reset-password" /></Route>
      <Route path="/verify-otp"><LegacyRedirect to="/auth/verify-otp" /></Route>
      <Route path="/change-password"><LegacyRedirect to="/auth/change-password" /></Route>

      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/verify-otp" component={VerifyOtp} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/auth/change-password" component={ChangePassword} />
      <Route path="/login-success" component={LoginSuccess} />

      <Route path="/user/subscription/verify">
        <RequireAuth allow={["User"]}>
          <VerifyPayment />
        </RequireAuth>
      </Route>
      {/* Paystack callback — trxref and reference are read directly by VerifyPayment */}
      <Route path="/payment/callback">
        <RequireAuth allow={["User"]}>
          <VerifyPayment />
        </RequireAuth>
      </Route>
      <Route path="/user/subscription/success">
        <RequireAuth allow={["User"]}>
          <SubscriptionSuccess />
        </RequireAuth>
      </Route>
      <Route path="/user/subscription">
        <RequireAuth allow={["User"]}>
          <SubscriptionCenter />
        </RequireAuth>
      </Route>
      <Route path="/user/activity">
        <RequireAuth allow={["User"]}>
          <ActivityFeed />
        </RequireAuth>
      </Route>
      <Route path="/user/missions">
        <RequireAuth allow={["User"]}>
          <UserMissions />
        </RequireAuth>
      </Route>
      <Route path="/user/xp-progress">
        <RequireAuth allow={["User"]}>
          <XPProgress />
        </RequireAuth>
      </Route>
      <Route path="/user/vx-progress">
        <RequireAuth allow={["User"]}>
          <VXProgress />
        </RequireAuth>
      </Route>
      <Route path="/user/experience-sessions">
        <RequireAuth allow={["User"]}>
          <ExperienceSessionsPage />
        </RequireAuth>
      </Route>
      <Route path="/user/settings">
        <RequireAuth allow={["User"]}>
          <UserSettings />
        </RequireAuth>
      </Route>
      <Route path="/user/badges">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <BadgesPage />
        </RequireAuth>
      </Route>
      <Route path="/user/achievements">
        <RequireAuth allow={["User"]}>
          <AchievementsPage />
        </RequireAuth>
      </Route>
      <Route path="/user/applications">
        <RequireAuth allow={["User"]}>
          <UserApplications />
        </RequireAuth>
      </Route>
      <Route path="/user/assessments">
        <RequireAuth allow={["User"]}>
          <UserAssessments />
        </RequireAuth>
      </Route>
      <Route path="/user/portfolio">
        <RequireAuth allow={["User"]}>
          <PublicPortfolioRedirect />
        </RequireAuth>
      </Route>
      <Route path="/user/map">
        <RequireAuth allow={["User"]}>
          <LegacyRedirect to="/profession/select" />
        </RequireAuth>
      </Route>
      <Route path="/user/profile/create">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <CreateProfile />
        </RequireAuth>
      </Route>
      <Route path="/user/:rest*">
        <RequireAuth allow={["User"]}>
          <UserDashboard />
        </RequireAuth>
      </Route>
      <Route path="/jobs/:jobId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <JobDetails />
        </RequireAuth>
      </Route>
      <Route path="/jobs">
        <RequireAuth allow={["User"]}>
          <JobFeed />
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
      <Route path="/admin/users/public/:userId">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminUserDossier />
        </RequireAuth>
      </Route>
      <Route path="/admin/users/:profileId">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminUserProfile />
        </RequireAuth>
      </Route>
      <Route path="/admin/users">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminUsers />
        </RequireAuth>
      </Route>
      <Route path="/admin/user-profiles">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminUsers />
        </RequireAuth>
      </Route>
      <Route path="/admin/public-dossiers">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminUsers />
        </RequireAuth>
      </Route>
      <Route path="/admin/employers/:employerId">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminEmployerDetails />
        </RequireAuth>
      </Route>
      <Route path="/admin/employers">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminEmployers />
        </RequireAuth>
      </Route>
      <Route path="/admin/forum">
        <RequireAuth allow={["GlobalAdmin"]}>
          <ForumDashboardPage mode="categories" />
        </RequireAuth>
      </Route>
      <Route path="/admin/analytics">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminAnalytics />
        </RequireAuth>
      </Route>
      <Route path="/admin/subscriptions">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminSubscriptions />
        </RequireAuth>
      </Route>
      <Route path="/admin/settings">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminSettings />
        </RequireAuth>
      </Route>
      <Route path="/admin/:rest*">
        <RequireAuth allow={["GlobalAdmin"]}>
          <AdminDashboard />
        </RequireAuth>
      </Route>

      {/* Employer-specific routes — must appear BEFORE the catch-all /employer/:rest* */}
      <Route path="/employer/overview">
        <RequireAuth allow={["Employer"]}>
          <EmployerOverview />
        </RequireAuth>
      </Route>
      <Route path="/employer/company-profile">
        <RequireAuth allow={["Employer"]}>
          <CompanyProfile />
        </RequireAuth>
      </Route>
      <Route path="/employer/candidates/:userId">
        <RequireAuth allow={["Employer"]}>
          <CandidateDossier />
        </RequireAuth>
      </Route>
      <Route path="/employer/candidates">
        <RequireAuth allow={["Employer"]}>
          <CandidateExplorer />
        </RequireAuth>
      </Route>
      <Route path="/employer/candidate-dossiers">
        <RequireAuth allow={["Employer"]}>
          <CandidateDossier />
        </RequireAuth>
      </Route>
      <Route path="/employer/saved-candidates">
        <RequireAuth allow={["Employer"]}>
          <SavedCandidates />
        </RequireAuth>
      </Route>
      <Route path="/employer/jobs/create">
        <RequireAuth allow={["Employer"]}>
          <CreateJob />
        </RequireAuth>
      </Route>
      <Route path="/employer/jobs">
        <RequireAuth allow={["Employer"]}>
          <MyJobPostings />
        </RequireAuth>
      </Route>
      <Route path="/employer/applications/:jobId">
        <RequireAuth allow={["Employer"]}>
          <Applications />
        </RequireAuth>
      </Route>
      <Route path="/employer/applications">
        <RequireAuth allow={["Employer"]}>
          <Applications />
        </RequireAuth>
      </Route>
      <Route path="/employer/portal">
        <RequireAuth allow={["Employer"]}>
          <LegacyRedirect to="/employer/candidates" />
        </RequireAuth>
      </Route>
      <Route path="/employer/team">
        <RequireAuth allow={["Employer"]}>
          <TeamMembers />
        </RequireAuth>
      </Route>
      <Route path="/employer/challenges">
        <RequireAuth allow={["Employer"]}>
          <PrivateChallenges />
        </RequireAuth>
      </Route>
      <Route path="/employer/assessments">
        <RequireAuth allow={["Employer"]}>
          <CandidateAssessments />
        </RequireAuth>
      </Route>
      <Route path="/employer/analytics">
        <RequireAuth allow={["Employer"]}>
          <TeamAnalytics />
        </RequireAuth>
      </Route>
      <Route path="/employer/billing">
        <RequireAuth allow={["Employer"]}>
          <BillingSeats />
        </RequireAuth>
      </Route>
      <Route path="/employer/subscription">
        <RequireAuth allow={["Employer"]}>
          <SubscriptionCenter />
        </RequireAuth>
      </Route>
      <Route path="/employer/settings">
        <RequireAuth allow={["Employer"]}>
          <EmployerSettings />
        </RequireAuth>
      </Route>
      {/* Catch-all → employer overview dashboard */}
      <Route path="/employer/:rest*">
        <RequireAuth allow={["Employer"]}>
          <EmployerOverview />
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
          <DistrictMap />
        </RequireAuth>
      </Route>

      <Route path="/app/district/:districtId/missions">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <MissionListPage />
        </RequireAuth>
      </Route>
      <Route path="/app/mission/:problemNodeId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <MissionDetailPage />
        </RequireAuth>
      </Route>
      <Route path="/app/session/:sessionId/solve">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <SolvePage />
        </RequireAuth>
      </Route>
      <Route path="/app/submission/:submissionId/evaluating">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <EvaluationPage />
        </RequireAuth>
      </Route>
      <Route path="/app/submission/:submissionId/result">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <ResultPage />
        </RequireAuth>
      </Route>
      <Route path="/mission/evaluating/:submissionId/:sessionId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <MissionEvaluatingPage />
        </RequireAuth>
      </Route>
      <Route path="/mission/results/:sessionId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <MissionResultPage />
        </RequireAuth>
      </Route>
      <Route path="/missions/node-results/:problemNodeId">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <NodeResultPage />
        </RequireAuth>
      </Route>
      <Route path="/app/dashboard">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <UserProgressPage />
        </RequireAuth>
      </Route>

      <Route path="/public-profile/:userId" component={PublicProfilePage} />

      <Route path="/forum/discussions">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <ForumDashboardPage mode="discussions" />
        </RequireAuth>
      </Route>
      <Route path="/forum/my-discussions">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <ForumDashboardPage mode="mine" />
        </RequireAuth>
      </Route>
      <Route path="/forum/category/:categoryId" component={ForumCategoryPage} />
      <Route path="/forum/thread/:threadId" component={ForumThreadPage} />
      <Route path="/forum">
        <RequireAuth allow={["User", "Employer", "GlobalAdmin"]}>
          <ForumDashboardPage mode="categories" />
        </RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function SessionGuard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useSessionTimeout(() => {
    toast({
      title: "Session Expired",
      description: "Your session has expired. Please log in again.",
      variant: "destructive",
    });
    setLocation("/auth/login?reason=expired");
  });

  return null;
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-[#0A0E14] text-foreground flex items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-[#0d1119] px-6 py-5 text-center shadow-[0_0_30px_rgba(0,210,255,0.12)]">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#00D2FF]/30 border-t-[#00D2FF]" />
        <p className="text-sm font-mono text-muted-foreground">Loading Brainepedia...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <SessionGuard />
          <ForbiddenWatcher />
          <Suspense fallback={<RouteFallback />}>
            <Router />
          </Suspense>
          <BrainiacWidget />
          <OnboardingGuide />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
