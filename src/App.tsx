import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Clients from './pages/clients/Clients';
import ClientDetails from './pages/clients/ClientDetails';
import Importers from './pages/importers/Importers';
import Processes from './pages/processes/Processes';
import ProcessDetails from './pages/processes/ProcessDetails';
import Financial from './pages/financial/Financial';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import BankAccounts from './pages/settings/BankAccounts';
import ExpenseCategories from './pages/settings/ExpenseCategories';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="clientes/:id" element={<ClientDetails />} />
            <Route path="importadoras" element={<Importers />} />
            <Route path="processos" element={<Processes />} />
            <Route path="processos/:id" element={<ProcessDetails />} />
            <Route path="financeiro" element={<Financial />} />
            <Route path="relatorios" element={<Reports />} />
            <Route path="configuracoes" element={<Settings />}>
              <Route path="contas" element={<BankAccounts />} />
              <Route path="categorias" element={<ExpenseCategories />} />
            </Route>
          </Route>

          {/* Rota 404 - redireciona para dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
