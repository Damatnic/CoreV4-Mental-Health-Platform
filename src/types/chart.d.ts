/**
 * Chart.js and visualization library type declarations
 * Provides additional types for chart configurations and plugins
 */

declare module 'chart.js' {
  // Core Chart class
  export class Chart {
    constructor(ctx: unknown, config: unknown);
    static register(...components: unknown[]): void;
    static getChart(key: unknown): Chart | undefined;
    static defaults: unknown;
    destroy(): void;
    update(mode?: string): void;
    render(): void;
    stop(): void;
    resize(width?: number, height?: number): void;
    clear(): void;
    toBase64Image(): string;
    generateLegend(): string;
    getElementsAtEventForMode(e: unknown, mode: string, options: unknown, useFinalPosition?: boolean): unknown[];
    getSortedVisibleDatasetMetas(): unknown[];
    getDatasetMeta(datasetIndex: number): unknown;
    getContext(): unknown;
    getCanvas(): HTMLCanvasElement;
    data: unknown;
    options: unknown;
  }
  
  // Chart components and scales
  export class CategoryScale {}
  export class LinearScale {}
  export class PointElement {}
  export class LineElement {}
  export class BarElement {}
  export class ArcElement {}
  export class Title {}
  export class Tooltip {}
  export class Legend {}
  export class Filler {}
  
  // Chart configuration interfaces
  export interface ChartConfiguration {
    type: string;
    data: ChartData;
    options?: ChartOptions;
    plugins?: Plugin[];
  }
  
  export interface ChartData {
    labels?: unknown[];
    datasets: Dataset[];
  }
  
  export interface Dataset {
    label?: string;
    data: unknown[];
    backgroundColor?: unknown;
    borderColor?: unknown;
    borderWidth?: number;
    [key: string]: unknown;
  }
  
  export interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: unknown;
    scales?: unknown;
    elements?: unknown;
    layout?: unknown;
    animation?: unknown;
    [key: string]: unknown;
  }
  
  export type ChartType = 'line' | 'bar' | 'radar' | 'doughnut' | 'pie' | 'polarArea' | 'bubble' | 'scatter';
  
  export interface Plugin<TType extends ChartType = ChartType> {
    id?: string;
    beforeInit?: (chart: Chart, args: unknown, options: unknown) => void;
    afterInit?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    afterUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeElementsUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeLayout?: (chart: Chart, args: unknown, options: unknown) => void;
    afterLayout?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDatasetsUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDatasetsUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDatasetUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDatasetUpdate?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeRender?: (chart: Chart, args: unknown, options: unknown) => void;
    afterRender?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDatasetsDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDatasetsDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDatasetDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDatasetDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeTooltipDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    afterTooltipDraw?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeEvent?: (chart: Chart, args: unknown, options: unknown) => void;
    afterEvent?: (chart: Chart, args: unknown, options: unknown) => void;
    beforeDestroy?: (chart: Chart, args: unknown, options: unknown) => void;
    afterDestroy?: (chart: Chart, args: unknown, options: unknown) => void;
    install?: (chart: Chart, args: unknown, options: unknown) => void;
    uninstall?: (chart: Chart, args: unknown, options: unknown) => void;
  }
  
  // Mental health specific chart data structures
  export interface MoodChartData {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
      fill?: boolean;
      tension?: number;
      pointRadius?: number;
      pointHoverRadius?: number;
    }>;
  }

  export interface WellnessMetricData {
    date: string;
    mood: number;
    anxiety: number;
    energy: number;
    sleep: number;
    stress: number;
  }

  export interface CrisisPatternData {
    timestamp: string;
    severity: number;
    triggers: string[];
    duration: number;
    intervention: string;
  }

  // Chart.js plugin extensions for mental health visualizations
  export interface MentalHealthChartPlugin extends Plugin<ChartType> {
    beforeDraw?: (chart: unknown, args: unknown, options: unknown) => void;
    afterDraw?: (chart: unknown, args: unknown, options: unknown) => void;
    beforeDatasetDraw?: (chart: unknown, args: unknown, options: unknown) => void;
    afterDatasetDraw?: (chart: unknown, args: unknown, options: unknown) => void;
  }

  // Mood tracking chart configuration
  export interface MoodChartConfiguration extends ChartConfiguration {
    type: 'line' | 'bar' | 'radar' | 'scatter';
    data: MoodChartData;
    options?: ChartOptions & {
      mentalHealth?: {
        showTrendLine?: boolean;
        highlightCrisis?: boolean;
        anonymizeData?: boolean;
        colorScheme?: 'therapeutic' | 'calming' | 'energetic';
      };
    };
  }

  // Wellness dashboard chart types
  export type WellnessChartType = 
    | 'mood-tracker' 
    | 'anxiety-levels' 
    | 'sleep-pattern' 
    | 'energy-flow' 
    | 'crisis-timeline'
    | 'therapy-progress'
    | 'medication-adherence'
    | 'social-engagement';

  // Chart utility functions for mental health data
  export interface ChartUtils {
    calculateMoodTrend: (data: WellnessMetricData[]) => number;
    identifyPatterns: (data: WellnessMetricData[]) => string[];
    generateInsights: (data: WellnessMetricData[]) => {
      trend: 'improving' | 'stable' | 'concerning';
      recommendations: string[];
      riskLevel: 'low' | 'medium' | 'high';
    };
    formatTherapeuticData: (raw: unknown[]) => MoodChartData;
  }

  // Export enhanced chart configuration
  export const MentalHealthChart: {
    create: (config: MoodChartConfiguration) => any;
    updateSafely: (chart: unknown, data: MoodChartData) => void;
    addPrivacyLayer: (chart: unknown, level: 'none' | 'blur' | 'aggregate') => void;
  };
}

