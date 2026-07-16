import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/AuthProvider";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import Layout from "./components/Layout";
import AdminLayout from "./components/AdminLayout";
import MaintenanceMode from "./components/MaintenanceMode";
import { queryClient } from "./lib/queryClient";

const Auth = React.lazy(() => import("./pages/Auth"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AddTransaction = React.lazy(() => import("./pages/AddTransaction"));
const Insights = React.lazy(() => import("./pages/Insights"));
const CalendarView = React.lazy(() => import("./pages/CalendarView"));
const Profile = React.lazy(() => import("./pages/Profile"));
const Settings = React.lazy(() => import("./pages/Settings"));
const CategoryManagement = React.lazy(() => import("./components/CategoryManagement"));
const AllTransactionHistory = React.lazy(() => import("./pages/AllTransactionHistory"));
const Budget = React.lazy(() => import("./pages/Budget"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard"));
const AdminSettings = React.lazy(() => import("./pages/admin/AdminSettings"));
const AdminActivityLogs = React.lazy(() => import("./pages/admin/AdminActivityLogs"));

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark" role="status">
      Loading page...
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
              {/* Admin Routes - Not affected by maintenance mode */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route path="login" element={<AdminLogin />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="activity-logs" element={<AdminActivityLogs />} />
              </Route>

              {/* Regular User Routes - Wrapped in MaintenanceMode */}
              <Route
                path="/*"
                element={
                  <MaintenanceMode>
                    <Routes>
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="add-transaction" element={<AddTransaction />} />
                        <Route path="insights" element={<Insights />} />
                        <Route path="calendar" element={<CalendarView />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="categories" element={<CategoryManagement />} />
                        <Route path="transactions" element={<AllTransactionHistory />} />
                        <Route path="budget" element={<Budget />} />
                      </Route>
                      <Route path="/auth" element={<Auth />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MaintenanceMode>
                }
              />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
