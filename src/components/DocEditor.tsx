import React, { useState, useEffect } from 'react';
import { Save, X, FileText } from 'lucide-react';
import { Document } from '../types';

interface DocEditorProps {
  document: Document | null;
  onSave: (id: string, content: string, name: string) => void;
  onClose: () => void;
}

export const DocEditor: React.FC<DocEditorProps> = ({ document, onSave, onClose }) => {
  const [content, setContent] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (document) {
      setContent(document.content || '');
      setName(document.name || '');
    } else {
      setContent('');
      setName('Untitled Document');
    }
  }, [document]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60] flex items-center justify-center p-8">
      <div className="bg-[#1e293b] border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-indigo-400" />
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border-none focus:outline-none font-bold text-slate-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onSave(document?.id || '', content, name)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-6">
          <textarea 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent border-none focus:outline-none resize-none font-mono text-sm text-slate-300"
            placeholder="Start writing..."
          />
        </div>
      </div>
    </div>
  );
};
