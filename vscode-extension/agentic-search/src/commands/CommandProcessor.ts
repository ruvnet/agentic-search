import * as vscode from 'vscode';
import { getLogger } from '../utils/logging';
import { ExaCommandHandler } from './ExaCommandHandler';
import { GithubCommandHandler } from './GithubCommandHandler';
import { OpenAICommandHandler } from './OpenAICommandHandler';
import { KeywordSearchHandler } from './KeywordSearchHandler';

// Logger instance for the command processor
const logger = getLogger('CommandProcessor');

/**
 * Interface for a command handler
 */
export interface CommandHandler {
  /**
   * Check if this handler can process the given command
   * @param content The command content
   * @returns True if this handler can process the command
   */
  canHandle(content: string): boolean;
  
  /**
   * Process the command and return messages to send to the chat interface
   * @param content The command content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  process(content: string, messages: any[], user: any): Promise<any[]>;
}

/**
 * Main command processor for detecting and routing commands
 */
export class CommandProcessor {
  private exaHandler: ExaCommandHandler;
  private githubHandler: GithubCommandHandler;
  private openaiHandler: OpenAICommandHandler;
  private keywordHandler: KeywordSearchHandler;
  
  /**
   * Initialize the command processor with all handlers
   * @param context The VS Code extension context
   */
  constructor(context: vscode.ExtensionContext) {
    // Initialize all command handlers
    this.exaHandler = new ExaCommandHandler(context);
    this.githubHandler = new GithubCommandHandler(context);
    this.openaiHandler = new OpenAICommandHandler(context);
    this.keywordHandler = new KeywordSearchHandler(context);
    
    logger.info('Command processor initialized');
  }
  
  /**
   * Process a user message and route to appropriate handler
   * @param content The user's message content
   * @param messages The existing message array to append to
   * @param user The user context (GitHub username, etc.)
   * @returns Promise resolving to the updated messages array
   */
  async processMessage(content: string, messages: any[], user: any): Promise<any[]> {
    const trimmedContent = content.trim();
    logger.debug(`Processing message: ${trimmedContent.substring(0, 100)}${trimmedContent.length > 100 ? '...' : ''}`);
    
    // Help command detection
    if (/\bhelp\b|\bdocumentation\b|\bguide\b/i.test(trimmedContent)) {
      logger.info('Help command detected');
      return this.processHelpCommand(trimmedContent, messages, user);
    }
    
    // Check and route to specific command handlers
    if (this.openaiHandler.canHandle(trimmedContent)) {
      logger.info('Routing to OpenAI handler');
      return this.openaiHandler.process(trimmedContent, messages, user);
    }
    
    if (this.exaHandler.canHandle(trimmedContent)) {
      logger.info('Routing to Exa handler');
      return this.exaHandler.process(trimmedContent, messages, user);
    }
    
    if (this.githubHandler.canHandle(trimmedContent)) {
      logger.info('Routing to GitHub handler');
      return this.githubHandler.process(trimmedContent, messages, user);
    }
    
    // Default to keyword search if no specific command matched
    logger.info('Routing to keyword search handler');
    return this.keywordHandler.process(trimmedContent, messages, user);
  }
  
  /**
   * Process help commands
   * @param content The help command content
   * @param messages The existing message array to append to
   * @param user The user context
   * @returns Updated messages array
   */
  private processHelpCommand(content: string, messages: any[], user: any): any[] {
    const lowerCaseContent = content.toLowerCase();
    
    if (/\bhelp\b/i.test(lowerCaseContent)) {
      messages.push({
        role: "system",
        content: `Format with markdown and BBS style formatting: Welcome to the Agentic Copilot Help System. Here are the sections you can explore:
[1] Keyword Search
[2] Site-specific Search
[3] Set Language
[4] Cache Control
[5] Proxy URL
[6] Return Format
[7] Cookies
[8] Additional Guidance
To select a section, simply type the corresponding number or keyword.`,
      });
    }
    
    if (/\bguide\b|\bdocumentation\b/i.test(lowerCaseContent)) {
      messages.push({
        role: "system",
        content: `Format with markdown and BBS style formatting: Here is the Agentic Copilot Guide. Please choose from the following topics to get more detailed guidance:
[1] How to use Keyword Search
[2] Setting up Site-specific Search
[3] Changing Language Settings
[4] Managing Cache Control
[5] Configuring Proxy URL
[6] Setting Return Format
[7] Using Cookies for Session Management
[8] Getting Additional Guidance
Type the corresponding number or topic name to proceed.`,
      });
    }
    
    return messages;
  }
}