declare module 'react-chartjs-2' {
  import { ComponentType } from 'react';
  import { ChartProps, ChartConfiguration, ChartOptions } from 'chart.js';

  // Enhanced chart components with mental health specific props
  export interface MentalHealthChartProps extends Omit<ChartProps, 'type'> {
    data: unknown;
    options?: ChartOptions & {
      mentalHealth?: {
        showTrendLine?: boolean;
        highlightCrisis?: boolean;
        anonymizeData?: boolean;
        colorScheme?: 'therapeutic' | 'calming' | 'energetic';
        enableTooltips?: boolean;
        showDataLabels?: boolean;
      };
      accessibility?: {
        announceOnHover?: boolean;
        describeChart?: string;
        enableKeyboardNav?: boolean;
      };
    };
    plugins?: unknown[];
    redraw?: boolean;
    updateMode?: 'resize' | 'reset' | 'none' | 'hide' | 'show' | 'active';
    height?: number;
    width?: number;
    id?: string;
    className?: string;
    style?: React.CSSProperties;
  }

  // Chart component exports
  export const Line: ComponentType<MentalHealthChartProps>;
  export const Bar: ComponentType<MentalHealthChartProps>;
  export const Radar: ComponentType<MentalHealthChartProps>;
  export const Doughnut: ComponentType<MentalHealthChartProps>;
  export const PolarArea: ComponentType<MentalHealthChartProps>;
  export const Bubble: ComponentType<MentalHealthChartProps>;
  export const Scatter: ComponentType<MentalHealthChartProps>;
  
  // Specific mental health chart components
  export const MoodTracker: ComponentType<MentalHealthChartProps & {
    moodData: Array<{
      date: string;
      mood: number;
      energy: number;
      anxiety: number;
    }>;
    timeRange: '7d' | '30d' | '90d' | '1y';
  }>;

  export const AnxietyLevels: ComponentType<MentalHealthChartProps & {
    anxietyData: Array<{
      timestamp: string;
      level: number;
      triggers?: string[];
    }>;
    showTriggers?: boolean;
  }>;

  export const SleepPattern: ComponentType<MentalHealthChartProps & {
    sleepData: Array<{
      date: string;
      bedtime: string;
      wakeup: string;
      quality: number;
      duration: number;
    }>;
    showQuality?: boolean;
  }>;

  // Chart registration and defaults
  export function getElementAtEvent(chart: unknown, event: React.MouseEvent): unknown[];
  export function getElementsAtEvent(chart: unknown, event: React.MouseEvent): unknown[];
  export function getDatasetAtEvent(chart: unknown, event: React.MouseEvent): unknown[];
}