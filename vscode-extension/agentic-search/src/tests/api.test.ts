import * as vscode from 'vscode';
import * as assert from 'assert';
import { OpenAIClient } from '../api/openai';
import { GitHubClient } from '../api/github';
import { ExaClient } from '../api/exa';
import { ConfigManager, ConfigKey } from '../config/ConfigManager';
import { JinaClient } from '../api/jina'; // Import JinaClient

// This file contains tests for the API clients implementation
// Note: These tests are meant to be run as part of the VS Code Extension Tests

/**
 * Mock extension context for testing
 */
class MockExtensionContext {
  private secretStorage: Record<string, string> = {};
  
  secrets = {
    get: async (key: string): Promise<string | undefined> => {
      return this.secretStorage[key];
    },
    store: async (key: string, value: string): Promise<void> => {
      this.secretStorage[key] = value;
    },
    delete: async (key: string): Promise<void> => {
      delete this.secretStorage[key];
    }
  };
  
  subscriptions: { dispose(): any }[] = [];
  
  workspaceState = {
    get: (key: string) => undefined,
    update: (key: string, value: any) => Promise.resolve(),
    keys: () => []
  };
  
  globalState = {
    get: (key: string) => undefined,
    update: (key: string, value: any) => Promise.resolve(),
    keys: () => [],
    setKeysForSync: (keys: string[]): void => {}
  };
  
  extensionPath = '';
  asAbsolutePath = (relativePath: string): string => relativePath;
  storageUri = null as any;
  globalStorageUri = null as any;
  logUri = null as any;
  extensionUri = null as any;
  extensionMode = 1; // Test mode
  environmentVariableCollection = {} as any;
}

/**
 * Test cases for the API client implementations
 */
