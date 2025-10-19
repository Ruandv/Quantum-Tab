# Widget Upgrade System

## Overview

The Quantum Tab extension includes a comprehensive widget upgrade system that automatically migrates stored widget data when new versions are installed. This ensures that existing user widgets remain functional and gain access to new features without data loss.

## How It Works

### Version Tracking
- The system tracks the extension version in Chrome storage using the key `STORAGE_KEYS.VERSION`
- On each extension load, it compares the stored version with the current manifest version
- If versions differ, the upgrade process is triggered

### Upgrade Process
1. **Detection**: Check if `needsUpgrade()` returns true
2. **Migration**: Apply version-specific upgrade functions in sequence
3. **Cleanup**: Remove deprecated properties
4. **Persistence**: Save upgraded widgets and update stored version

### Upgrade Functions

Each version can have specific upgrade logic:

- **1.1.0**: Added `autoRefresh` and `refreshInterval` to GitHub widgets
- **1.2.0**: Added AI features (`isAIEnabled`, `aiPrompt`, `aiKey`) to BackgroundManager
- **1.3.0**: Added website counter features (`showFavicons`, `maxWebsites`, `sortBy`)
- **1.4.0**: Added locale selection to LocaleWidget
- **1.5.0**: Enhanced LiveClock with format options and added SprintNumber widget

### Integration

The upgrade system is automatically integrated into the widget loading process in `NewTab.tsx`:

```typescript
// Check for and perform widget upgrades if needed
const upgradeResult = await upgradeWidgets(savedData.widgets);
if (upgradeResult.upgraded) {
    console.log('Widget upgrade performed:', upgradeResult.changes);
    // Save the upgraded widgets back to storage
    await chromeStorage.saveWidgets(upgradeResult.widgets);
    // Update savedData with upgraded widgets
    savedData.widgets = upgradeResult.widgets;
}
```

## Testing

A test utility is available at `src/utils/widgetUpgrade.test.ts` that can be used to verify upgrade functionality:

```javascript
// In browser console (after loading the extension)
window.testWidgetUpgrade();
```

This will simulate upgrading from version 1.0.0 to the current version and log all changes made.

## Adding New Upgrades

To add upgrades for future versions:

1. Add the new version to `VERSION_HISTORY` in `widgetUpgrade.ts`
2. Create an upgrade function `upgradeTo_X_Y_Z()`
3. Add the function call to `applyVersionUpgrade()`
4. Update the `CURRENT_VERSION` constant

Example:
```typescript
function upgradeTo_1_6_0(widgets: SerializedWidget[], changes: string[]): SerializedWidget[] {
    return widgets.map(widget => {
        if (widget.component === 'SomeWidget') {
            // Add new props or modify existing ones
            if (!widget.props) widget.props = {};
            widget.props.newFeature = true;
            changes.push(`Added newFeature=true to ${widget.name}`);
        }
        return widget;
    });
}
```

## Benefits

- **Backward Compatibility**: Existing widgets continue to work
- **Automatic Migration**: No user intervention required
- **Data Preservation**: No loss of user configurations
- **Version Safety**: Each upgrade is version-specific and tested
- **Extensible**: Easy to add new upgrade logic for future versions