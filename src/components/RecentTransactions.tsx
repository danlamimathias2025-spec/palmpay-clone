import { ArrowDownLeft, ArrowUpRight, ReceiptText } from 'lucide-react';

export default function RecentTransactions({ transactions, onSelect, sortBy, setSortBy }: { transactions: any[], onSelect: (t: any) => void, sortBy: string, setSortBy: (s: any) => void }) {
  if (transactions.length === 0) {
    return (
      <section className="p-4">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-sm border rounded-lg p-1 dark:bg-gray-800">
                <option value="date">Sort: Date</option>
                <option value="amount">Sort: Amount</option>
                <option value="vendor">Sort: Vendor</option>
            </select>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-2xl">
          <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-full mb-3">
            <ReceiptText size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-900 font-medium">No activity yet</p>
          <p className="text-sm text-gray-500 max-w-[200px] mt-1">Your recent transactions will appear here once you've started making payments.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="p-4 bg-white dark:bg-gray-950">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-sm border rounded-lg p-1 dark:bg-gray-800">
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="vendor">Sort: Vendor</option>
        </select>
      </div>
      <div className="space-y-4">
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between cursor-pointer" onClick={() => onSelect(t)}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${t.type === 'credit' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                {t.type === 'credit' ? <ArrowDownLeft size={16} className="text-green-600 dark:text-green-400" /> : <ArrowUpRight size={16} className="text-red-600 dark:text-red-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{t.type === 'transfer' ? `To: ${t.recipient}` : 'Incoming Funds'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t.timestamp ? new Date(t.timestamp.seconds * 1000).toLocaleDateString() : 'Pending'}</p>
              </div>
            </div>
            <p className={`text-sm font-semibold ${t.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                {t.type === 'credit' ? '+' : '-'}₦{Number(t.amount).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
