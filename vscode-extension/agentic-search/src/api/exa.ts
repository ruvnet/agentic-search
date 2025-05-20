import { ApiClient } from './index';
import { ConfigManager, getConfigManager, ConfigKey } from '../config/ConfigManager'; // Import ConfigManager

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
  
  private configManager: ConfigManager;
  private readonly baseUrl = 'https://api.exa.ai';
  
  /**
   * Initialize the Exa AI client with configuration
   * @param configManager The configuration manager instance
   */
  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    // Check initial status
    this.getApiKey().then(key => this.isInitialized = !!key);
  }
  
  /**
   * Get the API key from configuration or secure storage
   * @returns The API key or undefined if not available
   */
  private async getApiKey(): Promise<string | undefined> {
    const key = await this.configManager.getSecure(ConfigKey.EXA_API_KEY);
    this.isInitialized = !!key;
    return key;
  }
  
  /**
   * Set the API key for Exa AI
   * @param apiKey The API key to set
   */
  public async setApiKey(apiKey: string): Promise<void> {
    await this.configManager.storeSecure(ConfigKey.EXA_API_KEY, apiKey);
    this.isInitialized = true;
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
 * @returns The initialized Exa AI client
 */
export function setupExaClient(): ExaClient {
  const configManager = getConfigManager();
  if (!exaClient) {
    exaClient = new ExaClient(configManager);
  }
  return exaClient;
}