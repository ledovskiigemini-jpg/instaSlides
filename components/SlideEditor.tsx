import React, { useState } from 'react';
import { Slide } from '../types';
import { stripBase64Prefix } from '../utils/imageUtils';
import { editImageWithGemini } from '../services/geminiService';
import { Trash2, Wand2, Download, RefreshCcw } from 'lucide-react';

interface SlideEditorProps {
  slide: Slide;
  onUpdate: (id: string, updates: Partial<Slide>) => void;
  onDelete: (id: string) => void;
  onDownload: (slide: Slide) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  onUpdate,
  onDelete,
  onDownload,
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiInput, setShowAiInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAiEdit = async () => {
    if (!aiPrompt.trim()) return;

    onUpdate(slide.id, { isProcessing: true });
    setError(null);
    setShowAiInput(false);

    try {
      const { data, mimeType } = stripBase64Prefix(slide.currentImage);
      const newImageData = await editImageWithGemini(data, mimeType, aiPrompt);
      
      const newImageUrl = `data:image/jpeg;base64,${newImageData}`;
      onUpdate(slide.id, { currentImage: newImageUrl, isProcessing: false });
    } catch (err) {
      console.error(err);
      setError("Failed to edit image. Try a different prompt.");
      onUpdate(slide.id, { isProcessing: false });
    }
  };

  const handleResetImage = () => {
    onUpdate(slide.id, { currentImage: slide.originalImage });
  };

  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 flex flex-col md:flex-row h-full">
      {/* Preview Area (Standard 4:5 Aspect Ratio Container) */}
      <div className="relative w-full md:w-1/2 aspect-[4/5] bg-black group overflow-hidden">
        {slide.isProcessing && (
          <div className="absolute inset-0 z-20 bg-black/70 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm text-gray-300">Gemini is thinking...</p>
            </div>
          </div>
        )}
        
        <img
          src={slide.currentImage}
          alt="Slide"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Gradient Overlay Preview */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />

        {/* Text Preview */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-12 pointer-events-none">
          <h2 className="text-white font-bold text-3xl mb-2 leading-tight drop-shadow-lg break-words">
            {slide.title || "Add a Headline"}
          </h2>
          <p className="text-gray-200 text-lg leading-snug drop-shadow-md break-words">
            {slide.body || "Add your body text here to describe the slide."}
          </p>
        </div>

        {/* On-image Controls */}
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           {slide.currentImage !== slide.originalImage && (
             <button
                onClick={handleResetImage}
                title="Reset to Original"
                className="bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
              >
                <RefreshCcw size={18} />
              </button>
           )}
           <button 
             onClick={() => onDownload(slide)}
             title="Download Image"
             className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
           >
             <Download size={18} />
           </button>
        </div>
      </div>

      {/* Editor Controls */}
      <div className="p-6 flex flex-col gap-6 w-full md:w-1/2">
        <div className="flex justify-between items-center border-b border-slate-700 pb-4">
          <h3 className="font-semibold text-lg text-slate-200">Slide Details</h3>
          <button
            onClick={() => onDelete(slide.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition-colors"
            title="Remove Slide"
          >
            <Trash2 size={18} />
          </button>
        </div>

        <div className="space-y-4 flex-grow">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Headline</label>
            <input
              type="text"
              value={slide.title}
              onChange={(e) => onUpdate(slide.id, { title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
              placeholder="Catchy Headline"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Body Text</label>
            <textarea
              value={slide.body}
              onChange={(e) => onUpdate(slide.id, { body: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all h-24 resize-none"
              placeholder="Explain the concept..."
            />
          </div>
        </div>

        {/* AI Magic Section */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-300 flex items-center gap-2">
              <Wand2 size={16} />
              AI Image Editor
            </span>
          </div>
          
          {!showAiInput ? (
            <button
              onClick={() => setShowAiInput(true)}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 rounded border border-dashed border-slate-600 hover:border-slate-500 transition-all text-left"
            >
              Click to edit image with Gemini...
            </button>
          ) : (
            <div className="space-y-2">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'Make it look cyberpunk', 'Add a cat in the corner', 'Remove the background person'"
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-purple-500 outline-none"
                rows={2}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAiInput(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiEdit}
                  disabled={slide.isProcessing || !aiPrompt.trim()}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-medium disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};