import * as vscode from 'vscode';

/**
 * Initialize the token storage mechanism
 * This prepares the secure storage for storing sensitive tokens
 * 
 * @param context The extension context
 */
export async function initializeTokenStorage(context: vscode.ExtensionContext): Promise<void> {
  // Nothing special to initialize for VS Code's secretStorage
  // This function is included for future-proofing if initialization is needed later
  console.log('Token storage initialized');
}

/**
 * Store a token in secure storage
 * 
 * @param context The extension context
 * @param key The key to store the token under
 * @param token The token to store
 */
export async function storeToken(
  context: vscode.ExtensionContext,
  key: string,
  token: string
): Promise<void> {
  try {
    await context.secrets.store(key, token);
    console.log(`Token stored securely under key: ${key}`);
  } catch (error) {
    console.error(`Failed to store token for key ${key}:`, error);
    throw new Error(`Failed to store token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Retrieve a token from secure storage
 * 
 * @param context The extension context
 * @param key The key the token is stored under
 * @returns The token if found, undefined otherwise
 */
export async function getToken(
  context: vscode.ExtensionContext,
  key: string
): Promise<string | undefined> {
  try {
    const token = await context.secrets.get(key);
    return token || undefined;
  } catch (error) {
    console.error(`Failed to get token for key ${key}:`, error);
    return undefined;
  }
}

/**
 * Delete a token from secure storage
 * 
 * @param context The extension context
 * @param key The key the token is stored under
 */
export async function deleteToken(
  context: vscode.ExtensionContext,
  key: string
): Promise<void> {
  try {
    await context.secrets.delete(key);
    console.log(`Token deleted for key: ${key}`);
  } catch (error) {
    console.error(`Failed to delete token for key ${key}:`, error);
    throw new Error(`Failed to delete token: ${error instanceof Error ? error.message : String(error)}`);
  }
}