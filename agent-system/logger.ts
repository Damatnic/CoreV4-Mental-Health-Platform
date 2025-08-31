// Logger utility for agent system
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, ...args: unknown[]): void {
    // In production, this would send to a logging service
    // For development, we use console.warn to comply with ESLint
    console.warn(`[${this.context}] INFO:`, message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.context}] ERROR:`, message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] WARN:`, message, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    // Debug logs are suppressed in production
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[${this.context}] DEBUG:`, message, ...args);
    }
  }
}

// Create singleton loggers for common contexts
export const systemLogger = new Logger('System');
export const orchestratorLogger = new Logger('Orchestrator');
export const agentLogger = new Logger('Agent');