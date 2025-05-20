import * as vscode from 'vscode';
import { getToken, storeToken, deleteToken } from '../auth/tokenStorage';

/**
 * Configuration keys for the extension
 */
export enum ConfigKey {
  // OpenAI configuration
  OPENAI_API_KEY = 'agenticCopilot.openai.apiKey',
  OPENAI_MODEL = 'agenticCopilot.openai.model',
  
  // Exa configuration
  EXA_API_KEY = 'agenticCopilot.exa.apiKey',
  
  // GitHub configuration
  GITHUB_PERSONAL_ACCESS_TOKEN = 'agenticCopilot.github.personalAccessToken',
  
  // General configuration
  SEARCH_RESULTS_LIMIT = 'agenticCopilot.search.resultsLimit',
  ENABLE_TELEMETRY = 'agenticCopilot.enableTelemetry',
  PLUGIN_ENABLED = 'agenticCopilot.pluginEnabled'
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Partial<Record<ConfigKey, unknown>> = {
  [ConfigKey.OPENAI_MODEL]: 'gpt-3.5-turbo',
  [ConfigKey.SEARCH_RESULTS_LIMIT]: 10,
  [ConfigKey.ENABLE_TELEMETRY]: false,
  [ConfigKey.PLUGIN_ENABLED]: true
};

/**
 * Configuration manager for handling extension settings
 */
export class ConfigManager {
  private context: vscode.ExtensionContext;
  
  /**
   * Initialize the configuration manager
   * @param context The extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  
  /**
   * Get a configuration value
   * @param key The configuration key
   * @returns The configuration value or undefined if not set
   */
  public get<T>(key: ConfigKey): T | undefined {
    return vscode.workspace.getConfiguration().get<T>(key);
  }
  
  /**
   * Get a configuration value with a default fallback
   * @param key The configuration key
   * @param defaultValue The default value to return if the configuration is not set
   * @returns The configuration value or the default value
   */
  public getWithDefault<T>(key: ConfigKey, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }
  
  /**
   * Get a configuration value using the predefined defaults
   * @param key The configuration key
   * @returns The configuration value or the default value if defined, otherwise undefined
   */
  public getWithPredefinedDefault<T>(key: ConfigKey): T | undefined {
    if (key in DEFAULT_CONFIG) {
      const defaultValue = DEFAULT_CONFIG[key] as unknown as T;
      return this.getWithDefault<T>(key, defaultValue);
    }
    return this.get<T>(key);
  }
  
  /**
   * Update a configuration value
   * @param key The configuration key
   * @param value The value to set
   * @param configurationTarget Where to store the setting
   */
  public async update<T>(
    key: ConfigKey, 
    value: T, 
    configurationTarget: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    await vscode.workspace.getConfiguration().update(key, value, configurationTarget);
  }
  
  /**
   * Get a secure value (API key, token, etc.)
   * @param key The key to retrieve
   * @returns The secure value or undefined if not set
   */
  public async getSecure(key: ConfigKey): Promise<string | undefined> {
    // Try to get from secure storage first
    const storedValue = await getToken(this.context, key);
    if (storedValue) {
      return storedValue;
    }
    
    // Fall back to settings (for backward compatibility)
    const configValue = this.get<string>(key);
    if (configValue) {
      // If found in settings, store it securely for future use and remove from settings
      await this.storeSecure(key, configValue);
      await this.update(key, undefined); // Clear from settings
    }
    
    return configValue || undefined;
  }
  
  /**
   * Store a secure value (API key, token, etc.)
   * @param key The key to store under
   * @param value The value to store
   */
  public async storeSecure(key: ConfigKey, value: string): Promise<void> {
    if (!value) {
      throw new Error(`Value for ${key} cannot be empty`);
    }
    
    await storeToken(this.context, key, value);
  }
  
  /**
   * Delete a secure value
   * @param key The key to delete
   */
  public async deleteSecure(key: ConfigKey): Promise<void> {
    await deleteToken(this.context, key);
  }
  
  /**
   * Check if a secure value exists
   * @param key The key to check
   * @returns True if the secure value exists, false otherwise
   */
  public async hasSecure(key: ConfigKey): Promise<boolean> {
    const value = await this.getSecure(key);
    return !!value;
  }
}

// Singleton instance
let configManagerInstance: ConfigManager | undefined;

/**
 * Get the global ConfigManager instance
 * @param context The extension context (required only for first initialization)
 * @returns The ConfigManager instance
 */
export function getConfigManager(context?: vscode.ExtensionContext): ConfigManager {
  if (!configManagerInstance) {
    if (!context) {
      throw new Error('Extension context is required for first ConfigManager initialization');
    }
    configManagerInstance = new ConfigManager(context);
  }
  
  return configManagerInstance;
}

/**
 * Initialize the ConfigManager
 * @param context The extension context
 * @returns The ConfigManager instance
 */
export function initializeConfigManager(context: vscode.ExtensionContext): ConfigManager {
  configManagerInstance = new ConfigManager(context);
  return configManagerInstance;
}