import type React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  isLoading?: boolean;
}

export function Button({ children, className = "", isLoading = false, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center text-white py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed 
      bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] shadow-[0_0_20px_rgba(0,82,255,0.25)] hover:shadow-[0_0_28px_rgba(245,158,11,0.35)]
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]
      ${className}`}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
        </div>
      ) : (
        children
      )}
    </button>
  );
}
