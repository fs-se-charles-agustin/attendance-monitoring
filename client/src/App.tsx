import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyOtpPage } from "./pages/VerifyOtpPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute.tsx";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";

// Student Pages
import { StudentDashboard } from "./pages/student/StudentDashboard";
import { QRScanPage } from "./pages/student/QRScanPage.tsx";
import { StudentLogsPage } from "./pages/student/StudentLogsPage.tsx";
import { StudentReportsPage } from "./pages/student/StudentReportsPage.tsx";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { CompaniesPage } from "./pages/admin/CompaniesPage.tsx";
import { InternsPage } from "./pages/admin/InternsPage.tsx";
import { AdminLogsPage } from "./pages/admin/AdminLogsPage.tsx";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage.tsx";

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (!user) return null;
  return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/student/dashboard"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Role redirect */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />

        {/* Student routes */}
        <Route path="/student/*" element={
          <ProtectedRoute><RoleRoute role="student">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="scan" element={<QRScanPage />} />
                <Route path="logs" element={<StudentLogsPage />} />
                <Route path="reports" element={<StudentReportsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </RoleRoute></ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/*" element={
          <ProtectedRoute><RoleRoute role="admin">
            <Layout>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="companies" element={<CompaniesPage />} />
                <Route path="interns" element={<InternsPage />} />
                <Route path="logs" element={<AdminLogsPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Routes>
            </Layout>
          </RoleRoute></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
