import * as vscode from 'vscode';

// Output channel for extension logs
let outputChannel: vscode.OutputChannel;

/**
 * Logger class for consistent logging throughout the extension
 */
export class Logger {
  private name: string;
  
  /**
   * Create a new logger instance
   * @param name The name of the logger (usually component name)
   */
  constructor(name: string) {
    this.name = name;
  }
  
  /**
   * Log an informational message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }
  
  /**
   * Log an error message
   * @param message The message to log
   * @param error Optional error to include in the log
   */
  public error(message: string, error?: any): void {
    this.log('ERROR', message, error);
    
    // For errors, also show a notification
    vscode.window.showErrorMessage(`${this.name}: ${message}`);
  }
  
  /**
   * Log a debug message (only shown in development mode)
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  public debug(message: string, data?: any): void {
    // Only log if debug mode is enabled
    if (vscode.workspace.getConfiguration('agenticCopilot').get<boolean>('debugMode', false)) {
      this.log('DEBUG', message, data);
    }
  }
  
  /**
   * Internal method to log with consistency
   * @param level The log level
   * @param message The message to log
   * @param data Optional data to include
   */
  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] [${level}] [${this.name}] ${message}`;
    
    // Add data if provided
    if (data) {
      if (data instanceof Error) {
        logMessage += `\n${data.stack || data.message}`;
      } else if (typeof data === 'object') {
        try {
          logMessage += `\n${JSON.stringify(data, null, 2)}`;
        } catch (e) {
          logMessage += `\n[Object could not be stringified]`;
        }
      } else {
        logMessage += `\n${data}`;
      }
    }
    
    // Log to output channel
    outputChannel.appendLine(logMessage);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development' || level === 'ERROR') {
      console.log(logMessage);
    }
  }
}

/**
 * Setup logging for the extension
 * @param context The extension context
 * @returns A logger instance for the main extension
 */
export function setupLogging(context: vscode.ExtensionContext): Logger {
  // Create output channel if it doesn't exist
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('Agentic Copilot');
    context.subscriptions.push(outputChannel);
  }
  
  // Return main logger instance
  return new Logger('Extension');
}

/**
 * Get a logger for a specific component
 * @param name The name of the component
 * @returns A logger instance for the component
 */
export function getLogger(name: string): Logger {
  // Ensure output channel exists
  if (!outputChannel) {
    throw new Error('Logging not initialized. Call setupLogging first.');
  }
  
  return new Logger(name);
}