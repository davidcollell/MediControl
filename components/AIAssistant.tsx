import React, { useState, useRef, useEffect } from 'react';
import { askAIPharmacist } from '../services/geminiService';
import { Medication, ChatMessage } from '../types';
import { Button } from './Button';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface AIAssistantProps {
  medications: Medication[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ medications }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hola! Sóc el teu assistent MediBot. Tens alguna pregunta sobre la teva medicació o possibles interaccions?'
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input;
    setInput('');
    
    // Add User Message
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Prepare context
    const medContext = medications.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ');

    // Call API
    const responseText = await askAIPharmacist(userText, medContext);

    // Add Model Message
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          MediBot IA <Sparkles className="w-5 h-5 text-purple-500" />
        </h1>
        <p className="text-slate-500 text-sm">Pregunta sobre les teves pastilles.</p>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 no-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-sky-500 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-1 text-xs opacity-70">
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                <span className="font-semibold uppercase">{msg.role === 'user' ? 'Tu' : 'MediBot'}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escriu la teva pregunta..."
          className="w-full pl-4 pr-12 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
          disabled={isLoading}
        />
        <button 
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-2 p-1.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 disabled:opacity-50 disabled:hover:bg-sky-500 transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};