# Agentic Copilot VS Code Extension - Directory Structure

This document provides a detailed view of the proposed directory structure for the Agentic Copilot VS Code extension, explaining the purpose and organization of each module.

## Visual Directory Structure

```
agentic-copilot-vscode/
│
├── 📁 .vscode/                    # VS Code configuration 
│   ├── 📄 launch.json             # Debug configuration
│   └── 📄 tasks.json              # Build tasks
│
├── 📁 src/                        # Source code
│   │
│   ├── 📄 extension.ts            # ⭐ Main extension entry point
│   │
│   ├── 📁 activation/             # 🚀 Extension activation
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 registerCommands.ts # Register VSCode commands
│   │   └── 📄 registerPlugin.ts   # Register as Copilot plugin
│   │
│   ├── 📁 api/                    # 🔌 External API clients
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 openai.ts           # OpenAI API
│   │   ├── 📄 github.ts           # GitHub API
│   │   └── 📄 exa.ts              # Exa AI API
│   │
│   ├── 📁 auth/                   # 🔐 Authentication
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 githubAuth.ts       # GitHub auth provider
│   │   └── 📄 tokenStorage.ts     # Secure token storage
│   │
│   ├── 📁 commands/               # 🎮 Command handlers
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 commandRouter.ts    # Command routing
│   │   ├── 📄 exaCommand.ts       # /exa command
│   │   ├── 📄 githubCommand.ts    # /github command
│   │   ├── 📄 openaiCommand.ts    # /openai command
│   │   └── 📄 helpCommand.ts      # /help command
│   │
│   ├── 📁 config/                 # ⚙️ Configuration
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 settings.ts         # VS Code settings
│   │   └── 📄 constants.ts        # Constants and defaults
│   │
│   ├── 📁 plugin/                 # 🔌 Copilot plugin
│   │   ├── 📄 index.ts            # Exports
│   │   ├── 📄 pluginHandler.ts    # Plugin message handling
│   │   └── 📄 commandExtractor.ts # Extract commands
│   │
│   └── 📁 utils/                  # 🔧 Utilities
│       ├── 📄 index.ts            # Exports
│       ├── 📄 formatting.ts       # Response formatting
│       ├── 📄 logging.ts          # Logging
│       └── 📄 streaming.ts        # Response streaming
│
├── 📄 package.json                # 📦 Extension manifest
├── 📄 tsconfig.json               # TypeScript configuration
├── 📄 webpack.config.js           # Webpack configuration
└── 📄 README.md                   # Documentation
```

## Module Descriptions

### 1. Extension Entry (`extension.ts`)

The main entry point for the VS Code extension:

- Exports `activate` and `deactivate` functions
- Sets up the extension context
- Initializes all components
- Handles lifecycle events

```typescript
// Key interfaces
export function activate(context: vscode.ExtensionContext): void;
export function deactivate(): void;
```

### 2. Activation Module (`activation/`)

Handles the extension activation process:

- **registerCommands.ts**: Registers all VS Code commands
- **registerPlugin.ts**: Registers the extension as a Copilot Chat plugin

```typescript
// Key functionality
function registerCommands(context: vscode.ExtensionContext): void;
function registerPlugin(context: vscode.ExtensionContext): void;
```

### 3. API Clients (`api/`)

Manages interaction with external APIs:

- **openai.ts**: Client for OpenAI API
- **github.ts**: Client for GitHub API
- **exa.ts**: Client for Exa AI API

```typescript
// Key interfaces
interface ApiClient {
  execute(params: any): Promise<ApiResponse>;
}

class OpenAiClient implements ApiClient { /* ... */ }
class GitHubClient implements ApiClient { /* ... */ }
class ExaClient implements ApiClient { /* ... */ }
```

### 4. Authentication (`auth/`)

Handles authentication and token management:

- **githubAuth.ts**: GitHub authentication provider
- **tokenStorage.ts**: Secure token storage and retrieval

