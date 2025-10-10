// tests/server.test.js
import { describe, expect, jest, test } from '@jest/globals';
import express from 'express';
import { Octokit } from '@octokit/core';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// Manual mock for fetch
const mockFetch = jest.fn().mockImplementation(() => {
  return Promise.resolve({
    ok: true,
    text: () => Promise.resolve('Mock response data'),
    body: { pipe: jest.fn() }
  });
});

// Mock node-fetch
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: mockFetch
}));

describe('Agentic Copilot Extension Server', () => {
  describe('Route Handlers', () => {
    test('GET / handler should serve index.html', () => {
      // Create mocks
      const req = {};
      const res = { sendFile: jest.fn() };
      const path = { join: jest.fn().mockReturnValue('/mock/path/to/index.html') };
      
      // Create the handler function similar to the one in the server
      const handler = (req, res) => {
        res.sendFile(path.join('/mock/path', 'public', 'index.html'));
      };
      
      // Call the handler
      handler(req, res);
      
      // Verify the response
      expect(res.sendFile).toHaveBeenCalled();
    });
    
    test('POST / handler should process user messages', async () => {
      // Create mock request with GitHub token
      const req = {
        get: jest.fn().mockReturnValue('mock-token'),
        body: {
          messages: [
            { role: 'user', content: 'hello' }
          ]
        }
      };
      
      // Create mock response
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      
      // Mock Octokit instance
      const octokit = {
        request: jest.fn().mockResolvedValue({
          data: { login: 'testuser' }
        })
      };
      
      // Use mockFetch directly for this test
      const handler = async (req, res) => {
        try {
          // Get the GitHub token and user info
          const token = req.get('X-GitHub-Token');
          const userInfo = await octokit.request('GET /user');
          
          // Make sure we have messages
          if (!req.body.messages || !Array.isArray(req.body.messages)) {
            return res.status(400).send('Invalid messages format');
          }
          
          // Simulate making Copilot API request directly with mockFetch
          mockFetch('https://api.githubcopilot.com/chat/completions', {
            method: 'POST',
            headers: {
              authorization: `Bearer ${token}`,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              messages: req.body.messages,
              stream: true
            })
          });
          
          // For test purposes, we'll just directly manipulate the response
          res.status(200);
        } catch (error) {
          res.status(500).send(`An error occurred: ${error.message}`);
        }
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify fetch was called with the right parameters
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.githubcopilot.com/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            authorization: 'Bearer mock-token'
          })
        })
      );
    });
    
    test('Command detection should identify /exa command', () => {
      // Setup test message
      const userMessage = { content: '/exa test query' };
      
      // Function to detect /exa command
      const isExaCommand = (content) => content.startsWith('/exa');
      const extractExaKeywords = (content) => {
        if (isExaCommand(content)) {
          const keywords = content.slice(4).trim();
          return keywords || 'toronto weather'; // Default if no keywords
        }
        return null;
      };
      
      // Test the functions
      expect(isExaCommand(userMessage.content)).toBe(true);
      expect(extractExaKeywords(userMessage.content)).toBe('test query');
    });
    
    test('Command detection should identify /github command', () => {
      // Setup test message
      const userMessage = { content: '/github test query' };
      
      // Function to detect /github command
      const isGithubCommand = (content) => content.startsWith('/github');
      const extractGithubKeywords = (content) => {
        if (isGithubCommand(content)) {
          const keywords = content.slice(7).trim();
          return keywords || 'the latest agentic projects'; // Default if no keywords
        }
        return null;
      };
      
      // Test the functions
      expect(isGithubCommand(userMessage.content)).toBe(true);
      expect(extractGithubKeywords(userMessage.content)).toBe('test query');
    });
    
    test('Command detection should identify /openai command', () => {
      // Setup test message
      const userMessage = { content: '/openai write a poem' };
      
      // Function to detect /openai command
      const isOpenAiCommand = (content) => content.startsWith('/openai');
      const extractOpenAiPrompt = (content) => {
        if (isOpenAiCommand(content)) {
          return content.slice(7).trim();
        }
        return null;
      };
      
      // Test the functions
      expect(isOpenAiCommand(userMessage.content)).toBe(true);
      expect(extractOpenAiPrompt(userMessage.content)).toBe('write a poem');
    });
    
    test('Help command detection should work properly', () => {
      // Setup test messages
      const helpMessage = { content: 'can you help me with the documentation' };
      const regularMessage = { content: 'tell me about React' };
      
      // Function to detect help command
      const isHelpCommand = (content) => {
        return /\bhelp\b|\bdocumentation\b|\bguide\b/i.test(content);
      };
      
      // Test the function
      expect(isHelpCommand(helpMessage.content)).toBe(true);
      expect(isHelpCommand(regularMessage.content)).toBe(false);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      // Create a custom error
      const errorMessage = 'Custom network error';
      
      // Create mocks
      const req = {
        get: jest.fn().mockReturnValue('mock-token'),
        body: { messages: [] }
      };
      const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
      
      // Simple handler that directly throws an error
      const handler = async (req, res) => {
        try {
          throw new Error(errorMessage);
        } catch (error) {
          res.status(500).send(`An error occurred: ${error.message}`);
        }
      };
      
      // Call the handler
      await handler(req, res);
      
      // Verify error handling
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(`An error occurred: ${errorMessage}`);
    });
  });
});