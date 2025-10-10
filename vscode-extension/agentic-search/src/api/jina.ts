import { ApiClient } from './index';
import { ConfigManager, getConfigManager, ConfigKey } from '../config/ConfigManager'; // Import ConfigManager
import { getLogger } from '../utils/logging';

const logger = getLogger('JinaClient');

export class JinaClient implements ApiClient {
  public isInitialized: boolean = false;
  public name: string = 'JinaAI';

  private configManager: ConfigManager;
  private readonly baseUrl = 'https://s.jina.ai';

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    // Check initial status
    this.getApiKey().then(key => this.isInitialized = !!key);
  }

  private async getApiKey(): Promise<string | undefined> {
    const key = await this.configManager.getSecure(ConfigKey.JINA_API_KEY);
    this.isInitialized = !!key;
    if (!key) {
      logger.warn('Jina API key not found via ConfigManager.');
    }
    return key;
  }

  public async setApiKey(apiKey: string): Promise<void> {
    await this.configManager.storeSecure(ConfigKey.JINA_API_KEY, apiKey);
    this.isInitialized = true;
    logger.info('Jina API key processed via ConfigManager and client status updated.');
  }
  
  public async search(keyword: string): Promise<string> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      logger.error('Jina API key is not configured.');
      throw new Error('Jina API key is not configured. Please add it in the extension settings.');
    }

    const requestUrl = `${this.baseUrl}/${encodeURIComponent(keyword)}`;
    logger.debug(`Making request to Jina API: ${requestUrl}`);

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Return-Format': 'markdown',
          'Accept': 'text/markdown', // Explicitly accept markdown
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error(`Jina API request failed with status ${response.status}: ${errorBody}`);
        throw new Error(`Jina API request failed with status ${response.status}: ${errorBody}`);
      }
      const responseData = await response.text();
      logger.debug('Jina API Response Data:', responseData.substring(0, 100) + (responseData.length > 100 ? '...' : ''));
      return responseData;
    } catch (error) {
      logger.error('Error fetching information using Jina API:', error);
      throw error; // Re-throw to be caught by handler
    }
  }
}

let jinaClient: JinaClient | undefined;

export function setupJinaClient(): JinaClient {
  const configManager = getConfigManager();
  if (!jinaClient) {
    jinaClient = new JinaClient(configManager);
  }
  return jinaClient;
}
