# Agentic Copilot VS Code Extension - Data Flow Diagrams

This document provides detailed data flow diagrams for the Agentic Copilot VS Code extension, illustrating how data moves through the system during key operations.

## 1. High-Level System Data Flow

```mermaid
flowchart TD
    User([User]) <--> VSCode[VS Code Editor]
    VSCode <--> Extension[Agentic Copilot Extension]
    Extension <--> OpenAI[OpenAI API]
    Extension <--> GitHub[GitHub API]
    Extension <--> ExaAI[Exa AI API]
    
    subgraph "VS Code"
        VSCode
        Extension
    end
    
    subgraph "External Services"
        OpenAI
        GitHub
        ExaAI
    end
```

## 2. Command Processing Flow

### 2.1 Command Detection and Routing

```mermaid
flowchart LR
    A[User Message] --> B[Plugin Handler]
    B --> C{Contains Command?}
    C -->|Yes| D[Command Extractor]
    C -->|No| E[Default Search]
    
    D --> F{Command Type}
    F -->|/exa| G[Exa Command Handler]
    F -->|/github| H[GitHub Command Handler]
    F -->|/openai| I[OpenAI Command Handler]
    F -->|/help| J[Help Command Handler]
    
    G --> K[Execute Exa Search]
    H --> L[Execute GitHub Search]
    I --> M[Execute OpenAI Prompt]
    J --> N[Show Documentation]
    E --> O[Execute Keyword Search]
```

### 2.2 Command Execution Flow

```mermaid
sequenceDiagram
    participant User
    participant VSCode as VS Code
    participant Plugin as Plugin Handler
    participant Router as Command Router
    participant Handler as Command Handler
    participant API as API Client
    participant Formatter as Response Formatter
    
    User->>VSCode: Type message with @Agentic
    VSCode->>Plugin: Forward message
    Plugin->>Router: Extract and route command
    Router->>Handler: Process specific command
    
    Handler->>API: Make API request
    API-->>Handler: Return API response
    
    Handler->>Formatter: Format response
    Formatter-->>Plugin: Return formatted response
    Plugin-->>VSCode: Progressive updates
    VSCode-->>User: Display response
```

## 3. Authentication Flow

### 3.1 Initial Authentication

```mermaid
sequenceDiagram
    participant User
    participant VSCode as VS Code
    participant Extension as Extension
    participant AuthProvider as Auth Provider
    participant GitHub as GitHub API
    participant Storage as Secret Storage
    
    User->>Extension: Use extension for first time
    Extension->>AuthProvider: Request GitHub token
    
    alt Token not available
        AuthProvider->>VSCode: Request user login
        VSCode->>User: Show GitHub login dialog
        User->>VSCode: Login with credentials
        VSCode->>GitHub: Authentication request
        GitHub-->>VSCode: Return access token
        VSCode->>AuthProvider: Provide token
    end
    
    AuthProvider->>Storage: Store token securely
    AuthProvider->>GitHub: Validate token
    GitHub-->>AuthProvider: User information
    AuthProvider-->>Extension: Authentication successful
    Extension-->>User: Show authenticated status
```

### 3.2 Token Usage Flow

```mermaid
flowchart TD
    A[API Client needs token] --> B[Request from Auth Provider]
    B --> C{Token in cache?}
    C -->|Yes| D[Return cached token]
    C -->|No| E[Request from VS Code]
    E --> F[VS Code Auth API]
    F --> G[Return fresh token]
    G --> H[Cache token]
    H --> I[Return token to client]
    D --> I
    I --> J[Use in API request]
```

## 4. Response Processing Flow

### 4.1 Response Formatting and Streaming

```mermaid
flowchart LR
    A[Raw API Response] --> B[Parse JSON]
    B --> C[Extract relevant data]
    C --> D[Convert to Markdown]
    D --> E[Add formatting]
    E --> F[Process code blocks]
    F --> G[Add citations]
    G --> H[Split into chunks]
    H --> I[Stream progressively]
    I --> J[Display in VS Code]
```

### 4.2 Streaming Sequence

```mermaid
sequenceDiagram
    participant API as External API
    participant Client as API Client
    participant Stream as Stream Processor
    participant Plugin as Plugin Handler
    participant VSCode as VS Code
    
    API->>Client: Stream response chunks
    
    loop For each chunk
        Client->>Stream: Process chunk
        Stream->>Plugin: Format chunk
        Plugin->>VSCode: Update UI with chunk
        VSCode->>VSCode: Append to display
    end
    
    Client->>Plugin: Signal completion
    Plugin->>VSCode: Finalize display
```

## 5. Configuration Flow

### 5.1 Settings Management

```mermaid
flowchart TD
    A[VS Code Settings] --> B[Extension Configuration]
    B --> C[API Configuration]
    B --> D[UI Configuration]
    B --> E[Feature Flags]
    
    C --> F[API Client Instances]
    D --> G[Formatter Configuration]
    E --> H[Feature Enablement]
    
    I[User changes setting] --> J[Settings change event]
    J --> K[Update configuration]
    K --> L[Reconfigure components]
```

