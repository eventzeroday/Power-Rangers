import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  X,
  Edit,
  Trash2,
} from "lucide-react";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);

  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all"
  );

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
  });

  /* ------------------------------------
    🔧 FORMAT DATE (DD-MM-YYYY → YYYY-MM-DD)
  ------------------------------------ */
  const formatDate = (input: string) => {
    if (input.includes("-") && input.split("-")[0].length === 2) {
      const [day, month, year] = input.split("-");
      return `${year}-${month}-${day}`;
    }
    return input;
  };

  /* ------------------------------------
    LOAD TRANSACTIONS
  ------------------------------------ */
  useEffect(() => {
    if (user) loadTransactions();
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------
    ADD / UPDATE TRANSACTION
  ------------------------------------ */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formattedDate = formatDate(formData.date);

      if (editingTransaction) {
        // UPDATE
        const { error } = await supabase
          .from("transactions")
          .update({
            type: formData.type,
            amount: parseFloat(formData.amount),
            category: formData.category,
            description: formData.description,
            date: formattedDate,
          })
          .eq("id", editingTransaction.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from("transactions").insert({
          user_id: user!.id,
          type: formData.type,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formattedDate,
        });

        if (error) throw error;
      }

      // After save
      setShowModal(false);
      setEditingTransaction(null);
      resetForm();
      loadTransactions();
      alert("Transaction saved successfully!"); // optional feedback
    } catch (error: any) {
      alert(error.message);
      console.error("Error saving transaction:", error);
    }
  };

  /* ------------------------------------
    DELETE
  ------------------------------------ */
  const deleteTransaction = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;

      loadTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  };

  /* ------------------------------------
    RESET FORM
  ------------------------------------ */
  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
    });
    setShowModal(true);
  };

  /* ------------------------------------
    FILTER & TOTALS
  ------------------------------------ */
  const filteredTransactions = transactions.filter((t) =>
    filterType === "all" ? true : t.type === filterType
  );

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  /* ------------------------------------
    UI
  ------------------------------------ */
  return (
    <div className="p-8">
      {/* PAGE HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Transactions</h1>
        <p className="text-gray-600">
          Track all your income and expenses in one place.
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ArrowUpCircle size={24} className="text-green-600 mb-2" />
          <div className="text-sm text-gray-600">Total Income</div>
          <div className="text-3xl font-bold">{`₹${totalIncome.toLocaleString()}`}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ArrowDownCircle size={24} className="text-red-600 mb-2" />
          <div className="text-sm text-gray-600">Total Expenses</div>
          <div className="text-3xl font-bold">{`₹${totalExpenses.toLocaleString()}`}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ArrowUpCircle size={24} className="text-blue-600 mb-2" />
          <div className="text-sm text-gray-600">Balance</div>
          <div
            className={`text-3xl font-bold ${
              balance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            ₹{balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Transactions</h2>

          <button
            onClick={() => {
              resetForm();
              setEditingTransaction(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} /> Add Transaction
          </button>
        </div>

        <div className="overflow-x-auto">
          {filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No transactions found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 capitalize">{t.type}</td>
                    <td className="px-6 py-3">{t.category}</td>
                    <td className="px-6 py-3">{t.description}</td>
                    <td
                      className={`px-6 py-3 text-right font-medium ${
                        t.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"} ₹
                      {t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(t)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingTransaction ? "Edit Transaction" : "Add Transaction"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setEditingTransaction(null);
                }}
              >
                <X size={24} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* TYPE BUTTONS */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "income" })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    formData.type === "income"
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    formData.type === "expense"
                      ? "bg-red-600 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Expense
                </button>
              </div>

              {/* AMOUNT */}
              <input
                type="number"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                className="w-full border p-2 rounded"
              />

              {/* CATEGORY */}
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
                className="w-full border p-2 rounded"
              />

              {/* DATE */}
              <input
                type="text"
                placeholder="DD-MM-YYYY or YYYY-MM-DD"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
                className="w-full border p-2 rounded"
              />

              {/* DESCRIPTION */}
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                rows={3}
                className="w-full border p-2 rounded"
              />

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                >
                  {editingTransaction ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
