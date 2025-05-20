import * as vscode from 'vscode';
import { registerCommands } from '../agentic-search/src/activation/registerCommands';
import { registerPlugin } from '../agentic-search/src/activation/registerPlugin';
import { setupApiClients } from './api';
import { setupAuthentication } from './auth';
import { setupLogging, getLogger } from './utils/logging';
import { AgenticCopilotPlugin } from '../agentic-search/src/plugin/AgenticCopilotPlugin';

// Plugin instance to be used across the extension
let pluginInstance: AgenticCopilotPlugin;

/**
 * This method is called when the extension is activated.
 * Extension activation occurs when one of the activation events defined in package.json occurs.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Setup logging
    const logger = setupLogging(context);
    logger.info('Agentic Copilot extension is now active!');

    // Setup authentication providers
    await setupAuthentication(context);
    
    // Initialize API clients
    setupApiClients(context);
    
    // Register commands
    registerCommands(context);
    
    // Register as Copilot plugin and get the plugin instance
    pluginInstance = registerPlugin(context);

    // Register handler for Copilot Chat messages
    // This would be the entry point for incoming messages from Copilot Chat
    // In a real implementation, this would be registered with the Copilot API
    // For now, it's a placeholder for the actual integration
    
    // Register main command
    const disposable = vscode.commands.registerCommand('agenticCopilot.start', () => {
      vscode.window.showInformationMessage('Agentic Copilot is ready in the @ picker');
    });
    
    context.subscriptions.push(disposable);
    
    logger.info('Agentic Copilot initialization complete');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to activate Agentic Copilot extension:', error);
    vscode.window.showErrorMessage(`Agentic Copilot failed to initialize: ${errorMessage}`);
    
    // Log to output channel if logging is set up
    try {
      getLogger('Extension').error('Failed to activate extension', error);
    } catch (e) {
      // Ignore errors from logging
    }
  }
}

/**
 * This method is called when the extension is deactivated
 */
export function deactivate(): void {
  // Perform cleanup tasks if needed
  const logger = getLogger('Extension');
  logger.info('Agentic Copilot extension deactivated');
}

/**
 * Export the plugin instance for testing
 */
export function getPluginInstance(): AgenticCopilotPlugin | undefined {
  return pluginInstance;
}