import React from 'react';

export const ErrorMessage: React.FC<{ message: string }> = ({ message }) => {
    return (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg relative my-4 text-center animate-fade-in" role="alert">
            <strong className="font-bold">خطأ! </strong>
            <span className="block sm:inline ml-2">{message}</span>
        </div>
    );
};