import * as vscode from 'vscode';
import { CommandProcessor } from '../commands/CommandProcessor';
import { getLogger } from '../utils/logging';
import { GitHubClient, setupGitHubClient } from '../api/github'; // Add this

// Logger instance for this plugin
const logger = getLogger('AgenticCopilotPlugin');

/**
 * Main plugin handler for Agentic Copilot extension
 * This class handles interactions between Copilot Chat and our command handlers
 */
export class AgenticCopilotPlugin {
  private commandProcessor: CommandProcessor;
  private githubClient: GitHubClient; // Add this
  
  /**
   * Initialize the plugin with all required components
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    // Initialize the command processor
    this.commandProcessor = new CommandProcessor(context);
    this.githubClient = setupGitHubClient(context); // Add this
    logger.info('Agentic Copilot plugin initialized');
  }
  
  /**
   * Process an incoming message from Copilot Chat
   * This is the main entry point for handling user messages
   * 
   * @param message The incoming message object from Copilot Chat
   * @returns Response messages to be sent back to Copilot Chat
   */
  async processMessage(message: any): Promise<any> {
    try {
      logger.info('Processing incoming message');
      logger.debug('Message payload:', message);
      
      // Extract necessary information from the message
      const userContent = this.extractUserContent(message);
      const messages = message.messages || [];
      const user = await this.extractUserInfo(message);
      const token = message.token || '';
      
      if (!userContent) {
        logger.warn('No user content found in message');
        return {
          messages: messages
        };
      }
      
      // Extract command from user content if it exists
      // This supports /command syntax within Copilot Chat
      const command = this.extractCommand(userContent);
      // Enhance user object with additional context
      const enhancedUser = {
        ...user,
        token,
        command: this.extractCommand(userContent)
      };
      
      // Process the message using our command processor
      const processedMessages = await this.commandProcessor.processMessage(
        userContent,
        messages,
        enhancedUser
      );
      
      // Format the response for Copilot Chat
      const formattedResponse = this.formatResponseForCopilotChat(processedMessages, user);
      
      logger.info('Message processed successfully');
      
      // Return the processed messages with proper formatting
      return formattedResponse;
    } catch (error) {
      logger.error('Error processing message:', error);
      
      // If an error occurs, return a system message explaining the error
      return {
        messages: [
          {
            role: "system",
            content: `An error occurred while processing your request: ${error instanceof Error ? error.message : String(error)}`
          }
        ]
      };
    }
  }
  
  /**
   * Extract user content from the message
   * @param message The message object from Copilot Chat
   * @returns The user's message content or undefined
   */
  private extractUserContent(message: any): string | undefined {
    const messages = message.messages || [];
    
    // Find the last user message
    const userMessages = messages.filter(
      (msg: any) => msg.role === "user" && msg.content
    );
    
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[userMessages.length - 1];
      return lastUserMessage.content.trim();
    }
    
    return undefined;
  }
  
  /**
   * Extract a command from the user message if it starts with a slash
   * @param content The user message content
   * @returns The command without the slash if found, or undefined
   */
  private extractCommand(content: string): string | undefined {
    // Check if the message starts with a command (/)
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith('/')) {
      const parts = trimmedContent.split(' ');
      // Return the command without the slash
      return parts[0].substring(1);
    }
    return undefined;
  }
  
  /**
   * Format the processed messages for Copilot Chat
   * This ensures the response is properly structured for the Copilot Chat interface
   *
   * @param messages The processed messages
   * @param user The user information
   * @returns Formatted response object for Copilot Chat
   */
  private formatResponseForCopilotChat(messages: any[], user: any): any {
    // Add final guidance to ensure proper formatting in Copilot Chat
    messages.push({
      role: "system",
      content: `
Please format your response using markdown for readability.
- Address the user as @${user?.login || 'user'}
- Include code blocks with proper language syntax highlighting
- Use headings, lists, and other markdown elements for clear organization
- Provide citations and references where applicable
      `
    });
    
    return {
      messages: messages,
      // Additional metadata for Copilot Chat
      metadata: {
        plugin: 'agentic-search',
        version: '1.0.0',
        supportMarkdown: true
      }
    };
  }
  
  /**
   * Extract user information from the message
   * This would typically use the GitHub token to get user info
   * @param message The message object from Copilot Chat
   * @returns User information object
   */
  private async extractUserInfo(message: any): Promise<any> {
    try {
      // The githubClient is initialized to use vscode.authentication for tokens.
      // The message.token is also available if needed, but GitHubClient handles its own token acquisition.
      const ghTokenFromMessage = message.token; // This is the token Copilot Chat provides

      if (ghTokenFromMessage && this.githubClient) { // Check if token exists and client is available
        logger.info('Attempting to fetch GitHub user information using GitHubClient.');
        try {
          // GitHubClient's getAuthToken method (called by getAuthenticatedUser)
          // will try to get a session. If Copilot Chat provides a token,
          // it implies a session is active.
          const authenticatedUser = await this.githubClient.getAuthenticatedUser();
          if (authenticatedUser && authenticatedUser.login) {
            logger.info(`Successfully fetched GitHub user: @${authenticatedUser.login}`);
            return {
              login: authenticatedUser.login,
              name: authenticatedUser.name || authenticatedUser.login,
              authenticated: true,
              token: ghTokenFromMessage // We can still pass along the original token
            };
          } else {
            logger.warn('GitHubClient.getAuthenticatedUser() did not return a user with a login.');
          }
        } catch (err) {
          logger.error('Error fetching GitHub user info via GitHubClient:', err);
          // Fall through to default unauthenticated user
        }
      } else {
        if (!ghTokenFromMessage) logger.warn('No GitHub token found in the incoming message from Copilot Chat.');
        if (!this.githubClient) logger.error('GitHubClient not available in AgenticCopilotPlugin.');
      }
      
      // Default user info when no token, client error, or API call fails
      logger.info('Returning default unauthenticated user info.');
      return {
        login: 'user',
        name: 'User', // Changed from 'GitHub User' to generic 'User'
        authenticated: false,
        token: ghTokenFromMessage
      };
    } catch (error) {
      logger.error('Error in extractUserInfo:', error);
      return {
        login: 'user',
        name: 'User',
        authenticated: false
      };
    }
  }
}

// Singleton instance
let pluginInstance: AgenticCopilotPlugin | undefined;

/**
 * Setup the Agentic Copilot plugin
 * @param context The extension context
 * @returns The initialized plugin instance
 */
export function setupAgenticCopilotPlugin(context: vscode.ExtensionContext): AgenticCopilotPlugin {
  if (!pluginInstance) {
    pluginInstance = new AgenticCopilotPlugin(context);
  }
  
  return pluginInstance;
}