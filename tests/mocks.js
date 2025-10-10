// tests/mocks.js
// Mock implementations for external dependencies
import { jest } from '@jest/globals';

// Mock fetch responses
export const mockFetchResponses = {
  // Jina API mock response
  jinaSuccess: {
    ok: true,
    text: jest.fn().mockResolvedValue("Mock response from Jina API"),
    json: jest.fn(),
    body: {
      pipe: jest.fn()
    }
  },
  
  jinaError: {
    ok: false,
    status: 500,
    text: jest.fn().mockResolvedValue("Error from Jina API"),
    json: jest.fn(),
    body: {
      pipe: jest.fn()
    }
  },
  
  // Exa API mock responses
  exaSuccess: {
    ok: true,
    text: jest.fn().mockResolvedValue(JSON.stringify({
      results: [
        {
          title: "Mock Title 1",
          summary: "Mock Summary 1",
          url: "https://example.com/1"
        },
        {
          title: "Mock Title 2",
          summary: "Mock Summary 2",
          url: "https://example.com/2"
        }
      ]
    })),
    json: jest.fn(),
    body: {
      pipe: jest.fn()
    }
  },
  
  exaError: {
    ok: false,
    status: 500,
    text: jest.fn().mockResolvedValue("Error from Exa API"),
    json: jest.fn(),
    body: {
      pipe: jest.fn()
    }
  },
  
  // Copilot API mock responses
  copilotSuccess: {
    ok: true,
    body: {
      pipe: jest.fn()
    },
    text: jest.fn().mockResolvedValue("Mock response from Copilot API"),
    json: jest.fn()
  },
  
  copilotError: {
    ok: false,
    status: 500,
    text: jest.fn().mockResolvedValue("Error from Copilot API"),
    json: jest.fn(),
    body: {
      pipe: jest.fn()
    }
  }
};