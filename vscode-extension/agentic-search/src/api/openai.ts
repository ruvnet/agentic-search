import * as vscode from 'vscode';
import { ApiClient } from './index';
import { getToken, storeToken } from '../auth/tokenStorage';

// Define types for OpenAI API
export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  messages: ChatCompletionMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI API client for interacting with OpenAI services
 */
export class OpenAIClient implements ApiClient {
  public isInitialized: boolean = false;
  public name: string = 'OpenAI';
  
  private apiKey?: string;
  private readonly apiKeyStorageKey = 'agenticCopilot.openai.apiKey';
  private readonly baseUrl = 'https://api.openai.com/v1';
  private context: vscode.ExtensionContext;
  
  /**
   * Initialize the OpenAI client with configuration
   * @param context The extension context
   * @param apiKey The OpenAI API key
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
    const configKey = vscode.workspace.getConfiguration('agenticCopilot.openai').get<string>('apiKey');
    if (configKey) {
      // Store in secure storage for future use
      await storeToken(this.context, this.apiKeyStorageKey, configKey);
      this.apiKey = configKey;
      this.isInitialized = true;
    }
    
    return this.apiKey;
  }
  
  /**
   * Set the API key for OpenAI
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
      console.error('Failed to store OpenAI API key:', error);
      throw new Error(`Failed to store API key: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Creates a completion for the chat message
   * @param options The chat completion options
   * @returns The completion response
   */
  public async createChatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please add it in the extension settings.');
    }
    
    try {
      const url = `${this.baseUrl}/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          top_p: options.top_p ?? 1.0,
          frequency_penalty: options.frequency_penalty ?? 0,
          presence_penalty: options.presence_penalty ?? 0,
          stream: options.stream ?? false,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API request failed with status ${response.status}: ${errorText}`);
      }
      
      return await response.json() as ChatCompletionResponse;
    } catch (error) {
      console.error('Error in OpenAI API request:', error);
      throw new Error(`OpenAI API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Creates a streaming chat completion
   * @param options The chat completion options (with stream=true)
   * @returns A readable stream of the completion response
   */
  public async createChatCompletionStream(options: ChatCompletionOptions): Promise<ReadableStream> {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured. Please add it in the extension settings.');
    }
    
    try {
      const url = `${this.baseUrl}/chat/completions`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: options.messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens,
          top_p: options.top_p ?? 1.0,
          frequency_penalty: options.frequency_penalty ?? 0,
          presence_penalty: options.presence_penalty ?? 0,
          stream: true,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API streaming request failed with status ${response.status}: ${errorText}`);
      }
      
      return response.body!;
    } catch (error) {
      console.error('Error in OpenAI API streaming request:', error);
      throw new Error(`OpenAI API streaming request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Singleton instance
let openaiClient: OpenAIClient | undefined;

/**
 * Setup the OpenAI client
 * @param context The extension context
 * @returns The initialized OpenAI client
 */
export function setupOpenAIClient(context: vscode.ExtensionContext): OpenAIClient {
  // Get API key from settings
  const apiKey = vscode.workspace.getConfiguration('agenticCopilot.openai').get<string>('apiKey');
  
  if (!openaiClient) {
    openaiClient = new OpenAIClient(context, apiKey);
    
    // If API key is in settings and not yet stored securely, store it
    if (apiKey) {
      openaiClient.setApiKey(apiKey).catch(error => {
        console.error('Failed to store API key from settings:', error);
      });
    }
  }
  
  return openaiClient;
}