import React, { useState } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { STORY_GENRES, WRITING_STYLES } from '../constants';
import { StoryGenre, WritingStyle } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface StoryGeneratorSectionProps {
    onStoryGenerated: (story: string) => void;
}

export const StoryGeneratorSection: React.FC<StoryGeneratorSectionProps> = ({ onStoryGenerated }) => {
    const [idea, setIdea] = useState('');
    const [length, setLength] = useState<number>(1500);
    const [genre, setGenre] = useState<StoryGenre>(STORY_GENRES[0]);
    const [writingStyle, setWritingStyle] = useState<WritingStyle>(WRITING_STYLES[0]);
    const [generatedStory, setGeneratedStory] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const handleGenerateStory = async () => {
        if (!idea.trim()) {
            setError('الرجاء إدخال فكرة للقصة.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedStory('');

        const prompt = `
        اكتب قصة من نوع "${genre.label}" بأسلوب كتابة "${writingStyle.label}".
        يجب أن تكون القصة بطول حوالي ${length} حرفًا.
        الفكرة الرئيسية للقصة هي: "${idea}".
        تأكد من أن القصة كاملة ولها بداية ووسط ونهاية. يجب أن تكون مكتوبة باللغة العربية.
        `;

        try {
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: "gemini-2.5-pro",
                contents: prompt,
            });
            const story = response.text;
            setGeneratedStory(story);
        } catch (e) {
            console.error(e);
            setError('حدث خطأ أثناء إنشاء القصة. حاول مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUseStory = () => {
        onStoryGenerated(generatedStory);
    };

    return (
        <section className="bg-bg-surface/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-center text-text-primary">أداة جديدة: حوّل فكرتك إلى قصة</h2>
            <p className="text-center text-text-secondary">اكتب فكرة بسيطة، وسيقوم الذكاء الاصطناعي بتحويلها إلى قصة كاملة يمكنك استخدامها في الخطوة التالية.</p>

            <div className="space-y-4">
                <div>
                    <label htmlFor="story-idea" className="block mb-2 font-medium text-text-secondary">1. فكرة القصة</label>
                    <textarea
                        id="story-idea"
                        value={idea}
                        onChange={(e) => setIdea(e.target.value)}
                        placeholder="مثال: فتاة تكتشف بوابة سحرية في حديقة جدتها..."
                        className="w-full h-24 p-4 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition duration-200 resize-none text-text-secondary placeholder-text-secondary/50"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div>
                        <label htmlFor="story-genre" className="block mb-2 font-medium text-text-secondary">2. النوع الأدبي</label>
                        <select id="story-genre" value={genre.id} onChange={(e) => setGenre(STORY_GENRES.find(g => g.id === e.target.value) || STORY_GENRES[0])} className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition" disabled={isLoading}>
                            {STORY_GENRES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="writing-style" className="block mb-2 font-medium text-text-secondary">3. أسلوب الكتابة</label>
                        <select id="writing-style" value={writingStyle.id} onChange={(e) => setWritingStyle(WRITING_STYLES.find(s => s.id === e.target.value) || WRITING_STYLES[0])} className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition" disabled={isLoading}>
                            {WRITING_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="story-length" className="block mb-2 font-medium text-text-secondary">4. الطول (بالحروف)</label>
                        <input type="number" id="story-length" value={length} onChange={(e) => setLength(parseInt(e.target.value, 10))} min="500" step="100" className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition" disabled={isLoading} />
                    </div>
                </div>
            </div>

            <div className="text-center pt-4">
                <button
                    onClick={handleGenerateStory}
                    disabled={isLoading || !idea}
                    className="w-full md:w-auto bg-gradient-to-r from-brand-purple to-brand-pink text-white font-bold text-lg py-3 px-16 rounded-lg transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-lg shadow-brand-purple/20"
                >
                    أنشئ القصة
                </button>
            </div>

            {isLoading && <LoadingSpinner message="جاري كتابة القصة..." />}
            {error && <ErrorMessage message={error} />}

            {generatedStory && !isLoading && (
                <div className="pt-6 border-t border-white/10 space-y-4 animate-fade-in">
                    <h3 className="text-lg font-bold text-text-primary">القصة التي تم إنشاؤها:</h3>
                    <textarea
                        readOnly
                        value={generatedStory}
                        className="w-full h-64 p-4 bg-bg-input border border-white/10 rounded-lg resize-y text-text-secondary"
                    />
                    <div className="text-center">
                        <button
                            onClick={handleUseStory}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 hover:scale-105 flex items-center justify-center gap-2 mx-auto"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                            استخدم هذه القصة لتحويلها لمشاهد
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};
