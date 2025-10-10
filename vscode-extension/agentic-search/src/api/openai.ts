import { ApiClient } from './index';
import { ConfigManager, getConfigManager, ConfigKey } from '../config/ConfigManager'; // Import ConfigManager

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
  
  private configManager: ConfigManager;
  private readonly baseUrl = 'https://api.openai.com/v1';
  
  /**
   * Initialize the OpenAI client with configuration
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
    const key = await this.configManager.getSecure(ConfigKey.OPENAI_API_KEY);
    this.isInitialized = !!key;
    return key;
  }
  
  /**
   * Set the API key for OpenAI
   * @param apiKey The API key to set
   */
  public async setApiKey(apiKey: string): Promise<void> {
    await this.configManager.storeSecure(ConfigKey.OPENAI_API_KEY, apiKey);
    this.isInitialized = true; 
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
 * @returns The initialized OpenAI client
 */
export function setupOpenAIClient(): OpenAIClient {
  const configManager = getConfigManager();
  if (!openaiClient) {
    openaiClient = new OpenAIClient(configManager);
  }
  return openaiClient;
}