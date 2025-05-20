import * as vscode from 'vscode';
import { CommandHandler } from './CommandProcessor';
import { getLogger } from '../utils/logging';

// Logger instance for this handler
const logger = getLogger('KeywordSearchHandler');

/**
 * Handler for processing default keyword searches
 */
export class KeywordSearchHandler implements CommandHandler {
  /**
   * Initialize the keyword search handler
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    logger.info('Keyword search handler initialized');
  }
  
  /**
   * Check if this handler can process the given content
   * Since this is the default handler, it can handle any content
   * that isn't handled by other command handlers
   * @param content The command content
   * @returns Always true as this is the fallback handler
   */
  canHandle(content: string): boolean {
    // This handler processes anything that's not a specific command
    return true;
  }
  
  /**
   * Process a keyword search and append the results to the messages
   * @param content The user's message content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  async process(content: string, messages: any[], user: any): Promise<any[]> {
    try {
      // Extract keywords from the content
      const keyword = this.extractKeywords(content);
      
      if (!keyword) {
        logger.info('No valid keywords found in message');
        // Just return the messages as-is if no keywords found
        return messages;
      }
      
      logger.info(`Processing keyword search: "${keyword}"`);
      
      // In a real implementation, this would make a request to a search API
      // For example, the original implementation used Jina AI
      // For now, we'll simulate a response
      
      try {
        // Simulate making a search request
        logger.debug(`Simulating search request for: ${keyword}`);
        
        // In a real implementation, we would call an actual search API
        // For example:
        // const requestUrl = `https://s.jina.ai/${encodeURIComponent(keyword)}`;
        // const response = await fetch(requestUrl, {...});
        // const searchData = await response.text();
        
        // For now, we'll simulate search results
        const simulatedSearchData = `This is simulated search data for the keyword: ${keyword}. In a real implementation, this would be actual search results from an API like Jina AI.`;
        
        // Add system and user messages to guide the response
        messages.push({
          role: "system",
          content: `You have information about the keyword: '${keyword}'. Please summarize this information clearly, and ensure it is helpful and informative. Be complete, verbose with citations and references. Use markdown for formatting.`
        });
        
        messages.push({
          role: "user",
          content: `Here is some information about '${keyword}': ${simulatedSearchData}`
        });
        
        logger.info(`Successfully processed keyword search for '${keyword}'`);
        return messages;
        
      } catch (error) {
        logger.error("Error fetching search results:", error);
        messages.push({
          role: "system",
          content: "Unable to fetch search information at the moment. Please try again later."
        });
        return messages;
      }
      
    } catch (error) {
      logger.error("Error processing keyword search:", error);
      messages.push({
        role: "system",
        content: "An error occurred while processing your search. Please try again."
      });
      return messages;
    }
  }
  
  /**
   * Extract meaningful keywords from the user's message
   * @param content The user's message content
   * @returns Extracted keywords or empty string if none found
   */
  private extractKeywords(content: string): string {
    const lowerCaseContent = content.toLowerCase();
    
    // List of common stop words to filter out
    const stopWords = [
      "tell", "me", "about", "the", "and", "is", "a", "of", 
      "@agentic-co-pilot"
    ];
    
    // Extract keywords by filtering out stop words and keeping only alphanumeric words
    const keyword = lowerCaseContent
      .split(" ")
      .filter(word => 
        !stopWords.includes(word) && 
        /^[a-zA-Z0-9.]+$/.test(word)
      )
      .join(" ");
    
    return keyword;
  }
}