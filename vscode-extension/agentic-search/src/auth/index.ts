import * as vscode from 'vscode';
import { setupGitHubAuth } from './githubAuth';
import { initializeTokenStorage } from './tokenStorage';
import { getLogger } from '../utils/logging';

// Logger instance for authentication
const logger = getLogger('Authentication');

/**
 * Setup all authentication providers for the extension
 * @param context The extension context
 */
export async function setupAuthentication(context: vscode.ExtensionContext): Promise<void> {
  try {
    logger.info('Setting up authentication providers');
    
    // Initialize secure token storage
    await initializeTokenStorage(context);
    logger.info('Token storage initialized');
    
    // Setup GitHub authentication
    await setupGitHubAuth(context);
    logger.info('GitHub authentication setup complete');
    
    // Store authentication status in extension state
    await context.globalState.update('authenticationInitialized', true);
    
    logger.info('All authentication providers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize authentication:', error);
    vscode.window.showErrorMessage(`Failed to initialize authentication: ${error instanceof Error ? error.message : String(error)}`);
    
    // Update authentication status in extension state
    await context.globalState.update('authenticationInitialized', false);
    await context.globalState.update('authenticationError', error instanceof Error ? error.message : String(error));
  }
}