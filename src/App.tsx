import FlashcardDemo from "./pages/FlashcardDemo";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import QuizDemo from "./pages/QuizDemo";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import LeaderboardPage from "./pages/LeaderboardPage";
import LeaderboardGroupsPage from "./pages/LeaderboardGroupsPage";
import GamblingPage from "./pages/GamblingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CoursesPage from "./pages/CoursesPage";
import ProgressPage from "./pages/ProgressPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import AchievementsPage from "./pages/AchievementsPage";
import HelpPage from "./pages/HelpPage";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import { useEffect } from "react";
import {
  initMixpanel,
  trackPageView,
  identifyUser,
  resetIdentity,
} from "./utils/important_file";
import { trackLogin } from "./utils/eventTracker";
import LeaderboardGroupsIdPage from "./pages/LeaderboardGroupsIdPage";
import AiAssistantPage from "./pages/AIAssistantPage";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient();

// Route guard component for authenticated routes
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You could show a loading spinner here
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" />;
  }

  return children;
};

// Route guard for unauthenticated routes (login, register)
const RequireUnauth = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    // You could show a loading spinner here
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return children;
};

// PageTracker component to handle page view tracking
const PageTracker = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Track page view on each location change
    console.log("Page visited:", location.pathname);

    // Get page name from path for better analytics
    const pageName = getPageNameFromPath(location.pathname);

    // Track the page view with enhanced tracking that includes IP data
    import("@/utils/eventTracker").then(({ enhancedTrackPageView }) => {
      enhancedTrackPageView(pageName, {
        is_authenticated: isAuthenticated,
      });
    });
  }, [location, isAuthenticated]);

  // Helper function to get a readable page name from the path
  const getPageNameFromPath = (path: string): string => {
    // Remove leading slash and split by remaining slashes
    const parts = path.replace(/^\//, "").split("/");

    // If it's the root path, return "Dashboard"
    if (parts[0] === "") return "Dashboard";

    // Otherwise, capitalize the first segment of the path
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  };

  return null;
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize mixpanel once when the app loads
    initMixpanel();

    // Identify user if they're authenticated
    if (isAuthenticated && user) {
      identifyUser(user.id, {
        email: user.email || "",
        firstName: user.user_metadata?.first_name || "",
        lastName: user.user_metadata?.last_name || "",
        createdAt: user.created_at ? new Date(user.created_at) : new Date(),
      });
    }
  }, [isAuthenticated, user]);

  // Reset Mixpanel identity when user logs out
  useEffect(() => {
    return () => {
      if (!isAuthenticated) {
        resetIdentity();
      }
    };
  }, [isAuthenticated]);

  return (
    <Routes>
      {/* Public routes */}
  <Route path="/flashcard-demo" element={<FlashcardDemo />} />
  {/* New public route for QuizDemo */}
  <Route path="/quiz-demo" element={<QuizDemo />} />
      <Route
        path="/terms"
        element={<TermsPage />}
      />
      <Route
        path="/privacy"
        element={<PrivacyPage />}
      />
      <Route
        path="/landing"
        element={<Navigate to="/login" replace />}
      />

      <Route
        path="/login"
        element={
          <RequireUnauth>
            <LoginPage />
          </RequireUnauth>
        }
      />

      <Route
        path="/register"
        element={
          <RequireUnauth>
            <RegisterPage />
          </RequireUnauth>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Index />
          </RequireAuth>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <LeaderboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/gambling"
        element={
          <RequireAuth>
            <GamblingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/leaderboard/groups"
        element={
          <RequireAuth>
            <LeaderboardGroupsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/leaderboard/groups/:groupId"
        element={
          <RequireAuth>
            <LeaderboardGroupsIdPage />
          </RequireAuth>
        }
      />

      <Route
        path="/courses"
        element={
          <RequireAuth>
            <CoursesPage />
          </RequireAuth>
        }
      />

      <Route
        path="/progress"
        element={
          <RequireAuth>
            <ProgressPage />
          </RequireAuth>
        }
      />

      <Route
        path="/calendar"
        element={
          <RequireAuth>
            <CalendarPage />
          </RequireAuth>
        }
      />

      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      {/* <Route
        path="/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      /> */}
      <Route
        path="/ai-assistant"
        element={
          <RequireAuth>
            <AiAssistantPage />
          </RequireAuth>
        }
      />
      <Route
        path="/achievements"
        element={
          <RequireAuth>
            <AchievementsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminPage />
          </RequireAuth>
        }
      />

      <Route
        path="/help"
        element={
          <RequireAuth>
            <HelpPage />
          </RequireAuth>
        }
      />

      <Route
        path="/pricing"
        element={
          <RequireAuth>
            <PricingPage />
          </RequireAuth>
        }
      />

      <Route
        path="/forgot-password"
        element={
          <RequireUnauth>
            <ForgotPasswordPage />
          </RequireUnauth>
        }
      />

      <Route
        path="/update-password"
        element={<UpdatePasswordPage />} 
      />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <PageTracker />
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
