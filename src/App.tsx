/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Sales from './pages/Sales';
import Alerts from './pages/Alerts';
import Purchases from './pages/Purchases';
import Scanner from './pages/Scanner';
import History from './pages/History';
import StockReport from './pages/reports/StockReport';
import SalesReport from './pages/reports/SalesReport';
import PurchasesReport from './pages/reports/PurchasesReport';
import { InventoryProvider } from './InventoryContext';
import { AuthProvider, useAuth } from './AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="animate-spin text-brand-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <InventoryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard/stock" element={<StockReport />} />
              <Route path="dashboard/sales" element={<SalesReport />} />
              <Route path="dashboard/purchases" element={<PurchasesReport />} />
              <Route path="inventory" element={<Inventory />} />
              <Route path="sales" element={<Sales />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="history" element={<History />} />
              <Route path="scanner" element={<Scanner />} />
              <Route path="orders" element={<div className="text-white">Pedidos (Próximamente)</div>} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </InventoryProvider>
    </AuthProvider>
  );
}

