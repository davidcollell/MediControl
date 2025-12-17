import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  // Canvi: Padding molt més gran (py-4), text més gran (text-lg) i font-bold
  const baseStyles = "px-6 py-4 rounded-2xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-3 active:scale-95 touch-manipulation min-h-[60px]";
  
  const variants = {
    primary: "bg-sky-600 text-white shadow-xl shadow-sky-600/20 hover:bg-sky-700 border-2 border-transparent",
    secondary: "bg-white text-slate-900 border-2 border-slate-300 hover:bg-slate-50",
    danger: "bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};