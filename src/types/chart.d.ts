/**
 * Chart.js and visualization library type declarations
 * Provides additional types for chart configurations and plugins
 */

declare module 'chart.js' {
  // Core Chart class
  export class Chart {
    constructor(ctx: any, config: any);
    static register(...components: any[]): void;
    static getChart(key: any): Chart | undefined;
    static defaults: any;
    destroy(): void;
    update(mode?: string): void;
    render(): void;
    stop(): void;
    resize(width?: number, height?: number): void;
    clear(): void;
    toBase64Image(): string;
    generateLegend(): string;
    getElementsAtEventForMode(e: any, mode: string, options: any, useFinalPosition?: boolean): any[];
    getSortedVisibleDatasetMetas(): any[];
    getDatasetMeta(datasetIndex: number): any;
    getContext(): any;
    getCanvas(): HTMLCanvasElement;
    data: any;
    options: any;
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
    labels?: any[];
    datasets: Dataset[];
  }
  
  export interface Dataset {
    label?: string;
    data: any[];
    backgroundColor?: any;
    borderColor?: any;
    borderWidth?: number;
    [key: string]: any;
  }
  
  export interface ChartOptions {
    responsive?: boolean;
    maintainAspectRatio?: boolean;
    plugins?: any;
    scales?: any;
    elements?: any;
    layout?: any;
    animation?: any;
    [key: string]: any;
  }
  
  export type ChartType = 'line' | 'bar' | 'radar' | 'doughnut' | 'pie' | 'polarArea' | 'bubble' | 'scatter';
  
  export interface Plugin<TType extends ChartType = ChartType> {
    id?: string;
    beforeInit?: (chart: Chart, args: any, options: any) => void;
    afterInit?: (chart: Chart, args: any, options: any) => void;
    beforeUpdate?: (chart: Chart, args: any, options: any) => void;
    afterUpdate?: (chart: Chart, args: any, options: any) => void;
    beforeElementsUpdate?: (chart: Chart, args: any, options: any) => void;
    beforeLayout?: (chart: Chart, args: any, options: any) => void;
    afterLayout?: (chart: Chart, args: any, options: any) => void;
    beforeDatasetsUpdate?: (chart: Chart, args: any, options: any) => void;
    afterDatasetsUpdate?: (chart: Chart, args: any, options: any) => void;
    beforeDatasetUpdate?: (chart: Chart, args: any, options: any) => void;
    afterDatasetUpdate?: (chart: Chart, args: any, options: any) => void;
    beforeRender?: (chart: Chart, args: any, options: any) => void;
    afterRender?: (chart: Chart, args: any, options: any) => void;
    beforeDraw?: (chart: Chart, args: any, options: any) => void;
    afterDraw?: (chart: Chart, args: any, options: any) => void;
    beforeDatasetsDraw?: (chart: Chart, args: any, options: any) => void;
    afterDatasetsDraw?: (chart: Chart, args: any, options: any) => void;
    beforeDatasetDraw?: (chart: Chart, args: any, options: any) => void;
    afterDatasetDraw?: (chart: Chart, args: any, options: any) => void;
    beforeTooltipDraw?: (chart: Chart, args: any, options: any) => void;
    afterTooltipDraw?: (chart: Chart, args: any, options: any) => void;
    beforeEvent?: (chart: Chart, args: any, options: any) => void;
    afterEvent?: (chart: Chart, args: any, options: any) => void;
    beforeDestroy?: (chart: Chart, args: any, options: any) => void;
    afterDestroy?: (chart: Chart, args: any, options: any) => void;
    install?: (chart: Chart, args: any, options: any) => void;
    uninstall?: (chart: Chart, args: any, options: any) => void;
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
    beforeDraw?: (chart: any, args: any, options: any) => void;
    afterDraw?: (chart: any, args: any, options: any) => void;
    beforeDatasetDraw?: (chart: any, args: any, options: any) => void;
    afterDatasetDraw?: (chart: any, args: any, options: any) => void;
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
    formatTherapeuticData: (raw: any[]) => MoodChartData;
  }

  // Export enhanced chart configuration
  export const MentalHealthChart: {
    create: (config: MoodChartConfiguration) => any;
    updateSafely: (chart: any, data: MoodChartData) => void;
    addPrivacyLayer: (chart: any, level: 'none' | 'blur' | 'aggregate') => void;
  };
}

declare module 'react-chartjs-2' {
  import { ComponentType } from 'react';
  import { ChartProps, ChartConfiguration, ChartOptions } from 'chart.js';

  // Enhanced chart components with mental health specific props
  export interface MentalHealthChartProps extends Omit<ChartProps, 'type'> {
    data: any;
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
    plugins?: any[];
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
  export function getElementAtEvent(chart: any, event: React.MouseEvent): any[];
  export function getElementsAtEvent(chart: any, event: React.MouseEvent): any[];
  export function getDatasetAtEvent(chart: any, event: React.MouseEvent): any[];
}