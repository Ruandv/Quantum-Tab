# Quantum Tab Chrome Extension

A modern Chrome Extension built with React, TypeScript, and Manifest V3.

## Features

- **React-powered popup** with modern UI
- **TypeScript** for type safety
- **Manifest V3** compliance
- **Content script** for page interaction
- **Background service worker** for extension logic
- **Webpack** build system with hot reload support
- **ESLint & Prettier** for code quality

## Project Structure

```
quantum-tab/
├── src/
│   ├── popup/                 # React popup component
│   │   ├── index.tsx         # Main popup entry point
│   │   ├── Popup.tsx         # Popup React component
│   │   ├── popup.html        # Popup HTML template
│   │   └── popup.css         # Popup styles
│   ├── background/           # Background service worker
│   │   └── background.ts     # Background script
│   ├── content/              # Content script
│   │   └── content.ts        # Content script logic
│   ├── components/           # Reusable React components
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets
│   └── icons/               # Extension icons
├── manifest.json            # Extension manifest
├── webpack.config.js        # Build configuration
└── package.json            # Dependencies and scripts
```

## Development

### Prerequisites

- Node.js (v16 or later)
- npm or yarn

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the extension:**
   ```bash
   npm run build
   ```

3. **Development mode (with file watching):**
   ```bash
   npm run dev
   ```
### Development Workflow

1. Make changes to your code
2. Run `npm run dev` to build with file watching
3. Reload the extension in `chrome://extensions/`
4. Test your changes

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` folder
4. The extension should now appear in your extensions list

## Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in development mode with file watching
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Extension Features

### Dashboard Widgets

The Quantum Tab extension provides a customizable dashboard with the following widgets:

#### 🕒 **Live Clock**
- **Description**: Real-time clock with customizable timezone and format
- **Features**:
  - Multiple timezone support with automatic browser region detection
  - Customizable date and time formats
  - Toggle display options for time, date, and timezone
  - Resizable widget dimensions
- **Multiple Instances**: Yes (you can add multiple clocks for different timezones)

#### ⚡ **Quick Actions**
- **Description**: Quick access buttons to your favorite websites
- **Features**:
  - Customizable emoji icons and labels
  - Add unlimited quick access buttons
  - Direct website navigation with one click
  - Drag-and-drop button management
- **Multiple Instances**: Yes (create different button groups)
- **Default Buttons**: GitHub, MyBroadband

#### 🎨 **Background Manager**
- **Description**: Upload and manage custom background images
- **Features**:
  - Upload custom background images (PNG, JPG, JPEG, GIF, WebP)
  - Preview backgrounds before applying
  - Restore default gradient background
  - Remove background images
  - File size limit: 5MB
- **Multiple Instances**: No (single background manager)

#### 🐙 **GitHub Repository**
- **Description**: Monitor and interact with GitHub repositories
- **Features**:
  - Real-time pull request monitoring
  - PAT token authentication for private repositories
  - PR status indicators (Open, Merged, Closed, Draft)
  - Auto-refresh pull request data
  - Repository information display
- **Multiple Instances**: Yes (monitor multiple repositories)
- **Requirements**: GitHub Personal Access Token for private repos

#### 📊 **Website Counter**
- **Description**: Track and count visits to your favorite websites
- **Features**:
  - Automatic visit counting for configured websites
  - Favicon display for visual identification
  - Last visited timestamps
  - Customizable website list
  - Visit statistics and trends
- **Multiple Instances**: No (single counter tracks all websites)
- **Default Sites**: Google, GitHub, MyBroadband

### Extension Infrastructure

#### Popup Interface
- Modern React-based UI with gradient design
- Widget management system with drag-and-drop
- Internationalization (i18n) support with English translations
- Responsive design with CSS modules

#### Background Service Worker
- Handle extension lifecycle events
- Listen for messages from popup and content scripts
- Manage badge updates and extension state
- Website visit tracking for counter widget

#### Content Script Integration
- Page interaction capabilities
- Website visit detection and counting
- Communication bridge between web pages and extension

## Chrome APIs Used

- `chrome.tabs` - Tab management and queries
- `chrome.storage` - Data persistence for widget configurations and user data
- `chrome.runtime` - Message passing between components and lifecycle management
- `chrome.action` - Extension icon and badge management
- File System APIs - Background image upload and management
- Internationalization APIs - Multi-language support framework

## Contributing

1. Follow the existing code style (enforced by ESLint and Prettier)
2. Use meaningful commit messages
3. Test your changes before submitting

## Technologies & Architecture

### Frontend Stack
- **React 18** with functional components and hooks
- **TypeScript** for type safety and better developer experience
- **CSS Modules** for component-scoped styling
- **react-i18next** for internationalization support
- **Webpack** build system with hot reload development

### Extension Architecture
- **Manifest V3** compliance with modern Chrome Extension standards
- **Service Workers** instead of background pages for better performance
- **Content Security Policy** for enhanced security
- **Modern JavaScript modules** with ES6+ features
- **Component-based widget system** for extensibility

### Key Features
- **Drag-and-drop widget management** with collision detection
- **Persistent storage** for user configurations and data
- **Real-time data updates** for GitHub and clock widgets
- **File upload system** with image processing for backgrounds
- **Message passing architecture** between extension components
- **Type-safe development** with comprehensive TypeScript definitions