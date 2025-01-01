declare module 'pine' {
    export interface LogOptions {
      level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
      timestamp?: boolean;
      colorize?: boolean;
    }
  
    export interface Pine {
      log(message: string, options?: LogOptions): void;
      trace(message: string, options?: LogOptions): void;
      debug(message: string, options?: LogOptions): void;
      info(message: string, options?: LogOptions): void;
      warn(message: string, options?: LogOptions): void;
      error(message: string, options?: LogOptions): void;
      fatal(message: string, options?: LogOptions): void;
    }
  
    const pine: Pine;
    export default pine;
  }