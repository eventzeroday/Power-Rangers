import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { InvestmentGoals } from './pages/InvestmentGoals';
import { Transactions } from './pages/Transactions';
import { Bills } from './pages/Bills';
import { VisualAnalysis } from './pages/VisualAnalysis';
import { ExportData } from './pages/ExportData';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [netWorth, setNetWorth] = useState(0);

  useEffect(() => {
    if (user) {
      loadNetWorth();
    }
  }, [user, currentPage]);

  const loadNetWorth = async () => {
    try {
      const [transactionsRes, investmentsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user!.id),
        supabase.from('investments').select('*').eq('user_id', user!.id),
      ]);

      const transactions = transactionsRes.data || [];
      const investments = investmentsRes.data || [];

      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const investmentValue = investments.reduce((sum, i) => sum + Number(i.current_value), 0);

      setNetWorth(totalIncome - totalExpenses + investmentValue);
    } catch (error) {
      console.error('Error calculating net worth:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'goals':
        return <InvestmentGoals />;
      case 'transactions':
        return <Transactions />;
      case 'bills':
        return <Bills />;
      case 'visual-analysis':
        return <VisualAnalysis />;
      case 'export':
        return <ExportData />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} netWorth={netWorth}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
