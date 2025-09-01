/**
 * High-Performance Chart Component
 * Optimized for mental health data visualization with web workers
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { startTransition, useDeferredValue } from 'react';
import { performanceMonitor } from '../../utils/performance/performanceMonitor';
import { LoadingFallbacks, UpdatePriority, usePrioritizedTransition } from '../../utils/performance/concurrentFeatures';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Initialize web worker
let chartWorker: Worker | null = null;

if (typeof Worker !== 'undefined') {
  try {
    chartWorker = new Worker(
      new URL('../../workers/chartProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );
  } catch (error) {
    console.warn('Web Worker not available, falling back to main thread processing');
  }
}

interface OptimizedChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: any[];
  options?: ChartOptions;
  height?: number;
  width?: number;
  priority?: UpdatePriority;
  enableWebWorker?: boolean;
  enableSampling?: boolean;
  samplingThreshold?: number;
  onDataProcessed?: (processedData: any) => void;
  className?: string;
}

export function OptimizedChart({
  type = 'line',
  data,
  options = {},
  height = 300,
  width,
  priority = UpdatePriority.MEDIUM,
  enableWebWorker = true,
  enableSampling = true,
  samplingThreshold = 1000,
  onDataProcessed,
  className = '',
}: OptimizedChartProps) {
  const chartRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedData, setProcessedData] = useState<ChartData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use deferred value for non-critical updates
  const deferredData = useDeferredValue(data);
  const [isPending, startPrioritizedTransition] = usePrioritizedTransition(priority);

  // Performance monitoring
  useEffect(() => {
    performanceMonitor.measureStart('chart-render');
    return () => {
      performanceMonitor.measureEnd('chart-render');
    };
  }, []);

  // Process data with web worker
  const processDataWithWorker = useCallback(async (rawData: any[]) => {
    if (!chartWorker || !enableWebWorker) {
      return processDataOnMainThread(rawData);
    }

    return new Promise((resolve, reject) => {
      const messageHandler = (event: MessageEvent) => {
        const { type, result, error } = event.data;
        
        if (error) {
          reject(new Error(error));
        } else {
          resolve(result);
        }
        
        chartWorker!.removeEventListener('message', messageHandler);
      };

      chartWorker.addEventListener('message', messageHandler);

      // Send data to worker
      chartWorker.postMessage({
        type: 'PROCESS_MOOD_DATA',
        data: rawData,
        options: {
          sampling: enableSampling && rawData.length > samplingThreshold ? 100 : null,
          smoothing: true,
          trendLine: type === 'line',
        },
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        chartWorker!.removeEventListener('message', messageHandler);
        reject(new Error('Worker timeout'));
      }, 5000);
    });
  }, [enableWebWorker, enableSampling, samplingThreshold, type]);

  // Fallback processing on main thread
  const processDataOnMainThread = useCallback((rawData: any[]) => {
    performanceMonitor.measureStart('chart-data-processing');
    
    try {
      // Sample data if needed
      let processedPoints = rawData;
      if (enableSampling && rawData.length > samplingThreshold) {
        const step = Math.ceil(rawData.length / 100);
        processedPoints = rawData.filter((_, index) => index % step === 0);
      }

      // Format for Chart.js
      const chartData: ChartData = {
        labels: processedPoints.map(p => p.label || p.date || p.x),
        datasets: [{
          label: 'Wellness Data',
          data: processedPoints.map(p => p.value || p.y),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: type === 'line' 
            ? 'rgba(59, 130, 246, 0.1)'
            : 'rgba(59, 130, 246, 0.5)',
          tension: 0.4,
          fill: type === 'line',
        }],
      };

      performanceMonitor.measureEnd('chart-data-processing');
      return chartData;
    } catch (error) {
      performanceMonitor.measureEnd('chart-data-processing');
      throw error;
    }
  }, [enableSampling, samplingThreshold, type]);

  // Process data when it changes
  useEffect(() => {
    if (!deferredData || deferredData.length === 0) {
      setProcessedData(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    const processData = async () => {
      try {
        const result = await processDataWithWorker(deferredData) as { processed?: Array<{ date: string, value: number }> };
        
        startPrioritizedTransition(() => {
          if (result.processed) {
            // Web worker result
            const chartData: ChartData = {
              labels: result.processed.map(p => p.date),
              datasets: [{
                label: 'Mood Trend',
                data: result.processed.map(p => p.value),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: type === 'line',
              }],
            };
            
            setProcessedData(chartData);
            
            if (onDataProcessed) {
              onDataProcessed(result);
            }
          } else {
            // Main thread result
            setProcessedData(result as ChartData);
          }
          
          setIsProcessing(false);
        });
      } catch (err) {
        console.error('Chart data processing error:', err);
        setError(err instanceof Error ? err.message : 'Processing failed');
        setIsProcessing(false);
        
        // Fallback to main thread
        try {
          const fallbackData = processDataOnMainThread(deferredData);
          setProcessedData(fallbackData);
        } catch (fallbackErr) {
          console.error('Fallback processing failed:', fallbackErr);
        }
      }
    };

    processData();
  }, [deferredData, processDataWithWorker, processDataOnMainThread, startPrioritizedTransition, type, onDataProcessed]);

  // Optimized chart options
  const optimizedOptions = useMemo<ChartOptions>(() => ({
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: priority === UpdatePriority.CRISIS ? 0 : 750,
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      ...options.plugins,
      decimation: {
        enabled: true,
        algorithm: 'lttb',
        samples: 100,
      },
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    } : undefined,
    elements: {
      point: {
        radius: data.length > 50 ? 0 : 3,
        hoverRadius: 5,
      },
      line: {
        borderWidth: 2,
      },
    },
  }), [options, priority, data.length, type]);

  // Handle chart instance
  useEffect(() => {
    if (chartRef.current) {
      const chart = chartRef.current;
      
      // Optimize canvas rendering
      if (chart.canvas) {
        const ctx = chart.canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
      }

      // Cleanup on unmount
      return () => {
        chart.destroy();
      };
    }
  }, []);

  // Render appropriate chart component
  const ChartComponent = useMemo(() => {
    switch (type) {
      case 'bar':
        return Bar;
      case 'doughnut':
        return Doughnut;
      default:
        return Line;
    }
  }, [type]);

  if (error) {
    return (
      <div className={`flex items-center justify-center h-${height} bg-red-50 rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">Chart Error</p>
          <p className="text-sm text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isProcessing || !processedData) {
    return <LoadingFallbacks.Chart />;
  }

  return (
    <div className={`chart-container ${className}`} style={{ height, width }}>
      <ChartComponent
        ref={chartRef}
        data={processedData}
        options={optimizedOptions}
      />
      {isPending && (
        <div className="absolute top-2 right-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Specialized mood chart with mental health features
 */
export function MoodChart({ 
  moodData, 
  showTrends = true,
  showInsights = true,
  ...props 
}: any) {
  const [insights, setInsights] = useState<string[]>([]);
  const [wellnessScore, setWellnessScore] = useState<number | null>(null);

  const handleDataProcessed = useCallback((result: any) => {
    if (result.insights) {
      setInsights(result.insights);
    }
    if (result.wellnessScore !== undefined) {
      setWellnessScore(result.wellnessScore);
    }
  }, []);

  return (
    <div className="mood-chart-container">
      <OptimizedChart
        type="line"
        data={moodData}
        priority={UpdatePriority.HIGH}
        onDataProcessed={handleDataProcessed}
        {...props}
      />
      
      {showInsights && insights.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Insights</h4>
          <ul className="space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-blue-700">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {wellnessScore !== null && (
        <div className="mt-4 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">Wellness Score</span>
          <div className="flex items-center space-x-2">
            <div className="relative w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${wellnessScore}%` }}
              />
            </div>
            <span className="text-lg font-bold text-gray-900">{Math.round(wellnessScore)}</span>
          </div>
        </div>
      )}
    </div>
  );
}