# Quantum Tab Widgets Documentation

## Available Widgets

### BackgroundManager
- **Description**: Upload and manage custom background images for the dashboard
- **Usage**: Allows users to upload, select, and manage background images that appear behind all widgets on the dashboard. Supports image file validation and persists selections to Chrome storage.

#### Properties
- **widgetHeading**: Optional heading text displayed at the top of the widget

### GitHubWidget
- **Description**: Monitor and interact with GitHub repositories, displaying pull requests, issues, and repository statistics
- **Usage**: Connect to a GitHub repository using a Personal Access Token (PAT) to view pull requests, issues, and get repository insights. Fetches data from the GitHub API through a background service worker.

#### Properties
- **patToken**: GitHub Personal Access Token for API authentication (required for accessing private repositories and increased rate limits)
- **repositoryUrl**: GitHub repository URL to monitor in the format `https://github.com/owner/repo`
- **widgetHeading**: Optional heading text displayed at the top of the widget

### LiveClock
- **Description**: Real-time clock component with customizable timezone, date, and time formatting
- **Usage**: Displays the current time and date for any timezone with extensive customization options for format and display. Updates every second to show real-time information.

#### Properties
- **dateFormat**: Optional date formatting pattern  
  Common Examples:  
  `yyyy-MM-dd` → 2025-10-16  
  `dd MMMM yyyy` → 16 October 2025  
  `dddd, MMM d` → Thursday, Oct 16
- **showDate**: Boolean indicating whether to display the date (default: false)
- **showTime**: Boolean indicating whether to display the time (default: true)
- **showTimeZone**: Boolean indicating whether to display the time zone label (default: false)
- **timeFormat**: Optional time formatting pattern  
  Common Examples:  
  `HH:mm:ss` → 14:30:05 (24-hour)  
  `h:mm a` → 2:30 pm (12-hour)  
  `HH:mm` → 14:30 (24-hour without seconds)
- **timeZone**: IANA timezone identifier (required)  
  See the Time Zone Reference table for available zones.  
  Examples: `America/New_York`, `Europe/London`, `Asia/Tokyo`, `Australia/Sydney`
- **widgetHeading**: Optional heading text displayed at the top of the widget

### LocaleWidget
- **Description**: Language and locale settings component for changing the application language
- **Usage**: Allows users to select their preferred language from available options. Currently supports English, Afrikaans, and Spanish. Changes are applied immediately and persisted across sessions.

#### Properties
- **selectedLocale**: Currently selected locale code (e.g., 'en', 'af', 'es')
- **widgetHeading**: Optional heading text displayed at the top of the widget

### QuickActionButtons
- **Description**: Collection of customizable quick action buttons for accessing favorite websites
- **Usage**: Displays a grid of buttons that open websites in new tabs when clicked. Users can add, remove, and customize buttons with custom icons, labels, and URLs. Perfect for frequently accessed sites.

#### Properties
- **buttons**: Array of ActionButton objects, each containing:
  - **icon**: Emoji or text icon for the button
  - **label**: Display label for the button
  - **url**: Target URL to open when clicked
- **widgetHeading**: Optional heading text displayed at the top of the widget

### SprintNumber
- **Description**: Sprint counter and timeline tracking component for agile project management
- **Usage**: Displays the current sprint number and countdown information based on a configurable start date and sprint duration. Automatically calculates the current sprint number and remaining days.

#### Properties
- **currentSprint**: Starting sprint number (required)
- **numberOfDays**: Number of days per sprint cycle (required)
- **startDate**: Sprint start date in YYYY-MM-DD format (required)
- **widgetHeading**: Optional heading text displayed at the top of the widget

### WebsiteCounter
- **Description**: Website visit counter and tracking component
- **Usage**: Tracks and displays visit counts and last visited times for favorite websites. Users can add websites to track, view visit statistics, and sort by different criteria. Automatically increments count when visiting tracked sites.

#### Properties
- **maxWebsites**: Maximum number of websites to track (default: 10)
- **showFavicons**: Boolean indicating whether to display website favicons (default: true)
- **sortBy**: Sort order for the website list
  - `'count'` - Sort by number of visits (highest first)
  - `'name'` - Sort alphabetically by website name
  - `'recent'` - Sort by most recently visited
- **websites**: Array of WebsiteCounterData objects containing tracked website information
- **widgetHeading**: Optional heading text displayed at the top of the widget

