## Available Widgets

### BackgroundManager
- **Description**: Upload and manage custom background images for the dashboard
- **Usage**: Allows users to upload, select, and manage background images that appear behind all widgets on the dashboard

#### Properties
- **widgetHeading**: Optional heading text displayed at the top of the widget

### GitHubWidget
- **Description**: Monitor and interact with GitHub repositories, displaying pull requests, issues, and repository statistics
- **Usage**: Connect to a GitHub repository using a PAT token to view PRs, issues, and get repository insights

#### Properties
- **patToken**: Optional GitHub Personal Access Token for API authentication
- **repositoryUrl**: Optional GitHub repository URL to monitor
- **widgetHeading**: Optional heading text displayed at the top of the widget

### LiveClock
- **Description**: Real-time clock component with customizable timezone, date, and time formatting
- **Usage**: Displays the current time and date for any timezone, with extensive customization options for format and display

#### Properties
- **dateFormat**: Optional date formatting pattern (e.g., 'yyyy-MM-dd', 'dd MMMM yyyy')
- **showDate**: Optional boolean indicating whether to show the date
- **showTime**: Optional boolean indicating whether to show the time (default: true)
- **showTimeZone**: Optional boolean indicating whether to display the time zone label
- **timeFormat**: Optional time formatting pattern (e.g., 'HH:mm:ss', 'h:mm a')
- **timeZone**: IANA timezone identifier (e.g., 'America/New_York', 'Europe/London')
- **widgetHeading**: Optional heading text displayed at the top of the widget