```typescript
// Key interfaces
interface AuthProvider {
  getToken(): Promise<string>;
  isAuthenticated(): boolean;
}

interface TokenStorage {
  storeToken(key: string, token: string): Promise<void>;
  getToken(key: string): Promise<string>;
}
```

### 5. Command Handlers (`commands/`)

Processes different types of commands:

- **commandRouter.ts**: Routes commands to appropriate handlers
- **exaCommand.ts**: Handles /exa search commands
- **githubCommand.ts**: Handles /github search commands
- **openaiCommand.ts**: Handles /openai prompt commands
- **helpCommand.ts**: Handles /help commands

```typescript
// Key interfaces
interface CommandHandler {
  canHandle(message: string): boolean;
  extractParams(message: string): CommandParams;
  execute(params: CommandParams): Promise<CommandResult>;
}

class CommandRouter {
  route(message: string): Promise<CommandResult>;
  registerHandler(handler: CommandHandler): void;
}
```

### 6. Configuration (`config/`)

Manages extension configuration:

- **settings.ts**: Wrapper for VS Code settings
- **constants.ts**: Constant values and defaults

```typescript
// Key interfaces
interface ConfigurationManager {
  get<T>(section: string, defaultValue?: T): T;
  update<T>(section: string, value: T): Promise<void>;
  onChange(listener: (e: ConfigChangeEvent) => void): void;
}
```

### 7. Copilot Plugin (`plugin/`)

Integrates with VS Code's Copilot Chat:

- **pluginHandler.ts**: Handles plugin messages
- **commandExtractor.ts**: Extracts commands from messages

```typescript
// Key interfaces
interface PluginHandler {
  handleMessage(message: string): Promise<string>;
}

interface CommandExtractor {
  extractCommand(message: string): Command | null;
}
```

### 8. Utilities (`utils/`)

Provides common utility functions:

- **formatting.ts**: Response formatting utilities
- **logging.ts**: Logging to VS Code output channel
- **streaming.ts**: Response streaming utilities

```typescript
// Key functionality
function formatMarkdown(text: string): string;
function logInfo(message: string): void;
function streamResponse(generator: AsyncGenerator, progress: Progress): Promise<void>;
```

## Package.json Configuration

The `package.json` file will define:

1. **Extension Metadata**: Name, publisher, version, etc.
2. **Activation Events**: When the extension should activate
3. **Contribution Points**: Commands, configuration, etc.
4. **Dependencies**: Required npm packages
5. **Copilot Plugin Registration**: Required for Copilot Chat integration

```json
{
  "name": "agentic-copilot",
  "displayName": "Agentic Copilot",
  "description": "Advanced search capabilities for Copilot Chat",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.93.0"
  },
  "categories": ["Other"],
  "activationEvents": [
    "onCommand:agentic-copilot.search",
    "onCopilotChat:agenticCopilot"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "agentic-copilot.search",
        "title": "Agentic Copilot: Search"
      }
    ],
    "configuration": {
      "title": "Agentic Copilot",
      "properties": {
        "agenticCopilot.openai.apiKey": {
          "type": "string",
          "description": "OpenAI API key"
        },
        "agenticCopilot.exa.apiKey": {
          "type": "string",
          "description": "Exa AI API key"
        }
      }
    },
    "copilotChatPlugins": [
      {
        "name": "agenticCopilot",
        "displayName": "Agentic Copilot",
        "description": "Advanced search capabilities for Copilot Chat"
      }
    ]
  }
}
```

## Module Relationships

The overall dependency flow follows this pattern:

1. **Extension → Activation**: Entry point initializes activation
2. **Activation → Commands + Plugin**: Activation sets up commands and plugin
3. **Commands/Plugin → API Clients**: Command processing uses API clients
4. **API Clients → Auth**: API clients use authentication
5. **All Modules → Config**: Configuration used across modules
6. **All Modules → Utils**: Utility functions used across modules

This structure ensures clear separation of concerns, modular components, and maintainable code organization.