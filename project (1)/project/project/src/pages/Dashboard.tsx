import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, TrendingDown, Wallet, Target, Receipt, DollarSign } from 'lucide-react';

interface DashboardStats {
  netWorth: number;
  totalIncome: number;
  totalExpenses: number;
  activeGoals: number;
  pendingBills: number;
  investmentValue: number;
}

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    netWorth: 0,
    totalIncome: 0,
    totalExpenses: 0,
    activeGoals: 0,
    pendingBills: 0,
    investmentValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const [transactionsRes, goalsRes, billsRes, investmentsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user!.id),
        supabase.from('goals').select('*').eq('user_id', user!.id),
        supabase.from('bills').select('*').eq('user_id', user!.id).eq('status', 'pending'),
        supabase.from('investments').select('*').eq('user_id', user!.id),
      ]);

      const transactions = transactionsRes.data || [];
      const goals = goalsRes.data || [];
      const bills = billsRes.data || [];
      const investments = investmentsRes.data || [];

      const totalIncome = transactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const investmentValue = investments.reduce((sum, i) => sum + Number(i.current_value), 0);
      const netWorth = totalIncome - totalExpenses + investmentValue;

      setStats({
        netWorth,
        totalIncome,
        totalExpenses,
        activeGoals: goals.length,
        pendingBills: bills.length,
        investmentValue,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
    color
  }: {
    title: string;
    value: string;
    icon: any;
    trend?: string;
    trendUp?: boolean;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon size={24} className="text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trendUp ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            {trend}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Your complete financial overview at a glance.</p>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard title="Net Worth" value={`₹${stats.netWorth.toLocaleString()}`} icon={Wallet} trend="12.5%" trendUp color="bg-gradient-to-br from-blue-600 to-indigo-600" />
        <StatCard title="Total Income" value={`₹${stats.totalIncome.toLocaleString()}`} icon={TrendingUp} color="bg-gradient-to-br from-green-600 to-emerald-600" />
        <StatCard title="Total Expenses" value={`₹${stats.totalExpenses.toLocaleString()}`} icon={TrendingDown} color="bg-gradient-to-br from-red-600 to-rose-600" />
        <StatCard title="Investment Value" value={`₹${stats.investmentValue.toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-br from-amber-600 to-orange-600" />
        <StatCard title="Active Goals" value={stats.activeGoals.toString()} icon={Target} color="bg-gradient-to-br from-teal-600 to-cyan-600" />
        <StatCard title="Pending Bills" value={stats.pendingBills.toString()} icon={Receipt} color="bg-gradient-to-br from-gray-600 to-slate-600" />
      </div>

      {/* FINANCIAL + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FIN SUMMARY */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Summary</h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Savings Rate</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalIncome > 0
                    ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-600 to-emerald-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${stats.totalIncome > 0
                      ? ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100)
                      : 0}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ⭐ QUICK ACTIONS WITH NAVIGATION ⭐ */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">

            <button
              onClick={() => onNavigate("transactions")}
              className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-blue-900">Add Transaction</div>
              <div className="text-sm text-blue-700">Record income or expense</div>
            </button>

            <button
              onClick={() => onNavigate("goals")}
              className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-green-900">Create Goal</div>
              <div className="text-sm text-green-700">Set a new financial target</div>
            </button>

            <button
              onClick={() => onNavigate("bills")}
              className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <div className="font-medium text-amber-900">Add Bill</div>
              <div className="text-sm text-amber-700">Track upcoming payments</div>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
