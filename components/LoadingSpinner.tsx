import React from 'react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-brand-purple"></div>
            {message && <p className="mt-4 text-md text-text-secondary">{message}</p>}
        </div>
    );
};