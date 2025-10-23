/**
 *export { GitHubService } from './githubService';Services module - External API integrations
 *
 * This module contains all services that make external API calls
 * to third-party providers, websites, or APIs.
 */

export { default as GitHubService } from './githubService';
export { googleAnalytics } from './googleAnalyticsService';

// Future services can be exported here:
// export { default as TwitterService } from './twitterService';
// export { default as GoogleService } from './googleService';
// export { default as SlackService } from './slackService';
