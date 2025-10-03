// Chrome Extension Types
// Global Chrome API types will be available after npm install

/// <reference types="chrome" />

// Extend the global Window interface if needed
declare global {
  interface Window {
    // Add any custom properties if needed
  }
}

// Message types for communication between scripts
export interface ExtensionMessage {
  action: string;
  [key: string]: any;
}

// Tab information interface
export interface TabInfo {
  id?: number;
  title?: string;
  url?: string;
}

// Storage data structure
export interface StorageData {
  extensionInstalled?: boolean;
  installDate?: string;
  testData?: string;
  [key: string]: any;
}
