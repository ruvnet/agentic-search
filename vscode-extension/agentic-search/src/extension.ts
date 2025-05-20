import * as vscode from 'vscode';
import { setupAuthentication } from './auth/index';
import { registerCommands } from './activation/registerCommands';
import { registerPlugin } from './activation/registerPlugin';
import { setupLogging, getLogger } from './utils/logging';

// Set up logging system
let logger: any;

/**
 * This method is called when your extension is activated
 * Activation happens when:
 * 1. The extension is first loaded
 * 2. A command registered by the extension is executed
 * 3. A Copilot Chat query is directed to this extension
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    // Initialize logging system
    logger = setupLogging(context);
    logger.info('Activating Agentic Search extension');
    
    // Setup authentication providers (GitHub, etc.)
    await setupAuthentication(context);
    logger.info('Authentication setup complete');
    
    // Register all commands defined in package.json
    registerCommands(context);
    logger.info('Commands registered');
    
    // Register plugin with Copilot Chat
    const plugin = registerPlugin(context);
    logger.info('Plugin registered with Copilot Chat');
    
    // Log successful activation
    logger.info('Extension activated successfully');
    vscode.window.showInformationMessage('Agentic Search extension is now active and ready to use with Copilot Chat.');
    
    // Return API for possible use by other extensions
    return {
      plugin
    };
  } catch (error) {
    // Log and show any activation errors
    logger.error('Failed to activate extension:', error);
    vscode.window.showErrorMessage(`Failed to activate Agentic Search extension: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * This method is called when your extension is deactivated
 * Use this to clean up any resources
 */
export function deactivate() {
  logger.info('Deactivating Agentic Search extension');
  // Perform any cleanup here
}
