import React, { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Upload, Plus, Download, Image as ImageIcon, Layout } from 'lucide-react';
import { Slide } from './types';
import { SlideEditor } from './components/SlideEditor';
import { fileToBase64, downloadSlide } from './utils/imageUtils';

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Limit to 10 total slides
    const remainingSlots = 10 - slides.length;
    if (remainingSlots <= 0) {
      alert("You can only add up to 10 slides.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
    const newSlides: Slide[] = [];

    for (const file of filesToProcess) {
      try {
        const base64 = await fileToBase64(file);
        newSlides.push({
          id: uuidv4(),
          originalImage: base64,
          currentImage: base64,
          title: '',
          body: '',
          isProcessing: false,
        });
      } catch (err) {
        console.error("Error processing file", file.name, err);
      }
    }

    setSlides((prev) => [...prev, ...newSlides]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateSlide = (id: string, updates: Partial<Slide>) => {
    setSlides((prev) =>
      prev.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide))
    );
  };

  const deleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((slide) => slide.id !== id));
  };

  const handleDownloadAll = async () => {
    if (slides.length === 0) return;
    for (const slide of slides) {
      await downloadSlide(slide);
      // Small delay to prevent browser throttling downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500/30">
      
      {/* Header */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-tr from-brand-500 to-purple-500 p-2 rounded-lg">
              <Layout size={24} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              InstaGemini
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {slides.length > 0 && (
               <div className="hidden sm:flex items-center text-sm text-slate-400">
                 {slides.length} / 10 Slides
               </div>
             )}
            <button
              onClick={handleDownloadAll}
              disabled={slides.length === 0}
              className="flex items-center gap-2 bg-slate-100 text-slate-900 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-full font-medium transition-all text-sm"
            >
              <Download size={16} />
              Export All
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Empty State / Upload Area */}
        {slides.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 hover:bg-slate-900/50 transition-colors p-8 text-center">
            <div className="bg-slate-800 p-6 rounded-full mb-6 ring-1 ring-slate-700 shadow-2xl">
              <ImageIcon size={48} className="text-brand-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Create Your Carousel</h2>
            <p className="text-slate-400 max-w-md mb-8">
              Upload photos, add text overlays, and use AI to edit your images instantly. Perfect for Instagram.
            </p>
            
            <label className="cursor-pointer group relative overflow-hidden bg-brand-600 hover:bg-brand-500 text-white px-8 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-brand-500/25">
              <span className="flex items-center gap-2 relative z-10">
                <Upload size={20} />
                Select Photos
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-xs text-slate-500 mt-4">Supports JPG, PNG (Max 10 files)</p>
          </div>
        )}

        {/* Editor List */}
        {slides.length > 0 && (
          <div className="space-y-12">
            <div className="grid gap-8">
              {slides.map((slide, index) => (
                <div key={slide.id} className="relative">
                  <div className="absolute -left-4 md:-left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-800 to-transparent hidden md:block"></div>
                  <div className="absolute -left-4 md:-left-[3.25rem] top-8 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 hidden md:flex">
                    {index + 1}
                  </div>
                  <SlideEditor
                    slide={slide}
                    onUpdate={updateSlide}
                    onDelete={deleteSlide}
                    onDownload={downloadSlide}
                  />
                </div>
              ))}
            </div>

            {/* Add More Button */}
            {slides.length < 10 && (
              <div className="flex justify-center pb-20">
                <label className="cursor-pointer flex items-center gap-2 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 bg-slate-900 px-6 py-3 rounded-xl transition-all">
                  <Plus size={20} />
                  Add More Slides
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}