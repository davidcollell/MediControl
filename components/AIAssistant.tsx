import React, { useState, useRef, useEffect } from 'react';
import { askAIPharmacist } from '../services/geminiService';
import { Medication, ChatMessage } from '../types';
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
      text: 'Hola! Sóc el teu assistent MediBot. Pregunta\'m el que vulguis sobre les teves pastilles.'
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
    
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    const medContext = medications.map(m => `${m.name} (${m.dosage}, ${m.frequency})`).join(', ');

    const responseText = await askAIPharmacist(userText, medContext);

    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)]">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          MediBot IA <Sparkles className="w-8 h-8 text-purple-600" />
        </h1>
        <p className="text-slate-600 text-lg">Assistent intel·ligent.</p>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 no-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[90%] rounded-3xl p-6 ${
              msg.role === 'user' 
                ? 'bg-sky-600 text-white rounded-br-none' 
                : 'bg-white border-2 border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
            }`}>
              <div className="flex items-center gap-2 mb-2 text-sm opacity-80 font-bold uppercase tracking-wider">
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                <span>{msg.role === 'user' ? 'Tu' : 'MediBot'}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-xl">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border-2 border-slate-200 text-slate-500 rounded-3xl rounded-bl-none p-6 shadow-sm flex items-center gap-3">
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="relative mt-auto pb-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escriu aquí..."
          className="w-full pl-6 pr-16 py-6 rounded-3xl border-2 border-slate-300 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-500 shadow-md text-xl bg-white text-slate-900"
          disabled={isLoading}
        />
        <button 
          type="submit"
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-3 p-3 bg-sky-600 text-white rounded-2xl hover:bg-sky-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-8 h-8" />
        </button>
      </form>
    </div>
  );
};