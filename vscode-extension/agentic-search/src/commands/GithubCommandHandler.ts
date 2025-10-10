import * as vscode from 'vscode';
import { CommandHandler } from './CommandProcessor';
import { getLogger } from '../utils/logging';
import { setupGitHubClient, GitHubClient } from '../api/github';
import { setupExaClient, ExaClient } from '../api/exa';

// Logger instance for this handler
const logger = getLogger('GithubCommandHandler');

/**
 * Handler for processing /github commands
 */
export class GithubCommandHandler implements CommandHandler {
  private githubClient: GitHubClient;
  private exaClient: ExaClient; // We need Exa client for GitHub searches
  
  /**
   * Initialize the GitHub command handler
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.githubClient = setupGitHubClient(context); // Corrected: Added context argument
    this.exaClient = setupExaClient(); 
    logger.info('GitHub command handler initialized');
  }
  
  /**
   * Check if this handler can process the given command
   * @param content The command content
   * @returns True if this is a /github command
   */
  canHandle(content: string): boolean {
    return content.trim().startsWith('/github');
  }
  
  /**
   * Process a /github command and append the results to the messages
   * @param content The command content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  async process(content: string, messages: any[], user: any): Promise<any[]> {
    try {
      // Extract keywords after /github
      const githubKeywords = content.trim().slice(7).trim();
      const query = githubKeywords || "the latest agentic projects"; // Default query if none provided
      
      logger.info(`Processing GitHub command with keywords: "${query}"`);
      
      // Check client initialization
      if (!this.exaClient.isInitialized) {
        logger.warn('Exa client not initialized. Check API key configuration.');
        messages.push({
          role: "system",
          content: "Unable to process GitHub search. Please make sure your Exa API key is configured in the extension settings."
        });
        return messages;
      }
      
      logger.debug(`Sending request to Exa API for GitHub search`);
      
      try {
        // Call Exa API using the specialized searchGitHub method
        const exaResults = await this.exaClient.searchGitHub(query);
        
        // Process and format the results
        if (!exaResults.results || exaResults.results.length === 0) {
          logger.warn(`No GitHub results found for '${query}'`);
          messages.push({
            role: "system",
            content: `No GitHub repositories found for '${query}'. Please try a different search term.`
          });
          return messages;
        }
        
        // Format the results as a string
        const githubDataString = exaResults.results
          .map((result: any) => {
            return `Repository: ${result.title}\nDescription: ${result.summary || 'No description available'}\nURL: ${result.url}\n`;
          })
          .join("\n");
        
        // Truncate if too long
        const maxTokens = 8000;
        let truncatedGithubDataString = githubDataString;
        if (githubDataString.length > maxTokens) {
          truncatedGithubDataString = githubDataString.substring(0, maxTokens) + "... [truncated]";
        }
        
        // Add system and user messages to guide the response
        messages.push({
          role: "system",
          content: `You have information about GitHub repositories related to '${query}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`
        });
        
        messages.push({
          role: "user",
          content: `Here is some information about GitHub repositories related to '${query}':\n\n${truncatedGithubDataString}`
        });
        
        logger.info(`Successfully processed GitHub command for '${query}'`);
        return messages;
        
      } catch (error) {
        logger.error("Error fetching GitHub information using Exa AI API:", error);
        messages.push({
          role: "system",
          content: "Unable to fetch information at the moment. Please proceed with the current context."
        });
        return messages;
      }
      
    } catch (error) {
      logger.error("Error processing GitHub command:", error);
      messages.push({
        role: "system",
        content: "An error occurred while processing your GitHub command. Please try again."
      });
      return messages;
    }
  }
}