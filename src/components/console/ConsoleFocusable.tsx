import React, { ReactNode, forwardRef } from 'react';

interface ConsoleFocusableProps {
  children: ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export const ConsoleFocusable = forwardRef<HTMLDivElement, ConsoleFocusableProps>(
  ({ 
    children, 
    onFocus, 
    onBlur, 
    className = '', 
    tabIndex = 0,
    role = 'button',
    ariaLabel,
    disabled = false,
    ...props 
  }, ref) => {
    const handleFocus = () => {
      if (!disabled && onFocus) {
        onFocus();
      }
    };

    const handleBlur = () => {
      if (!disabled && onBlur) {
        onBlur();
      }
    };

    return (
      <div
        ref={ref}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        tabIndex={disabled ? -1 : tabIndex}
        role={role}
        aria-label={ariaLabel}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ConsoleFocusable.displayName = 'ConsoleFocusable';