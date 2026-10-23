import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Headphones, 
  Send, 
  MessageCircle, 
  Sparkles, 
  Bot, 
  User, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Wallet,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { WebsiteMasterSettings, CustomerRecord } from '../types';

interface SupportModalProps {
  onClose: () => void;
  settings?: WebsiteMasterSettings;
  customer?: CustomerRecord | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  source?: 'gemini-3.8-flash' | 'knowledge-engine';
}

const QUICK_PROMPTS = [
  'How do I fund my wallet?',
  'Why hasn’t my OTP arrived?',
  'How do I buy USA numbers?',
  'What is Special Marketplace 2?',
  'What is your refund policy?',
  'Check my wallet balance',
  'Connect with human WhatsApp agent',
];

export const SupportModal: React.FC<SupportModalProps> = ({ onClose, settings, customer }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Welcome to Steve Logs Marketplace! 👋 How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const whatsappPhone = settings?.whatsappSupportNumber?.replace(/\D/g, '') || '2348149021844';
  const whatsappMsg = encodeURIComponent(
    settings?.whatsappWelcomeMessage || 'Hello Steve Logs Support, I need assistance.'
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMsg}`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isAiTyping) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputText('');
    setIsAiTyping(true);

    try {
      const token = localStorage.getItem('stevelogs_customer_token');
      const res = await fetch('/api/support/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}`, 'x-customer-token': token } : {}),
          ...(customer?.id ? { 'x-customer-id': customer.id } : {}),
        },
        body: JSON.stringify({
          message: text,
          customerId: customer?.id,
          conversationHistory: messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text })),
        }),
      });

      if (!res.ok) throw new Error('AI assistant response error');
      const data = await res.json();

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'I am here to help. Could you please specify your question?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: 'All virtual numbers have a 100% automatic refund guarantee: if your SMS code is not delivered within the countdown window, your payment is refunded immediately back to your wallet. You can also chat directly with our official 24/7 WhatsApp Live Desk.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'Welcome to Steve Logs Marketplace! 👋 How can I help you today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Helper to render bold and lists nicely
  const renderFormattedText = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-extrabold text-sm text-slate-900 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const itemText = line.replace(/^[•-]\s*/, '');
        return (
          <div key={idx} className="flex items-start gap-1.5 my-1 text-xs">
            <span className="text-blue-600 font-bold shrink-0 leading-relaxed">•</span>
            <span className="leading-relaxed">{parseInline(itemText)}</span>
          </div>
        );
      }
      if (/^\d+\.\s*/.test(line)) {
        return (
          <div key={idx} className="my-1 text-xs leading-relaxed">
            {parseInline(line)}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs leading-relaxed my-0.5">
          {parseInline(line)}
        </p>
      );
    });
  };

  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[11px] font-bold">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex justify-center items-center p-3 sm:p-5">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[720px] border border-slate-200 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Support Header - Branded Deep Blue & Yellow */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#0a192f] via-[#1e3a8a] to-[#0a192f] text-white flex items-center justify-between border-b border-blue-900/60 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 font-black flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-slate-950 stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0a192f] animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  STEVELOGS AI Support
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold">
                  24/7 Smart Desk
                </span>
              </div>
              <p className="text-[11px] text-blue-200">
                Connected to live catalog, wallet balances & instant refund policies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Clear & Restart Chat"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Customer Info Bar */}
        {customer && (
          <div className="px-4 py-2 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-xs text-slate-700">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="font-semibold text-slate-900 truncate">{customer.name}</span>
              <span className="text-[11px] text-slate-500 truncate">({customer.email})</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-slate-900 shrink-0">
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-bold">₦{customer.walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/60 scrollbar-thin scrollbar-thumb-slate-200">
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-start ${isAi ? 'justify-start' : 'justify-end'}`}
              >
                {isAi && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-xs ${
                  isAi 
                    ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-sm' 
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-tr-sm shadow-blue-500/10'
                }`}>
                  {isAi ? renderFormattedText(msg.text) : msg.text}

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/60 text-[10px]">
                    <span className={isAi ? 'text-slate-400' : 'text-blue-100'}>
                      {msg.timestamp}
                    </span>

                    {isAi && (
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer ml-3"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {!isAi && (
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 text-xs font-bold font-sans">
                    {customer?.name ? customer.name.slice(0, 2).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Typing Indicator */}
          {isAiTyping && (
            <div className="flex gap-2.5 items-center">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 shadow-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-slate-500 font-medium ml-1.5">Consulting live database...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-white border-t border-slate-200/80 overflow-x-auto scrollbar-none flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Quick:
          </span>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              disabled={isAiTyping}
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 text-[11px] font-semibold border border-slate-200/80 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar & Human WhatsApp Link */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about numbers, funding, orders, or logs (English or Pidgin)..."
              disabled={isAiTyping}
              className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-300 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all bg-slate-50/50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isAiTyping}
              className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Direct WhatsApp Human Fallback Link */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 hidden sm:inline">
              Need immediate human review?
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-bold ml-auto"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>Chat with Human Agent on WhatsApp ({settings?.whatsappSupportNumber || '+2348149021844'})</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
