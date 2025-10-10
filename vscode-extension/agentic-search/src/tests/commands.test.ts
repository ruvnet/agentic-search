import * as assert from 'assert';
import * as vscode from 'vscode'; // Minimal import if needed
import { OpenAICommandHandler } from '../commands/OpenAICommandHandler';
import { OpenAIClient, ChatCompletionMessage } from '../api/openai'; // Assuming ChatCompletionMessage is needed for typing
import { ConfigManager } from '../config/ConfigManager'; // May not be directly needed if clients are mocked at a higher level

// Mock setup for OpenAIClient
// It's often easier to mock the entire class or specific methods used by the handler
const mockCreateChatCompletion = jest.fn();
const mockOpenAIClientInstance = {
  createChatCompletion: mockCreateChatCompletion,
  isInitialized: true, // Default to true for most tests
  // Mock other methods if the handler uses them
};

// Mock setupOpenAIClient to return our mock instance
jest.mock('../api/openai', () => ({
  ...jest.requireActual('../api/openai'), // Import and retain other exports
  setupOpenAIClient: () => mockOpenAIClientInstance,
}));

describe('OpenAICommandHandler', () => {
  let handler: OpenAICommandHandler;

  beforeEach(() => {
    // Reset mocks and create a new handler instance before each test
    mockCreateChatCompletion.mockClear();
    mockOpenAIClientInstance.isInitialized = true; // Reset to default
    
    // Command Handlers no longer take context directly in constructor
    // They use setup functions which are now mocked to return specific client instances
    handler = new OpenAICommandHandler(); 
  });

  describe('canHandle', () => {
    it('should return true for "/openai" command', () => {
      assert.strictEqual(handler.canHandle('/openai test prompt'), true);
    });

    it('should return false for other commands or text', () => {
      assert.strictEqual(handler.canHandle('/exa test'), false);
      assert.strictEqual(handler.canHandle('just some text'), false);
    });
  });

  describe('process', () => {
    const baseMessages: ChatCompletionMessage[] = [{ role: 'user', content: '/openai initial prompt' }];
    const mockUser = { login: 'testuser', name: 'Test User' };

    it('should return system message if no prompt is provided after /openai', async () => {
      const resultMessages = await handler.process('/openai ', [...baseMessages], mockUser);
      const lastMessage = resultMessages[resultMessages.length - 1];
      assert.strictEqual(lastMessage.role, 'system');
      assert.match(lastMessage.content, /Please provide a prompt after '\/openai'/);
    });

    it('should return system message if OpenAIClient is not initialized', async () => {
      mockOpenAIClientInstance.isInitialized = false;
      const resultMessages = await handler.process('/openai test prompt', [...baseMessages], mockUser);
      const lastMessage = resultMessages[resultMessages.length - 1];
      assert.strictEqual(lastMessage.role, 'system');
      assert.match(lastMessage.content, /OpenAI API key is not configured/);
    });

    it('should call OpenAIClient.createChatCompletion with correct parameters and add assistant message', async () => {
      const prompt = 'tell me a joke';
      const apiResponse = { choices: [{ message: { content: 'Why did the chicken cross the road?' } }] };
      mockCreateChatCompletion.mockResolvedValue(apiResponse);

      const initialMessages: ChatCompletionMessage[] = [{ role: 'user', content: `/openai ${prompt}` }];
      const resultMessages = await handler.process(`/openai ${prompt}`, initialMessages, mockUser);
      
      const expectedOpenAIMessages: ChatCompletionMessage[] = [
        { role: 'system', content: 'You are a knowledgeable assistant that provides clear and concise explanations without mentioning that you are an AI language model.' },
        { role: 'user', content: prompt }
      ];

      expect(mockCreateChatCompletion).toHaveBeenCalledWith({
        model: 'o1-mini',
        messages: expectedOpenAIMessages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const assistantMessage = resultMessages.find(m => m.role === 'assistant');
      assert.ok(assistantMessage, 'Should have an assistant message');
      assert.strictEqual(assistantMessage?.content, apiResponse.choices[0].message.content);
    });

    it('should handle errors from OpenAIClient.createChatCompletion', async () => {
      mockCreateChatCompletion.mockRejectedValue(new Error('API Error'));
      const resultMessages = await handler.process('/openai very long prompt', [...baseMessages], mockUser);
      const lastMessage = resultMessages[resultMessages.length - 1];
      assert.strictEqual(lastMessage.role, 'system');
      assert.strictEqual(lastMessage.content, 'Unable to process the /openai command at the moment. Please try again later.');
    });
    
    it('should handle general errors during processing', async () => {
        // Force an error by making the client undefined temporarily for this test
        (handler as any).openaiClient = undefined; 
        const resultMessages = await handler.process('/openai some prompt', [...baseMessages], mockUser);
        const lastMessage = resultMessages[resultMessages.length - 1];
        assert.strictEqual(lastMessage.role, 'system');
        // This will likely be caught by the general catch block in OpenAICommandHandler.process
        // Check for a generic error message if specific one is not defined for this case.
        // The exact message depends on the implementation of the catch block in the handler.
        // For this example, let's assume a generic message or the specific one if available.
        assert.match(lastMessage.content, /An error occurred while processing your OpenAI command/); 
    });
  });
});
