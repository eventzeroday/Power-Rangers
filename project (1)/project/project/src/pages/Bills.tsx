import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { Plus, X, Edit, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface Bill {
  id: string;
  bill_name: string; // <-- updated column name
  amount: number;
  due_date: string;
  status: "paid" | "pending" | "overdue";
  category: string;
  recurring: boolean;
  created_at: string;
}

export function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // formData uses "name" for input field, but stored as bill_name in DB
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    due_date: "",
    status: "pending" as "paid" | "pending" | "overdue",
    category: "utilities",
    recurring: false,
  });

  // Load bills
  useEffect(() => {
    if (user) loadBills();
  }, [user]);

  const loadBills = async () => {
    try {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .eq("user_id", user!.id)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const billsWithStatus = (data || []).map((bill) => {
        if (bill.status !== "paid") {
          const dueDate = new Date(bill.due_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (dueDate < today) {
            return { ...bill, status: "overdue" as const };
          }
        }
        return bill;
      });

      setBills(billsWithStatus);
    } catch (error) {
      console.error("Error loading bills:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add / Update bill
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBill) {
        // UPDATE
        const { error } = await supabase
          .from("bills")
          .update({
            bill_name: formData.name,
            amount: parseFloat(formData.amount),
            due_date: formData.due_date,
            status: formData.status,
            category: formData.category,
            recurring: formData.recurring,
          })
          .eq("id", editingBill.id);

        if (error) throw error;
      } else {
        // INSERT
        const { error } = await supabase.from("bills").insert({
          user_id: user!.id,
          bill_name: formData.name,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          status: formData.status,
          category: formData.category,
          recurring: formData.recurring,
        });

        if (error) throw error;
      }

      setShowModal(false);
      setEditingBill(null);
      resetForm();
      loadBills();
    } catch (error) {
      console.error("❌ Error saving bill:", error);
      alert("⚠️ Add/Update failed — check data values & database structure.");
    }
  };

  // Delete bill
  const deleteBill = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;
    try {
      const { error } = await supabase.from("bills").delete().eq("id", id);
      if (error) throw error;
      loadBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
    }
  };

  // Mark bill as paid
  const markAsPaid = async (bill: Bill) => {
    try {
      const { error } = await supabase
        .from("bills")
        .update({ status: "paid" })
        .eq("id", bill.id);

      if (error) throw error;
      loadBills();
    } catch (error) {
      console.error("Error updating bill:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: "",
      due_date: "",
      status: "pending",
      category: "utilities",
      recurring: false,
    });
  };

  const openEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      name: bill.bill_name, // <-- use bill_name when editing
      amount: bill.amount.toString(),
      due_date: bill.due_date,
      status: bill.status,
      category: bill.category,
      recurring: bill.recurring,
    });
    setShowModal(true);
  };

  const pendingBills = bills.filter((b) => b.status === "pending");
  const overdueBills = bills.filter((b) => b.status === "overdue");
  const paidBills = bills.filter((b) => b.status === "paid");

  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalOverdue = overdueBills.reduce((sum, b) => sum + Number(b.amount), 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + Number(b.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bills & Receipts</h1>
            <p className="text-gray-600">Manage your recurring payments and bills.</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingBill(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
          >
            <Plus size={20} />
            Add Bill
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Pending Bills" color="amber" amount={totalPending} count={pendingBills.length}>
          <Clock size={24} />
        </SummaryCard>

        <SummaryCard title="Overdue Bills" color="red" amount={totalOverdue} count={overdueBills.length}>
          <AlertCircle size={24} />
        </SummaryCard>

        <SummaryCard title="Paid Bills" color="green" amount={totalPaid} count={paidBills.length}>
          <CheckCircle size={24} />
        </SummaryCard>
      </div>

      {/* Bill lists */}
      {bills.length === 0 ? (
        <EmptyState onClick={() => setShowModal(true)} />
      ) : (
        <BillSections
          overdueBills={overdueBills}
          pendingBills={pendingBills}
          paidBills={paidBills}
          openEditModal={openEditModal}
          deleteBill={deleteBill}
          markAsPaid={markAsPaid}
        />
      )}

      {/* Modal */}
      {showModal && (
        <BillModal
          editingBill={editingBill}
          formData={formData}
          setFormData={setFormData}
          resetForm={resetForm}
          handleSubmit={handleSubmit}
          close={() => {
            setShowModal(false);
            setEditingBill(null);
            resetForm();
          }}
        />
      )}
    </div>
  );
}

/* ---------- UI COMPONENTS ---------- */

function SummaryCard({
  title,
  amount,
  count,
  color,
  children,
}: {
  title: string;
  amount: number;
  count: number;
  color: "amber" | "red" | "green";
  children: any;
}) {
  const colors: Record<string, string> = {
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${colors[color]}`}>{children}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">₹{amount.toLocaleString()}</div>
      <div className="text-sm text-gray-500">{count} bills</div>
    </div>
  );
}

function EmptyState({ onClick }: { onClick: () => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-gray-100 rounded-full">
          <Plus size={32} className="text-gray-400" />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No bills yet</h3>
      <p className="text-gray-600 mb-6">Start tracking your bills and payments</p>
      <button
        onClick={onClick}
        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
      >
        Add Your First Bill
      </button>
    </div>
  );
}

function BillSections({
  overdueBills,
  pendingBills,
  paidBills,
  openEditModal,
  deleteBill,
  markAsPaid,
}: any) {
  const renderSection = (title: string, color: string, icon: any, bills: Bill[]) =>
    bills.length > 0 && (
      <div>
        <h3 className={`text-lg font-semibold text-${color}-600 mb-3 flex items-center gap-2`}>
          {icon} {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bills.map((bill) => (
            <BillCard
              key={bill.id}
              bill={bill}
              onEdit={openEditModal}
              onDelete={deleteBill}
              onMarkPaid={markAsPaid}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {renderSection("Overdue Bills", "red", <AlertCircle size={20} />, overdueBills)}
      {renderSection("Pending Bills", "gray", <Clock size={20} />, pendingBills)}
      {renderSection("Paid Bills", "green", <CheckCircle size={20} />, paidBills)}
    </div>
  );
}

function BillModal({ editingBill, formData, setFormData, handleSubmit, close }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBill ? "Edit Bill" : "Add New Bill"}
          </h2>
          <button onClick={close} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input label="Bill Name" value={formData.name} onChange={(v) => setFormData({ ...formData, name: v })} />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(v) => setFormData({ ...formData, amount: v })}
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(v) => setFormData({ ...formData, category: v })}
              options={["utilities", "rent", "insurance", "subscription", "loan", "other"]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={(v) => setFormData({ ...formData, due_date: v })}
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(v) => setFormData({ ...formData, status: v })}
              options={["pending", "paid", "overdue"]}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.recurring}
              onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Recurring Bill</span>
          </label>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={close}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium"
            >
              {editingBill ? "Update Bill" : "Add Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

function BillCard({ bill, onEdit, onDelete, onMarkPaid }: any) {
  const statusColors = {
    paid: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    overdue: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border-2 p-5 hover:shadow-md transition-shadow ${
        statusColors[bill.status]
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">{bill.bill_name}</h4>
          <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">{bill.category}</span>
        </div>
        {bill.recurring && (
          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Recurring</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Amount</span>
          <span className="font-medium text-gray-900">₹{Number(bill.amount).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Due Date</span>
          <span className="font-medium text-gray-900">{new Date(bill.due_date).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex gap-2">
        {bill.status !== "paid" && (
          <button
            onClick={() => onMarkPaid(bill)}
            className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Mark Paid
          </button>
        )}
        <button
          onClick={() => onEdit(bill)}
          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => onDelete(bill.id)}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
