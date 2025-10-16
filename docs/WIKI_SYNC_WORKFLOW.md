# Local Wiki Sync Workflow

This document explains how to use the local wiki synchronization system for Quantum Tab documentation.

## Overview

The local wiki sync system allows you to:
- Generate wiki pages from the `docs/WIDGET_DOCUMENTATION.md` file
- Work with wiki content locally in the `wiki/` folder
- Sync changes to the GitHub Wiki repository

## Workflow

### 1. Make Documentation Changes

Edit the `docs/WIDGET_DOCUMENTATION.md` file to add or update widget documentation.

### 2. Generate Wiki Pages Locally

Run the local sync script to generate wiki pages:

```bash
npm run docs:sync-wiki-local
```

This will:
- Parse the documentation file
- Generate `Home.md` with an overview and widget links
- Create individual pages for each widget section
- Clean up any old files with invalid filenames

### 3. Review Generated Pages

Check the generated files in the `wiki/` folder:
- `Home.md` - Main wiki page with widget overview
- `[widget-name].md` - Individual widget documentation pages

### 4. Commit and Push Wiki Changes

The `wiki/` folder contains a Git repository that's linked to the GitHub Wiki. To sync changes:

```bash
cd wiki
git add .
git commit -m "Update widget documentation"
git push origin main
```

## File Structure

```
wiki/
├── .git/                    # GitHub Wiki repository
├── Home.md                  # Main wiki page
├── available-widgets.md     # Widget overview
├── how-documentation-works.md
├── creating-wiki-pages.md
├── widget-documentation-content.md
├── getting-help.md
└── why-github-wiki.md
```

## Automation

The GitHub Actions workflow (`.github/workflows/sync-docs-to-wiki.yml`) provides automated syncing when documentation changes are pushed to the main repository.

## Troubleshooting

- **Invalid filenames**: The script automatically sanitizes filenames by removing emojis and special characters
- **Old files**: The script cleans up files with invalid names before generating new ones
- **Git conflicts**: If there are conflicts in the wiki repo, resolve them manually in the `wiki/` folder

## Scripts

- `npm run docs:sync-wiki-local` - Generate wiki pages locally
- `npm run docs:sync-wiki` - Generate wiki pages to `wiki/` folder (for CI/CD)