import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Download, FileText, CheckCircle } from 'lucide-react';

export function ExportData() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const exportToCSV = async (tableName: string, fileName: string) => {
    try {
      setLoading(true);
      setExportSuccess(false);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(`No ${tableName} data to export`);
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header];
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setLoading(true);
      setExportSuccess(false);

      const [goalsRes, transactionsRes, billsRes, investmentsRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', user!.id),
        supabase.from('transactions').select('*').eq('user_id', user!.id),
        supabase.from('bills').select('*').eq('user_id', user!.id),
        supabase.from('investments').select('*').eq('user_id', user!.id),
      ]);

      const allData = {
        goals: goalsRes.data || [],
        transactions: transactionsRes.data || [],
        bills: billsRes.data || [],
        investments: investmentsRes.data || [],
        exported_at: new Date().toISOString(),
      };

      const jsonContent = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `financeai_all_data_${Date.now()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting all data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ExportCard = ({
    title,
    description,
    onClick,
    icon: Icon,
  }: {
    title: string;
    description: string;
    onClick: () => void;
    icon: any;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Data</h1>
        <p className="text-gray-600">Download your financial data in various formats for backup or analysis.</p>
      </div>

      {exportSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600" />
          <span className="text-green-800 font-medium">Data exported successfully!</span>
        </div>
      )}

      <div className="space-y-6 mb-8">
        <ExportCard
          title="Export Goals"
          description="Download all your investment goals and targets as a CSV file."
          onClick={() => exportToCSV('goals', `financeai_goals_${Date.now()}.csv`)}
          icon={FileText}
        />

        <ExportCard
          title="Export Transactions"
          description="Download all your income and expense transactions as a CSV file."
          onClick={() => exportToCSV('transactions', `financeai_transactions_${Date.now()}.csv`)}
          icon={FileText}
        />

        <ExportCard
          title="Export Bills"
          description="Download all your bills and receipts data as a CSV file."
          onClick={() => exportToCSV('bills', `financeai_bills_${Date.now()}.csv`)}
          icon={FileText}
        />

        <ExportCard
          title="Export Investments"
          description="Download all your investment portfolio data as a CSV file."
          onClick={() => exportToCSV('investments', `financeai_investments_${Date.now()}.csv`)}
          icon={FileText}
        />

        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-sm p-8 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Download size={32} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Export All Data</h3>
              <p className="text-blue-100 mb-6">
                Download a complete backup of all your financial data in JSON format. This includes goals,
                transactions, bills, and investments.
              </p>
              <button
                onClick={exportAllData}
                disabled={loading}
                className="px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Exporting...' : 'Export Complete Backup'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notes</h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.</li>
          <li>• JSON files contain complete data and can be used for backup or data migration.</li>
          <li>• Exported data includes all records associated with your account.</li>
          <li>• Keep your exported files secure as they contain sensitive financial information.</li>
          <li>• Regular backups are recommended to prevent data loss.</li>
        </ul>
      </div>
    </div>
  );
}
