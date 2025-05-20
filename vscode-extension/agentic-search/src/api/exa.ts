import * as vscode from 'vscode';
import { ApiClient } from './index';
import { getToken, storeToken } from '../auth/tokenStorage';

// Define types for Exa AI API
export interface ExaSearchOptions {
  query: string;
  type?: 'keyword' | 'semantic' | 'hybrid' | 'auto';
  numResults?: number;
  startPublishedDate?: string;
  category?: 'news' | 'blog' | 'forum' | 'research' | 'docs' | 'github' | 'code';
  livecrawl?: 'always' | 'conditional' | 'never';
  contents?: {
    text?: boolean;
    summary?: {
      query?: string;
    };
  };
}

export interface ExaSearchResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text?: string;
  summary?: string;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  query: string;
  stats?: {
    timeTaken: number;
    totalResults: number;
  };
}

/**
 * Exa AI API client for interacting with Exa AI services
 */
export class ExaClient implements ApiClient {
  public isInitialized: boolean = false;
  public name: string = 'Exa AI';
  
  private apiKey?: string;
  private readonly apiKeyStorageKey = 'agenticCopilot.exa.apiKey';
  private readonly baseUrl = 'https://api.exa.ai';
  private context: vscode.ExtensionContext;
  
  /**
   * Initialize the Exa AI client with configuration
   * @param context The extension context
   * @param apiKey The Exa AI API key
   */
  constructor(context: vscode.ExtensionContext, apiKey?: string) {
    this.context = context;
    this.apiKey = apiKey;
    this.isInitialized = !!apiKey;
  }
  
  /**
   * Get the API key from configuration or secure storage
   * @returns The API key or undefined if not available
   */
  private async getApiKey(): Promise<string | undefined> {
    if (this.apiKey) {
      return this.apiKey;
    }
    
    // Try to get from secure storage first
    const storedKey = await getToken(this.context, this.apiKeyStorageKey);
    if (storedKey) {
      this.apiKey = storedKey;
      this.isInitialized = true;
      return storedKey;
    }
    
    // Fall back to settings
    const configKey = vscode.workspace.getConfiguration('agenticCopilot.exa').get<string>('apiKey');
    if (configKey) {
      // Store in secure storage for future use
      await storeToken(this.context, this.apiKeyStorageKey, configKey);
      this.apiKey = configKey;
      this.isInitialized = true;
    }
    
    return this.apiKey;
  }
  
  /**
   * Set the API key for Exa AI
   * @param apiKey The API key to set
   */
  public async setApiKey(apiKey: string): Promise<void> {
    if (!apiKey) {
      throw new Error('API key cannot be empty');
    }
    
    try {
      await storeToken(this.context, this.apiKeyStorageKey, apiKey);
      this.apiKey = apiKey;
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to store Exa AI API key:', error);
      throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a search query using Exa AI
   * @param options The search options
   * @returns Search results
   */
  public async search(options: ExaSearchOptions | string): Promise<ExaSearchResponse> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Exa AI API key not configured. Please add it in the extension settings.');
    }
    
    // If options is a string, convert it to a proper options object
    const searchOptions: ExaSearchOptions = typeof options === 'string'
      ? { query: options }
      : options;
    
    try {
      const url = `${this.baseUrl}/search`;
      
      const requestBody: ExaSearchOptions = {
        query: searchOptions.query,
        type: searchOptions.type || 'auto',
        numResults: searchOptions.numResults || 10,
        category: searchOptions.category,
        livecrawl: searchOptions.livecrawl || 'always',
        contents: searchOptions.contents || {
          text: true,
          summary: {}
        }
      };
      
      if (searchOptions.startPublishedDate) {
        requestBody.startPublishedDate = searchOptions.startPublishedDate;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Exa AI API request failed with status ${response.status}: ${errorText}`);
      }
      
      return await response.json() as ExaSearchResponse;
    } catch (error) {
      console.error('Error in Exa AI API request:', error);
      throw new Error(`Exa AI API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Execute a GitHub-specific search query using Exa AI
   * @param query The search query
   * @param numResults Number of results to return
   * @returns Search results for GitHub repositories
   */
  public async searchGitHub(query: string, numResults: number = 20): Promise<ExaSearchResponse> {
    return this.search({
      query,
      type: 'auto',
      numResults,
      startPublishedDate: '2023-01-01',
      category: 'github',
      livecrawl: 'always',
      contents: {
        summary: {
          query: 'overview of github repo'
        }
      }
    });
  }
  
  /**
   * Execute a news-specific search query using Exa AI
   * @param query The search query
   * @param numResults Number of results to return
   * @returns Search results for news articles
   */
  public async searchNews(query: string, numResults: number = 25): Promise<ExaSearchResponse> {
    return this.search({
      query,
      type: 'auto',
      numResults,
      startPublishedDate: '2023-01-01',
      category: 'news',
      livecrawl: 'always',
      contents: {
        text: true,
        summary: {}
      }
    });
  }
}

// Singleton instance
let exaClient: ExaClient | undefined;

/**
 * Setup the Exa AI client
 * @param context The extension context
 * @returns The initialized Exa AI client
 */
export function setupExaClient(context: vscode.ExtensionContext): ExaClient {
  // Get API key from settings
  const apiKey = vscode.workspace.getConfiguration('agenticCopilot.exa').get<string>('apiKey');
  
  if (!exaClient) {
    exaClient = new ExaClient(context, apiKey);
    
    // If API key is in settings and not yet stored securely, store it
    if (apiKey) {
      exaClient.setApiKey(apiKey).catch(error => {
        console.error('Failed to store API key from settings:', error);
      });
    }
  }
  
  return exaClient;
}