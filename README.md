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

### Loading the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `dist` folder
4. The extension should now appear in your extensions list

### Development Workflow

1. Make changes to your code
2. Run `npm run dev` to build with file watching
3. Reload the extension in `chrome://extensions/`
4. Test your changes

## Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in development mode with file watching
- `npm run lint` - Run ESLint to check code quality
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Extension Features

### Popup
- Modern React-based UI with gradient design
- Display current tab information
- Send messages to content script
- Test Chrome storage API

### Background Script
- Handle extension lifecycle events
- Listen for messages from popup and content scripts
- Manage badge updates and extension state

### Content Script
- Show notifications on web pages
- Highlight text on pages
- Communicate with popup and background scripts

## Chrome APIs Used

- `chrome.tabs` - Tab management and queries
- `chrome.storage` - Data persistence
- `chrome.runtime` - Message passing and lifecycle
- `chrome.action` - Extension icon and badge

## Contributing

1. Follow the existing code style (enforced by ESLint and Prettier)
2. Use meaningful commit messages
3. Test your changes before submitting

## Manifest V3 Features

This extension uses Chrome Extension Manifest V3, which includes:
- Service workers instead of background pages
- Improved security with content security policy
- Modern JavaScript modules support
- Enhanced privacy and performance