import React, { useState } from 'react';
import { X, Headphones, Send, MessageSquare, Phone, HelpCircle } from 'lucide-react';

interface CustomerSupportModalProps {
  onClose: () => void;
  userProfile?: {
    fullName?: string;
    userName?: string;
  };
}

export default function CustomerSupportModal({ onClose, userProfile }: CustomerSupportModalProps) {
  const displayName = userProfile?.userName || userProfile?.fullName?.split(' ')[0] || 'Valued Customer';
  const [messages, setMessages] = useState([
    { sender: 'bot', text: `Hello ${displayName}! Welcome to PalmPay 24/7 Live Care. How can we help you today?` },
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `Thank you for contacting PalmPay Support regarding "${userMsg}". A dedicated customer care representative is reviewing your account. Transfers and funding are currently operating at 100% success rate.`,
        },
      ]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="mirror-glass-modal rounded-3xl p-5 w-full max-w-sm h-[520px] flex flex-col relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full mirror-glass flex items-center justify-center text-white/70 hover:text-white"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-[#c084fc] flex items-center justify-center">
            <Headphones size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-script">PalmPay Live Support</h3>
            <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Agent Online
            </p>
          </div>
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-[#7846f7] text-white rounded-br-none shadow-md'
                    : 'mirror-glass border border-white/10 text-white/90 rounded-bl-none'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="pt-2 border-t border-white/10 flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2.5 rounded-xl mirror-glass border border-white/10 text-xs text-white focus:outline-none focus:border-purple-400 placeholder-white/40"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl bg-[#7846f7] hover:bg-[#6836ea] text-white active:scale-95 transition-all"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
