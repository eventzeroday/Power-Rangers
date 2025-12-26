import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Receipt,
  FileText,
  Target,
  Download,
  TrendingUp,
  Camera
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  netWorth: number;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "visual-analysis", label: "Visual Analysis", icon: BarChart3 },
  { id: "transactions", label: "Transactions", icon: FileText },
  { id: "bills", label: "Bills & Receipts", icon: Receipt },
  { id: "goals", label: "Investment Goals", icon: Target },
  { id: "export", label: "Export Data", icon: Download },
];

// helper to get initials
function getInitials(text: string) {
  return text
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Layout({ children, currentPage, onNavigate, netWorth }: LayoutProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const fullName = user?.user_metadata?.full_name || "";
  const initials = fullName ? getInitials(fullName) : getInitials(user?.email || "");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-lg px-2 py-1">
              ₹
            </span>
            FinanceAI
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                Net Worth
              </span>
              <TrendingUp size={16} className="text-green-400" />
            </div>
            <div className="text-2xl font-bold">₹{netWorth.toLocaleString()}</div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1">

        {/* ⭐ TOP NAV BAR ⭐ */}
        <header className="w-full bg-white border-b border-gray-200 p-4 flex justify-end items-center relative">
          {user && (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setMenuOpen(!menuOpen)}>
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  className="w-10 h-10 rounded-full object-cover"
                  alt="avatar"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {initials}
                </div>
              )}

              <span className="font-semibold text-gray-700">
                {fullName || user.email}
              </span>
            </div>
          )}

          {/* DROPDOWN MENU */}
          {menuOpen && (
            <div className="absolute right-4 top-16 bg-white shadow-lg rounded-lg border w-48">
              <button className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-left">
                <Camera size={18} /> Upload Profile Photo
              </button>
              <button className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100 text-left">
                Change Password
              </button>
            </div>
          )}
        </header>

        {children}
      </main>
    </div>
  );
}
