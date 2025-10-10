# Agentic Search Copilot Extension - Manual Test Plan

This document outlines the steps to manually verify the functionality of the Agentic Search Copilot extension after implementation.

## Prerequisites

- VS Code version 1.93.0 or higher
- GitHub Copilot Chat extension installed and properly configured
- GitHub account with valid authentication

## Test Categories

1. Installation & Activation
2. Authentication Flow
3. Command Registration
4. Copilot Chat Integration
5. Message Processing
6. Error Handling

## 1. Installation & Activation

### 1.1 Extension Installation

- [ ] Build the extension using `npm run compile`
- [ ] Install the extension via VSIX file using "Install from VSIX" command
- [ ] Verify extension appears in the extensions list
- [ ] Check extension details panel shows correct metadata

### 1.2 Extension Activation

- [ ] Open a new VS Code window
- [ ] Run the command `agenticCopilot.start` from the command palette
- [ ] Verify the information message "Agentic Copilot is ready in the @ picker of Copilot Chat"
- [ ] Check the Output panel for "Agentic Search extension" logs that show successful activation
- [ ] Verify extension activation events are properly logged

## 2. Authentication Flow

### 2.1 GitHub Authentication

- [ ] Check the authorization flow starts when the extension is activated
- [ ] Verify GitHub authentication dialog appears
- [ ] Complete authentication and check for success message
- [ ] Verify token is stored securely
- [ ] Check the authentication status in the Output panel logs

### 2.2 Token Management

- [ ] Verify token is properly cached between sessions
- [ ] Check that logging out and back in refreshes the token
- [ ] Verify the extension handles authentication errors gracefully

## 3. Command Registration

### 3.1 Basic Commands

- [ ] Verify `agenticCopilot.start` command works
- [ ] Verify `agenticCopilot.openSettings` command opens the correct settings page
- [ ] Try `agenticCopilot.resetCache` command and verify cache clearing message

### 3.2 Configuration

- [ ] Open extension settings via UI
- [ ] Modify `agenticCopilot.enableLogging` setting and verify logging behavior changes
- [ ] Modify `agenticCopilot.defaultSearchProvider` setting and verify search behavior changes

## 4. Copilot Chat Integration

### 4.1 Plugin Registration

- [ ] Open Copilot Chat panel
- [ ] Type `@` and check if "Agentic Search" appears in the picker
- [ ] Verify plugin description and title match package.json entries

### 4.2 Basic Interaction

- [ ] Select `@Agentic Search` in Copilot Chat
- [ ] Enter a simple query like "Hello"
- [ ] Verify response appears and is properly formatted with markdown
- [ ] Check the Output panel for logs showing message processing

## 5. Message Processing

### 5.1 Command Handling

- [ ] Try `/help` command in Copilot Chat with `@Agentic Search` selected
- [ ] Verify help information is displayed
- [ ] Try `/exa search for typescript` and verify Exa handler is invoked
- [ ] Try `/github find react libraries` and verify GitHub handler is invoked
- [ ] Try `/openai explain callbacks` and verify OpenAI handler is invoked

### 5.2 Default Search

- [ ] Enter a query without any command prefix (e.g., "How to implement async functions")
- [ ] Verify default search handler is invoked (as configured in settings)
- [ ] Check response contains relevant information

## 6. Error Handling

### 6.1 Invalid Commands

- [ ] Try an invalid command like `/nonexistent` 
- [ ] Verify appropriate error message is shown
- [ ] Check logs for proper error handling

### 6.2 Network Errors

- [ ] Disconnect from the internet
- [ ] Try a search query that requires network access
- [ ] Verify graceful error handling with user-friendly message
- [ ] Reconnect and verify functionality is restored

### 6.3 Authentication Errors

- [ ] Invalidate the GitHub token (by revoking access in GitHub settings)
- [ ] Try a query that requires authentication
- [ ] Verify the authentication error is handled properly
- [ ] Check that the user is prompted to re-authenticate

## Additional Tests

### Performance Testing

- [ ] Measure cold start time when first invoking the extension
- [ ] Measure response time for different types of queries
- [ ] Try with large responses and verify handling of streaming

### Security Testing

- [ ] Verify token is securely stored and not logged
- [ ] Check handling of sensitive information in queries
- [ ] Verify no credentials are exposed in logs

## Reporting Issues

Document any issues encountered during testing with:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/logs where applicable
5. VS Code and extension version information

---

## Test Results Summary

| Test Category | Status | Notes |
|---------------|--------|-------|
| Installation & Activation | ⬜ | |
| Authentication Flow | ⬜ | |
| Command Registration | ⬜ | |
| Copilot Chat Integration | ⬜ | |
| Message Processing | ⬜ | |
| Error Handling | ⬜ | |
| Performance Testing | ⬜ | |
| Security Testing | ⬜ | |

Legend: ✅ Pass, ❌ Fail, ⚠️ Partial/Issues, ⬜ Not Tested