## Getting Help

For more detailed instructions, visit our [GitHub Wiki](https://github.com/Ruandv/Quantum-Tab/wiki).

---

### Time Zone Reference

The Live Clock widget supports all IANA time zone identifiers. Below is a table of commonly used time zones organized by region. Use the **Time Zone ID** column when configuring your clock.

#### Common Examples

*   `America/New_York` → Eastern Time
*   `Europe/London` → GMT/BST
*   `Asia/Tokyo` → Japan Standard Time
*   `Australia/Sydney` → Australian Eastern Time

---

#### Americas

| Region | Time Zone ID | Common Name | UTC Offset |
| :----- | :----------- | :---------- | :--------- |
| **Eastern** | `America/New_York` | EST/EDT | UTC-5/-4 |
| **Central** | `America/Chicago` | CST/CDT | UTC-6/-5 |
| **Mountain** | `America/Denver` | MST/MDT | UTC-7/-6 |
| **Pacific** | `America/Los_Angeles` | PST/PDT | UTC-8/-7 |
| **Alaska** | `America/Anchorage` | AKST/AKDT | UTC-9/-8 |
| **Hawaii** | `Pacific/Honolulu` | HST | UTC-10 |
| **Brazil** | `America/Sao_Paulo` | BRT | UTC-3 |
| **Argentina** | `America/Argentina/Buenos_Aires` | ART | UTC-3 |
| **Mexico City** | `America/Mexico_City` | CST/CDT | UTC-6/-5 |

---

#### Europe

| Region | Time Zone ID | Common Name | UTC Offset |
| :----- | :----------- | :---------- | :--------- |
| **London** | `Europe/London` | GMT/BST | UTC+0/+1 |
| **Paris** | `Europe/Paris` | CET/CEST | UTC+1/+2 |
| **Berlin** | `Europe/Berlin` | CET/CEST | UTC+1/+2 |
| **Rome** | `Europe/Rome` | CET/CEST | UTC+1/+2 |
| **Madrid** | `Europe/Madrid` | CET/CEST | UTC+1/+2 |
| **Amsterdam** | `Europe/Amsterdam` | CET/CEST | UTC+1/+2 |
| **Moscow** | `Europe/Moscow` | MSK | UTC+3 |
| **Istanbul** | `Europe/Istanbul` | TRT | UTC+3 |

---

#### Asia & Oceania

| Region | Time Zone ID | Common Name | UTC Offset |
| :----- | :----------- | :---------- | :--------- |
| **Tokyo** | `Asia/Tokyo` | JST | UTC+9 |
| **Shanghai** | `Asia/Shanghai` | CST | UTC+8 |
| **Hong Kong** | `Asia/Hong_Kong` | HKT | UTC+8 |
| **Singapore** | `Asia/Singapore` | SGT | UTC+8 |
| **Seoul** | `Asia/Seoul` | KST | UTC+9 |
| **Mumbai** | `Asia/Kolkata` | IST | UTC+5:30 |
| **Dubai** | `Asia/Dubai` | GST | UTC+4 |
| **Sydney** | `Australia/Sydney` | AEST/AEDT | UTC+10/+11 |
| **Melbourne** | `Australia/Melbourne` | AEST/AEDT | UTC+10/+11 |
| **Perth** | `Australia/Perth` | AWST | UTC+8 |

---

#### Africa

| Region | Time Zone ID | Common Name | UTC Offset |
| :----- | :----------- | :---------- | :--------- |
| **Cairo** | `Africa/Cairo` | EET/EEST | UTC+2/+3 |
| **Johannesburg** | `Africa/Johannesburg` | SAST | UTC+2 |
| **Lagos** | `Africa/Lagos` | WAT | UTC+1 |
| **Nairobi** | `Africa/Nairobi` | EAT | UTC+3 |

---

## Why GitHub Wiki?

**Benefits of using GitHub Wiki for documentation:**

✅ **Professional Presentation**: Better formatting, images, and rich content  
✅ **Community Contributions**: Anyone can suggest improvements via pull requests  
✅ **Easy Updates**: No need to rebuild the extension to update documentation  
✅ **Version Control**: Documentation changes are tracked in git  
✅ **Rich Media**: Can include screenshots, videos, and interactive examples  
✅ **Standard Practice**: Common pattern for open source projects  

**Local Fallback**: This template file serves as a backup and development reference.
