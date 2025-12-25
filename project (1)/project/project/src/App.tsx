import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Auth } from "./components/Auth";
import { Layout } from "./components/Layout";

import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { InvestmentGoals } from "./pages/InvestmentGoals";
import { Bills } from "./pages/Bills";
import { VisualAnalysis } from "./pages/VisualAnalysis";
import { ExportData } from "./pages/ExportData";

import { supabase } from "./lib/supabase";

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [netWorth, setNetWorth] = useState(0);

  // 🔹 Load net worth whenever user logs in or page switches
  useEffect(() => {
    if (user) {
      loadNetWorth();
    }
  }, [user, currentPage]);

  // 🔹 Calculate net worth
  const loadNetWorth = async () => {
    try {
      const [transactionsRes, investmentsRes] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user!.id),
        supabase.from("investments").select("*").eq("user_id", user!.id),
      ]);

      const transactions = transactionsRes.data || [];
      const investments = investmentsRes.data || [];

      const totalIncome = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const investmentValue = investments.reduce(
        (sum, i) => sum + Number(i.current_value),
        0
      );

      setNetWorth(totalIncome - totalExpenses + investmentValue);
    } catch (error) {
      console.error("Error calculating net worth:", error);
    }
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 🔹 If user not logged in → show Auth page
  if (!user) {
    return <Auth />;
  }

  // 🔹 Route pages
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />; // ⭐ IMPORTANT
      case "transactions":
        return <Transactions />; // ⭐ Modal opens from this page
      case "goals":
        return <InvestmentGoals />;
      case "bills":
        return <Bills />;
      case "visual-analysis":
        return <VisualAnalysis />;
      case "export":
        return <ExportData />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} netWorth={netWorth}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
