import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { SalesmanDashboard } from './pages/dashboards/SalesmanDashboard';
import { ProductionDashboard } from './pages/dashboards/ProductionDashboard';
import { AccountantDashboard } from './pages/dashboards/AccountantDashboard';
import { OrdersList } from './pages/sales/OrdersList';
import { CreateOrder } from './pages/sales/CreateOrder';
import { ProductionRuns } from './pages/production/ProductionRuns';
import { CreateProductionRun } from './pages/production/CreateProductionRun';
import { BomsList } from './pages/production/BomsList';
import { CreateBom } from './pages/production/CreateBom';
import { StockSummary } from './pages/inventory/StockSummary';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { PaymentsList } from './pages/payments/PaymentsList';
import { CostingReport } from './pages/costing/CostingReport';
import { ReportsCenter } from './pages/reports/ReportsCenter';
import { PurchasesList } from './pages/purchases/PurchasesList';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RoleBasedRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case 'PRODUCTION_SUPERVISOR':
      return <Navigate to="/dashboard/production" replace />;
    case 'SALESMAN':
      return <Navigate to="/dashboard/salesman" replace />;
    case 'ACCOUNTANT':
      return <Navigate to="/dashboard/accountant" replace />;
    case 'ADMIN':
      return <Navigate to="/dashboard/admin" replace />;
    case 'OWNER':
    default:
      return <Navigate to="/dashboard/owner" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<RoleBasedRedirect />} />
            <Route path="dashboard/owner" element={<OwnerDashboard />} />
            <Route path="dashboard/admin" element={<AdminDashboard />} />
            <Route path="dashboard/salesman" element={<SalesmanDashboard />} />
            <Route path="dashboard/production" element={<ProductionDashboard />} />
            <Route path="dashboard/accountant" element={<AccountantDashboard />} />

            <Route path="orders" element={<OrdersList />} />
            <Route path="orders/new" element={<CreateOrder />} />

            <Route path="production" element={<ProductionRuns />} />
            <Route path="production/runs/new" element={<CreateProductionRun />} />
            <Route path="production/boms" element={<BomsList />} />
            <Route path="production/boms/new" element={<CreateBom />} />
            <Route path="recipes" element={<BomsList />} />
            <Route path="recipes/new" element={<CreateBom />} />

            <Route path="inventory" element={<StockSummary />} />
            <Route path="inventory/ledger" element={<StockSummary />} />
            <Route path="purchases" element={<PurchasesList />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="payments" element={<PaymentsList />} />
            <Route path="costing" element={<CostingReport />} />
            <Route path="reports" element={<ReportsCenter />} />
          </Route>

          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
