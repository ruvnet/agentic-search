import * as vscode from 'vscode';
import { setupOpenAIClient, OpenAIClient } from './openai';
import { setupGitHubClient, GitHubClient } from './github';
import { setupExaClient, ExaClient } from './exa';

// Export API client interfaces for use in other modules
export interface ApiClient {
  isInitialized: boolean;
  name: string;
}

// Export all clients for use in other modules
export {
  OpenAIClient,
  GitHubClient,
  ExaClient
};

// Export client setup functions
export {
  setupOpenAIClient,
  setupGitHubClient,
  setupExaClient
};

// Client instances for singleton access
let openaiClientInstance: OpenAIClient | undefined;
let githubClientInstance: GitHubClient | undefined;
let exaClientInstance: ExaClient | undefined;

/**
 * Initialize all API clients required by the extension
 * @param context The extension context
 */
export function setupApiClients(context: vscode.ExtensionContext): void {
  // Initialize the OpenAI client
  openaiClientInstance = setupOpenAIClient(context);
  
  // Initialize the GitHub client
  githubClientInstance = setupGitHubClient(context);
  
  // Initialize the Exa AI client
  exaClientInstance = setupExaClient(context);
  
  console.log('API clients initialized');
}

/**
 * Get the OpenAI client instance
 * @returns The OpenAI client instance
 */
export function getOpenAIClient(): OpenAIClient | undefined {
  return openaiClientInstance;
}

/**
 * Get the GitHub client instance
 * @returns The GitHub client instance
 */
export function getGitHubClient(): GitHubClient | undefined {
  return githubClientInstance;
}

/**
 * Get the Exa client instance
 * @returns The Exa client instance
 */
export function getExaClient(): ExaClient | undefined {
  return exaClientInstance;
}