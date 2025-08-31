import React from 'react';
import { AlertCircle } from 'lucide-react';

interface CrisisButtonProps {
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
}

const CrisisButton: React.FC<CrisisButtonProps> = ({ 
  onClick, 
  className = '', 
  size = 'medium',
  variant = 'primary'
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-red-100 hover:bg-red-200 text-red-700'
  };

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 font-semibold rounded-lg
        transition-colors duration-200 focus:outline-none focus:ring-2 
        focus:ring-red-500 focus:ring-offset-2
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      aria-label="Crisis support"
    >
      <AlertCircle className={size === 'small' ? 'w-4 h-4' : size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} />
      <span>Crisis Support</span>
    </button>
  );
};

export default CrisisButton;