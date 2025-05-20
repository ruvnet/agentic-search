# Agentic Copilot - VS Code Extension Pseudocode

This document provides pseudocode for implementing the Agentic Copilot as a VS Code extension with Copilot Chat integration.

## 1. Extension Entry Point

```typescript
// extension.ts
import * as vscode from 'vscode';
import { AgenticCopilotCommandHandler } from './commandHandler';
import { GitHubAuthProvider } from './authProvider';

// TEST: Extension activates correctly and registers commands
export function activate(context: vscode.ExtensionContext) {
    // Initialize services
    const authProvider = new GitHubAuthProvider(context);
    const commandHandler = new AgenticCopilotCommandHandler(context, authProvider);

    // Register commands
    const startCommand = vscode.commands.registerCommand(
        'agenticCopilot.start', 
        () => {
            // Display activation message
            vscode.window.showInformationMessage('Agentic Copilot is ready in the @ picker');
        }
    );

    // Add subscriptions to context
    context.subscriptions.push(startCommand);
    
    // Setup status bar indicator
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right, 
        100
    );
    statusBarItem.text = "$(copilot) Agentic Copilot";
    statusBarItem.tooltip = "Agentic Copilot is active";
    statusBarItem.command = 'agenticCopilot.start';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Log activation
    console.log('Agentic Copilot Extension activated');
}

// TEST: Extension cleans up resources on deactivation
export function deactivate() {
    // Clean up resources
    console.log('Agentic Copilot Extension deactivated');
}
```

## 2. Authentication Provider

```typescript
// authProvider.ts
import * as vscode from 'vscode';
import { Octokit } from '@octokit/core';

// TEST: Authentication provider successfully retrieves GitHub token
export class GitHubAuthProvider {
    private context: vscode.ExtensionContext;
    private tokenKey: string = 'agentic-copilot.github-token';
    private cachedToken: string | undefined;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    // TEST: getGitHubToken returns valid token or prompts for authentication
    async getGitHubToken(): Promise<string | undefined> {
        // Check if we have a cached token
        if (this.cachedToken) {
            return this.cachedToken;
        }

        // Check if token is in secrets storage
        try {
            const storedToken = await this.context.secrets.get(this.tokenKey);
            if (storedToken) {
                this.cachedToken = storedToken;
                return storedToken;
            }
        } catch (error) {
            console.error('Error retrieving stored token:', error);
        }

        // Token not found, try to get it from VS Code GitHub authentication
        try {
            const session = await vscode.authentication.getSession('github', ['user:email', 'repo'], { createIfNone: true });
            if (session?.accessToken) {
                // Store token in secrets
                await this.context.secrets.store(this.tokenKey, session.accessToken);
                this.cachedToken = session.accessToken;
                return session.accessToken;
            }
        } catch (error) {
            console.error('Error getting GitHub authentication session:', error);
            vscode.window.showErrorMessage('Failed to authenticate with GitHub. Please try again.');
        }

        return undefined;
    }

    // TEST: getAuthenticatedOctokit returns initialized Octokit client
    async getAuthenticatedOctokit(): Promise<Octokit | undefined> {
        const token = await this.getGitHubToken();
        if (!token) {
            vscode.window.showErrorMessage('GitHub token not available. Please authenticate first.');
            return undefined;
        }

        return new Octokit({ auth: token });
    }

    // TEST: clearToken removes token from cache and storage
    async clearToken(): Promise<void> {
        this.cachedToken = undefined;
        await this.context.secrets.delete(this.tokenKey);
    }
}
```

## 3. Command Handler

