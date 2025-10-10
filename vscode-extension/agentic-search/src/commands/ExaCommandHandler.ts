import * as vscode from 'vscode';
import { CommandHandler } from './CommandProcessor';
import { getLogger } from '../utils/logging';
import { setupExaClient, ExaClient } from '../api/exa';

// Logger instance for this handler
const logger = getLogger('ExaCommandHandler');

/**
 * Handler for processing /exa commands
 */
export class ExaCommandHandler implements CommandHandler {
  private exaClient: ExaClient;
  
  /**
   * Initialize the Exa command handler
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.exaClient = setupExaClient(); // Corrected: Removed context argument
    logger.info('Exa command handler initialized');
  }
  
  /**
   * Check if this handler can process the given command
   * @param content The command content
   * @returns True if this is an /exa command
   */
  canHandle(content: string): boolean {
    return content.trim().startsWith('/exa');
  }
  
  /**
   * Process an /exa command and append the results to the messages
   * @param content The command content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  async process(content: string, messages: any[], user: any): Promise<any[]> {
    try {
      // Extract keywords after /exa
      const exaKeywords = content.trim().slice(4).trim();
      const query = exaKeywords || "toronto weather"; // Default query if none provided
      
      logger.info(`Processing Exa command with keywords: "${query}"`);
      
      if (!this.exaClient.isInitialized) {
        logger.warn('Exa client not initialized. Check API key configuration.');
        messages.push({
          role: "system",
          content: "Unable to process Exa search. Please make sure your Exa API key is configured in the extension settings."
        });
        return messages;
      }
      
      logger.debug(`Sending request to Exa API for news search`);
      
      try {
        // Call Exa API using the specialized searchNews method
        const exaResults = await this.exaClient.searchNews(query);
        
        // Process and format the results
        if (!exaResults.results || exaResults.results.length === 0) {
          logger.warn(`Exa API returned no results for '${query}'`);
          messages.push({
            role: "system",
            content: `No results found for '${query}'. Please try a different search term.`
          });
          return messages;
        }
        
        // Format the results as a string
        const exaDataString = exaResults.results
          .map((result: any) => {
            return `Title: ${result.title}\nSummary: ${result.summary || 'No summary available'}\nURL: ${result.url}\n`;
          })
          .join("\n");
        
        // Truncate if too long
        const maxTokens = 8000;
        let truncatedExaDataString = exaDataString;
        if (exaDataString.length > maxTokens) {
          truncatedExaDataString = exaDataString.substring(0, maxTokens) + "... [truncated]";
        }
        
        // Add system and user messages to guide the response
        messages.push({
          role: "system",
          content: `You have information about '${query}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`
        });
        
        messages.push({
          role: "user",
          content: `Here is some information about '${query}':\n\n${truncatedExaDataString}`
        });
        
        logger.info(`Successfully processed Exa command for '${query}'`);
        return messages;
        
      } catch (error) {
        logger.error("Error fetching information using Exa AI API:", error);
        messages.push({
          role: "system",
          content: "Unable to fetch information at the moment. Please proceed with the current context."
        });
        return messages;
      }
      
    } catch (error) {
      logger.error("Error processing Exa command:", error);
      messages.push({
        role: "system",
        content: "An error occurred while processing your Exa command. Please try again."
      });
      return messages;
    }
  }
}