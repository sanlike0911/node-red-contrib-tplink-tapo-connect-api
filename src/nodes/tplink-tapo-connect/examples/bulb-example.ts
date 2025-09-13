/**
 * Example demonstrating Tapo Smart Bulb control (L510, L520, L530)
 */

import * as dotenv from 'dotenv';
import { TapoConnect } from '../src';

// Load environment variables
dotenv.config();

// Device IP addresses for different bulb models
const L510_IP = process.env.L510_BULB_IP || '192.168.1.110';
const L520_IP = process.env.L520_BULB_IP || '192.168.1.120';
const L530_IP = process.env.L530_BULB_IP || '192.168.1.130';
const USERNAME = process.env.TAPO_USERNAME || '';
const PASSWORD = process.env.TAPO_PASSWORD || '';

// Bulb configuration for each model
interface BulbTestConfig {
  model: 'L510' | 'L520' | 'L530';
  ip: string;
  description: string;
  hasColorTemperature: boolean;
  hasColor: boolean;
  hasEffects: boolean;
}

const BULB_CONFIGS: BulbTestConfig[] = [
  { 
    model: 'L510', 
    ip: L510_IP,
    description: 'Dimmable white bulb',
    hasColorTemperature: false,
    hasColor: false,
    hasEffects: false
  },
  { 
    model: 'L520', 
    ip: L520_IP,
    description: 'Tunable white bulb with color temperature',
    hasColorTemperature: true,
    hasColor: false,
    hasEffects: false
  },
  { 
    model: 'L530', 
    ip: L530_IP,
    description: 'Full color bulb with effects',
    hasColorTemperature: true,
    hasColor: true,
    hasEffects: true
  }
];

/**
 * Factory function to create the appropriate bulb instance
 */
function createBulbByModel(model: string, ip: string, credentials: any) {
  switch (model) {
    case 'L510':
      return TapoConnect.createL510Bulb(ip, credentials);
    case 'L520':
      return TapoConnect.createL520Bulb(ip, credentials);
    case 'L530':
      return TapoConnect.createL530Bulb(ip, credentials);
    default:
      throw new Error(`Unsupported bulb model: ${model}`);
  }
}

/**
 * Test specific bulb models based on environment variable
 */
async function testSpecificBulbs(): Promise<void> {
  const testModels = process.env.TEST_DEVICE_MODELS;
  
  if (!testModels) {
    await demonstrateBulbControl();
    return;
  }
  
  const modelsToTest = testModels.split(',').map(m => m.trim().toUpperCase());
  const validConfigs = BULB_CONFIGS.filter(config => 
    modelsToTest.includes(config.model)
  );
  
  if (validConfigs.length === 0) {
    console.log(`ℹ️  No bulb models found in TEST_DEVICE_MODELS. Running all bulb tests.`);
    await demonstrateBulbControl();
    return;
  }
  
  console.log('=== Tapo Smart Bulb Example (Filtered) ===\n');
  console.log(`🎯 Testing specific bulb models: ${validConfigs.map(c => c.model).join(', ')}`);
  
  const credentials = { username: USERNAME, password: PASSWORD };
  
  for (const config of validConfigs) {
    await testSingleBulb(config, credentials);
    if (config !== validConfigs[validConfigs.length - 1]) {
      console.log('\n' + '-'.repeat(60));
    }
  }
}

/**
 * Test a single bulb with comprehensive feature testing
 */
