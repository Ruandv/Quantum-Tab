#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Local sync script to generate wiki pages from WIDGET_DOCUMENTATION.md
 * Outputs directly to the local wiki/ folder
 */

const DOCS_FILE = path.join(__dirname, '..', 'docs', 'WIDGET_DOCUMENTATION.md');
const WIKI_DIR = path.join(__dirname, '..', 'wiki');

function parseWidgetDocumentation(content) {
    const lines = content.split('\n');
    const widgets = [];
    let currentWidget = null;
    let inWidgetSection = false;
    let parsingWidgets = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Check for "Available Widgets" section start
        if (line === "## Available Widgets") {
            parsingWidgets = true;
        } else if (parsingWidgets) {
            // Check for widget header (### Widget Name)
            const widgetHeaderMatch = line.match(/^### (.+)$/);
            if (widgetHeaderMatch) {
                // Save previous widget if exists
                if (currentWidget) {
                    widgets.push(currentWidget);
                }

                // Start new widget
                currentWidget = {
                    name: widgetHeaderMatch[1],
                    content: [line]
                };
                inWidgetSection = true;
            } else if (currentWidget && inWidgetSection) {
                currentWidget.content.push(line);

                // Check if we've reached the next section (another ###, ##, or #)
                if (i + 1 < lines.length) {
                    const nextLine = lines[i + 1].trim();
                    if (nextLine.match(/^### /) || nextLine.match(/^## /) || nextLine.match(/^# /)) {
                        inWidgetSection = false;
                    }
                }
            }
        }
    }

    // Add the last widget
    if (currentWidget) {
        widgets.push(currentWidget);
    }

    return widgets;
}

function generateHomePage(widgets) {
    let content = '# Quantum Tab Widgets Documentation\n\n';
    content += 'Welcome to the Quantum Tab widgets documentation. This wiki contains detailed information about all available widgets.\n\n';
    content += '## Available Widgets\n\n';

    widgets.forEach(widget => {
        const widgetName = widget.name;
        const fileName = widgetName.replace(/\s+/g, '-').toLowerCase();
        content += `- [${widgetName}](${fileName})\n`;
    });

    content += 'For detailed configuration options, see the individual widget pages.\n';

    return content;
}

function generateWidgetPage(widget) {
    return widget.content.join('\n');
}

function ensureWikiDirectory() {
    if (!fs.existsSync(WIKI_DIR)) {
        fs.mkdirSync(WIKI_DIR, { recursive: true });
        console.log('Created wiki directory');
    }
}

function cleanupOldWikiFiles() {
    if (fs.existsSync(WIKI_DIR)) {
        const files = fs.readdirSync(WIKI_DIR);
        files.forEach(file => {
            if (file.endsWith('.md') && file !== 'Home.md') {
                // Remove files that contain emojis or start with dash
                if (/[^\w\s.-]/.test(file) || file.startsWith('-')) {
                    const filePath = path.join(WIKI_DIR, file);
                    fs.unlinkSync(filePath);
                    console.log(`Cleaned up old file: ${file}`);
                }
            }
        });
    }
}

function writeWikiPage(fileName, content) {
    const filePath = path.join(WIKI_DIR, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Generated: ${fileName}`);
}

function main() {
    try {
        // Check if docs file exists
        if (!fs.existsSync(DOCS_FILE)) {
            console.error('Error: WIDGET_DOCUMENTATION.md not found in docs/ folder');
            process.exit(1);
        }

        // Read the documentation file
        const content = fs.readFileSync(DOCS_FILE, 'utf8');

        // Parse widgets
        const widgets = parseWidgetDocumentation(content);
        console.log(`Found ${widgets.length} widgets in documentation`);

        // Ensure wiki directory exists
        ensureWikiDirectory();

        // Clean up old wiki files with emojis
        cleanupOldWikiFiles();

        // Generate Home page
        const homeContent = generateHomePage(widgets);
        writeWikiPage('Home.md', homeContent);

        // Generate individual widget pages
        widgets.forEach(widget => {
            const sanitizedName = widget.name
                .replace(/[^\w\s-]/g, '') // Remove emojis and special chars
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/^-+/, '') // Remove leading dashes
                .replace(/-+$/, '') // Remove trailing dashes
                .toLowerCase();
            const fileName = `${sanitizedName}.md`;
            const pageContent = generateWidgetPage(widget);
            writeWikiPage(fileName, pageContent);
        });

        console.log('\nWiki pages generated successfully in wiki/ folder!');
        console.log('To sync to GitHub Wiki, commit and push the changes in the wiki/ folder.');

    } catch (error) {
        console.error('Error generating wiki pages:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { parseWidgetDocumentation, generateHomePage, generateWidgetPage };