# Chrome Web Store Compliance Gaps – Quantum Tab

- **Permission scope:** Content scripts now register per user-approved hostnames; add a migration plan to clear legacy `<all_urls>` grants for existing installs and document the runtime consent prompt for reviewers.
- **Browsing-data disclosure:** Website visits are logged through `trackWebsiteVisit` in `src/content/content.ts`. Publish an explicit privacy policy and keep Chrome Web Store privacy metadata in sync with this behaviour.
- **Dormant message handlers:** Removed `showMessage` and `getPageInfo` handlers from `src/content/content.ts` to eliminate unnecessary page access exposure.

- **Credential handling:** GitHub PATs and Gemini API keys persist in `chrome.storage.local` (`gitHubGuru.tsx`, `backgroundManager.tsx`). Provide clear removal guidance and consider optional non-persistent storage.
- **Performance considerations:** Large bundles (`newtab.js`, `vendors.js`) and an always-on content script can affect page performance and bfcache usage. Investigate lazy loading and host-scoped script registration.
- **Listing readiness:** Prepare Chrome Web Store assets that accurately describe functionality, permissions, data usage, and support channels before publishing.
