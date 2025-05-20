import * as vscode from 'vscode';
import { storeToken, getToken } from './tokenStorage';

// GitHub authentication provider ID
const GITHUB_AUTH_PROVIDER_ID = 'github';

// Required scopes for GitHub API access
const GITHUB_REQUIRED_SCOPES = ['repo', 'user'];

// Key for storing GitHub token in secure storage
const GITHUB_TOKEN_KEY = 'github-token';

/**
 * Setup GitHub authentication for the extension
 * @param context The extension context
 */
export async function setupGitHubAuth(context: vscode.ExtensionContext): Promise<void> {
  // Check if we already have a stored token
  const existingToken = await getToken(context, GITHUB_TOKEN_KEY);
  
  if (existingToken) {
    console.log('GitHub token found in secure storage');
    return;
  }
  
  try {
    // Register callback for session changes
    context.subscriptions.push(
      vscode.authentication.onDidChangeSessions(async e => {
        if (e.provider.id === GITHUB_AUTH_PROVIDER_ID) {
          console.log('GitHub authentication session changed, updating token');
          await updateGitHubToken(context);
        }
      })
    );
    
    // Initial token acquisition
    await updateGitHubToken(context);
    
  } catch (error) {
    console.error('GitHub authentication setup failed:', error);
    vscode.window.showErrorMessage(`GitHub authentication setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get and store the GitHub token from the authentication provider
 * @param context The extension context
 */
async function updateGitHubToken(context: vscode.ExtensionContext): Promise<string | undefined> {
  try {
    // Get GitHub authentication session
    const session = await vscode.authentication.getSession(
      GITHUB_AUTH_PROVIDER_ID,
      GITHUB_REQUIRED_SCOPES,
      { createIfNone: false, silent: true }
    );
    
    if (session) {
      // Store token in secure storage
      await storeToken(context, GITHUB_TOKEN_KEY, session.accessToken);
      return session.accessToken;
    }
    
    return undefined;
  } catch (error) {
    console.error('Failed to get GitHub token:', error);
    return undefined;
  }
}

/**
 * Get the GitHub token for API requests
 * @param context The extension context
 * @param createIfNone Whether to trigger authentication if no token exists
 * @returns Promise resolving to the GitHub token or undefined
 */
export async function getGitHubToken(
  context: vscode.ExtensionContext,
  createIfNone: boolean = false
): Promise<string | undefined> {
  // Try to get token from secure storage first
  const storedToken = await getToken(context, GITHUB_TOKEN_KEY);
  
  if (storedToken) {
    return storedToken;
  }
  
  if (createIfNone) {
    try {
      // Get authentication session
      const session = await vscode.authentication.getSession(
        GITHUB_AUTH_PROVIDER_ID,
        GITHUB_REQUIRED_SCOPES,
        { createIfNone: true }
      );
      
      // Store token in secure storage
      await storeToken(context, GITHUB_TOKEN_KEY, session.accessToken);
      return session.accessToken;
    } catch (error) {
      console.error('Failed to create GitHub authentication session:', error);
      vscode.window.showErrorMessage(`GitHub authentication failed: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }
  
  return undefined;
}