```typescript
// commandHandler.ts
import * as vscode from 'vscode';
import { GitHubAuthProvider } from './authProvider';
import { OpenAIClient } from './apiClients/openAIClient';
import { ExaAIClient } from './apiClients/exaAIClient';
import { ResponseFormatter } from './responseFormatter';

// TEST: Command handler correctly initializes with dependencies
export class AgenticCopilotCommandHandler {
    private context: vscode.ExtensionContext;
    private authProvider: GitHubAuthProvider;
    private openAIClient: OpenAIClient;
    private exaAIClient: ExaAIClient;
    private responseFormatter: ResponseFormatter;

    constructor(context: vscode.ExtensionContext, authProvider: GitHubAuthProvider) {
        this.context = context;
        this.authProvider = authProvider;
        
        // Initialize API clients
        this.openAIClient = new OpenAIClient(context);
        this.exaAIClient = new ExaAIClient(context);
        this.responseFormatter = new ResponseFormatter();
    }

    // TEST: processMessage correctly extracts commands from user messages
    async processMessage(message: string, userLogin: string): Promise<string> {
        // Extract command or keyword
        const lowerCaseContent = message.toLowerCase();
        const isHelpCommand = /\bhelp\b|\bdocumentation\b|\bguide\b/i.test(lowerCaseContent);
        
        // Check for commands
        if (message.startsWith('/openai')) {
            return await this.handleOpenAICommand(message, userLogin);
        } 
        else if (message.startsWith('/exa')) {
            return await this.handleExaCommand(message, userLogin);
        }
        else if (message.startsWith('/github')) {
            return await this.handleGitHubCommand(message, userLogin);
        }
        else if (isHelpCommand) {
            return await this.handleHelpCommand(message, userLogin);
        }
        else {
            return await this.handleKeywordSearch(message, userLogin);
        }
    }

    // TEST: handleOpenAICommand processes OpenAI commands correctly
    private async handleOpenAICommand(message: string, userLogin: string): Promise<string> {
        const prompt = message.slice(7).trim();
        if (!prompt) {
            return `@${userLogin}, please provide a prompt after the /openai command.`;
        }

        try {
            const response = await this.openAIClient.getCompletion(prompt);
            return this.responseFormatter.formatResponse(
                `@${userLogin}, here is the response to your OpenAI query:\n\n${response}`,
                'markdown'
            );
        } catch (error) {
            console.error('Error with OpenAI command:', error);
            return `@${userLogin}, I encountered an error processing your OpenAI request: ${error.message}`;
        }
    }

    // TEST: handleExaCommand processes Exa commands correctly
    private async handleExaCommand(message: string, userLogin: string): Promise<string> {
        let keywords = message.slice(4).trim();
        if (!keywords) {
            keywords = 'toronto weather'; // Default query
        }

        try {
            const results = await this.exaAIClient.search(keywords, 'news');
            return this.responseFormatter.formatResponse(
                `@${userLogin}, here is information about "${keywords}":\n\n${results}`,
                'markdown'
            );
        } catch (error) {
            console.error('Error with Exa command:', error);
            return `@${userLogin}, I encountered an error searching for "${keywords}": ${error.message}`;
        }
    }

    // TEST: handleGitHubCommand processes GitHub commands correctly
    private async handleGitHubCommand(message: string, userLogin: string): Promise<string> {
        let keywords = message.slice(7).trim();
        if (!keywords) {
            keywords = 'the latest agentic projects'; // Default query
        }

        try {
            const results = await this.exaAIClient.search(keywords, 'github');
            return this.responseFormatter.formatResponse(
                `@${userLogin}, here is information about GitHub repositories related to "${keywords}":\n\n${results}`,
                'markdown'
            );
        } catch (error) {
            console.error('Error with GitHub command:', error);
            return `@${userLogin}, I encountered an error searching GitHub for "${keywords}": ${error.message}`;
        }
    }

    // TEST: handleHelpCommand returns appropriate help information
    private async handleHelpCommand(message: string, userLogin: string): Promise<string> {
        // Format comprehensive help message with markdown
        return this.responseFormatter.formatResponse(
            `@${userLogin}, here are the available commands:

## Agentic Copilot Help

### Available Commands:
- **/openai [prompt]** - Send a prompt directly to OpenAI
- **/exa [query]** - Search for information using Exa AI
- **/github [query]** - Search GitHub repositories
- **help** - Display this help information

### Examples:
- \`/openai write a function to calculate fibonacci numbers\`
- \`/exa latest news about artificial intelligence\`
- \`/github best react state management libraries\``,
            'markdown'
        );
    }

    // TEST: handleKeywordSearch extracts and searches for keywords
    private async handleKeywordSearch(message: string, userLogin: string): Promise<string> {
        // Extract keywords (simplified version of server implementation)
        const stopWords = ["tell", "me", "about", "the", "and", "is", "a", "of"];
        const keyword = message.toLowerCase()
            .split(" ")
            .filter(word => !stopWords.includes(word) && /^[a-zA-Z0-9.]+$/.test(word))
            .join(" ");

        if (!keyword) {
            return `@${userLogin}, I couldn't extract keywords from your message. Try using a command like /exa or /github.`;
        }

        try {
            // In the full implementation, we might use another search API here
            const results = await this.exaAIClient.search(keyword, 'auto');
            return this.responseFormatter.formatResponse(
                `@${userLogin}, here is information about "${keyword}":\n\n${results}`,
                'markdown'
            );
        } catch (error) {
            console.error('Error with keyword search:', error);
            return `@${userLogin}, I encountered an error searching for "${keyword}": ${error.message}`;
        }
    }
}
```

## 4. OpenAI API Client

```typescript
// apiClients/openAIClient.ts
import * as vscode from 'vscode';
import OpenAI from 'openai';

