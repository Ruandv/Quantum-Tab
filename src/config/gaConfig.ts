// Google Analytics Configuration
// IMPORTANT: Replace these placeholder values with your actual GA4 credentials
// NEVER commit real credentials to version control

// For production builds, use webpack DefinePlugin to inject these values
declare const GA_MEASUREMENT_ID: string | undefined;
declare const GA_API_SECRET: string | undefined;

export const GA_CONFIG = {
  // Get this from GA4 Admin > Data Streams > Measurement ID
  MEASUREMENT_ID: (typeof GA_MEASUREMENT_ID !== 'undefined' ? GA_MEASUREMENT_ID : 'GA_MEASUREMENT_ID'),

  // Get this from GA4 Admin > Data Streams > Measurement Protocol API secrets
  API_SECRET: (typeof GA_API_SECRET !== 'undefined' ? GA_API_SECRET : 'GA_API_SECRET'),
} as const;