export function runApiTests() {
  describe('ConfigManager', () => {
    let mockContext: MockExtensionContext;
    let configManager: ConfigManager;
    
    beforeEach(() => {
      mockContext = new MockExtensionContext();
      configManager = new ConfigManager(mockContext as any);
    });
    
    it('should store and retrieve secure settings', async () => {
      const testApiKey = 'test-api-key-12345';
      
      await configManager.storeSecure(ConfigKey.OPENAI_API_KEY, testApiKey);
      const retrievedKey = await configManager.getSecure(ConfigKey.OPENAI_API_KEY);
      
      assert.strictEqual(retrievedKey, testApiKey);
    });
    
    it('should delete secure settings', async () => {
      const testApiKey = 'test-api-key-12345';
      
      await configManager.storeSecure(ConfigKey.OPENAI_API_KEY, testApiKey);
      await configManager.deleteSecure(ConfigKey.OPENAI_API_KEY);
      const retrievedKey = await configManager.getSecure(ConfigKey.OPENAI_API_KEY);
      
      assert.strictEqual(retrievedKey, undefined);
    });
    
    it('should check if secure value exists', async () => {
      const testApiKey = 'test-api-key-12345';
      
      await configManager.storeSecure(ConfigKey.OPENAI_API_KEY, testApiKey);
      
      const hasKey = await configManager.hasSecure(ConfigKey.OPENAI_API_KEY);
      const hasNonExistent = await configManager.hasSecure(ConfigKey.EXA_API_KEY);
      
      assert.strictEqual(hasKey, true);
      assert.strictEqual(hasNonExistent, false);
    });
  });

  describe('OpenAI API Client', () => {
    let mockConfigManager: ConfigManager;
    let openaiClient: OpenAIClient;
    let fetchSpy: jest.SpyInstance;

    const mockGetSecure = jest.fn();
    const mockStoreSecure = jest.fn();

    beforeEach(() => {
      mockConfigManager = {
        getSecure: mockGetSecure,
        storeSecure: mockStoreSecure,
      } as any;

      openaiClient = new OpenAIClient(mockConfigManager);
      fetchSpy = jest.spyOn(global, 'fetch');

      mockGetSecure.mockClear();
      mockStoreSecure.mockClear();
      fetchSpy.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('constructor should initialize with isInitialized false if no key is found by getApiKey', async () => {
      mockGetSecure.mockResolvedValue(undefined);
      const client = new OpenAIClient(mockConfigManager); 
      // Allow async operation in constructor to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      assert.strictEqual(client.isInitialized, false, 'isInitialized should be false initially or if key retrieval fails');
    });

    it('setApiKey should call configManager.storeSecure and set isInitialized to true', async () => {
      const testApiKey = 'test-openai-key-12345';
      await openaiClient.setApiKey(testApiKey);
      expect(mockStoreSecure).toHaveBeenCalledWith(ConfigKey.OPENAI_API_KEY, testApiKey);
      assert.strictEqual(openaiClient.isInitialized, true);
    });
    
    it('methods calling getApiKey should set isInitialized to true if key exists', async () => {
      mockGetSecure.mockResolvedValue('dummy-key');
      fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({}) }); 
      try { await openaiClient.createChatCompletion({ model: 'o1-mini', messages: [] }); } catch (e) {}
      assert.strictEqual(openaiClient.isInitialized, true);
    });

    it('methods calling getApiKey should set isInitialized to false if no key exists', async () => {
      mockGetSecure.mockResolvedValue(undefined);
      try { await openaiClient.createChatCompletion({ model: 'o1-mini', messages: [] }); } catch (e) {}
      assert.strictEqual(openaiClient.isInitialized, false);
    });

    describe('createChatCompletion', () => {
      const chatOptions = {
        model: 'o1-mini',
        messages: [{ role: 'user' as 'user', content: 'Hello' }],
        temperature: 0.5,
        max_tokens: 50,
      };
      const mockApiResponse = { choices: [{ message: { content: 'response' } }] };

      it('should make a successful API call', async () => {
        mockGetSecure.mockResolvedValue('dummy-api-key');
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          json: async () => mockApiResponse,
        });

        const response = await openaiClient.createChatCompletion(chatOptions);

        expect(fetchSpy).toHaveBeenCalledWith(
          'https://api.openai.com/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer dummy-api-key',
            },
            body: JSON.stringify({
              ...chatOptions,
              stream: false, 
              top_p: 1.0, 
              frequency_penalty: 0, 
              presence_penalty: 0, 
            }),
          })
        );
        assert.deepStrictEqual(response, mockApiResponse);
      });

      it('should throw error if API key is not configured', async () => {
        mockGetSecure.mockResolvedValue(undefined);
        await assert.rejects(
          openaiClient.createChatCompletion(chatOptions),
          /OpenAI API key is not configured/
        );
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      it('should throw error if OpenAI API returns an error', async () => {
        mockGetSecure.mockResolvedValue('dummy-api-key');
        fetchSpy.mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized',
        });
        await assert.rejects(
          openaiClient.createChatCompletion(chatOptions),
          /OpenAI API request failed with status 401: Unauthorized/
        );
      });

      it('should throw error on network failure', async () => {
        mockGetSecure.mockResolvedValue('dummy-api-key');
        fetchSpy.mockRejectedValueOnce(new Error('Network failed'));
        await assert.rejects(
          openaiClient.createChatCompletion(chatOptions),
          /Network failed/
        );
      });
    });

    describe('createChatCompletionStream', () => {
      const streamOptions = {
        model: 'o1-mini',
        messages: [{ role: 'user' as 'user', content: 'Hello Stream' }],
        temperature: 0.6,
      };
      const mockStream = new ReadableStream();

      it('should make a successful API call for stream', async () => {
        mockGetSecure.mockResolvedValue('dummy-api-key-stream');
        fetchSpy.mockResolvedValueOnce({
          ok: true,
          body: mockStream,
        });
        const responseStream = await openaiClient.createChatCompletionStream(streamOptions);
        expect(fetchSpy).toHaveBeenCalledWith(
          'https://api.openai.com/v1/chat/completions',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"stream":true'),
          })
        );
        assert.strictEqual(responseStream, mockStream);
      });
    });
  });

  describe('GitHub API Client', () => {
    let mockContext: vscode.ExtensionContext;
    let githubClient: GitHubClient;
    let fetchSpy: jest.SpyInstance;
    let mockGetSession: jest.Mock;

    beforeEach(() => {
      mockContext = new MockExtensionContext() as any;
      
      mockGetSession = jest.fn();
      (vscode.authentication.getSession as jest.Mock) = mockGetSession;

      githubClient = new GitHubClient(mockContext);
      fetchSpy = jest.spyOn(global, 'fetch');

      (githubClient as any).token = undefined; 
      githubClient.isInitialized = false;

      mockGetSession.mockClear();
      fetchSpy.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('constructor should initialize with name "GitHub" and isInitialized false', () => {
      assert.strictEqual(githubClient.name, 'GitHub');
      assert.strictEqual(githubClient.isInitialized, false);
    });

    describe('getAuthToken', () => {
      it('should retrieve token successfully and set isInitialized to true', async () => {
        mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token' });
        const token = await githubClient.getAuthToken();
        assert.strictEqual(token, 'mock-gh-token');
        assert.strictEqual(githubClient.isInitialized, true);
      });

      it('should return undefined if no session is available and keep isInitialized false', async () => {
        mockGetSession.mockResolvedValueOnce(undefined);
        const token = await githubClient.getAuthToken();
        assert.strictEqual(token, undefined);
        assert.strictEqual(githubClient.isInitialized, false);
      });

      it('should use cached token on subsequent calls', async () => {
        mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token-cached' });
        await githubClient.getAuthToken(); 
        expect(mockGetSession).toHaveBeenCalledTimes(1);
        const token = await githubClient.getAuthToken(); 
        assert.strictEqual(token, 'mock-gh-token-cached');
        expect(mockGetSession).toHaveBeenCalledTimes(1);
      });
    });

    describe('getAuthenticatedUser', () => {
      const mockUserData = { login: 'test-user', name: 'Test User' };
      it('should fetch authenticated user successfully', async () => {
        mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token' });
        fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockUserData });
        const user = await githubClient.getAuthenticatedUser();
        expect(fetchSpy).toHaveBeenCalledWith('https://api.github.com/user', expect.anything());
        assert.deepStrictEqual(user, mockUserData);
      });

      it('should throw error if no auth token', async () => {
        mockGetSession.mockResolvedValueOnce(undefined);
        await assert.rejects(githubClient.getAuthenticatedUser(), /GitHub authentication is required/);
      });
    });
    
    describe('searchRepositories', () => {
        const query = 'agentic-copilot';
        const mockSearchData = { items: [{ id: 1, name: 'agentic-copilot-repo' }]};
        it('should search repositories successfully', async () => {
            mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token'});
            fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockSearchData });
            const results = await githubClient.searchRepositories({ q: query, sort: 'stars', order: 'desc', per_page: 10, page: 1 });
            expect(fetchSpy).toHaveBeenCalledWith(
                `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10&page=1`,
                expect.objectContaining({ method: 'GET'})
            );
            assert.deepStrictEqual(results, mockSearchData);
        });
    });
    
    describe('getMyRepositories', () => {
        const mockRepoData = [{ id: 1, name: 'my-repo' }];
        it('should fetch user repositories with specific type, sort, and direction', async () => {
          mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token-repo-test' });
          fetchSpy.mockResolvedValueOnce({
            ok: true,
            json: async () => mockRepoData,
            status: 200,
          });
    
          const results = await githubClient.getMyRepositories('owner', 'pushed', 'desc');
    
          expect(vscode.authentication.getSession).toHaveBeenCalledWith('github', ['repo', 'user'], { createIfNone: true });
          const expectedUrl = 'https://api.github.com/user/repos?type=owner&sort=pushed&direction=desc';
          expect(fetchSpy).toHaveBeenCalledWith(
            expectedUrl,
            expect.objectContaining({
              method: 'GET',
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token mock-gh-token-repo-test`,
              },
            })
          );
          assert.deepStrictEqual(results, mockRepoData, 'Should return mocked repository data');
          assert.strictEqual(githubClient.isInitialized, true, 'Client should be initialized after successful token fetch');
        });
    });

    describe('getRepository', () => {
        const owner = 'test-owner';
        const repo = 'test-repo';
        const mockRepoData = { id: 1, name: repo, full_name: `${owner}/${repo}` };
        it('should fetch a specific repository successfully', async () => {
            mockGetSession.mockResolvedValueOnce({ accessToken: 'mock-gh-token'});
            fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockRepoData });
            const result = await githubClient.getRepository(owner, repo);
            expect(fetchSpy).toHaveBeenCalledWith(
                `https://api.github.com/repos/${owner}/${repo}`,
                expect.objectContaining({ method: 'GET'})
            );
            assert.deepStrictEqual(result, mockRepoData);
        });
    });
  });

  describe('Exa API Client', () => {
    let mockConfigManager: ConfigManager;
    let exaClient: ExaClient;
    let fetchSpy: jest.SpyInstance;
    const mockExaGetSecure = jest.fn();
    const mockExaStoreSecure = jest.fn();
    
    beforeEach(() => {
      mockConfigManager = { getSecure: mockExaGetSecure, storeSecure: mockExaStoreSecure } as any;
      exaClient = new ExaClient(mockConfigManager);
      fetchSpy = jest.spyOn(global, 'fetch');
      mockExaGetSecure.mockClear();
      mockExaStoreSecure.mockClear();
      fetchSpy.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('setApiKey should call configManager.storeSecure and set isInitialized to true', async () => {
      const testApiKey = 'test-exa-key-12345';
      await exaClient.setApiKey(testApiKey);
      expect(mockExaStoreSecure).toHaveBeenCalledWith(ConfigKey.EXA_API_KEY, testApiKey);
      assert.strictEqual(exaClient.isInitialized, true);
    });

    describe('search', () => {
      const mockExaResponse = { results: [{ title: 'Exa Test Result', url: 'http://exa.com/test' }] };
      it('should make a successful API call with string query', async () => {
        mockExaGetSecure.mockResolvedValue('dummy-exa-api-key');
        fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => mockExaResponse });
        const response = await exaClient.search('test exa query');
        expect(fetchSpy).toHaveBeenCalledWith('https://api.exa.ai/search', expect.anything());
        assert.deepStrictEqual(response, mockExaResponse);
      });

      it('should throw error if API key is not configured', async () => {
        mockExaGetSecure.mockResolvedValue(undefined);
        await assert.rejects(exaClient.search('test query'), /Exa AI API key not configured/);
      });
    });

    describe('searchGitHub', () => {
        it('should make a successful call with correct parameters', async () => {
            mockExaGetSecure.mockResolvedValue('gh-exa-api-key');
            fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });
            await exaClient.searchGitHub('agentic projects', 15);
            expect(fetchSpy).toHaveBeenCalledWith(
                'https://api.exa.ai/search',
                expect.objectContaining({
                    body: expect.stringContaining('"category":"github"')
                })
            );
        });
    });

    describe('searchNews', () => {
        it('should make a successful call with correct parameters', async () => {
            mockExaGetSecure.mockResolvedValue('news-exa-api-key');
            fetchSpy.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [] }) });
            await exaClient.searchNews('latest tech', 5);
            expect(fetchSpy).toHaveBeenCalledWith(
                'https://api.exa.ai/search',
                expect.objectContaining({
                    body: expect.stringContaining('"category":"news"')
                })
            );
        });
    });
  });

  describe('Jina AI Client', () => {
    let mockConfigManager: ConfigManager;
    let jinaClient: JinaClient;
    let fetchSpy: jest.SpyInstance;
    const mockJinaGetSecure = jest.fn();
    const mockJinaStoreSecure = jest.fn();

    beforeEach(() => {
      mockConfigManager = { getSecure: mockJinaGetSecure, storeSecure: mockJinaStoreSecure } as any;
      jinaClient = new JinaClient(mockConfigManager);
      fetchSpy = jest.spyOn(global, 'fetch');
      mockJinaGetSecure.mockClear();
      mockJinaStoreSecure.mockClear();
      fetchSpy.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('setApiKey should call configManager.storeSecure and set isInitialized to true', async () => {
      const testApiKey = 'test-jina-key-12345';
      await jinaClient.setApiKey(testApiKey);
      expect(mockJinaStoreSecure).toHaveBeenCalledWith(ConfigKey.JINA_API_KEY, testApiKey);
      assert.strictEqual(jinaClient.isInitialized, true);
    });

    describe('search', () => {
      const mockJinaResponseText = "## Markdown Result for Jina";
      it('should make a successful API call', async () => {
        mockJinaGetSecure.mockResolvedValue('dummy-jina-api-key');
        fetchSpy.mockResolvedValueOnce({ ok: true, text: async () => mockJinaResponseText });
        const response = await jinaClient.search("test jina keyword");
        expect(fetchSpy).toHaveBeenCalledWith(
            `https://s.jina.ai/${encodeURIComponent("test jina keyword")}`,
            expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ 'Authorization': 'Bearer dummy-jina-api-key' }) })
        );
        assert.strictEqual(response, mockJinaResponseText);
      });

      it('should throw error if API key is not configured', async () => {
        mockJinaGetSecure.mockResolvedValue(undefined);
        await assert.rejects(jinaClient.search("test keyword"), /Jina API key is not configured/);
      });
    });
  });
}