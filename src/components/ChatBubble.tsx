import React, { useState } from 'react';
import { Send, X, User, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChatBubbleProps {
  agentName: string;
  onClose: () => void;
  onSendMessage: (msg: string) => void;
  messages: { role: 'user' | 'agent', text: string }[];
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ agentName, onClose, onSendMessage, messages }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 w-80 h-96 bg-[#1e293b] border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50"
    >
      <div className="p-4 bg-indigo-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">Comms: {agentName}</span>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-xl text-xs ${
              msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send command..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button type="submit" className="bg-indigo-600 p-2 rounded-lg text-white hover:bg-indigo-700">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  );
};