### 5.2 Secret Management

```mermaid
flowchart LR
    A[API Keys] --> B{Storage Type}
    B -->|Sensitive| C[VS Code Secret Storage]
    B -->|Non-sensitive| D[VS Code Settings]
    
    C --> E[Encrypted Storage]
    D --> F[settings.json]
    
    E --> G[Auth Provider]
    F --> H[Configuration Manager]
    
    G --> I[API Clients]
    H --> I
```

## 6. Plugin Integration Flow

### 6.1 Copilot Chat Integration

```mermaid
flowchart TD
    A[Copilot Chat] --> B[Message with @Agentic]
    B --> C[Extension Activation]
    C --> D[Plugin Handler]
    D --> E[Process Message]
    E --> F[Command Extraction]
    F --> G[Command Execution]
    G --> H[Response Generation]
    H --> I[Format Response]
    I --> J[Progressive Updates]
    J --> K[Display in Chat]
```

### 6.2 Plugin Registration

```mermaid
sequenceDiagram
    participant Extension
    participant VSCode as VS Code
    participant Copilot as Copilot Chat
    participant Registry as Plugin Registry
    
    Extension->>VSCode: Activate extension
    Extension->>Registry: Register as Copilot plugin
    Registry->>Copilot: Add to available plugins
    Copilot->>VSCode: Show in @ menu
    
    Note over Extension,VSCode: Registration happens through package.json
```

## 7. Error Handling Flow

```mermaid
flowchart TD
    A[API Request] --> B{Success?}
    B -->|Yes| C[Process Response]
    B -->|No| D[Error Handler]
    
    D --> E{Error Type}
    E -->|Authentication| F[Auth Error Handler]
    E -->|Network| G[Network Error Handler]
    E -->|API-specific| H[API Error Handler]
    E -->|Other| I[Generic Error Handler]
    
    F --> J[Re-authenticate]
    G --> K[Retry with backoff]
    H --> L[Show API error message]
    I --> M[Show generic error]
    
    J --> N[Notify user]
    K --> N
    L --> N
    M --> N
```

## 8. End-to-End Command Flow Example

### 8.1 Example: `/exa` Command Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat as Copilot Chat
    participant Plugin as Agentic Plugin
    participant Router as Command Router
    participant Handler as Exa Command Handler
    participant Auth as Auth Provider
    participant API as Exa AI Client
    participant Formatter as Response Formatter
    
    User->>Chat: Type "@Agentic /exa quantum computing"
    Chat->>Plugin: Forward message
    
    Plugin->>Router: Extract command
    Router->>Handler: Route to Exa handler
    
    Handler->>Auth: Request authentication
    Auth->>Handler: Provide token
    
    Handler->>API: Search "quantum computing"
    API->>Handler: Return search results
    
    Handler->>Formatter: Format results
    Formatter->>Plugin: Return markdown
    
    Plugin->>Chat: Send progressive response
    Chat->>User: Display formatted results
```

### 8.2 Example: `/github` Command Flow

```mermaid
sequenceDiagram
    participant User
    participant Chat as Copilot Chat
    participant Plugin as Agentic Plugin
    participant Router as Command Router
    participant Handler as GitHub Command Handler
    participant Auth as Auth Provider
    participant API as GitHub Client
    participant Formatter as Response Formatter
    
    User->>Chat: Type "@Agentic /github react hooks"
    Chat->>Plugin: Forward message
    
    Plugin->>Router: Extract command
    Router->>Handler: Route to GitHub handler
    
    Handler->>Auth: Request GitHub token
    Auth->>Handler: Provide token
    
    Handler->>API: Search GitHub for "react hooks"
    API->>Handler: Return repository results
    
    Handler->>Formatter: Format results
    Formatter->>Plugin: Return markdown
    
    Plugin->>Chat: Send progressive response
    Chat->>User: Display formatted results
```

## 9. Data Transformation Points

This diagram highlights where data transformations occur in the system:

```mermaid
flowchart TD
    A[User Input] -->|Text parsing| B[Command Structure]
    B -->|Parameter extraction| C[API Parameters]
    C -->|API formatting| D[API Request]
    D -->|Network request| E[API Response]
    E -->|Result extraction| F[Structured Results]
    F -->|Markdown conversion| G[Formatted Output]
    G -->|Chunking| H[Response Stream]
    H -->|UI rendering| I[Displayed Content]
    
    subgraph "Input Transformation"
        A
        B
        C
    end
    
    subgraph "API Interaction"
        D
        E
    end
    
    subgraph "Output Transformation"
        F
        G
        H
        I
    end
```

These data flow diagrams provide a comprehensive view of how data moves through the Agentic Copilot VS Code extension, highlighting the key interaction points, transformation stages, and system integrations.