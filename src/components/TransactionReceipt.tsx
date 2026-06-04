import { ChevronLeft, Copy } from 'lucide-react';

export default function TransactionReceipt({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="text-gray-900 dark:text-white"><ChevronLeft /></button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
      </div>

      <div className="text-center mb-8">
        <p className="text-sm text-gray-500 mb-1">Transaction Amount</p>
        <p className="text-3xl font-bold text-blue-600">₦{Math.abs(Number(transaction.amount)).toLocaleString()}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        <div>
            <p className="text-sm text-gray-500 mb-1">Sender Details</p>
            <p className="font-semibold text-gray-900 dark:text-white">MATHIAS SHEKWOAGA DANLAMI</p>
            <p className="text-sm text-gray-500">TENN | *** *** 6038</p>
        </div>
        <hr className='dark:border-gray-800'/>
        <div>
            <p className="text-sm text-gray-500 mb-1">Beneficiary Details</p>
            <p className="font-semibold text-gray-900 dark:text-white">MATHIAS SHEKWOAGA DANLAMI</p>
            <p className="text-sm text-gray-500">OPAY | *** *** 6038</p>
        </div>
        <hr className='dark:border-gray-800'/>
        <div className='flex justify-between'><p className="text-sm text-gray-500">Paid on</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200">{transaction.date}</p></div>
        <div className='flex justify-between'><p className="text-sm text-gray-500">Description</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200">Transfer out</p></div>
        <div className='flex justify-between items-center'><p className="text-sm text-gray-500">Transaction Reference</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200 flex items-center gap-2">712022...128 <Copy size={14}/></p></div>
        <div className='flex justify-between items-center'><p className="text-sm text-gray-500">Session ID</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200 flex items-center gap-2">090716...8975 <Copy size={14}/></p></div>
        <div className='flex justify-between'><p className="text-sm text-gray-500">Remark</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200">-</p></div>
      </div>

      <button className="w-full mt-8 p-4 rounded-xl bg-blue-600 text-white font-semibold">Share Receipt</button>
    </div>
  );
}