// TEST: OpenAIClient initializes with valid configuration
export class OpenAIClient {
    private openai: OpenAI;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Get API key from configuration
        const config = vscode.workspace.getConfiguration('agenticCopilot');
        const apiKey = config.get<string>('openaiApiKey');
        
        if (!apiKey) {
            // Handle missing API key
            console.error('OpenAI API key not found in configuration');
            vscode.window.showErrorMessage(
                'OpenAI API key not configured. Please add it in settings.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand(
                        'workbench.action.openSettings',
                        'agenticCopilot.openaiApiKey'
                    );
                }
            });
        }
        
        // Initialize OpenAI client
        this.openai = new OpenAI({
            apiKey: apiKey || '',
        });
    }

    // TEST: getCompletion returns a valid response from OpenAI
    async getCompletion(prompt: string): Promise<string> {
        try {
            // Check if API key is available
            if (!this.openai) {
                throw new Error('OpenAI client not initialized');
            }

            // Prepare messages for OpenAI
            const messages = [
                {
                    role: "system",
                    content: "You are a knowledgeable assistant that provides clear and concise explanations without mentioning that you are an AI language model.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ];

            // Make the request to OpenAI's Chat Completion API
            const response = await this.openai.chat.completions.create({
                model: "o1-mini",
                messages: messages,
                temperature: 0.7,
                max_tokens: 1500,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            });

            return response.choices[0].message.content || "No response generated.";
        } catch (error) {
            console.error('OpenAI API error:', error);
            throw new Error(`OpenAI API error: ${error.message}`);
        }
    }
}
```

## 5. Exa AI Client

```typescript
// apiClients/exaAIClient.ts
import * as vscode from 'vscode';
import fetch from 'node-fetch';

// TEST: ExaAIClient initializes with valid configuration
export class ExaAIClient {
    private apiKey: string | undefined;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Get API key from configuration
        const config = vscode.workspace.getConfiguration('agenticCopilot');
        this.apiKey = config.get<string>('exaApiKey');
        
        if (!this.apiKey) {
            // Handle missing API key
            console.error('Exa AI API key not found in configuration');
            vscode.window.showErrorMessage(
                'Exa AI API key not configured. Please add it in settings.',
                'Open Settings'
            ).then(selection => {
                if (selection === 'Open Settings') {
                    vscode.commands.executeCommand(
                        'workbench.action.openSettings',
                        'agenticCopilot.exaApiKey'
                    );
                }
            });
        }
    }

    // TEST: search returns valid results from Exa AI
    async search(query: string, category: string = 'auto'): Promise<string> {
        try {
            // Check if API key is available
            if (!this.apiKey) {
                throw new Error('Exa AI API key not configured');
            }

            const requestUrl = 'https://api.exa.ai/search';
            
            // Prepare request body based on category
            const requestBody: any = {
                query: query,
                type: "auto",
                numResults: category === 'github' ? 20 : 25,
                startPublishedDate: "2023-01-01",
                category: category,
                livecrawl: "always",
                contents: {
                    summary: {}
                }
            };
            
            // For GitHub searches, modify the contents field
            if (category === 'github') {
                requestBody.contents.summary.query = "overview of github repo";
            } else {
                requestBody.contents.text = true;
            }

            // Make the request to Exa AI API
            const response = await fetch(requestUrl, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                },
                body: JSON.stringify(requestBody),
            });

            // Handle non-successful responses
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Exa AI API request failed with status ${response.status}: ${errorText}`);
            }

            // Parse and process the results
            const exaData = await response.json();
            
            if (!exaData.results || exaData.results.length === 0) {
                return `No results found for "${query}"`;
            }

            // Format the results into a string
            let formattedResults: string;
            
            if (category === 'github') {
                formattedResults = exaData.results
                    .map((result: any) => {
                        return `### [${result.title}](${result.url})\n${result.summary}\n`;
                    })
                    .join("\n");
            } else {
                formattedResults = exaData.results
                    .map((result: any) => {
                        return `### [${result.title}](${result.url})\n${result.summary}\n`;
                    })
                    .join("\n");
            }

            return formattedResults;
        } catch (error) {
            console.error('Exa AI API error:', error);
            throw new Error(`Exa AI API error: ${error.message}`);
        }
    }
}
```

## 6. Response Formatter

```typescript
// responseFormatter.ts
import * as vscode from 'vscode';

