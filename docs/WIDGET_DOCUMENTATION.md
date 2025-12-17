## Available Widgets

### BackgroundManager
- **Description**: Upload and manage custom background images for the dashboard, with support for AI-generated backgrounds.
- **Usage**: Allows users to upload, select, and manage background images that appear behind all widgets on the dashboard. Supports AI-powered background generation when configured with a compatible AI provider.

#### Properties
- **autoRefresh**: Boolean indicating whether to automatically refresh the background at regular intervals (default: false)
- **backgroundSize**: Controls how the background image is sized. Options: `cover` (fill entire area), `contain` (fit within area), or `auto` (natural size)
- **isAIEnabled**: Boolean indicating whether AI background generation is enabled
- **providerName**: Name of the AI provider to use for background generation (e.g., 'Gemini')
- **refreshInterval**: Auto-refresh interval in minutes when autoRefresh is enabled
- **widgetHeading**: Optional heading text displayed at the top of the widget

### GitHubGuru
- **Description**: Monitor and interact with GitHub repositories, displaying pull requests and tracking activity on your PRs.
- **Usage**: Connect to a GitHub repository using a Personal Access Token (PAT) to view all open pull requests. Displays both all repository PRs and your own PRs in separate tabs. Tracks new activity on your PRs including comments and approvals. Supports auto-refresh for real-time updates.

#### Properties
- **autoRefresh**: Boolean indicating whether to automatically refresh PR data at regular intervals (default: false)
- **providerName**: Name of the provider configuration that contains the PAT token for GitHub API authentication
- **refreshInterval**: Auto-refresh interval in minutes when autoRefresh is enabled (default: 5 minutes)
- **repositoryUrl**: GitHub repository URL to monitor in the format `https://github.com/owner/repo` (required)
- **widgetHeading**: Optional heading text displayed at the top of the widget

### LiveClock
- **Description**: Real-time clock component with customizable timezone, date, and time formatting.
- **Usage**: Displays the current time and date for any timezone, with extensive customization options for format and display. Updates every second for accurate timekeeping.

#### Properties
- **dateFormat**: Date formatting pattern using tokens.  
  Common Examples:  
  `yyyy-MM-dd` → 2025-12-17  
  `dd MMMM yyyy` → 17 December 2025  
  `dddd, MMM d` → Wednesday, Dec 17  
  Available tokens: `yyyy` (full year), `yy` (2-digit year), `MMMM` (full month), `MMM` (short month), `MM` (2-digit month), `M` (month), `dddd` (full day name), `ddd` (short day name), `dd` (2-digit day), `d` (day)
- **showDate**: Boolean indicating whether to show the date (default: true)
- **showTime**: Boolean indicating whether to show the time (default: true)
- **showTimeZone**: Boolean indicating whether to display the time zone label
- **timeFormat**: Time formatting pattern using tokens.  
  Common Examples:  
  `HH:mm:ss` → 14:30:05 (24-hour)  
  `h:mm a` → 2:30 pm (12-hour)  
  Available tokens: `HH` (24-hour with zero), `H` (24-hour), `hh` (12-hour with zero), `h` (12-hour), `mm` (minutes), `ss` (seconds), `A` (AM/PM uppercase), `a` (am/pm lowercase), `SSS` (milliseconds)
- **timeZone**: IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'Africa/Johannesburg')
- **widgetHeading**: Optional heading text displayed at the top of the widget

### LocaleWidget
- **Description**: Language selector widget for switching the application's display language.
- **Usage**: Provides a dropdown interface to select from available languages. Changes are persisted and apply immediately to all translated text throughout the application.

#### Properties
- **selectedLocale**: The currently selected locale code (e.g., 'en', 'af', 'es')
- **widgetHeading**: Optional heading text displayed at the top of the widget

### ModalDialog
- **Description**: Reusable modal dialog component for displaying overlays with customizable content and actions.
- **Usage**: Used throughout the application to display popups, confirmations, forms, and other modal content. Supports custom title, body content, and action buttons.

#### Properties
- **content**: Object containing the modal content configuration:
  - **title**: Optional string or React node for the modal header
  - **content**: React node for the modal body (required)
  - **actions**: Optional array of action buttons, each with `index` (number), `text` (string), `onClick` (function), and optional `disabled` (boolean)
