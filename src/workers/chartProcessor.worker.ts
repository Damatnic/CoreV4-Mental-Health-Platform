/// <reference lib="webworker" />
/**
 * Web Worker for Heavy Chart Calculations
 * Offloads intensive data processing from main thread
 */

// @ts-expect-error - DedicatedWorkerGlobalScope is a global API
declare const self: DedicatedWorkerGlobalScope;

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  metadata?: unknown;
}

interface ProcessingRequest {
  type: 'PROCESS_MOOD_DATA' | 'AGGREGATE_WELLNESS' | 'CALCULATE_TRENDS' | 'SAMPLE_DATA';
  data: ChartDataPoint[];
  options?: {
    interval?: 'day' | 'week' | 'month';
    smoothing?: boolean;
    sampling?: number;
    trendLine?: boolean;
  };
}

interface ProcessingResponse {
  type: string;
  result: unknown;
  processingTime: number;
}

interface ProcessingOptions {
  interval?: 'day' | 'week' | 'month';
  smoothing?: boolean;
  sampling?: number;
  trendLine?: boolean;
}

interface Patterns {
  weeklyPattern: { day: number; average: number }[];
  monthlyPattern: unknown[];
  peaks: unknown[];
  troughs: unknown[];
}

// Utility functions for data processing
const dataProcessors = {
  /**
   * Process mood data for visualization
   */
  processMoodData(data: ChartDataPoint[], options: ProcessingOptions = {}) {
    const startTime = performance.now();
    
    // Group by interval
    const grouped = this.groupByInterval(data, options.interval || 'day');
    
    // Calculate averages
    const averaged = Object.entries(grouped).map(([date, points]) => ({
      date,
      value: points.reduce((sum, p) => sum + p.value, 0) / points.length,
      count: points.length,
      min: Math.min(...points.map(p => p.value)),
      max: Math.max(...points.map(p => p.value)),
    }));
    
    // Apply smoothing if requested
    const result = options.smoothing 
      ? this.applySmoothing(averaged, 3)
      : averaged;
    
    return {
      processed: result,
      stats: this.calculateStats(data),
      processingTime: performance.now() - startTime,
    };
  },

  /**
   * Aggregate wellness metrics
   */
  aggregateWellness(data: ChartDataPoint[], _options: ProcessingOptions = {}) {
    const startTime = performance.now();
    
    // Calculate rolling averages
    const rollingAvg = this.calculateRollingAverage(data, 7);
    
    // Identify patterns
    const _patterns = this.identifyPatterns(data);
    
    // Calculate wellness score
    const wellnessScore = this.calculateWellnessScore(data);
    
    return {
      aggregated: rollingAvg,
      patterns,
      wellnessScore,
      insights: this.generateInsights(patterns, wellnessScore),
      processingTime: performance.now() - startTime,
    };
  },

  /**
   * Calculate trend lines and predictions
   */
  calculateTrends(data: ChartDataPoint[], _options: ProcessingOptions = {}) {
    const startTime = performance.now();
    
    // Linear regression for trend line
    const trendLine = this.linearRegression(data);
    
    // Calculate moving averages
    const movingAvg = {
      short: this.calculateMovingAverage(data, 7),
      medium: this.calculateMovingAverage(data, 30),
      long: this.calculateMovingAverage(data, 90),
    };
    
    // Detect trend direction
    const trendDirection = this.detectTrendDirection(trendLine);
    
    // Simple prediction (next 7 days)
    const predictions = this.generatePredictions(trendLine, 7);
    
    return {
      trendLine,
      movingAverages: movingAvg,
      direction: trendDirection,
      predictions,
      confidence: this.calculateConfidence(data, trendLine),
      processingTime: performance.now() - startTime,
    };
  },

  /**
   * Sample large datasets for performance
   */
  sampleData(data: ChartDataPoint[], options: ProcessingOptions = {}) {
    const targetSize = options.sampling || 100;
    
    if (data.length <= targetSize) {
      return data;
    }
    
    const step = Math.ceil(data.length / targetSize);
    const sampled: ChartDataPoint[] = [];
    
    for (let i = 0; i < data.length; i += step) {
      // Take average of points in step range
      const slice = data.slice(i, Math.min(i + step, data.length));
      const avgValue = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
      
      const middlePoint = slice[Math.floor(slice.length / 2)];
      if (!middlePoint) continue;
      
      sampled.push({
        date: middlePoint.date,
        value: avgValue,
        metadata: { sampled: true, originalCount: slice.length },
      });
    }
    
    return sampled;
  },

  // Helper functions
  groupByInterval(data: ChartDataPoint[], interval: string) {
    const grouped: { [key: string]: ChartDataPoint[] } = {};
    
    data.forEach(point => {
      const date = new Date(point.date);
      let key: string;
      
      switch (interval) {
        case "week": {
          const week = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${week}`;
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          key = date.toISOString().split('T')[0] || date.toISOString();
      }
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key]!.push(point);
    });
    
    return grouped;
  },

  getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  },

  applySmoothing(data: ChartDataPoint[], windowSize: number) {
    const smoothed = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
      const window = data.slice(start, end);
      
      const avgValue = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      
      smoothed.push({
        ...data[i],
        value: avgValue,
        smoothed: true,
      });
    }
    
    return smoothed;
  },

  calculateStats(data: ChartDataPoint[]) {
    const values = data.map(p => p.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean,
      median,
      min: Math.min(...values),
      max: Math.max(...values),
      stdDev,
      count: values.length,
    };
  },

  calculateRollingAverage(data: ChartDataPoint[], windowSize: number) {
    const result = [];
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
      
      result.push({
        ...data[i],
        rollingAvg: avg,
      });
    }
    
    return result;
  },

  identifyPatterns(data: ChartDataPoint[]) {
    const _patterns = {
      weeklyPattern: this.findWeeklyPattern(data),
      monthlyPattern: this.findMonthlyPattern(data),
      peaks: this.findPeaks(data),
      troughs: this.findTroughs(data),
    };
    
    return patterns;
  },

  findWeeklyPattern(data: ChartDataPoint[]) {
    const dayAverages: { [key: number]: number[] } = {};
    
    data.forEach(point => {
      const day = new Date(point.date).getDay();
      if (!dayAverages[day]) {
        dayAverages[day] = [];
      }
      dayAverages[day].push(point.value);
    });
    
    const pattern = Object.entries(dayAverages).map(([day, values]) => ({
      day: parseInt(day),
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
    }));
    
    return pattern;
  },

  findMonthlyPattern(data: ChartDataPoint[]) {
    const monthAverages: { [key: number]: number[] } = {};
    
    data.forEach(point => {
      const month = new Date(point.date).getMonth();
      if (!monthAverages[month]) {
        monthAverages[month] = [];
      }
      monthAverages[month].push(point.value);
    });
    
    const pattern = Object.entries(monthAverages).map(([month, values]) => ({
      month: parseInt(month),
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
    }));
    
    return pattern;
  },

  findPeaks(data: ChartDataPoint[], threshold = 0.8) {
    const values = data.map(p => p.value);
    const max = Math.max(...values);
    const peakThreshold = max * threshold;
    
    return data.filter(p => p.value >= peakThreshold);
  },

  findTroughs(data: ChartDataPoint[], threshold = 0.2) {
    const values = data.map(p => p.value);
    const max = Math.max(...values);
    const troughThreshold = max * threshold;
    
    return data.filter(p => p.value <= troughThreshold);
  },

  calculateWellnessScore(data: ChartDataPoint[]) {
    const recentData = data.slice(-30); // Last 30 days
    const avgMood = recentData.reduce((sum, p) => sum + p.value, 0) / recentData.length;
    const consistency = 1 - (this.calculateStats(recentData).stdDev / 10);
    const trend = this.detectTrendDirection(this.linearRegression(recentData));
    
    const trendScore = trend === 'improving' ? 1.2 : trend === 'declining' ? 0.8 : 1;
    
    return Math.min(100, Math.max(0, (avgMood * 10 * consistency * trendScore)));
  },

  generateInsights(patterns: Patterns, wellnessScore: number) {
    const insights = [];
    
    if (wellnessScore > 70) {
      insights.push('Your overall wellness is excellent. Keep up the great work!');
    } else if (wellnessScore > 50) {
      insights.push('Your wellness is good, with room for improvement.');
    } else {
      insights.push('Your wellness score suggests you might benefit from additional support.');
    }
    
    // Weekly pattern insights
    const bestDay = patterns.weeklyPattern.reduce((best, current) => 
      current.average > best.average ? current : best
    );
    insights.push(`You tend to feel best on ${this.getDayName(bestDay.day)}s.`);
    
    return insights;
  },

  getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  },

  linearRegression(data: ChartDataPoint[]) {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    data.forEach((point, i) => {
      sumX += i;
      sumY += point.value;
      sumXY += i * point.value;
      sumX2 += i * i;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  },

  calculateMovingAverage(data: ChartDataPoint[], period: number) {
    const result = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, p) => sum + p.value, 0) / period;
      
      const dataPoint = data[i];
      if (!dataPoint) continue;
      
      result.push({
        date: dataPoint.date,
        value: avg,
      });
    }
    
    return result;
  },

  detectTrendDirection(regression: { slope: number; intercept: number }) {
    if (regression.slope > 0.1) return 'improving';
    if (regression.slope < -0.1) return 'declining';
    return 'stable';
  },

  generatePredictions(regression: { slope: number; intercept: number }, days: number) {
    const predictions = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      
      const predictedValue = regression.intercept + regression.slope * i;
      
      predictions.push({
        date: futureDate.toISOString(),
        value: Math.max(0, Math.min(10, predictedValue)), // Clamp between 0-10
        isPrediction: true,
      });
    }
    
    return predictions;
  },

  calculateConfidence(data: ChartDataPoint[], regression: { slope: number; intercept: number }) {
    // Calculate R-squared
    const yMean = data.reduce((sum, p) => sum + p.value, 0) / data.length;
    let ssRes = 0, ssTot = 0;
    
    data.forEach((point, i) => {
      const predicted = regression.intercept + regression.slope * i;
      ssRes += Math.pow(point.value - predicted, 2);
      ssTot += Math.pow(point.value - yMean, 2);
    });
    
    const rSquared = 1 - (ssRes / ssTot);
    return Math.max(0, Math.min(1, rSquared));
  },
};

// Message handler
self.addEventListener('message', (event: MessageEvent<ProcessingRequest>) => {
  const { type, data, options } = event.data;
  const startTime = performance.now();
  
  let result: unknown;
  
  try {
    switch (type) {
      case 'PROCESS_MOOD_DATA':
        result = dataProcessors.processMoodData(data, options);
        break;
      
      case 'AGGREGATE_WELLNESS':
        result = dataProcessors.aggregateWellness(data, options);
        break;
      
      case 'CALCULATE_TRENDS':
        result = dataProcessors.calculateTrends(data, options);
        break;
      
      case 'SAMPLE_DATA':
        result = dataProcessors.sampleData(data, options);
        break;
      
      default:
        throw new Error(`Unknown processing type: ${type}`);
    }
    
    const response: ProcessingResponse = {
      type,
      result,
      processingTime: performance.now() - startTime,
    };
    
    self.postMessage(response);
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Processing error',
      processingTime: performance.now() - startTime,
    });
  }
});

// Export for TypeScript
export {};