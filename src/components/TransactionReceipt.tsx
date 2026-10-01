import React, { useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Copy, Headphones, CheckCircle2, Share2, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import NetworkLogo, { detectTelecomNetwork } from './NetworkLogo';

interface TransactionReceiptProps {
  transaction: any;
  onClose: () => void;
  onSupportClick?: () => void;
  onWealthClick?: () => void;
}

export default function TransactionReceipt({
  transaction,
  onClose,
  onSupportClick,
  onWealthClick,
}: TransactionReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  const isCredit = transaction.type === 'credit' || transaction.type === 'interest' || transaction.type === 'airtime' ? false : transaction.type === 'credit';
  const isIncoming = transaction.type === 'credit' || (typeof transaction.formattedAmount === 'string' && transaction.formattedAmount.startsWith('+')) || transaction.senderName;

  // Determine sender and bank
  const senderName =
    transaction.senderName ||
    (transaction.title?.includes('from ') ? transaction.title.split('from ')[1] : (isIncoming ? 'PalmPay Cashback' : 'PalmPay User'));
  const bankName = transaction.senderBank || transaction.bankName || (transaction.title?.includes('POS') ? 'Commercial Bank' : 'PalmPay');

  // Format amount
  const rawNum = typeof transaction.amount === 'number'
    ? Math.abs(transaction.amount)
    : parseFloat(transaction.amount?.toString().replace(/[^0-9.]/g, '')) || 0;
  const formattedNum = rawNum.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  // Account masking
  const maskedAccount = transaction.accountNumber
    ? `${transaction.accountNumber.slice(0, 3)}***${transaction.accountNumber.slice(-4)}`
    : '***';

  // Completion time
  const completionTime = transaction.date || 'Just now';

  // Deterministic or stored IDs
  const txId = transaction.reference || transaction.txId || transaction.id || `TX-${Date.now()}`;
  const sessionId = transaction.sessionId || transaction.reference || `SES-${Date.now()}`;

  // Narration / Remark
  const remarkText = transaction.narration || transaction.description || transaction.remark || (isIncoming ? `Deposit from ${senderName}` : `Transfer to ${transaction.recipient || 'Recipient'}`);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleShareAsImage = async () => {
    if (!receiptRef.current) return;
    setSharingImage(true);
    try {
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#f4f5fa', scale: 2 });
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `palmpay_transaction_${rawNum}.png`;
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
      const canvas = await html2canvas(receiptRef.current, { backgroundColor: '#f4f5fa', scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`palmpay_transaction_${rawNum}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setSharingPdf(false);
    }
  };

  // Helper to render authentic bank logos or telecom network logos
  const renderBankLogo = (bank: string) => {
    // 0. Check Telecom Network (Airtime / Data)
    const telecomNet = detectTelecomNetwork(transaction);
    if (telecomNet || transaction.type === 'airtime' || transaction.type === 'data') {
      return <NetworkLogo network={telecomNet || 'mtn'} size="lg" />;
    }

    const b = (bank || '').toLowerCase();

    // 0b. Electricity Providers
    if (b.includes('aedc') || b.includes('ikedc') || b.includes('ekedc') || b.includes('ibedc') || transaction.type === 'electricity') {
      return (
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center shadow-md border border-gray-200 text-[#059669]">
          <span className="text-[10px] font-black uppercase tracking-tight">AEDC</span>
          <span className="text-[7px] text-gray-500 font-semibold leading-none">Power</span>
        </div>
      );
    }

    // 0c. Betting
    if (b.includes('bet') || b.includes('sporty') || b.includes('1xbet')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#1b5e20] flex items-center justify-center shadow-md border-2 border-white text-white font-extrabold text-xs">
          BET
        </div>
      );
    }

    // 1. PalmPay Logo
    if (b.includes('palm') || b.includes('palmpay')) {
      return (
        <div className="w-13 h-13 rounded-full overflow-hidden shadow-md border-2 border-white bg-transparent">
          <img
            src="/palmpay_official_icon.svg"
            alt="PalmPay"
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    // 2. Moniepoint Logo (exact match to screenshot)
    if (b.includes('monie') || b.includes('point')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#0052ff] flex flex-col items-center justify-center shadow-md border-2 border-white text-white">
          <span className="text-xl font-black leading-none font-sans">M</span>
          <span className="text-[7px] font-bold tracking-tighter leading-none mt-0.5">Moniepoint</span>
        </div>
      );
    }

    // 3. Access Bank
    if (b.includes('access')) {
      return (
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center shadow-md border border-gray-200">
          <div className="flex gap-0.5 items-center">
            <span className="w-2.5 h-2.5 bg-[#002f6c] rotate-45 rounded-xs" />
            <span className="w-2.5 h-2.5 bg-[#ff6a00] rotate-45 rounded-xs" />
          </div>
          <span className="text-[7px] font-extrabold text-[#002f6c] tracking-tight mt-0.5">access</span>
        </div>
      );
    }

    // 4. GTBank
    if (b.includes('gt') || b.includes('guaranty')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#e35205] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          GTBank
        </div>
      );
    }

    // 5. Zenith Bank
    if (b.includes('zenith')) {
      return (
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center shadow-md border border-gray-200">
          <span className="text-lg font-black text-[#d32f2f] leading-none">Z</span>
          <span className="text-[7px] font-bold text-[#d32f2f]">ZENITH</span>
        </div>
      );
    }

    // 6. Kuda Bank
    if (b.includes('kuda')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#40196d] flex items-center justify-center shadow-md border-2 border-white text-white font-extrabold text-sm">
          Kuda.
        </div>
      );
    }

    // 7. OPay
    if (b.includes('opay')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#00b875] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          OPay
        </div>
      );
    }

    // 8. UBA
    if (b.includes('uba') || b.includes('united bank')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#d32f2f] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          UBA
        </div>
      );
    }

    // Default Bank Logo
    return (
      <div className="w-13 h-13 rounded-full bg-[#6c1cf5] flex items-center justify-center shadow-md border-2 border-white text-white">
        <span className="text-xs font-black uppercase tracking-wider">{bank.slice(0, 3)}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f5fa] text-[#181a20] overflow-y-auto no-scrollbar flex flex-col">
      {/* 1. Header Bar matching screenshot */}
      <div className="px-4 py-3.5 flex items-center sticky top-0 z-30 bg-[#f4f5fa]/95 backdrop-blur-md">
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#181a20] hover:bg-black/5 active:scale-95 transition-all mr-3"
          aria-label="Back"
        >
          <ArrowLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 className="text-lg font-bold text-[#181a20] tracking-normal">
          Transaction Details
        </h1>
      </div>

      {copiedField && (
        <div className="fixed top-14 inset-x-0 mx-auto w-fit z-50 bg-black/80 text-white text-xs font-medium py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{copiedField} copied to clipboard</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-8 max-w-md mx-auto w-full space-y-3.5" ref={receiptRef}>
        {/* CARD 1: Top Hero Card (Bank Logo, Received from, Amount, Successful) */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80 flex flex-col items-center text-center relative pt-7 mt-2">
          {/* Circular Bank Logo overlapping top */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            {renderBankLogo(bankName)}
          </div>

          {/* Received from [name] */}
          <p className="text-sm font-medium text-[#2d3142] mt-3">
            {transaction.title || (isIncoming ? `Received from ${senderName}` : `Sent to ${senderName}`)}
          </p>

          {/* Amount */}
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] my-2 tracking-tight font-sans">
            {isIncoming ? '+' : '-'}₦{formattedNum}
          </h2>

          {/* Status Badge: Green Check + Successful */}
          <div className="flex items-center gap-1.5 text-emerald-500 font-semibold text-sm mt-0.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <Check size={11} strokeWidth={3.5} />
            </div>
            <span>Successful</span>
          </div>
        </div>

        {/* CARD 2: Metadata Details Table */}
        <div className="bg-white rounded-3xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80 divide-y divide-gray-100 text-xs">
          {/* Sender */}
          <div className="py-3 flex justify-between items-start first:pt-1">
            <span className="text-[#8c92a4] font-normal">Sender</span>
            <div className="text-right max-w-[65%]">
              <p className="text-[#181b28] font-medium leading-tight">
                {senderName}
              </p>
              <p className="text-[11px] text-[#8c92a4] mt-0.5">
                {bankName}|{maskedAccount}
              </p>
            </div>
          </div>

          {/* Remark */}
          <div className="py-3 flex justify-between items-start">
            <span className="text-[#8c92a4] font-normal shrink-0 pr-4">Remark</span>
            <p className="text-right text-[#181b28] font-normal break-all max-w-[70%] leading-relaxed text-[11px]">
              {remarkText}
            </p>
          </div>

          {/* Transaction Type */}
          <div className="py-3 flex justify-between items-center">
            <span className="text-[#8c92a4] font-normal">Transaction Type</span>
            <span className="text-[#181b28] font-medium">
              {transaction.type === 'credit' ? 'Bank Deposit' : (transaction.category === 'airtime' ? 'Airtime Top-up' : 'PalmPay Transfer')}
            </span>
          </div>

          {/* Credited To */}
          <div className="py-3 flex justify-between items-center">
            <span className="text-[#8c92a4] font-normal">Credited To</span>
            <button
              onClick={onClose}
              className="flex items-center gap-0.5 text-[#181b28] font-medium hover:text-[#6c1cf5] transition-colors"
            >
              <span>Balance</span>
              <ChevronRight size={14} className="text-[#8c92a4]" />
            </button>
          </div>

          {/* Completion Time */}
          <div className="py-3 flex justify-between items-center">
            <span className="text-[#8c92a4] font-normal">Completion Time</span>
            <span className="text-[#181b28] font-normal">{completionTime}</span>
          </div>

          {/* Transaction ID with Copy */}
          <div className="py-3 flex justify-between items-center">
            <span className="text-[#8c92a4] font-normal">Transaction ID</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[#181b28] font-mono text-[11px]">{txId}</span>
              <button
                onClick={() => copyToClipboard(txId, 'Transaction ID')}
                className="text-[#8c92a4] hover:text-[#181b28] p-0.5 active:scale-90 transition-transform"
                title="Copy Transaction ID"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>

          {/* Session ID with Copy */}
          <div className="py-3 flex justify-between items-center last:pb-1">
            <span className="text-[#8c92a4] font-normal shrink-0 pr-2">Session ID</span>
            <div className="flex items-center gap-1.5 max-w-[70%]">
              <span className="text-[#181b28] font-mono text-[10px] truncate">{sessionId}</span>
              <button
                onClick={() => copyToClipboard(sessionId, 'Session ID')}
                className="text-[#8c92a4] hover:text-[#181b28] p-0.5 active:scale-90 transition-transform shrink-0"
                title="Copy Session ID"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: "Make This Deposit Grow" Card */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#ede7f6] flex items-center justify-center text-[#6c1cf5] shrink-0">
              {/* Lightbulb / Wealth icon */}
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#181b28]">
                Make This Deposit Grow
              </h4>
              <p className="text-[11px] text-[#8c92a4] mt-0.5">
                Earn up to 20% p.a., paid daily, wit..
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (onWealthClick) {
                onClose();
                onWealthClick();
              } else {
                alert("Redirecting to Prime Wealth Savings portal!");
              }
            }}
            className="py-1.5 px-5 rounded-full bg-[#6c1cf5] hover:bg-[#5b15d4] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
          >
            Go
          </button>
        </div>

        {/* CARD 4: "Any Questions about this transaction?" Card */}
        <div className="bg-white rounded-3xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80 space-y-2.5">
          <p className="text-xs text-[#8c92a4] font-normal">
            Any Questions about this transaction?
          </p>

          <button
            onClick={() => {
              if (onSupportClick) {
                onClose();
                onSupportClick();
              } else {
                alert("Connecting to PalmPay 24/7 Customer Service...");
              }
            }}
            className="flex items-center gap-2 text-sm font-semibold text-[#6c1cf5] hover:text-[#5b15d4] transition-colors py-1 active:scale-95"
          >
            <Headphones size={17} strokeWidth={2.2} />
            <span>Customer Service</span>
          </button>
        </div>

        {/* Share & Download Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handleShareAsImage}
            disabled={sharingImage}
            className="py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-[#181b28] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Share2 size={15} />
            <span>{sharingImage ? 'Saving...' : 'Share Receipt'}</span>
          </button>

          <button
            onClick={handleShareAsPDF}
            disabled={sharingPdf}
            className="py-3 px-4 rounded-2xl bg-[#6c1cf5] hover:bg-[#5b15d4] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
          >
            <Download size={15} />
            <span>{sharingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
