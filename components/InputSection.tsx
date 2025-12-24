
import React, { useRef } from 'react';
import { StoryStyle, AspectRatio } from '../types';
import { STORY_STYLES, ASPECT_RATIOS } from '../constants';

interface InputSectionProps {
    storyText: string;
    setStoryText: (text: string) => void;
    notes: string;
    setNotes: (text: string) => void;
    numScenes: number;
    setNumScenes: (n: number) => void;
    storyStyle: StoryStyle;
    setStoryStyle: (style: StoryStyle) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    onAnalyze: () => void;
    onPdfUpload: (file: File) => void;
    onProjectImport: (file: File) => void;
    isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
    storyText,
    setStoryText,
    notes,
    setNotes,
    numScenes,
    setNumScenes,
    storyStyle,
    setStoryStyle,
    aspectRatio,
    setAspectRatio,
    onAnalyze,
    onPdfUpload,
    onProjectImport,
    isLoading
}) => {
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const projectInputRef = useRef<HTMLInputElement>(null);

    const handlePdfFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onPdfUpload(file);
        }
    };

    const handleProjectFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onProjectImport(file);
        }
    };
    
    return (
        <section className="bg-bg-surface/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-center text-text-primary">1. أدخل تفاصيل قصتك</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <textarea
                    value={storyText}
                    onChange={(e) => setStoryText(e.target.value)}
                    placeholder="الصق قصتك هنا..."
                    className="w-full h-64 p-4 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition duration-200 resize-none text-text-secondary placeholder-text-secondary/50"
                    disabled={isLoading}
                />
                
                <div className="flex flex-col items-center justify-center bg-bg-input p-4 rounded-lg border-2 border-dashed border-white/20 space-y-4">
                     <p className="text-text-secondary text-center">أو ارفع ملف PDF لقصتك</p>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfFileChange}
                        ref={pdfInputRef}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <input
                        type="file"
                        accept=".json"
                        onChange={handleProjectFileChange}
                        ref={projectInputRef}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-bg-surface hover:bg-white/5 text-text-primary font-medium py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 border border-white/10"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                            اختر PDF
                        </button>
                         <button
                            onClick={() => projectInputRef.current?.click()}
                            disabled={isLoading}
                            className="flex items-center gap-2 bg-bg-surface hover:bg-white/5 text-text-primary font-medium py-2 px-4 rounded-lg transition duration-300 disabled:opacity-50 border border-white/10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12V8a4 4 0 0 1 4-4h4"/><path d="M4 20v-4a4 4 0 0 1 4-4h4"/><path d="m18 4 4 4"/><path d="m12 14 6 6"/><path d="m18 20 4-4"/></svg>
                            استيراد
                        </button>
                    </div>
                </div>
            </div>

            <div>
                <label htmlFor="notes" className="block mb-2 font-medium text-text-secondary">ملحوظات إضافية (اختياري)</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أضف أي ملحوظات أو توجيهات خاصة لتحليل القصة..."
                    className="w-full h-24 p-4 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition duration-200 resize-none text-text-secondary placeholder-text-secondary/50"
                    disabled={isLoading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div className="md:col-span-3 lg:col-span-1">
                    <label htmlFor="numScenes" className="block mb-2 font-medium text-text-secondary">عدد المشاهد</label>
                    <input
                        type="number"
                        id="numScenes"
                        value={numScenes}
                        onChange={(e) => setNumScenes(Math.max(1, parseInt(e.target.value, 10)))}
                        min="1"
                        max="10"
                        className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                        disabled={isLoading}
                    />
                </div>
                 <div className="md:col-span-3 lg:col-span-1">
                    <label htmlFor="aspectRatio" className="block mb-2 font-medium text-text-secondary">أبعاد الصور</label>
                    <select
                        id="aspectRatio"
                        value={aspectRatio.value}
                        onChange={(e) => {
                            const newRatio = ASPECT_RATIOS.find(r => r.value === e.target.value);
                            if (newRatio) setAspectRatio(newRatio);
                        }}
                        className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                        disabled={isLoading}
                    >
                        {ASPECT_RATIOS.map(ratio => (
                            <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                        ))}
                    </select>
                </div>
                 <div className="md:col-span-3 lg:col-span-1">
                    <label className="block mb-2 font-medium text-text-secondary">الأسلوب الفني</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STORY_STYLES.map(style => (
                            <button
                                key={style.id}
                                onClick={() => setStoryStyle(style)}
                                disabled={isLoading}
                                className={`py-2 px-2 rounded-lg text-sm transition duration-200 text-center ${storyStyle.id === style.id ? 'bg-brand-purple text-white' : 'bg-bg-input hover:bg-white/5 text-text-secondary border border-white/10'}`}
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <button
                    onClick={onAnalyze}
                    disabled={isLoading || !storyText}
                    className="w-full md:w-auto bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-lg py-3 px-16 rounded-lg transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-brand-purple/20"
                >
                    حلل القصة
                </button>
            </div>
        </section>
    );
};
