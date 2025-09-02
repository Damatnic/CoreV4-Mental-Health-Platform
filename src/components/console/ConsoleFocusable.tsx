import React, { useRef, useEffect } from 'react';
import { useConsoleNavigation } from '../../hooks/useConsoleNavigation';

interface ConsoleFocusableProps {
  id: string;
  group: string;
  priority?: number;
  children: React.ReactNode;
  className?: string;
  onFocus?: () => void;
  onActivate?: () => void;
}

export function ConsoleFocusable({
  id,
  group,
  priority = 0,
  children,
  className = '',
  onFocus,
  onActivate,
}: ConsoleFocusableProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { registerFocusable, unregisterFocusable } = useConsoleNavigation();

  useEffect(() => {
    if (elementRef.current) {
      registerFocusable({
        id,
        element: elementRef.current,
        priority,
        group,
      });

      // Add console navigation classes
      elementRef.current.classList.add('console-focusable');
      
      return () => {
        unregisterFocusable(id);
      };
    }
  }, [id, group, priority, registerFocusable, unregisterFocusable]);

  // Handle focus events
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleFocus = () => {
      onFocus?.();
    };

    const handleClick = () => {
      onActivate?.();
    };

    element.addEventListener('focus', handleFocus);
    element.addEventListener('click', handleClick);

    return () => {
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('click', handleClick);
    };
  }, [onFocus, onActivate]);

  return (
    <div
      ref={elementRef}
      className={`console-focusable ${className}`}
      tabIndex={0}
      data-console-id={id}
      data-console-group={group}
    >
      {children}
    </div>
  );
}

// Add console focus styles
const consoleStyles = `
.console-focusable {
  transition: all 0.2s ease-out;
  position: relative;
}

.console-focused {
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2) !important;
  border-color: rgb(59 130 246 / 0.5) !important;
  z-index: 10;
}

.console-focused::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6);
  border-radius: inherit;
  z-index: -1;
  animation: console-pulse 2s linear infinite;
}

.console-activated {
  transform: scale(0.98);
  transition: transform 0.1s ease-out;
}

@keyframes console-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

/* Gamepad mode indicators */
.console-navigation-gamepad .console-focusable {
  border: 2px solid transparent;
}

.console-navigation-gamepad .console-focused {
  border-color: rgb(59 130 246);
  background: rgba(59, 130, 246, 0.1) !important;
}

/* Keyboard mode styling */
.console-navigation-keyboard .console-focused {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}
`;

// Inject styles when component is first imported
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = consoleStyles;
  document.head.appendChild(styleElement);
}