import * as vscode from 'vscode';
import { CommandHandler } from './CommandProcessor';
import { getLogger } from '../utils/logging';
import { setupOpenAIClient, OpenAIClient, ChatCompletionMessage } from '../api/openai'; // Import ChatCompletionMessage

// Logger instance for this handler
const logger = getLogger('OpenAICommandHandler');

/**
 * Handler for processing /openai commands
 */
export class OpenAICommandHandler implements CommandHandler {
  private openaiClient: OpenAIClient;
  
  /**
   * Initialize the OpenAI command handler
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this.openaiClient = setupOpenAIClient(); // Corrected: Removed context argument
    logger.info('OpenAI command handler initialized');
  }
  
  /**
   * Check if this handler can process the given command
   * @param content The command content
   * @returns True if this is an /openai command
   */
  canHandle(content: string): boolean {
    return content.trim().startsWith('/openai');
  }
  
  /**
   * Process an /openai command and append the results to the messages
   * @param content The command content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  async process(content: string, messages: any[], user: any): Promise<any[]> {
    try {
      // Extract the prompt after /openai
      const openAiPrompt = content.trim().slice(7).trim();
      
      logger.info(`Processing OpenAI command with prompt: "${openAiPrompt.substring(0, 50)}${openAiPrompt.length > 50 ? '...' : ''}"`);
      
      if (!openAiPrompt) {
        logger.warn('No prompt provided for OpenAI command');
        messages.push({
          role: "system",
          content: "Please provide a prompt after '/openai'. For example: '/openai Tell me about quantum computing'"
        });
        return messages;
      }
      
      if (!this.openaiClient.isInitialized) {
        logger.warn('OpenAI client not initialized. Check API key configuration.');
        messages.push({
          role: "system",
          content: "Unable to process OpenAI request. Please make sure your OpenAI API key is configured in the extension settings."
        });
        return messages;
      }
      
      // Prepare messages for OpenAI
      const openAIMessages: ChatCompletionMessage[] = [ // Explicitly typed
        {
          role: "system",
          content: "You are a knowledgeable assistant that provides clear and concise explanations without mentioning that you are an AI language model."
        },
        {
          role: "user",
          content: openAiPrompt
        }
      ];
      
      logger.debug('Making OpenAI API request');
      
      try {
        const chatCompletion = await this.openaiClient.createChatCompletion({
          model: "o1-mini",
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0,
        });
        
        const assistantMessage = chatCompletion.choices[0].message.content.trim();
        
        // Add the assistant's reply to the messages
        messages.push({
          role: "assistant",
          content: assistantMessage
        });
        
        logger.info('Successfully processed OpenAI command');
        return messages;
        
      } catch (error) {
        logger.error("Error calling OpenAI API:", error);
        messages.push({
          role: "system",
          content: "Unable to process the /openai command at the moment. Please try again later."
        });
        return messages;
      }
      
    } catch (error) {
      logger.error("Error processing OpenAI command:", error);
      messages.push({
        role: "system",
        content: "An error occurred while processing your OpenAI command. Please try again."
      });
      return messages;
    }
  }
}