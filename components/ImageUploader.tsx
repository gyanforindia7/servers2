import React, { useState, useRef } from 'react';
import { Upload, ImageIcon, X } from './Icons';

interface ImageUploaderProps {
  currentImage: string;
  onImageChange: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ currentImage, onImageChange }) => {
  const [inputType, setInputType] = useState<'url' | 'file'>('file');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <button
          type="button"
          onClick={() => setInputType('file')}
          className={`pb-1 border-b-2 transition-colors ${inputType === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setInputType('url')}
          className={`pb-1 border-b-2 transition-colors ${inputType === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
        >
          Image URL
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {inputType === 'file' ? (
          <div 
            className={`flex-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
            onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Upload className="text-slate-400" size={32} />
              <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
              <p className="text-xs text-slate-500">SVG, PNG, JPG or GIF (max. 800x400px recommended)</p>
            </div>
          </div>
        ) : (
          <div className="flex-1">
             <input
              type="text"
              placeholder="https://example.com/image.jpg"
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none"
              value={currentImage}
              onChange={(e) => onImageChange(e.target.value)}
             />
             <p className="text-xs text-slate-500 mt-2">Paste a direct link to an image.</p>
          </div>
        )}

        {currentImage && (
          <div className="w-32 h-32 relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
            <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onImageChange('')}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
