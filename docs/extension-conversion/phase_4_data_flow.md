# Agentic Copilot - Data Flow Diagrams

## 1. Server vs. Extension Data Flow

This document illustrates the data flow differences between the current server architecture and the proposed VS Code extension architecture.

## 2. Current Server Architecture Data Flow

### 2.1 High-Level Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│   Client    │────▶│   Express   │────▶│  Message    │────▶│  Command    │
│  (Browser)  │     │   Server    │     │  Processor  │     │  Detector   │
│             │◀────│             │◀────│             │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│   HTTP      │◀────│  Response   │◀────│  External   │◀────│  Command    │
│  Response   │     │  Formatter  │     │   APIs      │     │  Handlers   │
│             │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 2.2 Authentication Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│   Express   │────▶│  GitHub     │
│  (Browser)  │     │   Server    │     │   API       │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  ▲                    │
       │                  │                    ▼
       │            ┌─────────────┐     ┌─────────────┐
       │            │             │     │             │
       └───────────▶│  GitHub     │◀────│  Token      │
                    │  Token      │     │  Validation │
                    │             │     │             │
                    └─────────────┘     └─────────────┘
```

### 2.3 Command Processing Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  User       │────▶│  Message    │────▶│  Command    │
│  Message    │     │  Parser     │     │  Extractor  │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Response   │◀────│  API        │◀────│  Command    │
│  Generator  │     │  Client     │     │  Router     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2.4 Response Streaming Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Copilot    │────▶│  Express    │────▶│  HTTP       │
│  API        │     │  Server     │     │  Response   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Stream     │────▶│  Pipe       │────▶│  Client     │
│  Processing │     │  Mechanism  │     │  Browser    │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 3. VS Code Extension Architecture Data Flow

### 3.1 High-Level Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  VS Code    │────▶│  Extension  │────▶│  Message    │────▶│  Command    │
│  Copilot    │     │  Host       │     │  Processor  │     │  Detector   │
│  Chat       │◀────│             │◀────│             │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │     │             │
│  Copilot    │◀────│  Response   │◀────│  External   │◀────│  Command    │
│  Chat       │     │  Formatter  │     │   APIs      │     │  Handlers   │
│  Plugin     │     │             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 Authentication Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  VS Code    │────▶│  VS Code    │────▶│  GitHub     │
│  Extension  │     │  Auth API   │     │   API       │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  ▲                    │
       │                  │                    ▼
       │            ┌─────────────┐     ┌─────────────┐
       │            │             │     │             │
       └───────────▶│  Secret     │◀────│  Token      │
                    │  Storage    │     │  Cache      │
                    │             │     │             │
                    └─────────────┘     └─────────────┘
```

### 3.3 Command Processing Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Copilot    │────▶│  Plugin     │────▶│  Command    │
│  Chat       │     │  Handler    │     │  Extractor  │
│  Input      │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Response   │◀────│  API        │◀────│  Command    │
│  Generator  │     │  Client     │     │  Router     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 3.4 Response Streaming Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  External   │────▶│  VS Code    │────▶│  Copilot    │
│  API        │     │  Extension  │     │  Chat       │
│             │     │             │     │  Plugin     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                  │                    │
       ▼                  ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  Stream     │────▶│  Progressive│────▶│  VS Code    │
│  Processing │     │  Updates    │     │  UI         │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 4. Key Data Flow Differences

### 4.1 Input/Output Mechanism

**Server Architecture**:
- HTTP request/response cycle
- Express middleware for processing
- Direct HTTP streams for response

**VS Code Extension**:
- VS Code extension API events
- Copilot Chat plugin message passing
- VS Code UI updates for display

### 4.2 Authentication Flow

**Server Architecture**:
- Token passed in HTTP headers
- Manual validation with GitHub API
- Token forwarded to Copilot API

**VS Code Extension**:
- VS Code authentication provider
- Secure token storage in extension context
- Automatic token management

### 4.3 User Interaction Model

**Server Architecture**:
- Browser-based interface
- HTTP-based commands
- Client-side rendering of responses

**VS Code Extension**:
- VS Code-native UI components
- Integration with editor features
- Context-aware interaction with workspace

### 4.4 Persistence Layer

**Server Architecture**:
- No built-in persistence between requests
- External database connections for state
- Client-side storage optional

**VS Code Extension**:
- Extension context storage for persistence
- VS Code settings for configuration
- Workspace-specific configurations

## 5. Data Transformation Points

### 5.1 Message Transformation

```
┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │
│  Raw User       │────▶│  Command or     │
│  Message        │     │  Keyword Query  │
│                 │     │                 │
└─────────────────┘     └─────────────────┘
```

### 5.2 API Response Transformation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  API JSON       │────▶│  Processed      │────▶│  Formatted      │
│  Response       │     │  Results        │     │  Markdown       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 5.3 Error Transformation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Raw API        │────▶│  Error          │────▶│  User-Friendly  │
│  Error          │     │  Context        │     │  Error Message  │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