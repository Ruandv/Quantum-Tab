/**
 * Widget Upgrade Test Script
 * This script tests the widget upgrade functionality with mock old data
 */

import { upgradeWidgets, setStoredVersion } from './widgetUpgrade';
import { SerializedWidget } from './chromeStorage';

// Mock old widget data (simulating data from version 1.0.0)
const mockOldWidgets: SerializedWidget[] = [
  {
    id: 'github-widget-1',
    name: 'GitHub Widget',
    description: 'GitHub PR monitoring',
    wikiPage: 'github-widget',
    // isRuntimeVisible: missing (will be added as true in 1.5.0 upgrade)
    allowMultiples: false,
    component: 'GitHubWidget',
    props: {
      patToken: 'old-token',
      repositoryUrl: 'https://github.com/user/repo',
      // Missing autoRefresh and refreshInterval (added in 1.1.0)
    },
    dimensions: { width: 400, height: 300 },
    position: { x: 100, y: 100 },
    style: {
      border: 1,
      radius: 8,
      blur: 0,
      backgroundColorRed: 255,
      backgroundColorGreen: 255,
      backgroundColorBlue: 255,
      transparency: 0.9,
      textColorRed: 0,
      textColorGreen: 0,
      textColorBlue: 0,
      alignment: 'center',
      justify: 'center'
    }
  },
  {
    id: 'background-manager-1',
    name: 'Background Manager',
    description: 'Manage background images',
    wikiPage: 'background-manager',
    // isRuntimeVisible: missing (will be added as false in 1.5.0 upgrade)
    allowMultiples: false,
    component: 'BackgroundManager',
    props: {
      // Missing AI props (added in 1.2.0)
    },
    dimensions: { width: 300, height: 200 },
    position: { x: 200, y: 200 },
    style: {
      border: 1,
      radius: 8,
      blur: 0,
      backgroundColorRed: 255,
      backgroundColorGreen: 255,
      backgroundColorBlue: 255,
      transparency: 0.9,
      textColorRed: 0,
      textColorGreen: 0,
      textColorBlue: 0,
      alignment: 'center',
      justify: 'center'
    }
  },
  {
    id: 'live-clock-1',
    name: 'Live Clock',
    description: 'Shows current time',
    wikiPage: 'live-clock',
    // isRuntimeVisible: missing (will be added as true in 1.5.0 upgrade)
    allowMultiples: true,
    component: 'LiveClock',
    props: {
      timeZone: 'America/New_York',
      // Missing new format options (added in 1.5.0)
    },
    dimensions: { width: 250, height: 150 },
    position: { x: 50, y: 50 },
    style: {
      border: 1,
      radius: 8,
      blur: 0,
      backgroundColorRed: 255,
      backgroundColorGreen: 255,
      backgroundColorBlue: 255,
      transparency: 0.9,
      textColorRed: 0,
      textColorGreen: 0,
      textColorBlue: 0,
      alignment: 'center',
      justify: 'center'
    }
  }
];

/**
 * Test the upgrade functionality
 */
export async function testWidgetUpgrade(): Promise<void> {
  console.log('🧪 Testing Widget Upgrade System...');

  try {
    // Reset version to simulate old installation
    await setStoredVersion('1.0.0');
    console.log('✅ Set stored version to 1.0.0');

    // Run upgrade
    console.log('🔄 Running upgrade on mock old widgets...');
    const result = await upgradeWidgets(mockOldWidgets);

    console.log('📊 Upgrade Results:');
    console.log(`   Upgraded: ${result.upgraded}`);
    console.log(`   Changes made: ${result.changes.length}`);
    console.log('   Changes:');
    result.changes.forEach((change, index) => {
      console.log(`     ${index + 1}. ${change}`);
    });

    // Verify specific upgrades
    const githubWidget = result.widgets.find(w => w.id === 'github-widget-1');
    const backgroundWidget = result.widgets.find(w => w.id === 'background-manager-1');
    const clockWidget = result.widgets.find(w => w.id === 'live-clock-1');

    console.log('\n🔍 Verification:');

    // Check isRuntimeVisible additions (1.0.1 upgrade)
    if (githubWidget?.isRuntimeVisible === true) {
      console.log('   ✅ GitHub widget: isRuntimeVisible=true added');
    } else {
      console.log('   ❌ GitHub widget: Missing isRuntimeVisible=true');
    }

    if (backgroundWidget?.isRuntimeVisible === false) {
      console.log('   ✅ Background Manager: isRuntimeVisible=false added');
    } else {
      console.log('   ❌ Background Manager: Missing isRuntimeVisible=false');
    }

    if (clockWidget?.isRuntimeVisible === true) {
      console.log('   ✅ Live Clock: isRuntimeVisible=true added');
    } else {
      console.log('   ❌ Live Clock: Missing isRuntimeVisible=true');
    }

    // Check GitHub widget upgrades
    if (githubWidget?.props?.autoRefresh === false && githubWidget?.props?.refreshInterval === 5) {
      console.log('   ✅ GitHub widget: autoRefresh and refreshInterval added');
    } else {
      console.log('   ❌ GitHub widget: Missing expected props');
    }

    // Check Background Manager upgrades
    if (backgroundWidget?.props?.isAIEnabled === false &&
        backgroundWidget?.props?.aiPrompt === '' &&
        backgroundWidget?.props?.aiKey === '') {
      console.log('   ✅ Background Manager: AI props added');
    } else {
      console.log('   ❌ Background Manager: Missing expected AI props');
    }

    // Check Live Clock upgrades
    if (clockWidget?.props?.showTime === true &&
        clockWidget?.props?.showDate === true &&
        clockWidget?.props?.showTimeZone === false) {
      console.log('   ✅ Live Clock: Format options added');
    } else {
      console.log('   ❌ Live Clock: Missing expected format props');
    }

    console.log('\n🎉 Widget upgrade test completed successfully!');

  } catch (error) {
    console.error('❌ Widget upgrade test failed:', error);
  }
}

// Export for use in browser console or tests
if (typeof window !== 'undefined') {
  (window as unknown as { testWidgetUpgrade: typeof testWidgetUpgrade }).testWidgetUpgrade = testWidgetUpgrade;
}