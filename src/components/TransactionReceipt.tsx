import { useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function TransactionReceipt({ transaction, onClose }: { transaction: any, onClose: () => void }) {
  const isTransfer = transaction.type === 'transfer';
  const receiptRef = useRef<HTMLDivElement>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  const handleShareAsImage = async () => {
    if (!receiptRef.current) return;
    setSharingImage(true);
    try {
        const canvas = await html2canvas(receiptRef.current);
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `receipt_${transaction.amount}.png`;
        link.click();
    } catch (e) {
        console.error(e);
    } finally {
        setSharingImage(false);
    }
  };

  const handleShareAsPDF = async () => {
    if (!receiptRef.current) return;
    setSharingPdf(true);
    try {
        const canvas = await html2canvas(receiptRef.current);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`receipt_${transaction.amount}.pdf`);
    } catch (e) {
        console.error(e);
    } finally {
        setSharingPdf(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-blue-100 to-white px-2 py-6 overflow-y-auto">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onClose} className="text-gray-900"><ChevronLeft /></button>
        <h2 className="text-lg font-semibold text-gray-900">Share Receipt</h2>
      </div>

      <div ref={receiptRef} className="relative bg-white shadow-xl rounded-t-lg rounded-b-lg border-x-4 border-b-4 border-dashed border-gray-200 p-6 space-y-4">
        {/* Decorative torn edges */}
        <div className="absolute -top-3 left-0 w-full h-4 flex justify-between">
            {[...Array(12)].map((_, i) => <div key={i} className="w-5 h-4 bg-gradient-to-b from-blue-100 to-white rounded-full"></div>)}
        </div>
        <div className="absolute -bottom-3 left-0 w-full h-4 flex justify-between">
            {[...Array(12)].map((_, i) => <div key={i} className="w-5 h-4 bg-white rounded-full"></div>)}
        </div>

        {/* Branding header */}
        <div className='flex justify-between items-center mb-6'>
            <span className="text-2xl font-extrabold text-blue-600 tracking-tighter">TENN</span>
            <p className='text-xs font-semibold text-gray-400'>Transaction Receipt</p>
        </div>
        
        {/* Amount */}
        <div className="text-center mb-6">
            <p className="text-xs italic text-gray-400 mb-1">Final Amount Paid</p>
            <p className="text-4xl font-bold text-blue-600">₦{Math.abs(Number(transaction.amount)).toLocaleString()}</p>
        </div>
        
        <div className='border-t border-dashed border-gray-300 pt-6 space-y-4'>
            {isTransfer ? (
                <>
                    <div className='flex justify-between items-start'>
                        <p className="text-sm text-gray-500">Sender</p>
                        <div className='text-right'>
                            <p className="font-semibold text-gray-900">{transaction.senderName}</p>
                            <p className="text-xs text-gray-400">TENN | {transaction.senderAccountNumber}</p>
                        </div>
                    </div>
                    <div className='flex justify-between items-start'>
                        <p className="text-sm text-gray-500">Beneficiary</p>
                        <div className='text-right'>
                            <p className="font-semibold text-gray-900">{transaction.accountName}</p>
                            <p className="text-xs text-gray-400">{transaction.bank} | {transaction.accountNumber}</p>
                        </div>
                    </div>
                </>
            ) : (
                <div className='flex justify-between items-start'>
                    <p className="text-sm text-gray-500">Details</p>
                    <p className="font-semibold text-gray-900">{transaction.recipient || transaction.details || 'N/A'}</p>
                </div>
            )}
            <div className='border-t border-dashed border-gray-300 pt-4 flex justify-between'><p className="text-sm text-gray-500">Paid on</p><p className="text-sm text-gray-900">{transaction.timestamp ? new Date(transaction.timestamp.toDate()).toLocaleString() : 'N/A'}</p></div>
             <div className='flex justify-between'><p className="text-sm text-gray-500">Fees</p><p className="text-sm text-gray-900">₦10.00</p></div>
             <div className='flex justify-between'><p className="text-sm text-gray-500">Description</p><p className="text-sm text-gray-900">Transfer out</p></div>
             <div className='flex justify-between'><p className="text-sm text-gray-500">Transaction Reference</p><p className="text-sm text-gray-900 text-right">712022123456789012345678901234</p>
            </div>
             <div className='flex justify-between'><p className="text-sm text-gray-500">Session ID</p><p className="text-sm text-gray-900 text-right">09071612345678901234567890123456789</p></div>
             <div className='flex justify-between'><p className="text-sm text-gray-500">Remark</p><p className="text-sm text-gray-900">—</p></div>
        </div>
      </div>

      <div className='space-y-3 mt-8'>
        <button onClick={handleShareAsImage} disabled={sharingImage || sharingPdf} className="w-full p-4 rounded-xl bg-blue-100 text-gray-800 font-semibold italic flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75">
          {sharingImage ? (
            <>
              <span className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
              Generating Image...
            </>
          ) : 'Share as Image'}
        </button>
        <button onClick={handleShareAsPDF} disabled={sharingImage || sharingPdf} className="w-full p-4 rounded-xl bg-blue-100 text-gray-800 font-semibold italic flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75">
          {sharingPdf ? (
            <>
              <span className="w-5 h-5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin"></span>
              Generating PDF...
            </>
          ) : 'Share as PDF'}
        </button>
      </div>
    </div>
  );
}