- **isOpen**: Boolean indicating whether the modal is currently visible
- **widgetHeading**: Optional heading text displayed at the top of the widget

### QuarterIndicator
- **Description**: Displays the current fiscal or calendar quarter number based on a configurable start date.
- **Usage**: Automatically calculates which quarter the current date falls into, counting from the specified start date. Useful for tracking fiscal quarters, project quarters, or any quarterly planning cycle.

#### Properties
- **startDate**: The start date for quarter calculation in `YYYY-MM-DD` format (e.g., '2025-01-01'). Quarters are calculated as 3-month periods from this date.
- **widgetHeading**: Optional heading text displayed at the top of the widget

### QuickActionButtons
- **Description**: Customizable quick access buttons for frequently used websites and resources.
- **Usage**: Provides a grid of clickable buttons that open external URLs. Users can add, remove, and customize buttons with custom icons (emojis), labels, and URLs.

#### Properties
- **buttons**: Array of button configurations, each containing:
  - **icon**: Emoji or text icon to display (e.g., '🐙', '📧')
  - **label**: Text label for the button (e.g., 'GitHub', 'Email')
  - **url**: URL to open when the button is clicked (e.g., 'https://github.com')
- **widgetHeading**: Optional heading text displayed at the top of the widget

### SettingsWidget
- **Description**: Central configuration widget for managing AI providers and default widget styling.
- **Usage**: Allows users to configure API providers (such as Gemini for AI features, GitHub for repository access) by adding their API keys and settings. Also provides controls for default widget styling that applies to newly created widgets.

#### Properties
- **widgetHeading**: Optional heading text displayed at the top of the widget (e.g., 'Settings', 'Configuration')

### SprintNumber
- **Description**: Displays the current sprint number for agile/scrum teams with automatic calculation based on sprint duration.
- **Usage**: Automatically calculates the current sprint number based on a start date, sprint duration, and initial sprint number. Shows the current sprint's start and end dates. Useful for development teams following sprint-based methodologies.

#### Properties
- **currentSprint**: The sprint number at the start date. Subsequent sprints are calculated from this base number.
- **numberOfDays**: The duration of each sprint in days (e.g., 14 for two-week sprints)
- **startDate**: The start date of the first sprint in `YYYY-MM-DD` format (e.g., '2025-01-06')
- **widgetHeading**: Optional heading text displayed at the top of the widget

---

## Generating a GitHub Personal Access Token (PAT)

The GitHubGuru widget requires a GitHub Personal Access Token (PAT) to authenticate with the GitHub API. Follow these steps to generate one:

### Step 1: Access GitHub Settings
1. Log in to your GitHub account at [github.com](https://github.com)
2. Click on your profile picture in the top-right corner
3. Select **Settings** from the dropdown menu

### Step 2: Navigate to Developer Settings
1. Scroll down the left sidebar
2. Click on **Developer settings** (at the bottom)

### Step 3: Create a Personal Access Token
1. In the left sidebar, click **Personal access tokens**
2. Select **Tokens (classic)** or **Fine-grained tokens** based on your preference
3. Click **Generate new token**

### Step 4: Configure Token Permissions
For **Classic Tokens**:
1. Give your token a descriptive name (e.g., "Quantum Tab - GitHubGuru")
2. Set an expiration date (recommended: 90 days or custom)
3. Select the following scopes:
   - `repo` - Full control of private repositories (required for private repos)
   - `read:user` - Read user profile data
4. Click **Generate token**

For **Fine-grained Tokens** (recommended for better security):
1. Give your token a descriptive name
2. Set an expiration date
3. Select the repository access (specific repositories or all repositories)
4. Under **Permissions**, set:
   - **Repository permissions**:
     - Pull requests: Read
     - Contents: Read
     - Metadata: Read
5. Click **Generate token**

### Step 5: Copy and Save Your Token
1. **Important**: Copy your token immediately - you won't be able to see it again!
2. Store it securely (e.g., in a password manager)
3. Add the token to the Settings Widget in Quantum Tab under the GitHub provider configuration

### Security Best Practices
- Never share your PAT with anyone
- Use fine-grained tokens when possible for minimal permissions
- Set an expiration date and rotate tokens regularly
- Revoke tokens you no longer use
- If a token is compromised, revoke it immediately in GitHub Settings
