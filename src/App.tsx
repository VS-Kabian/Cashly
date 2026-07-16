import React from "react";
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
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Insights from "./pages/Insights";
import CalendarView from "./pages/CalendarView";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import CategoryManagement from "./components/CategoryManagement";
import AllTransactionHistory from "./pages/AllTransactionHistory";
import Budget from "./pages/Budget";
import NotFound from "./pages/NotFound";
// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminActivityLogs from "./pages/admin/AdminActivityLogs";
import { queryClient } from "./lib/queryClient";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminAuthProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
          </BrowserRouter>
        </AuthProvider>
      </AdminAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
