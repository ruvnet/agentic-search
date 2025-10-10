import * as vscode from 'vscode';
import { ApiClient } from './index';

// Define types for GitHub API responses
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
    url: string;
  };
  html_url: string;
  description: string;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string;
  topics: string[];
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  email: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubSearchResult<T> {
  total_count: number;
  incomplete_results: boolean;
  items: T[];
}

export interface GitHubSearchOptions {
  q: string;
  sort?: string;
  order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

/**
 * GitHub API client for interacting with GitHub services
 */
export class GitHubClient implements ApiClient {
  public isInitialized: boolean = false;
  public name: string = 'GitHub';
  
  private token?: string;
  private readonly baseUrl = 'https://api.github.com';
  private context: vscode.ExtensionContext;
  
  /**
   * Initialize the GitHub client with configuration
   * @param context The extension context
   * @param token The GitHub authentication token
   */
  constructor(context: vscode.ExtensionContext, token?: string) {
    this.context = context;
    this.token = token;
    this.isInitialized = !!token;
  }
  
  /**
   * Get the GitHub token from VS Code authentication provider
   * @returns Promise resolving to the token or undefined
   */
  public async getAuthToken(): Promise<string | undefined> {
    if (this.token) {
      return this.token;
    }
    
    try {
      // Get authentication session from VS Code's GitHub authentication provider
      const session = await vscode.authentication.getSession('github', ['repo', 'user'], { createIfNone: true });
      this.token = session.accessToken;
      this.isInitialized = true;
      return this.token;
    } catch (error) {
      console.error('Failed to get GitHub token:', error);
      return undefined;
    }
  }
  
  /**
   * Makes a request to the GitHub API
   * @param endpoint The API endpoint to request
   * @param method The HTTP method to use
   * @param body Optional request body for POST/PUT/PATCH requests
   * @returns The response data
   */
  private async request<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    const token = await this.getAuthToken();
    
    if (!token) {
      throw new Error('GitHub authentication is required. Please sign in to GitHub from VS Code.');
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${token}`,
    };
    
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GitHub API request failed with status ${response.status}: ${errorText}`);
      }
      
      // Check if the response is empty (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('Error in GitHub API request:', error);
      throw new Error(`GitHub API request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the authenticated user's profile
   * @returns The user profile data
   */
  public async getAuthenticatedUser(): Promise<GitHubUser> {
    return await this.request<GitHubUser>('/user');
  }
  
  /**
   * Get a specific user's profile
   * @param username The GitHub username
   * @returns The user profile data
   */
  public async getUser(username: string): Promise<GitHubUser> {
    return await this.request<GitHubUser>(`/users/${encodeURIComponent(username)}`);
  }
  
  /**
   * Search for repositories on GitHub
   * @param options Search options
   * @returns Search results
   */
  public async searchRepositories(options: GitHubSearchOptions): Promise<GitHubSearchResult<GitHubRepository>> {
    const queryParams = new URLSearchParams();
    queryParams.append('q', options.q);
    
    if (options.sort) {
      queryParams.append('sort', options.sort);
    }
    
    if (options.order) {
      queryParams.append('order', options.order);
    }
    
    if (options.per_page) {
      queryParams.append('per_page', options.per_page.toString());
    }
    
    if (options.page) {
      queryParams.append('page', options.page.toString());
    }
    
    return await this.request<GitHubSearchResult<GitHubRepository>>(`/search/repositories?${queryParams.toString()}`);
  }
  
  /**
   * Get the authenticated user's repositories
   * @param type Type of repositories to fetch (all, owner, public, private, member)
   * @param sort Sort field (created, updated, pushed, full_name)
   * @param direction Sort direction (asc, desc)
   * @returns List of repositories
   */
  public async getMyRepositories(
    type: 'all' | 'owner' | 'public' | 'private' | 'member' = 'all',
    sort: 'created' | 'updated' | 'pushed' | 'full_name' = 'full_name',
    direction: 'asc' | 'desc' = 'asc'
  ): Promise<GitHubRepository[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    queryParams.append('sort', sort);
    queryParams.append('direction', direction);
    
    return await this.request<GitHubRepository[]>(`/user/repos?${queryParams.toString()}`);
  }
  
  /**
   * Get a specific repository
   * @param owner The repository owner
   * @param repo The repository name
   * @returns Repository data
   */
  public async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    return await this.request<GitHubRepository>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }
}

// Singleton instance
let githubClient: GitHubClient | undefined;

/**
 * Setup the GitHub client
 * @param context The extension context
 * @returns The initialized GitHub client
 */
export function setupGitHubClient(context: vscode.ExtensionContext): GitHubClient {
  if (!githubClient) {
    // Create client without token, it will be acquired when needed
    githubClient = new GitHubClient(context);
    
    // Optional: Immediately try to get the token
    githubClient.getAuthToken().catch(error => {
      console.log('Note: GitHub authentication will be requested when needed');
    });
  }
  
  return githubClient;
}