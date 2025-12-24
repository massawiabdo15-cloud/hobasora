
import React, { useState, useEffect } from 'react';
import { Scene, AspectRatio } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { ASPECT_RATIOS } from '../constants';
import { cropImageToAspectRatio } from '../utils/imageUtils';
import { DownloadButton } from './DownloadButton';

interface SceneSectionProps {
    scenes: Scene[];
    onGenerateImage: (index: number) => void;
    onAspectRatioChange: (index: number, ratio: AspectRatio) => void;
    onPromptChange: (index: number, newPrompt: string) => void;
    onDeleteImage: (index: number) => void;
}

const SceneCard: React.FC<{
    scene: Scene;
    index: number;
    onGenerateImage: (index: number) => void;
    onAspectRatioChange: (index: number, ratio: AspectRatio) => void;
    onPromptChange: (index: number, newPrompt: string) => void;
    onDeleteImage: (index: number) => void;
}> = ({ scene, index, onGenerateImage, onAspectRatioChange, onPromptChange, onDeleteImage }) => {
    const [displayImage, setDisplayImage] = useState<string | null>(scene.image);

    useEffect(() => {
        let isMounted = true;
        if (scene.image) {
            setDisplayImage(null);
            cropImageToAspectRatio(scene.image, scene.aspectRatio.value)
                .then(croppedImg => {
                    if (isMounted) setDisplayImage(croppedImg);
                })
                .catch(err => {
                    console.error("Failed to crop scene image:", err);
                    if (isMounted) setDisplayImage(scene.image);
                });
        } else {
            setDisplayImage(null);
        }
        return () => { isMounted = false; };
    }, [scene.image, scene.aspectRatio.value]);
    
    return (
        <div className="bg-bg-surface/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-lg overflow-hidden flex flex-col lg:flex-row gap-6 p-6 animate-fade-in">
            <div className="lg:w-1/2 flex flex-col justify-between">
                <div>
                    <h3 className="text-xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-brand-purple to-brand-pink">المشهد #{scene.sceneNumber}</h3>
                     <label htmlFor={`scene-prompt-${index}`} className="block mb-2 font-medium text-text-secondary text-sm">
                        نص المشهد (قابل للتعديل):
                    </label>
                    <textarea
                        id={`scene-prompt-${index}`}
                        value={scene.prompt}
                        onChange={(e) => onPromptChange(index, e.target.value)}
                        className="w-full h-32 p-3 bg-bg-input border border-white/10 rounded-md resize-none text-text-secondary placeholder-text-secondary/50 focus:ring-1 focus:ring-brand-purple transition duration-200"
                        disabled={scene.isLoading}
                    />
                </div>
                <div className="mt-4 space-y-4">
                    <div>
                        <label htmlFor={`scene-aspect-ratio-${index}`} className="block mb-2 font-medium text-text-secondary text-sm">أبعاد الصورة للمشهد:</label>
                        <select
                            id={`scene-aspect-ratio-${index}`}
                            value={scene.aspectRatio.value}
                            onChange={(e) => {
                                const newRatio = ASPECT_RATIOS.find(r => r.value === e.target.value);
                                if (newRatio) onAspectRatioChange(index, newRatio);
                            }}
                            className="w-full p-2.5 bg-bg-input border border-white/10 rounded-lg focus:ring-2 focus:ring-brand-purple transition"
                            disabled={scene.isLoading}
                        >
                            {ASPECT_RATIOS.map(ratio => (
                                <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => onGenerateImage(index)}
                            disabled={scene.isLoading}
                            className="w-full bg-brand-purple hover:bg-brand-purple/80 text-white font-bold py-2.5 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                            إنشاء الصورة
                        </button>
                        <DownloadButton
                            isDisabled={scene.isLoading || !displayImage}
                            image={displayImage}
                            filename={`scene-${scene.sceneNumber}`}
                        />
                    </div>
                </div>
            </div>
            <div 
                className="relative lg:w-1/2 bg-bg-input rounded-md flex items-center justify-center overflow-hidden border border-white/10"
                style={{ aspectRatio: scene.aspectRatio.value.replace(':', ' / ') }}
            >
                 {displayImage && !scene.isLoading && (
                    <button
                        onClick={() => onDeleteImage(index)}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-red-600 text-white p-2 rounded-full transition-colors duration-200 z-10"
                        aria-label="حذف الصورة"
                        title="حذف الصورة"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                )}
                {scene.isLoading ? (
                    <LoadingSpinner message="جاري الإنشاء..." />
                ) : displayImage ? (
                    <img src={displayImage} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" />
                ) : scene.image ? (
                    <LoadingSpinner message="جاري المعالجة..."/>
                ) : (
                    <div className="text-text-secondary/50 text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                         <p className="mt-2">سيتم عرض الصورة هنا</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const SceneSection: React.FC<SceneSectionProps> = ({ scenes, onGenerateImage, onAspectRatioChange, onPromptChange, onDeleteImage }) => {
    return (
        <section className="animate-fade-in" style={{animationDelay: '400ms'}}>
            <div className="pb-2 mb-8 text-center">
                <h2 className="text-3xl font-bold text-text-primary">3. مشاهد القصة</h2>
                <p className="text-text-secondary mt-1">عدّل النصوص وأنشئ صورًا فريدة لكل مشهد.</p>
            </div>
            <div className="space-y-8">
                {scenes.map((scene, index) => (
                    <SceneCard
                        key={scene.sceneNumber}
                        scene={scene}
                        index={index}
                        onGenerateImage={onGenerateImage}
                        onAspectRatioChange={onAspectRatioChange}
                        onPromptChange={onPromptChange}
                        onDeleteImage={onDeleteImage}
                    />
                ))}
            </div>
        </section>
    );
};
