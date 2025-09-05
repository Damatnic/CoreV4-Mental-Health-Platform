import React, { ReactNode, forwardRef } from 'react';

interface ConsoleFocusableProps {
  id?: string;
  group?: string;
  priority?: number;
  onActivate?: () => void;
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
    id,
    group,
    priority,
    onActivate,
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

    const handleActivate = () => {
      if (!disabled && onActivate) {
        onActivate();
      }
    };

    return (
      <div
        ref={ref}
        id={id}
        className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        tabIndex={disabled ? -1 : tabIndex}
        role={role}
        aria-label={ariaLabel}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleActivate}
        data-group={group}
        data-priority={priority}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ConsoleFocusable.displayName = 'ConsoleFocusable';