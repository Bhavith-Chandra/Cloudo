import { CloudProvider } from '@/types';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = 'info';

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(log: LogMessage): string {
    const timestamp = log.timestamp.toISOString();
    const level = log.level.toUpperCase();
    const metadata = log.metadata
      ? ` ${JSON.stringify(log.metadata)}`
      : '';
    return `[${timestamp}] ${level}: ${log.message}${metadata}`;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const logMessage: LogMessage = {
      level,
      message,
      timestamp: new Date(),
      metadata,
    };

    const formattedMessage = this.formatMessage(logMessage);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  public info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  public error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  public logCloudOperation(
    operation: string,
    provider: CloudProvider,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error';
    const message = `${operation} operation for ${provider} ${success ? 'succeeded' : 'failed'}`;
    this.log(level, message, { provider, ...metadata });
  }

  public logApiRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
    const message = `${method} ${path} ${status} ${duration}ms`;
    this.log(level, message, { method, path, status, duration, ...metadata });
  }

  public logUserAction(
    userId: string,
    action: string,
    success: boolean,
    metadata?: Record<string, any>
  ): void {
    const level = success ? 'info' : 'error';
    const message = `User ${userId} ${action} ${success ? 'succeeded' : 'failed'}`;
    this.log(level, message, { userId, action, ...metadata });
  }
}

export const logger = Logger.getInstance(); 