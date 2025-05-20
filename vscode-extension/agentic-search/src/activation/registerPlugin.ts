import * as vscode from 'vscode';
import { setupAgenticCopilotPlugin, AgenticCopilotPlugin } from '../plugin/AgenticCopilotPlugin';
import { getLogger } from '../utils/logging';

// Logger instance for plugin registration
const logger = getLogger('PluginRegistration');

/**
 * Register the extension as a Copilot Chat plugin
 * This function handles the registration of the plugin specified in package.json
 * and sets up the necessary event handlers and message handling
 *
 * @param context The extension context
 * @returns The initialized plugin instance
 */
export function registerPlugin(context: vscode.ExtensionContext): AgenticCopilotPlugin {
  logger.info('Registering Agentic Copilot plugin with Copilot Chat');
  
  // Initialize the plugin instance
  const plugin = setupAgenticCopilotPlugin(context);
  
  // Set up message handling for Copilot Chat
  setupMessageHandler(context, plugin);
  
  // Register event listeners for plugin state changes
  setupEventListeners(context, plugin);
  
  // Log that plugin registration is complete
  logger.info('Agentic Copilot plugin registered with Copilot Chat');
  
  return plugin;
}

/**
 * Set up the message handler to process incoming requests from Copilot Chat
 * This connects our plugin to the Copilot Chat interface
 *
 * @param context The extension context
 * @param plugin The plugin instance
 */
function setupMessageHandler(context: vscode.ExtensionContext, plugin: AgenticCopilotPlugin): void {
  // The actual message handling is managed by VS Code based on the plugin configuration in package.json
  // Our plugin.processMessage method will be called when messages are received
  
  // We could register additional handlers here if needed
  logger.info('Message handler set up for Copilot Chat integration');
  
  // Store plugin instance in global state for potential access by other parts of the extension
  context.globalState.update('pluginInstance', plugin);
}

/**
 * Set up event listeners for plugin state changes
 *
 * @param context The extension context
 * @param plugin The plugin instance
 */
function setupEventListeners(context: vscode.ExtensionContext, plugin: AgenticCopilotPlugin): void {
  // Listen for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('agenticCopilot')) {
        logger.info('Configuration changed, updating plugin settings');
        // Additional code to handle configuration changes
      }
    })
  );
  
  // Listen for extension message events (for potential communication between extension components)
  const extensionMessageListener = vscode.window.onDidChangeActiveTextEditor(() => {
    // This is a placeholder for potential future functionality
    // We might want to update the plugin state based on the active editor
  });
  
  context.subscriptions.push(extensionMessageListener);
  
  logger.info('Event listeners registered for plugin state changes');
}