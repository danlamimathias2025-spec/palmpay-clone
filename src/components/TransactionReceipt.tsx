import React, { useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Copy, Headphones, CheckCircle2, Share2, Download, ReceiptText, Smartphone, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import NetworkLogo, { detectTelecomNetwork } from './NetworkLogo';
import { ensureReceiptDetails } from '../utils/transactionFormat';

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
  const slipRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'app' | 'slip'>('app');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);

  // Compute authentic PalmPay receipt details
  const details = ensureReceiptDetails(transaction);

  // Amount formatting
  const rawNum =
    typeof transaction.amount === 'number'
      ? Math.abs(transaction.amount)
      : parseFloat(transaction.amount?.toString().replace(/[^0-9.]/g, '')) || 0;
  const formattedNum = rawNum.toLocaleString('en-NG', { minimumFractionDigits: 2 });

  const isIncoming = details.isIncoming;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyToClipboard = (text: string, field: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.warn('Clipboard write error:', e);
    }
  };

  const handleShareAsImage = async () => {
    const target = activeTab === 'slip' ? slipRef.current : receiptRef.current;
    if (!target) return;
    setSharingImage(true);
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: activeTab === 'slip' ? '#ffffff' : '#f4f5fa',
        scale: 2,
        useCORS: true,
      });
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = `palmpay_receipt_${details.txId}.png`;
      link.click();
      showToast('Receipt image downloaded!');
    } catch (e) {
      console.error(e);
      showToast('Export failed. Please retry.');
    } finally {
      setSharingImage(false);
    }
  };

  const handleShareAsPDF = async () => {
    const target = activeTab === 'slip' ? slipRef.current : receiptRef.current;
    if (!target) return;
    setSharingPdf(true);
    try {
      const canvas = await html2canvas(target, {
        backgroundColor: activeTab === 'slip' ? '#ffffff' : '#f4f5fa',
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`palmpay_receipt_${details.txId}.pdf`);
      showToast('Receipt PDF exported!');
    } catch (e) {
      console.error(e);
      showToast('Export failed. Please retry.');
    } finally {
      setSharingPdf(false);
    }
  };

  // Helper to render authentic bank logos or telecom network logos
  const renderBankLogo = (bank: string) => {
    const telecomNet = detectTelecomNetwork(transaction);
    if (telecomNet || transaction.type === 'airtime' || transaction.type === 'data') {
      return <NetworkLogo network={telecomNet || 'mtn'} size="lg" />;
    }

    const b = (bank || '').toLowerCase();

    // Electricity
    if (b.includes('aedc') || b.includes('ikedc') || b.includes('ekedc') || b.includes('ibedc') || transaction.type === 'electricity') {
      return (
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center shadow-md border border-gray-200 text-[#059669]">
          <span className="text-[10px] font-black uppercase tracking-tight">AEDC</span>
          <span className="text-[7px] text-gray-500 font-semibold leading-none">Power</span>
        </div>
      );
    }

    // Betting
    if (b.includes('bet') || b.includes('sporty') || b.includes('1xbet')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#1b5e20] flex items-center justify-center shadow-md border-2 border-white text-white font-extrabold text-xs">
          BET
        </div>
      );
    }

    // Moniepoint
    if (b.includes('monie') || b.includes('point')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#0052ff] flex flex-col items-center justify-center shadow-md border-2 border-white text-white">
          <span className="text-xl font-black leading-none font-sans">M</span>
          <span className="text-[7px] font-bold tracking-tighter leading-none mt-0.5">Moniepoint</span>
        </div>
      );
    }

    // Access Bank
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

    // GTBank
    if (b.includes('gt') || b.includes('guaranty')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#e35205] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          GTBank
        </div>
      );
    }

    // Zenith Bank
    if (b.includes('zenith')) {
      return (
        <div className="w-13 h-13 rounded-full bg-white flex flex-col items-center justify-center shadow-md border border-gray-200">
          <span className="text-lg font-black text-[#d32f2f] leading-none">Z</span>
          <span className="text-[7px] font-bold text-[#d32f2f]">ZENITH</span>
        </div>
      );
    }

    // Kuda Bank
    if (b.includes('kuda')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#40196d] flex items-center justify-center shadow-md border-2 border-white text-white font-extrabold text-sm">
          Kuda.
        </div>
      );
    }

    // OPay
    if (b.includes('opay')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#00b875] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          OPay
        </div>
      );
    }

    // UBA
    if (b.includes('uba') || b.includes('united bank')) {
      return (
        <div className="w-13 h-13 rounded-full bg-[#d32f2f] flex items-center justify-center shadow-md border-2 border-white text-white font-black text-xs">
          UBA
        </div>
      );
    }

    // PalmPay Logo (default)
    return (
      <div className="w-13 h-13 rounded-full overflow-hidden shadow-md border-2 border-white bg-transparent">
        <img
          src="/palmpay_official_icon.svg"
          alt="PalmPay"
          className="w-full h-full object-contain"
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f5fa] text-[#181a20] overflow-y-auto no-scrollbar flex flex-col">
      {/* 1. Header Bar matching authentic PalmPay interface */}
      <div className="px-4 py-3 flex items-center justify-between sticky top-0 z-30 bg-[#f4f5fa]/95 backdrop-blur-md border-b border-gray-200/50">
        <div className="flex items-center">
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#181a20] hover:bg-black/5 active:scale-95 transition-all mr-2"
            aria-label="Back"
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
          </button>
          <h1 className="text-base font-bold text-[#181a20] tracking-normal font-sans">
            Transaction Details
          </h1>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center bg-gray-200/70 p-0.5 rounded-full text-xs font-semibold">
          <button
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
              activeTab === 'app'
                ? 'bg-white text-[#6c1cf5] shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <Smartphone size={12} />
            <span>App View</span>
          </button>
          <button
            onClick={() => setActiveTab('slip')}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
              activeTab === 'slip'
                ? 'bg-white text-[#6c1cf5] shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            <ReceiptText size={12} />
            <span>Official Slip</span>
          </button>
        </div>
      </div>

      {copiedField && (
        <div className="fixed top-14 inset-x-0 mx-auto w-fit z-50 bg-black/85 text-white text-xs font-medium py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>{copiedField} copied to clipboard</span>
        </div>
      )}

      {toastMessage && (
        <div className="fixed top-14 inset-x-0 mx-auto w-fit z-50 bg-[#6c1cf5] text-white text-xs font-medium py-1.5 px-4 rounded-full shadow-lg flex items-center gap-1.5 animate-fade-in">
          <CheckCircle2 size={14} className="text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 px-4 pb-8 max-w-md mx-auto w-full space-y-3.5 pt-2">
        {activeTab === 'app' ? (
          /* ========================================================
             VIEW 1: AUTHENTIC PALMPAY IN-APP TRANSACTION DETAILS
             ======================================================== */
          <div ref={receiptRef} className="space-y-3.5">
            {/* CARD 1: Top Hero Card (Bank Logo, Received from / Sent to, Amount, Successful badge) */}
            <div className="bg-white rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100/80 flex flex-col items-center text-center relative pt-7 mt-3">
              {/* Circular Bank Logo overlapping top */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                {renderBankLogo(isIncoming ? details.senderBank : details.recipientBank)}
              </div>

              {/* Received from [name] / Sent to [name] */}
              <p className="text-sm font-medium text-[#2d3142] mt-3">
                {isIncoming
                  ? `Received from ${details.senderName}`
                  : `Sent to ${details.recipientName}`}
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
              {/* Sender Info Row */}
              <div className="py-3 flex justify-between items-start first:pt-1">
                <span className="text-[#8c92a4] font-normal">Sender</span>
                <div className="text-right max-w-[68%]">
                  <p className="text-[#181b28] font-medium leading-tight select-all">
                    {details.senderName}
                  </p>
                  <p className="text-[11px] text-[#8c92a4] mt-0.5">
                    {details.senderBank}|{details.maskedSenderAccount}
                  </p>
                </div>
              </div>

              {/* Recipient Info Row */}
              <div className="py-3 flex justify-between items-start">
                <span className="text-[#8c92a4] font-normal">Recipient</span>
                <div className="text-right max-w-[68%]">
                  <p className="text-[#181b28] font-medium leading-tight select-all">
                    {details.recipientName}
                  </p>
                  <p className="text-[11px] text-[#8c92a4] mt-0.5">
                    {details.recipientBank}|{details.maskedRecipientAccount}
                  </p>
                </div>
              </div>

              {/* Remark */}
              <div className="py-3 flex justify-between items-start">
                <span className="text-[#8c92a4] font-normal shrink-0 pr-3">Remark</span>
                <p className="text-right text-[#181b28] font-normal break-words max-w-[75%] leading-relaxed text-[11px] select-all">
                  {details.remark}
                </p>
              </div>

              {/* Transaction Type */}
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#8c92a4] font-normal">Transaction Type</span>
                <span className="text-[#181b28] font-medium">
                  {transaction.type === 'credit' || isIncoming
                    ? 'Bank Deposit'
                    : transaction.category === 'airtime' || transaction.type === 'airtime'
                    ? 'Airtime Top-up'
                    : transaction.category === 'data' || transaction.type === 'data'
                    ? 'Data Bundle'
                    : transaction.category === 'electricity' || transaction.type === 'electricity'
                    ? 'Electricity Bill'
                    : transaction.category === 'betting' || transaction.type === 'betting'
                    ? 'Betting & Gaming'
                    : 'PalmPay Transfer'}
                </span>
              </div>

              {/* Credited To / Payment Method */}
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#8c92a4] font-normal">
                  {isIncoming ? 'Credited To' : 'Payment Method'}
                </span>
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
                <span className="text-[#181b28] font-normal select-all">
                  {details.completionTime}
                </span>
              </div>

              {/* Transaction ID with Copy */}
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#8c92a4] font-normal shrink-0 pr-3">Transaction ID</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-[#181b28] font-mono text-[11px] font-medium tracking-tight select-all">
                    {details.txId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(details.txId, 'Transaction ID')}
                    className="text-[#8c92a4] hover:text-[#181b28] p-0.5 active:scale-90 transition-transform shrink-0"
                    title="Copy Transaction ID"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>

              {/* Session ID with Copy */}
              <div className="py-3 flex justify-between items-start last:pb-1">
                <span className="text-[#8c92a4] font-normal shrink-0 pr-3">Session ID</span>
                <div className="flex items-center gap-1.5 max-w-[75%] justify-end">
                  <span className="text-[#181b28] font-mono text-[10.5px] leading-tight select-all text-right break-all">
                    {details.sessionId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(details.sessionId, 'Session ID')}
                    className="text-[#8c92a4] hover:text-[#181b28] p-0.5 active:scale-90 transition-transform shrink-0 mt-0.5"
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
                    showToast("Prime Wealth Savings: 20% annual yield active");
                  }
                }}
                className="py-1.5 px-5 rounded-full bg-[#6c1cf5] hover:bg-[#5b15d4] text-white font-bold text-xs shadow-md active:scale-95 transition-all"
              >
                Go
              </button>
            </div>

            {/* CARD 4: "Any Questions about this transaction?" Support Card */}
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
                    showToast("Connecting to PalmPay 24/7 Customer Service...");
                  }
                }}
                className="flex items-center gap-2 text-sm font-semibold text-[#6c1cf5] hover:text-[#5b15d4] transition-colors py-1 active:scale-95"
              >
                <Headphones size={17} strokeWidth={2.2} />
                <span>Customer Service</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             VIEW 2: OFFICIAL PALMPAY TRANSACTION RECEIPT SLIP
             ======================================================== */
          <div
            ref={slipRef}
            className="bg-white rounded-3xl p-6 shadow-md border border-gray-200 relative overflow-hidden"
          >
            {/* Top PalmPay Brand Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <img
                  src="/palmpay_official_icon.svg"
                  alt="PalmPay"
                  className="w-8 h-8 object-contain"
                />
                <div>
                  <h3 className="text-base font-extrabold text-[#6c1cf5] tracking-tight">PalmPay</h3>
                  <p className="text-[9px] text-gray-400 font-medium">Licensed by CBN | Insured by NDIC</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Transaction Receipt
                </span>
              </div>
            </div>

            {/* Transfer Successful Banner & Big Amount */}
            <div className="text-center py-3 border-b border-gray-100 mb-4">
              <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <CheckCircle2 size={15} />
                <span>Transaction Successful</span>
              </div>
              <h2 className="text-3xl font-black text-gray-900 font-sans tracking-tight">
                ₦{formattedNum}
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {isIncoming ? 'Bank Inward Credit' : 'Fund Transfer'}
              </p>
            </div>

            {/* Receipt Key-Value Rows */}
            <div className="space-y-2.5 text-xs text-gray-700 divide-y divide-gray-50">
              <div className="flex justify-between items-start pt-1">
                <span className="text-gray-400 font-normal">Recipient Name</span>
                <span className="font-semibold text-right text-gray-900 select-all">{details.recipientName}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Recipient Bank</span>
                <span className="font-semibold text-right text-gray-900">{details.recipientBank}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Recipient Account</span>
                <span className="font-mono font-medium text-right text-gray-900">{details.maskedRecipientAccount}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Sender Name</span>
                <span className="font-semibold text-right text-gray-900 select-all">{details.senderName}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Sender Bank</span>
                <span className="font-semibold text-right text-gray-900">{details.senderBank}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Remark</span>
                <span className="text-right text-gray-900 max-w-[65%] text-[11px] select-all leading-tight font-sans">
                  {details.remark}
                </span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal">Transaction Date</span>
                <span className="text-right font-medium text-gray-900">{details.completionTime}</span>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-400 font-normal">Transaction ID</span>
                <span className="font-mono text-[11px] font-semibold text-gray-900 select-all">{details.txId}</span>
              </div>

              <div className="flex justify-between items-start pt-2">
                <span className="text-gray-400 font-normal shrink-0">Session ID</span>
                <span className="font-mono text-[10px] text-right text-gray-900 select-all break-all max-w-[70%]">
                  {details.sessionId}
                </span>
              </div>
            </div>

            {/* Official Footer */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-[#6c1cf5]" />
                <span>Verified PalmPay Instant Settlement</span>
              </div>
              <span className="font-mono">www.palmpay.com</span>
            </div>
          </div>
        )}

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
