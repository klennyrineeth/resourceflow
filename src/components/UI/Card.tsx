import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', onClick }: CardProps) {
  // If className already provided a background, we don't apply bg-white
  const hasBackground = className.includes('bg-');
  const baseClasses = `rounded-2xl border border-gray-100 ${hasBackground ? '' : 'bg-white'} shadow-sm transition-all`;
  
  return (
    <div className={`${baseClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
