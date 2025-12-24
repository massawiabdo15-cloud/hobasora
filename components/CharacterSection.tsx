import React from 'react';
import { Character, AspectRatio } from '../types';
import { CharacterCard } from './CharacterCard';

interface CharacterSectionProps {
    characters: Character[];
    onRegenerateImage: (index: number) => void;
    onUploadImage: (index: number, file: File) => void;
    onDescriptionChange: (index: number, newDescription: string) => void;
    aspectRatio: AspectRatio;
}

export const CharacterSection: React.FC<CharacterSectionProps> = ({ 
    characters, 
    onRegenerateImage,
    onUploadImage,
    onDescriptionChange,
    aspectRatio
 }) => {
    return (
        <section className="animate-fade-in" style={{animationDelay: '200ms'}}>
            <div className="pb-2 mb-8 text-center">
                <h2 className="text-3xl font-bold text-text-primary">2. شخصيات القصة</h2>
                <p className="text-text-secondary mt-1">راجع الشخصيات التي تم إنشاؤها أو ارفع صورًا خاصة بك.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {characters.map((char, index) => (
                    <CharacterCard 
                        key={index} 
                        character={char} 
                        index={index} 
                        aspectRatio={aspectRatio}
                        onRegenerate={onRegenerateImage} 
                        onUpload={onUploadImage}
                        onDescriptionChange={onDescriptionChange}
                    />
                ))}
            </div>
        </section>
    );
};