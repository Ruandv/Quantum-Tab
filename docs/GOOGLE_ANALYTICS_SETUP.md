# Google Analytics Setup for Quantum Tab

This document explains how to set up Google Analytics tracking for the Quantum Tab Chrome Extension.

## Overview

The extension uses Google Analytics 4 (GA4) with the Measurement Protocol to track:
- Extension installations and updates
- Widget additions by users
- General extension usage patterns

## Setup Instructions

### 1. Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for your Chrome Extension
3. Note down your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 2. Create an API Secret

1. In your GA4 property, go to **Admin** > **Data Streams**
2. Select your web data stream (or create one if needed)
3. Go to **Measurement Protocol API secrets**
4. Create a new API secret
5. Note down the **Secret value**

### 3. Configure Environment Variables (Developer Only)

**As the extension developer/publisher**, you set these environment variables **once** on your build machine:

```bash
# Set these ONCE on your development/build machine
export GA_MEASUREMENT_ID="G-XXXXXXXXXX"
export GA_API_SECRET="your_api_secret_here"
```

### 4. Build the Extension

```bash
npm run build
```

The webpack build process embeds these credentials into the extension code.

### 5. Distribute the Built Extension

Users install the built extension normally - **no environment variable setup required for them**.

## CI/CD Pipeline Setup

For automated builds (GitHub Actions, etc.), set the environment variables in your pipeline:

```yaml
# In your GitHub Actions workflow
- name: Build Extension
  env:
    GA_MEASUREMENT_ID: ${{ secrets.GA_MEASUREMENT_ID }}
    GA_API_SECRET: ${{ secrets.GA_API_SECRET }}
  run: npm run build
```

---

## Alternative: Using a .env File

You can create a `.env` file in your project root:

```bash
# Create .env file
echo "GA_MEASUREMENT_ID=G-XXXXXXXXXX" > .env
echo "GA_API_SECRET=your_api_secret_here" >> .env
```

Then source it before building:

```bash
# Linux/Mac
source .env && npm run build

# Windows PowerShell
. .\.env; npm run build

# Windows Command Prompt
for /f "tokens=*" %i in (.env) do set %i && npm run build
```

**Note:** The `.env` file is already in `.gitignore`, so it won't be committed.

### Using dotenv (Optional)

If you prefer programmatic loading, install dotenv:

```bash
npm install --save-dev dotenv
```

Then create a build script that loads the .env file:

```javascript
// In package.json scripts
"build": "node -r dotenv/config webpack --mode production"
```

But **dotenv is not required** - webpack can read environment variables directly.

If you prefer not to use environment variables, you can directly edit `src/config/gaConfig.ts`:

```typescript
export const GA_CONFIG = {
  MEASUREMENT_ID: 'G-XXXXXXXXXX',  // Your real measurement ID
  API_SECRET: 'your_real_api_secret',  // Your real API secret
} as const;
```

**⚠️ WARNING:** This approach risks accidentally committing credentials to version control.

### 4. Test the Integration

1. Build and load the extension in Chrome
2. Open the developer console in the extension's background page
3. Add a widget and check for GA event logs
4. Verify events appear in your GA4 real-time reports

## Tracked Events

### Extension Events
- `extension_install`: When the extension is first installed
- `extension_update`: When the extension is updated

### Widget Events
- `widget_added`: When a user adds a new widget
  - Parameters: `widget_type`, `widget_name`

### General Usage
- `extension_usage`: General extension interactions

## Privacy Considerations

- The extension only tracks widget types and names, not personal data
- All tracking is anonymous using client IDs
- Users are not individually identifiable through the collected data
- Consider adding a privacy notice or opt-out mechanism if required

## Troubleshooting

### Events Not Appearing in GA4
1. Check that your Measurement ID and API Secret are correct
2. Verify network requests are allowed (manifest.json includes host_permissions)
3. Check browser console for GA service error messages
4. Ensure you're looking at the correct GA4 property

### Common Issues
- **403 Forbidden**: Check your API Secret permissions
- **400 Bad Request**: Verify Measurement ID format
- **Network errors**: Ensure the extension has internet access

## Development Notes

- The GA service uses the Measurement Protocol v4 for Chrome Extension compatibility
- Events are sent asynchronously and won't block extension functionality
- Failed GA requests are logged but don't affect extension operation