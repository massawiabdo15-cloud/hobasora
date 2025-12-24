import React, { useState, useRef, useEffect } from 'react';
import { downloadImage } from '../utils/imageUtils';

interface DownloadButtonProps {
    isDisabled: boolean;
    image: string | null;
    filename: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ isDisabled, image, filename }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDownload = (format: 'image/jpeg' | 'image/png', quality: number) => {
        if (!image) return;
        downloadImage(image, filename, format, quality);
        setIsOpen(false);
    };
    
    const buttonClass = "w-full bg-bg-surface hover:bg-white/5 text-text-primary font-medium py-2 px-4 rounded-md transition duration-300 flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10";
    
    if (!image) {
        return (
            <button disabled={true} className={buttonClass}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                تحميل
            </button>
        );
    }

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isDisabled}
                className={buttonClass}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                تحميل
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-bg-surface/80 backdrop-blur-sm rounded-md shadow-lg z-10 border border-white/10 animate-fade-in" style={{animationDuration: '150ms'}}>
                    <button onClick={() => handleDownload('image/png', 1)} className="block w-full text-right px-4 py-2 text-sm text-text-primary hover:bg-white/5 rounded-t-md">جودة عالية (PNG)</button>
                    <button onClick={() => handleDownload('image/jpeg', 0.8)} className="block w-full text-right px-4 py-2 text-sm text-text-primary hover:bg-white/5">جودة متوسطة (JPG)</button>
                    <button onClick={() => handleDownload('image/jpeg', 0.5)} className="block w-full text-right px-4 py-2 text-sm text-text-primary hover:bg-white/5 rounded-b-md">جودة منخفضة (JPG)</button>
                </div>
            )}
        </div>
    );
};