/**
 * Ambient type declarations for React component libraries
 * Fixes missing type exports and provides proper TypeScript support
 */

// Fix react-window missing exports
declare module 'react-window' {
  import { ComponentType, CSSProperties, ReactNode, Ref } from 'react';
  
  // Export the correct component props interfaces
  export interface ListChildComponentProps<T = any> {
    index: number;
    style: CSSProperties;
    data: T;
  }
  
  export interface GridChildComponentProps<T = any> {
    columnIndex: number;
    rowIndex: number;
    style: CSSProperties;
    data: T;
  }

  // List component interfaces
  export interface ListProps<T = any> {
    children: ComponentType<ListChildComponentProps<T>>;
    height: number;
    width: number | string;
    itemCount: number;
    itemSize: number | ((index: number) => number);
    itemData?: T;
    itemKey?: (index: number, data: T) => string;
    overscanCount?: number;
    onScroll?: (props: {
      scrollDirection: 'forward' | 'backward';
      scrollOffset: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
    ref?: Ref<any>;
    className?: string;
    style?: CSSProperties;
    estimatedItemSize?: number;
  }

  // Variable size list props
  export interface VariableSizeListProps<T = any> extends Omit<ListProps<T>, 'itemSize'> {
    itemSize: (index: number) => number;
    estimatedItemSize?: number;
  }

  // Grid component interfaces  
  export interface GridProps<T = any> {
    children: ComponentType<GridChildComponentProps<T>>;
    height: number;
    width: number | string;
    columnCount: number;
    rowCount: number;
    columnWidth: number | ((index: number) => number);
    rowHeight: number | ((index: number) => number);
    itemData?: T;
    overscanCount?: number;
    onScroll?: (props: {
      scrollLeft: number;
      scrollTop: number;
      scrollUpdateWasRequested: boolean;
    }) => void;
    className?: string;
    style?: CSSProperties;
  }

  // Component exports
  export const List: ComponentType<ListProps>;
  export const FixedSizeList: ComponentType<ListProps>;
  export const VariableSizeList: ComponentType<VariableSizeListProps>;
  
  // Add VList as an alias to VariableSizeList (fix for the missing export)
  export const VList: ComponentType<VariableSizeListProps>;
  
  export const Grid: ComponentType<GridProps>;
  export const FixedSizeGrid: ComponentType<GridProps>;
  export const VariableSizeGrid: ComponentType<GridProps>;

  // Utility functions
  export function areEqual(
    prevProps: Record<string, any>,
    nextProps: Record<string, any>
  ): boolean;
  
  export function shouldComponentUpdate(
    props: Record<string, any>,
    nextProps: Record<string, any>
  ): boolean;
}

// React Error Boundary type fixes
declare module 'react-error-boundary' {
  import { ComponentType, ReactNode, Component } from 'react';

  export interface FallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
  }

  export interface ErrorBoundaryProps {
    children: ReactNode;
    FallbackComponent?: ComponentType<FallbackProps>;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: { componentStack: string }) => void;
    onReset?: () => void;
    resetKeys?: Array<string | number>;
    resetOnPropsChange?: boolean;
  }

  export class ErrorBoundary extends Component<ErrorBoundaryProps> {}
  
  export interface WithErrorBoundaryProps {
    onError?: (error: Error, errorInfo: { componentStack: string }) => void;
    fallback?: ReactNode;
    FallbackComponent?: ComponentType<FallbackProps>;
  }
  
  export function withErrorBoundary<P extends {}>(
    component: ComponentType<P>,
    errorBoundaryConfig: WithErrorBoundaryProps
  ): ComponentType<P>;
  
  export function useErrorHandler(): (error: Error) => void;
}

// React Circular Progress Bar
declare module 'react-circular-progressbar' {
  import { CSSProperties, ReactNode } from 'react';
  
  export interface CircularProgressbarProps {
    value: number;
    minValue?: number;
    maxValue?: number;
    text?: string;
    className?: string;
    strokeWidth?: number;
    background?: boolean;
    backgroundPadding?: number;
    counterClockwise?: boolean;
    styles?: {
      root?: CSSProperties;
      path?: CSSProperties;
      trail?: CSSProperties;
      text?: CSSProperties;
      background?: CSSProperties;
    };
  }
  
  export const CircularProgressbar: React.ComponentType<CircularProgressbarProps>;
  
  export interface CircularProgressbarWithChildrenProps extends CircularProgressbarProps {
    children: ReactNode;
  }
  
  export const CircularProgressbarWithChildren: React.ComponentType<CircularProgressbarWithChildrenProps>;
  
  export const buildStyles: (styles: {
    rotation?: number;
    strokeLinecap?: 'butt' | 'round' | 'square';
    textColor?: string;
    textSize?: string;
    pathColor?: string;
    pathTransition?: string;
    pathTransitionDuration?: number;
    trailColor?: string;
    backgroundColor?: string;
  }) => CircularProgressbarProps['styles'];
}

// React Hot Toast
declare module 'react-hot-toast' {
  import { ReactNode, CSSProperties } from 'react';
  
  export interface ToastOptions {
    id?: string;
    duration?: number;
    position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
    style?: CSSProperties;
    className?: string;
    icon?: ReactNode;
    iconTheme?: {
      primary: string;
      secondary: string;
    };
    ariaProps?: {
      role: 'status' | 'alert';
      'aria-live': 'assertive' | 'off' | 'polite';
    };
  }
  
  export interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'loading' | 'blank';
    visible: boolean;
    position?: ToastOptions['position'];
    duration?: number;
    style?: CSSProperties;
    className?: string;
    icon?: ReactNode;
    iconTheme?: ToastOptions['iconTheme'];
    ariaProps?: ToastOptions['ariaProps'];
    createdAt: number;
    pausedAt?: number;
    height?: number;
  }
  
  export interface ToasterProps {
    position?: ToastOptions['position'];
    toastOptions?: ToastOptions;
    reverseOrder?: boolean;
    gutter?: number;
    containerClassName?: string;
    containerStyle?: CSSProperties;
  }
  
  export const toast: {
    (message: string, options?: ToastOptions): string;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    loading: (message: string, options?: ToastOptions) => string;
    custom: (jsx: ReactNode, options?: ToastOptions) => string;
    dismiss: (toastId?: string) => void;
    remove: (toastId?: string) => void;
    promise: <T>(
      promise: Promise<T>,
      msgs: {
        loading: string;
        success: string;
        error: string;
      },
      options?: ToastOptions
    ) => Promise<T>;
  };
  
  export const Toaster: React.ComponentType<ToasterProps>;
  
  export const useToasterStore: (selector?: (state: {
    toasts: Toast[];
    pausedAt?: number;
  }) => any) => any;
  
  export const resolveValue: (
    valOrFunction: ReactNode | ((toast: Toast) => ReactNode),
    arg: Toast
  ) => ReactNode;
}