// TEST: ResponseFormatter correctly formats responses
export class ResponseFormatter {
    constructor() {}

    // TEST: formatResponse returns well-formatted markdown
    formatResponse(content: string, format: string = 'markdown'): string {
        if (format.toLowerCase() === 'markdown') {
            // Ensure proper markdown formatting
            return content;
        } else {
            // Fall back to plain text
            return content;
        }
    }

    // TEST: truncateString correctly truncates long content
    truncateString(content: string, maxLength: number): string {
        if (content.length <= maxLength) {
            return content;
        }
        
        return content.substring(0, maxLength) + '... [truncated]';
    }

    // TEST: formatError creates user-friendly error messages
    formatError(error: Error | any, userLogin: string): string {
        const errorMessage = error.message || 'An unknown error occurred';
        return `@${userLogin}, I encountered a problem: ${errorMessage}`;
    }
}
```

## 7. Configuration Contribution in package.json

```json
{
  "name": "agentic-copilot-vscode",
  "displayName": "Agentic Copilot",
  "description": "Agentic Copilot Extension for VS Code",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.93.0"
  },
  "categories": ["Other"],
  "activationEvents": ["onCommand:agenticCopilot.start"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "agenticCopilot.start",
        "title": "Start Agentic Copilot"
      }
    ],
    "configuration": {
      "title": "Agentic Copilot",
      "properties": {
        "agenticCopilot.openaiApiKey": {
          "type": "string",
          "default": "",
          "description": "API key for OpenAI"
        },
        "agenticCopilot.exaApiKey": {
          "type": "string",
          "default": "",
          "description": "API key for Exa AI"
        }
      }
    },
    "copilotPlugins": [
      {
        "id": "agentic-co-pilot",
        "displayName": "Agentic Copilot",
        "description": "Your custom server-backed Copilot plugin",
        "url": "http://localhost:3000/",
        "scopes": ["chat"],
        "auth": {
          "type": "gitHubToken"
        }
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js"
  },
  "devDependencies": {
    "@types/vscode": "^1.93.0",
    "@types/node": "16.x",
    "@typescript-eslint/eslint-plugin": "^6.9.0",
    "@typescript-eslint/parser": "^6.9.0",
    "eslint": "^8.52.0",
    "typescript": "^5.2.2"
  },
  "dependencies": {
    "@octokit/core": "^6.0.0",
    "openai": "^4.0.0",
    "node-fetch": "^3.3.0"
  }
}
```

## 8. Test Cases (Jest)

```typescript
// extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as myExtension from '../extension';

// Suite: Extension Activation
describe('Extension Activation', () => {
    // TEST: Extension should be present in VS Code
    it('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('publisher.agentic-copilot-vscode'));
    });

    // TEST: Extension should activate
    it('Extension should activate', async () => {
        const extension = vscode.extensions.getExtension('publisher.agentic-copilot-vscode');
        await extension?.activate();
        assert.strictEqual(extension?.isActive, true);
    });

    // TEST: Commands should be registered
    it('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        assert.ok(commands.includes('agenticCopilot.start'));
    });
});

// Suite: Command Handler
describe('Command Handler', () => {
    // TEST: OpenAI command should work properly
    it('OpenAI command should work properly', async () => {
        // Test implementation
    });

    // TEST: Exa command should work properly
    it('Exa command should work properly', async () => {
        // Test implementation
    });

    // TEST: GitHub command should work properly
    it('GitHub command should work properly', async () => {
        // Test implementation
    });

    // TEST: Help command should work properly
    it('Help command should work properly', async () => {
        // Test implementation
    });
});

// Suite: Authentication
describe('Authentication', () => {
    // TEST: GitHub auth provider should get token
    it('GitHub auth provider should get token', async () => {
        // Test implementation
    });
});