import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string; // Tailwind color class e.g., 'text-indigo-600'
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'text-indigo-600',
  text,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${sizeClasses[size]}`}>
        <div
          className={`absolute top-0 left-0 w-full h-full rounded-full border-2 border-transparent border-t-${color.split('-')[1]}-200 animate-spin`}
          style={{ borderColor: 'transparent', borderTopColor: 'currentColor' }}
        />
        <div
          className={`absolute top-0 left-0 w-full h-full rounded-full border-2 border-transparent border-b-${color.split('-')[1]}-200 animate-spin`}
          style={{
            borderColor: 'transparent',
            borderBottomColor: 'currentColor',
            animationDelay: '0.15s',
          }}
        />
        <div
          className={`absolute top-0 left-0 w-full h-full rounded-full border-2 border-transparent border-l-${color.split('-')[1]}-200 animate-spin`}
          style={{
            borderColor: 'transparent',
            borderLeftColor: 'currentColor',
            animationDelay: '0.3s',
          }}
        />
      </div>
      {text && <p className={`mt-2 text-sm ${color}`}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
