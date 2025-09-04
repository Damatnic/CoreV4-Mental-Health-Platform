/**
 * UI Component Type Definitions
 * Provides type safety for UI components and icon mappings
 */

import type { LucideIcon } from 'lucide-react';

// Icon mapping types - flexible string-based mapping for Lucide icons
export type IconMap = Record<string, LucideIcon>;

// Widget icon props
export interface IconComponentProps {
  iconName: string;
  className?: string;
  size?: number;
}

// Schedule item type for TodaySchedule widget
export interface ScheduleItemType {
  _type: 'appointment' | 'medication' | 'activity' | 'reminder' | 'wellness';
}

// Contact preference types
export type ContactPreference = 'call' | 'text' | 'video' | 'any';

// Chart data types for analytics
export interface ChartDataPoint {
  date: string;
  mood?: number;
  anxiety?: number;
  energy?: number;
  sleep?: number;
  value?: number;
  label?: string;
  count?: number;
}

// Form data types
export interface FormFieldValue {
  [key: string]: string | number | boolean | FormFieldValue;
}


// Component ref types
export type ComponentRef<T = HTMLElement> = React.RefObject<T>;
export type ForwardedRef<T = HTMLElement> = React.ForwardedRef<T>;

// Event handler types
export type ClickHandler<T = HTMLElement> = (event: React.MouseEvent<T>) => void;
export type ChangeHandler<T = HTMLInputElement> = (event: React.ChangeEvent<T>) => void;
export type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type KeyboardHandler = (event: React.KeyboardEvent) => void;

// Generic callback types
export type VoidCallback = () => void;
export type AsyncVoidCallback = () => Promise<void>;
export type ValueCallback<T> = (value: T) => void;
export type AsyncValueCallback<T> = (value: T) => Promise<void>;

// Modal and dialog types
export interface ModalProps {
  isOpen: boolean;
  onClose: VoidCallback;
  title?: string;
  children: React.ReactNode;
}

// Loading states
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// Animation variants
export interface AnimationVariant {
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
}

// Theme color variants
export type ColorVariant = 
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

// Size variants
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// Button variants
export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';

// Input types
export type InputType = 
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

// Notification types
export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: VoidCallback;
}

// Table column definitions
export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string | number;
  render?: (value: any, row: T) => React.ReactNode;
}

// Pagination types
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: ValueCallback<number>;
  pageSize?: number;
  totalItems?: number;
}

// Dropdown menu types
export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: string;
  onClick?: VoidCallback;
  disabled?: boolean;
  divider?: boolean;
}

// Tab types
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: string;
  disabled?: boolean;
}

// Badge types
export interface BadgeProps {
  variant?: ColorVariant;
  size?: SizeVariant;
  children: React.ReactNode;
}

// Card types
export interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

// Mood Analytics types
export interface MoodEntry {
  moodScore: number;
  stressLevel?: number;
  energyLevel?: number;
  anxietyLevel?: number;
  sleep?: number;
  exercise?: boolean;
  socialInteraction?: number;
  weather?: string;
  triggers: string[];
  timestamp: string;
  notes?: string;
}

export interface AnalyticsDataMap {
  date: string;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
  avgAnxiety: number;
  sleep: number;
  exercise: boolean;
  socialInteraction: number;
  entries: MoodEntry[];
}

// Avatar types
export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: SizeVariant;
  status?: 'online' | 'offline' | 'away' | 'busy';
}

// Progress types
export interface ProgressProps {
  value: number;
  max?: number;
  variant?: ColorVariant;
  size?: SizeVariant;
  label?: string;
  showPercentage?: boolean;
}

// Tooltip types
export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

// Alert types
export interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: VoidCallback;
}