async function testSingleBulb(config: BulbTestConfig, credentials: any): Promise<void> {
  console.log(`\n💡 Testing ${config.model} Bulb:`);
  console.log(`📍 IP: ${config.ip}`);
  console.log(`📝 Description: ${config.description}`);
  
  try {
    const bulb = createBulbByModel(config.model, config.ip, credentials);
    await bulb.connect();
    console.log(`✅ Successfully connected to ${config.model}`);
    
    // Get device info
    const deviceInfo = await bulb.getDeviceInfo();
    console.log(`📱 Device: ${deviceInfo.model} - ${deviceInfo.nickname || 'No nickname'}`);
    console.log(`📊 Current brightness: ${deviceInfo.brightness}%`);
    console.log(`🔋 Status: ${deviceInfo.device_on ? 'ON' : 'OFF'}`);
    
    // Basic control test
    console.log('\n🔧 Testing basic controls...');
    await bulb.setBrightness(75);
    await bulb.turnOn();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Color temperature test (L520, L530)
    if (config.hasColorTemperature && await bulb.hasColorTemperatureSupport()) {
      console.log('🌡️  Testing color temperature...');
      await bulb.setColorTemperature(3000, 80);
      await new Promise(resolve => setTimeout(resolve, 2000));
      await bulb.setColorTemperature(6000, 60);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Color control test (L530)
    if (config.hasColor && await bulb.hasColorSupport()) {
      console.log('🎨 Testing color control...');
      await bulb.setNamedColor('red');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await bulb.setColorRGB({ red: 0, green: 0, blue: 255 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await bulb.setColor({ hue: 270, saturation: 100, value: 80 });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Effects test (L530)
    if (config.hasEffects && await bulb.hasEffectsSupport()) {
      console.log('✨ Testing light effects...');
      await bulb.setLightEffect({
        effect: 'rainbow',
        speed: 5,
        brightness: 90
      });
      await new Promise(resolve => setTimeout(resolve, 3000));
      await bulb.turnOffEffect();
    }
    
    await bulb.turnOff();
    await bulb.disconnect();
    console.log(`🎉 ${config.model} test completed successfully!`);
    
  } catch (error) {
    console.error(`❌ Failed to test ${config.model}:`, error.message);
  }
}

async function demonstrateBulbControl() {
  console.log('=== Tapo Smart Bulb Example ===\n');

  if (!USERNAME || !PASSWORD) {
    console.error('Please set TAPO_USERNAME and TAPO_PASSWORD environment variables');
    process.exit(1);
  }

  try {
    // Example 1: L510 Bulb (Dimmable white)
    console.log('1. L510 Bulb (Dimmable White) Example:');
    console.log(`   Using IP: ${L510_IP}`);
    const l510 = TapoConnect.createL510Bulb(L510_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l510.connect();
    console.log('Connected to L510 bulb');

    // Get device info
    const l510Info = await l510.getDeviceInfo();
    console.log(`Device: ${l510Info.model} - ${l510Info.nickname}`);
    console.log(`Current brightness: ${l510Info.brightness}%`);

    // Control brightness
    console.log('Setting brightness to 75%...');
    await l510.setBrightness(75);
    
    console.log('Turning on...');
    await l510.turnOn();
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Turning off...');
    await l510.turnOff();
    
    await l510.disconnect();
    console.log('L510 example completed\n');

    // Example 2: L520 Bulb (Tunable white)
    console.log('2. L520 Bulb (Tunable White) Example:');
    console.log(`   Using IP: ${L520_IP}`);
    const l520 = TapoConnect.createL520Bulb(L520_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l520.connect();
    console.log('Connected to L520 bulb');

    // Check capabilities
    console.log('L520 Capabilities:');
    console.log(`- Brightness: ${l520.supportsFeature('brightness')}`);
    console.log(`- Color Temperature: ${l520.supportsFeature('colorTemperature')}`);
    console.log(`- Full Color: ${l520.supportsFeature('color')}`);

    if (await l520.hasColorTemperatureSupport()) {
      console.log('Setting warm white (3000K)...');
      await l520.setColorTemperature(3000, 80);
      await l520.turnOn();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting cool white (6000K)...');
      await l520.setColorTemperature(6000, 60);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await l520.turnOff();
    await l520.disconnect();
    console.log('L520 example completed\n');

    // Example 3: L530 Bulb (Full color with effects)
    console.log('3. L530 Bulb (Full Color with Effects) Example:');
    console.log(`   Using IP: ${L530_IP}`);
    const l530 = TapoConnect.createL530Bulb(L530_IP, {
      username: USERNAME,
      password: PASSWORD
    });

    await l530.connect();
    console.log('Connected to L530 bulb');

    // Check capabilities
    console.log('L530 Capabilities:');
    console.log(`- Brightness: ${l530.supportsFeature('brightness')}`);
    console.log(`- Color Temperature: ${l530.supportsFeature('colorTemperature')}`);
    console.log(`- Full Color: ${l530.supportsFeature('color')}`);
    console.log(`- Light Effects: ${l530.supportsFeature('effects')}`);

    if (await l530.hasColorSupport()) {
      console.log('Setting red color...');
      await l530.setNamedColor('red');
      await l530.turnOn();
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting blue color using RGB...');
      await l530.setColorRGB({ red: 0, green: 0, blue: 255 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Setting custom HSV color (purple)...');
      await l530.setColor({ hue: 270, saturation: 100, value: 80 });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (await l530.hasEffectsSupport()) {
      console.log('Starting rainbow effect...');
      await l530.setLightEffect({
        effect: 'rainbow',
        speed: 5,
        brightness: 90
      });
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('Turning off effects...');
      await l530.turnOffEffect();
    }
    
    await l530.turnOff();
    await l530.disconnect();
    console.log('L530 example completed\n');

    console.log('=== All bulb examples completed successfully! ===');

  } catch (error) {
    console.error('Error in bulb example:', error);
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  // Check credentials
  if (!USERNAME || !PASSWORD) {
    console.error('❌ Error: Please set TAPO_USERNAME and TAPO_PASSWORD environment variables');
    console.log('\nExample:');
    console.log('export TAPO_USERNAME="your_tapo_username"');
    console.log('export TAPO_PASSWORD="your_tapo_password"');
    console.log('\nOptional device-specific IP addresses:');
    console.log('export L510_BULB_IP="192.168.1.110"');
    console.log('export L520_BULB_IP="192.168.1.120"');
    console.log('export L530_BULB_IP="192.168.1.130"');
    console.log('\nOptional model selection:');
    console.log('export TEST_DEVICE_MODELS="L510,L530"  # Test only specific models');
    process.exit(1);
  }
  
  console.log('🚀 Tapo Smart Bulb Example');
  console.log(`👤 Username: ${USERNAME}`);
  console.log(`🔑 Password: ${'*'.repeat(PASSWORD.length)}`);
  
  try {
    await testSpecificBulbs();
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('💡 Tapo Smart Bulb Example');
  console.log('\nUsage:');
  console.log('  npm run example:bulb');
  console.log('  npm run example:bulb -- --help');
  console.log('\nEnvironment Variables:');
  console.log('  TAPO_USERNAME        - Your Tapo account username (required)');
  console.log('  TAPO_PASSWORD        - Your Tapo account password (required)');
  console.log('  TEST_DEVICE_MODELS   - Comma-separated models to test (optional)');
  console.log('                         Example: "L510,L530"');
  console.log('\n  Device IP addresses (optional):');
  console.log('    L510_BULB_IP       - L510 IP address (default: 192.168.1.110)');
  console.log('    L520_BULB_IP       - L520 IP address (default: 192.168.1.120)');
  console.log('    L530_BULB_IP       - L530 IP address (default: 192.168.1.130)');
  console.log('\nSupported Models: L510, L520, L530');
  process.exit(0);
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}