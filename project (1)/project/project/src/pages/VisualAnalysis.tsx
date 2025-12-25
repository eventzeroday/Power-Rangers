import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, PieChart, Calendar } from 'lucide-react';

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
}

export function VisualAnalysis() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incomeByCategory, setIncomeByCategory] = useState<CategoryData[]>([]);
  const [expenseByCategory, setExpenseByCategory] = useState<CategoryData[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; income: number; expense: number }[]>([]);

  useEffect(() => {
    if (user) {
      loadAnalysisData();
    }
  }, [user]);

  const loadAnalysisData = async () => {
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      const incomeTransactions = (transactions || []).filter((t) => t.type === 'income');
      const expenseTransactions = (transactions || []).filter((t) => t.type === 'expense');

      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      const totalExpense = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0);

      const incomeCategories: { [key: string]: number } = {};
      incomeTransactions.forEach((t) => {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + Number(t.amount);
      });

      const expenseCategories: { [key: string]: number } = {};
      expenseTransactions.forEach((t) => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + Number(t.amount);
      });

      const incomeData = Object.entries(incomeCategories).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalIncome) * 100,
      }));

      const expenseData = Object.entries(expenseCategories).map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalExpense) * 100,
      }));

      setIncomeByCategory(incomeData.sort((a, b) => b.amount - a.amount));
      setExpenseByCategory(expenseData.sort((a, b) => b.amount - a.amount));

      const monthlyMap: { [key: string]: { income: number; expense: number } } = {};
      (transactions || []).forEach((t) => {
        const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyMap[month]) {
          monthlyMap[month] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
          monthlyMap[month].income += Number(t.amount);
        } else {
          monthlyMap[month].expense += Number(t.amount);
        }
      });

      const monthlyArray = Object.entries(monthlyMap).map(([month, data]) => ({
        month,
        ...data,
      }));

      setMonthlyData(monthlyArray);
    } catch (error) {
      console.error('Error loading analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visual Analysis</h1>
        <p className="text-gray-600">Get insights from your financial data with visual analytics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Income by Category</h2>
          </div>

          {incomeByCategory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No income data available</div>
          ) : (
            <div className="space-y-4">
              {incomeByCategory.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">₹{item.amount.toLocaleString()}</span>
                      <span className="text-gray-500 ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colors[index % colors.length]} h-3 rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart size={20} className="text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Expenses by Category</h2>
          </div>

          {expenseByCategory.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No expense data available</div>
          ) : (
            <div className="space-y-4">
              {expenseByCategory.map((item, index) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">₹{item.amount.toLocaleString()}</span>
                      <span className="text-gray-500 ml-2">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${colors[index % colors.length]} h-3 rounded-full transition-all`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar size={20} className="text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Monthly Trends</h2>
        </div>

        {monthlyData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No monthly data available</div>
        ) : (
          <div className="space-y-6">
            {monthlyData.map((item) => (
              <div key={item.month} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-gray-900">{item.month}</span>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-gray-600">Income: </span>
                      <span className="font-semibold text-green-600">₹{item.income.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Expense: </span>
                      <span className="font-semibold text-red-600">₹{item.expense.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Net: </span>
                      <span
                        className={`font-semibold ${
                          item.income - item.expense >= 0 ? 'text-blue-600' : 'text-red-600'
                        }`}
                      >
                        ₹{(item.income - item.expense).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute left-0 h-full bg-green-500 opacity-50"
                    style={{ width: `${(item.income / (item.income + item.expense)) * 100}%` }}
                  ></div>
                  <div
                    className="absolute right-0 h-full bg-red-500 opacity-50"
                    style={{ width: `${(item.expense / (item.income + item.expense)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <h3 className="font-semibold">Top Income Category</h3>
          </div>
          {incomeByCategory[0] ? (
            <>
              <div className="text-2xl font-bold mb-1">{incomeByCategory[0].category}</div>
              <div className="text-blue-100">₹{incomeByCategory[0].amount.toLocaleString()}</div>
            </>
          ) : (
            <div className="text-blue-100">No data</div>
          )}
        </div>

        <div className="bg-gradient-to-br from-red-600 to-rose-600 text-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <h3 className="font-semibold">Top Expense Category</h3>
          </div>
          {expenseByCategory[0] ? (
            <>
              <div className="text-2xl font-bold mb-1">{expenseByCategory[0].category}</div>
              <div className="text-red-100">₹{expenseByCategory[0].amount.toLocaleString()}</div>
            </>
          ) : (
            <div className="text-red-100">No data</div>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={20} />
            <h3 className="font-semibold">Total Months Tracked</h3>
          </div>
          <div className="text-2xl font-bold mb-1">{monthlyData.length}</div>
          <div className="text-green-100">Months of data</div>
        </div>
      </div>
    </div>
  );
}
