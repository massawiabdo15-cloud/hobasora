import React, { useState, useEffect, useRef } from 'react';
import { Character, AspectRatio } from '../types';
import { LoadingSpinner } from './LoadingSpinner';
import { padImageToAspectRatio } from '../utils/imageUtils';
import { DownloadButton } from './DownloadButton';

interface CharacterCardProps {
    character: Character;
    index: number;
    aspectRatio: AspectRatio;
    onRegenerate: (index: number) => void;
    onUpload: (index: number, file: File) => void;
    onDescriptionChange: (index: number, newDescription: string) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, index, aspectRatio, onRegenerate, onUpload, onDescriptionChange }) => {
    const [displayImage, setDisplayImage] = useState<string | null>(character.image);
    const uploadInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let isMounted = true;
        if (character.image) {
            setDisplayImage(null);
            padImageToAspectRatio(character.image, aspectRatio.value)
                .then(paddedImg => {
                    if (isMounted) setDisplayImage(paddedImg);
                })
                .catch(err => {
                    console.error("Failed to pad image:", err);
                    if (isMounted) setDisplayImage(character.image);
                });
        } else {
            setDisplayImage(null);
        }
        return () => { isMounted = false; };
    }, [character.image, aspectRatio]);

    const handleUploadClick = () => {
        uploadInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUpload(index, file);
        }
    };

    return (
        <div className="bg-bg-surface/50 backdrop-blur-sm border border-white/10 rounded-lg shadow-md overflow-hidden flex flex-col animate-fade-in">
            <div className="w-full bg-bg-input flex items-center justify-center" style={{ aspectRatio: aspectRatio.value.replace(':', ' / ') }}>
                {character.isLoading ? (
                    <LoadingSpinner />
                ) : displayImage ? (
                    <img src={displayImage} alt={character.name} className="w-full h-full object-contain" />
                ) : character.image ? (
                    <LoadingSpinner />
                )
                : (
                    <div className="text-red-400/50 p-4 text-center text-xs">فشل تحميل الصورة</div>
                )}
            </div>
            <div className="p-4 bg-bg-surface/50 flex-grow flex flex-col">
                <h3 className="font-bold text-lg text-center text-text-primary truncate">{character.name}</h3>
                 <textarea
                    value={character.description}
                    onChange={(e) => onDescriptionChange(index, e.target.value)}
                    className="w-full h-24 p-2 my-2 bg-bg-input border border-white/10 rounded-md resize-none text-sm text-text-secondary focus:ring-1 focus:ring-brand-purple transition duration-200"
                    placeholder="وصف الشخصية..."
                    disabled={character.isLoading}
                />
                 <div className="mt-auto space-y-2">
                    <DownloadButton
                        isDisabled={character.isLoading || !displayImage}
                        image={displayImage}
                        filename={character.name}
                    />
                    <input type="file" accept="image/*" ref={uploadInputRef} onChange={handleFileChange} className="hidden" />
                    <button
                        onClick={handleUploadClick}
                        disabled={character.isLoading}
                        className="w-full bg-bg-surface hover:bg-white/5 text-text-primary font-medium py-2 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                        رفع صورة
                    </button>
                    <button
                        onClick={() => onRegenerate(index)}
                        disabled={character.isLoading}
                        className="w-full bg-brand-purple/80 hover:bg-brand-purple/70 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg>
                        إعادة إنشاء
                    </button>
                </div>
            </div>
        </div>
    );
};