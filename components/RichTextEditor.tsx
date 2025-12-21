import React, { useRef } from 'react';
import { Bold, Italic, List, Heading } from './Icons';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        const selection = text.substring(start, end);

        let newText = '';
        if (tag === 'b') newText = `${before}<strong>${selection}</strong>${after}`;
        if (tag === 'i') newText = `${before}<em>${selection}</em>${after}`;
        if (tag === 'ul') newText = `${before}\n<ul>\n  <li>${selection}</li>\n</ul>\n${after}`;
        if (tag === 'h3') newText = `${before}<h3>${selection}</h3>${after}`;

        onChange(newText);
        
        // Restore focus to textarea
        setTimeout(() => {
            textarea.focus();
        }, 0);
    } else {
        onChange(value + `<${tag}></${tag}>`);
    }
  };

  return (
    <div className={`border border-slate-300 rounded-lg overflow-hidden bg-white ${className}`}>
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <button type="button" onClick={() => insertTag('b')} className="p-2 hover:bg-slate-200 rounded" title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => insertTag('i')} className="p-2 hover:bg-slate-200 rounded" title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => insertTag('ul')} className="p-2 hover:bg-slate-200 rounded" title="List">
          <List size={16} />
        </button>
        <button type="button" onClick={() => insertTag('h3')} className="p-2 hover:bg-slate-200 rounded" title="Heading">
          <Heading size={16} />
        </button>
        <span className="text-xs text-slate-400 ml-auto">HTML Supported</span>
      </div>
      <textarea
        ref={textareaRef}
        className="w-full p-4 min-h-[200px] outline-none resize-y font-mono text-sm text-slate-700"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Enter content here. HTML tags are supported for formatting."}
      />
    </div>
  );
};