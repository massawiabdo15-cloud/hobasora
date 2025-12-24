import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="text-center py-8 animate-fade-in">
             <div className="flex items-center justify-center gap-4 mb-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-pink">
                    منتج القصة
                </h1>
            </div>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
                 Leverage generative AI with a unique suite of tools to convey your ideas to the world.
            </p>
             <a 
                href="https://www.youtube.com/@TechTricksArabic/videos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-6 text-sm text-text-secondary hover:text-brand-purple transition-colors duration-300 inline-flex items-center gap-2"
            >
                <span>تم صناعته بواسطة Tech Tricks|تريكات</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#FF0000">
                    <path d="M21.582,6.186c-0.23-0.814-0.908-1.492-1.722-1.722C18.25,4,12,4,12,4S5.75,4,4.14,4.464 c-0.814,0.23-1.492,0.908-1.722,1.722C2,7.796,2,12,2,12s0,4.204,0.418,5.814c0.23,0.814,0.908,1.492,1.722,1.722 C5.75,20,12,20,12,20s6.25,0,7.86-0.464c0.814-0.23,1.492-0.908,1.722-1.722C22,16.204,22,12,22,12S22,7.796,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/>
                </svg>
            </a>
        </header>
    );
};