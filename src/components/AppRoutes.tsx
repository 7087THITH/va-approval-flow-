import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ProposalWizardPage = lazy(() => import("@/pages/ProposalWizardPage"));
const ProposalDetailPage = lazy(() => import("@/pages/ProposalDetailPage"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const VACalculatePage = lazy(() => import("@/pages/VACalculatePage"));
const ProjectManagementPage = lazy(() => import("@/pages/ProjectManagementPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const BatchCreatePage = lazy(() => import("@/pages/BatchCreatePage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

export function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/" element={isAuthenticated ? <ProtectedRoute><HomePage /></ProtectedRoute> : <Navigate to="/login" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/proposal/new" element={<ProtectedRoute><ProposalWizardPage /></ProtectedRoute>} />
        <Route path="/proposal/edit/:id" element={<ProtectedRoute><ProposalWizardPage /></ProtectedRoute>} />
        <Route path="/proposal/batch" element={<ProtectedRoute><BatchCreatePage /></ProtectedRoute>} />
        <Route path="/proposal/:id" element={<ProtectedRoute><ProposalDetailPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/va-calculate" element={<ProtectedRoute><VACalculatePage /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectManagementPage /></ProtectedRoute>} />
        <Route path="/drafts" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/pending" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/completed" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/rejected" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}