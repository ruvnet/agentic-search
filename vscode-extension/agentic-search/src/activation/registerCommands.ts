import * as vscode from 'vscode';
import { getLogger } from '../utils/logging';

// Logger instance for command registration
const logger = getLogger('CommandRegistration');

/**
 * Register all commands for the extension
 * @param context The extension context
 */
export function registerCommands(context: vscode.ExtensionContext): void {
  logger.info('Registering extension commands');
  
  // Register the command to start the extension
  const startCommand = vscode.commands.registerCommand('agenticCopilot.start', () => {
    vscode.window.showInformationMessage('Agentic Copilot is ready in the @ picker of Copilot Chat');
    
    // Open VS Code settings to the Copilot section to help users enable Copilot Chat if needed
    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:github.copilot-chat');
  });
  
  // Register command to open extension settings
  const openSettingsCommand = vscode.commands.registerCommand('agenticCopilot.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:agentic-search');
  });
  
  // Register command to reset cached data
  const resetCacheCommand = vscode.commands.registerCommand('agenticCopilot.resetCache', async () => {
    try {
      // Clear any cached data stored in extension context
      await context.globalState.update('cachedSearchResults', undefined);
      await context.globalState.update('lastSearchTimestamp', undefined);
      
      vscode.window.showInformationMessage('Agentic Copilot cache has been cleared');
      logger.info('Cache cleared successfully');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
      vscode.window.showErrorMessage(`Failed to clear cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  
  // Add all commands to extension context so they are disposed when extension is deactivated
  context.subscriptions.push(
    startCommand,
    openSettingsCommand,
    resetCacheCommand
  );
  
  logger.info('Extension commands registered successfully');
}