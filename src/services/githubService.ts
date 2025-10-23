import { GitHubPullRequest, GitHubApiError, GitHubPullRequestsParams } from '../types/common';

/**
 * GitHub Service for interacting with GitHub REST API v2022-11-28
 * Handles authentication, rate limiting, and API calls
 */
export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com';
  private static readonly API_VERSION = '2022-11-28';

  /**
   * Parse repository URL to extract owner and repo name
   * Supports various GitHub URL formats:
   * - https://github.com/owner/repo
   * - https://github.com/owner/repo.git
   * - git@github.com:owner/repo.git
   */
  private static parseRepositoryUrl(repositoryUrl: string): { owner: string; repo: string } {
    try {
      // Remove .git suffix if present
      const cleanUrl = repositoryUrl.replace(/\.git$/, '');

      // Handle different URL formats
      let owner: string, repo: string;

      if (cleanUrl.includes('github.com/')) {
        // HTTP/HTTPS format: https://github.com/owner/repo
        const parts = cleanUrl.split('github.com/')[1].split('/');
        owner = parts[0];
        repo = parts[1];
      } else if (cleanUrl.includes('git@github.com:')) {
        // SSH format: git@github.com:owner/repo
        const parts = cleanUrl.split('git@github.com:')[1].split('/');
        owner = parts[0];
        repo = parts[1];
      } else {
        throw new Error('Invalid GitHub repository URL format');
      }

      if (!owner || !repo) {
        throw new Error('Could not extract owner and repository name from URL');
      }

      return { owner, repo };
    } catch (error) {
      throw new Error(
        `Failed to parse repository URL: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Make authenticated request to GitHub API
   */
  private static async makeRequest<T>(
    endpoint: string,
    token: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': this.API_VERSION,
      'User-Agent': 'QuantumTab-Extension/1.0',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle rate limiting
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        const rateLimitReset = response.headers.get('x-ratelimit-reset');

        if (rateLimitRemaining === '0') {
          const resetTime = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : new Date();
          throw new Error(
            `GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`
          );
        }
      }

      if (!response.ok) {
        const errorData: GitHubApiError = await response.json().catch(() => ({
          message: `HTTP ${response.status}: ${response.statusText}`,
        }));

        // Provide more specific error messages
        let errorMessage = errorData.message || `GitHub API error: ${response.status}`;

        if (response.status === 404) {
          errorMessage =
            'Repository not found or access denied. This could mean:\n' +
            "• The repository doesn't exist\n" +
            '• The repository is private and your token lacks access\n' +
            "• Your token needs the 'repo' scope for private repositories\n" +
            "• You're not a member of the organization";
        } else if (response.status === 401) {
          errorMessage =
            'Invalid or expired GitHub token. Please check your Personal Access Token.';
        } else if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          if (rateLimitRemaining === '0') {
            // Rate limit error already handled above
          } else {
            errorMessage =
              'Access forbidden. Your token may lack the required permissions or scopes.';
          }
        }

        console.error('GitHub API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          url: url,
          headers: Object.fromEntries(response.headers.entries()),
          errorData,
        });

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error occurred while making GitHub API request');
    }
  }

  /**
   * Fetch pull requests for a repository
   * @param token - GitHub Personal Access Token
   * @param repositoryUrl - GitHub repository URL
   * @param params - Optional parameters for filtering and pagination
   */
  static async getPullRequests(
    token: string,
    repositoryUrl: string,
    params: GitHubPullRequestsParams = {}
  ): Promise<GitHubPullRequest[]> {
    if (!token) {
      throw new Error('GitHub Personal Access Token is required');
    }

    if (!repositoryUrl) {
      throw new Error('Repository URL is required');
    }

    try {
      const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);

      // First, validate token and check repository access
      const tokenValidation = await this.validateToken(token);
      if (!tokenValidation.valid) {
        throw new Error(`Invalid token: ${tokenValidation.error}`);
      }

      // Check repository access
      const repoAccess = await this.checkRepositoryAccess(token, repositoryUrl);
      if (!repoAccess.hasAccess) {
        throw new Error(repoAccess.error || 'Cannot access repository');
      }

      // Build query parameters or search query
      let endpoint: string;
      let pullRequests: GitHubPullRequest[];

      if (params.author) {
        // Use search API to filter by author
        const searchQuery = `repo:${owner}/${repo} is:pr author:${params.author} is:open`;
        const searchParams = new URLSearchParams();
        searchParams.set('q', searchQuery);
        searchParams.set('sort', params.sort || 'created');
        searchParams.set('order', params.direction || 'desc');
        if (params.per_page) searchParams.set('per_page', params.per_page.toString());
        if (params.page) searchParams.set('page', params.page.toString());

        endpoint = `/search/issues?${searchParams.toString()}`;

        const searchResponse = await this.makeRequest<{
          total_count: number;
          incomplete_results: boolean;
          items: GitHubPullRequest[];
        }>(endpoint, token);

        pullRequests = searchResponse.items;
      } else {
        // Use regular pulls endpoint
        const queryParams = new URLSearchParams();
        queryParams.set('state', params.state || 'open');

        if (params.head) queryParams.set('head', params.head);
        if (params.base) queryParams.set('base', params.base);
        if (params.sort) queryParams.set('sort', params.sort);
        if (params.direction) queryParams.set('direction', params.direction);
        if (params.per_page) queryParams.set('per_page', params.per_page.toString());
        if (params.page) queryParams.set('page', params.page.toString());

        endpoint = `/repos/${owner}/${repo}/pulls?${queryParams.toString()}`;

        pullRequests = await this.makeRequest<GitHubPullRequest[]>(endpoint, token);
      }

      return pullRequests;
    } catch (error) {
      console.error('GitHub Service Error:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error('Failed to fetch pull requests from GitHub');
    }
  }

  /**
   * Get a specific pull request by number
   */
  static async getPullRequest(
    token: string,
    repositoryUrl: string,
    pullNumber: number
  ): Promise<GitHubPullRequest> {
    if (!token) {
      throw new Error('GitHub Personal Access Token is required');
    }

    const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);
    const endpoint = `/repos/${owner}/${repo}/pulls/${pullNumber}`;

    return await this.makeRequest<GitHubPullRequest>(endpoint, token);
  }

  /**
   * Test API connection and token validity
   */
  static async validateToken(
    token: string
  ): Promise<{ valid: boolean; user?: string; scopes?: string[]; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/user`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': this.API_VERSION,
          'User-Agent': 'QuantumTab-Extension/1.0',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          valid: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const user = await response.json();
      const scopes = response.headers.get('x-oauth-scopes')?.split(', ') || [];

      return {
        valid: true,
        user: user.login,
        scopes,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if user has access to a specific repository
   */
  static async checkRepositoryAccess(
    token: string,
    repositoryUrl: string
  ): Promise<{ hasAccess: boolean; isPrivate?: boolean; error?: string }> {
    try {
      const { owner, repo } = this.parseRepositoryUrl(repositoryUrl);
      const endpoint = `/repos/${owner}/${repo}`;

      const response = await fetch(`${this.BASE_URL}${endpoint}`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': this.API_VERSION,
          'User-Agent': 'QuantumTab-Extension/1.0',
        },
      });

      if (response.status === 404) {
        return {
          hasAccess: false,
          error:
            "Repository not found or you do not have access to it. If this is a private repository, ensure your token has the 'repo' scope.",
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          hasAccess: false,
          error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const repoData = await response.json();
      return {
        hasAccess: true,
        isPrivate: repoData.private,
      };
    } catch (error) {
      return {
        hasAccess: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get the authenticated user's information
   * @param token - GitHub Personal Access Token
   */
  static async getCurrentUser(
    token: string
  ): Promise<{ login: string; id: number; name: string | null }> {
    if (!token) {
      throw new Error('GitHub Personal Access Token is required');
    }

    const endpoint = '/user';
    return await this.makeRequest<{ login: string; id: number; name: string | null }>(
      endpoint,
      token
    );
  }
}

export default GitHubService;
