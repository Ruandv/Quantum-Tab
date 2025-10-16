#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Sync documentation files to GitHub Wiki format
 * Converts WIDGET_DOCUMENTATION.md into individual wiki pages
 */

function syncDocsToWiki() {
    const docsDir = path.join(__dirname, '..', 'docs');
    const outputDir = path.join(__dirname, '..', 'wiki-output');

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the main documentation file
    const docFile = path.join(docsDir, 'WIDGET_DOCUMENTATION.md');
    if (!fs.existsSync(docFile)) {
        console.error('WIDGET_DOCUMENTATION.md not found!');
        process.exit(1);
    }

    const content = fs.readFileSync(docFile, 'utf8');
    const lines = content.split('\n');

    // Parse widgets from the documentation
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
                    slug: widgetHeaderMatch[1].toLowerCase().replace(/\s+/g, '-'),
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

    // Save the last widget
    if (currentWidget) {
        widgets.push(currentWidget);
    }

    // Create Home.md (main wiki page)
    const homeContent = `# Quantum Tab Widgets Documentation

Welcome to the Quantum Tab widgets documentation. This wiki contains detailed information about all available widgets.

## Available Widgets

${widgets.map(widget => `- [${widget.name}](${widget.slug})`).join('\n')}

For detailed configuration options, see the individual widget pages.
`;

    fs.writeFileSync(path.join(outputDir, 'Home.md'), homeContent);
    console.log('✓ Created Home.md');

    // Create individual widget pages
    widgets.forEach(widget => {
        const widgetContent = widget.content.join('\n');
        const filename = `${widget.slug}.md`;
        fs.writeFileSync(path.join(outputDir, filename), widgetContent);
        console.log(`✓ Created ${filename}`);
    });

    console.log(`\n🎉 Successfully generated ${widgets.length + 1} wiki pages in ${outputDir}`);
    console.log('\nNext steps:');
    console.log('1. Review the generated files in wiki-output/');
    console.log('2. Commit and push to trigger the GitHub Action');
    console.log('3. Or manually copy the files to your GitHub Wiki');
}

if (require.main === module) {
    syncDocsToWiki();
}

module.exports = { syncDocsToWiki };