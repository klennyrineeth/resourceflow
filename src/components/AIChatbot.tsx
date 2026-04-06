import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import { GeminiService } from '../lib/gemini';

interface AIChatbotProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function AIChatbot({ forceOpen = false, onClose: parentClose }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(forceOpen);
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Greetings. I am Stratos, your ResourceFlow AI assistant. How can I assist with your relief operations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);

    const history = messages.filter(m => m.role === 'user' || m.text !== 'Greetings. I am Stratos, your ResourceFlow AI assistant. How can I assist with your relief operations today?').map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await GeminiService.chatWithAssistant(userMessage, history as any);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: String(response) }]);
  };

  const handleToggle = () => {
    if (forceOpen && parentClose) {
      parentClose();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={forceOpen ? "" : "fixed bottom-6 right-6 z-[9999]"}>
      {/* Floating Toggle Button (Hidden if forceOpen) */}
      {!forceOpen && (
        <button
          onClick={handleToggle}
          className={`group relative p-4 rounded-2xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 ${
            isOpen ? 'bg-red-500 rotate-90 text-white' : 'bg-blue-600 text-white'
          }`}
        >
           {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`
          w-full sm:w-[400px] h-[100dvh] sm:h-[600px] bg-white sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300 z-[10001]
          ${forceOpen ? 'fixed sm:absolute inset-0 sm:inset-auto sm:bottom-0 sm:right-0' : 'fixed sm:absolute inset-0 sm:inset-auto sm:bottom-20 sm:right-0'}
          border-0 sm:border sm:border-gray-100
        `}>
          {/* Header */}
          <div className="bg-blue-600 p-5 sm:p-6 flex items-center justify-between text-white flex-shrink-0 shadow-lg relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl tracking-tight leading-tight">Stratos AI</h3>
                <div className="flex items-center gap-2 opacity-90">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-blue-50">Operational</span>
                </div>
              </div>
            </div>
            {(forceOpen || !forceOpen) && (
              <button onClick={handleToggle} className="p-2.5 sm:p-3 hover:bg-white/20 rounded-2xl transition-all active:scale-90">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`flex gap-3 max-w-[90%] sm:max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      m.role === 'user' ? 'bg-white font-bold text-blue-600' : 'bg-blue-600 text-white'
                    }`}>
                       {m.role === 'user' ? 'U' : <Bot className="w-5 h-5" />}
                    </div>
                    <div className={`p-4 rounded-2xl sm:rounded-3xl text-sm sm:text-base leading-relaxed shadow-sm transition-all ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                    }`}>
                       {m.text}
                    </div>
                 </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 p-4 bg-white border border-gray-100 rounded-3xl rounded-tl-none shadow-sm animate-pulse items-center">
                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 sm:p-6 bg-white border-t border-gray-100 flex gap-3 relative z-10"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire with Stratos..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
            <button
               type="submit"
               disabled={!input.trim() || isTyping}
               className="p-3.5 sm:p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
               <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
