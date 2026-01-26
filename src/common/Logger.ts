import * as fs from 'fs';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error'
}

export class Logger {
    private readonly logLevelPriorities: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    private readonly logLevel: LogLevel;
    private readonly logFile: string;

    constructor(logLevel: LogLevel, logFile: string) {
      this.logLevel = logLevel;
      this.logFile = logFile;
    }
  
    debug(...args: any[]): void {
      if (this.shouldLog(LogLevel.Debug)) {
        console.debug('[DEBUG]', ...args);
      }
    }
  
    info(...args: any[]): void {
      if (this.shouldLog(LogLevel.Info)) {
        console.info('[INFO]', ...args);
      }
    }
  
    warn(...args: any[]): void {
      if (this.shouldLog(LogLevel.Warn)) {
        console.warn('[WARN]', ...args);
      }
    }
  
    error(...args: any[]): void {
      if (this.shouldLog(LogLevel.Error)) {
        console.error('[ERROR]', ...args);
      }
    }

    logToFile(...args: any[]): void {
      const timestamp = new Date().toISOString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry = `[${timestamp}] ${message}\n`;
      
      try {
        fs.appendFileSync(this.logFile, logEntry);
      } catch (error) {
        this.error('Could not log to file:', error);
      }
    }

    private shouldLog(level: LogLevel): boolean {
        return this.logLevelPriorities[level] >= this.logLevelPriorities[this.logLevel];
      }
  }