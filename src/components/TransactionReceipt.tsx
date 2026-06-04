import { ChevronLeft, Copy } from 'lucide-react';

export default function TransactionReceipt({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  const isTransfer = transaction.type === 'transfer';
  
  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-950 p-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="text-gray-900 dark:text-white"><ChevronLeft /></button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction Details</h2>
      </div>

       <div className="text-center mb-8 space-y-2">
            <div className='bg-green-100 text-green-600 px-4 py-1 rounded-full inline-block font-semibold text-sm'>Successful</div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">₦{Math.abs(Number(transaction.amount)).toLocaleString()}</p>
       </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
        {isTransfer ? (
            <>
                <div>
                    <p className="text-sm text-gray-500 mb-1">Sender Details</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{transaction.senderName}</p>
                    <p className="text-sm text-gray-500">{transaction.senderAccountNumber}</p>
                </div>
                <hr className='dark:border-gray-800'/>
                <div>
                    <p className="text-sm text-gray-500 mb-1">Beneficiary Details</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{transaction.accountName}</p>
                    <p className="text-sm text-gray-500">{transaction.bank} | {transaction.accountNumber}</p>
                </div>
            </>
        ) : (
             <div>
                <p className="text-sm text-gray-500 mb-1">Details</p>
                <p className="font-semibold text-gray-900 dark:text-white">{transaction.recipient || transaction.details || 'N/A'}</p>
            </div>
        )}
        <hr className='dark:border-gray-800'/>
        <div className='flex justify-between'><p className="text-sm text-gray-500">Date</p><p className="text-sm font-medium text-gray-900 dark:text-gray-200">{transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleString() : 'N/A'}</p></div>
      </div>

      <button className="w-full mt-8 p-4 rounded-xl bg-blue-600 text-white font-semibold">Share Receipt</button>
    </div>
  );
}
