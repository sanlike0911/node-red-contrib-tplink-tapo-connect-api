import { tplinkTapoConnectWrapper } from '../src/wrapper/tplink-tapo-connect-wrapper';
import { config } from 'dotenv';

config();

async function main(): Promise<void> {
  try {
    const wrapper = tplinkTapoConnectWrapper.getInstance();

    const email = process.env['TAPO_USERNAME'] || 'your-tapo-username';
    const password = process.env['TAPO_PASSWORD'] || 'your-tapo-password';
    const ipAddress = process.env['TAPO_IPADDRESS'] || '192.168.0.10';

    console.log('=== TP-Link Tapo Connect Wrapper Example ===');
    console.log('Email:', email);
    console.log('Plug IP:', ipAddress);

    // Test device info retrieval
    if (true) {
      console.log('\n--- Getting Device Info ---');
      console.log('Note: getTapoDeviceInfo() now includes energy usage data for supported devices');
      try {
        const deviceInfoResult = await wrapper.getTapoDeviceInfo(email, password, ipAddress);
        if (deviceInfoResult.result) {
          console.log('Device Info Retrieved Successfully:');
          console.log('- Model:', deviceInfoResult.tapoDeviceInfo?.model);
          console.log('- Type:', deviceInfoResult.tapoDeviceInfo?.type);
          console.log('- Avatar:', deviceInfoResult.tapoDeviceInfo?.avatar);
          console.log('- Device On:', deviceInfoResult.tapoDeviceInfo?.device_on);
          console.log('- On Time:', deviceInfoResult.tapoDeviceInfo?.on_time, 'seconds');

          // Check for energy usage data
          if (deviceInfoResult.tapoEnergyUsage) {
            console.log('\n--- Energy Usage Data Found ---');
            console.log('- Energy Usage Object:', JSON.stringify(deviceInfoResult.tapoEnergyUsage, null, 2));

            // Log specific energy fields if available
            if (deviceInfoResult.tapoEnergyUsage.current_power !== undefined) {
              console.log('- Current Power:', deviceInfoResult.tapoEnergyUsage.current_power, 'mW');
            }
            if (deviceInfoResult.tapoEnergyUsage.today_runtime !== undefined) {
              console.log('- Today Runtime:', deviceInfoResult.tapoEnergyUsage.today_runtime, 'minutes');
            }
            if (deviceInfoResult.tapoEnergyUsage.today_energy !== undefined) {
              console.log('- Today Energy:', deviceInfoResult.tapoEnergyUsage.today_energy, 'Wh');
            }
          } else {
            console.log('- Energy Usage Data: Not available (device may not support energy monitoring)');
          }
        } else {
          console.log('Failed to get device info:', deviceInfoResult.errorInf?.message);
        }
      } catch (error) {
        console.log('Device info error:', error);
      }
    }

    // Test energy usage with device detection and validation
    if (false) {
      console.log('\n--- Testing Energy Usage ---');
      const energyResult = await wrapper.getTapoEnergyUsage(email, password, ipAddress);
      if (energyResult.result) {
        console.log('✅ Energy usage retrieved successfully');
        console.log('   Device Model:', energyResult.tapoDeviceInfo?.model);
        console.log('   Device Type:', energyResult.tapoDeviceInfo?.type);

        // Check for energy usage data
        if (energyResult.tapoEnergyUsage) {
          console.log('\n--- Energy Usage Data Details ---');
          console.log('- Full Energy Usage Object:', JSON.stringify(energyResult.tapoEnergyUsage, null, 2));

          // Log specific energy fields if available
          if (energyResult.tapoEnergyUsage.current_power !== undefined) {
            console.log('- Current Power:', energyResult.tapoEnergyUsage.current_power, 'mW');
          }
          if (energyResult.tapoEnergyUsage.today_runtime !== undefined) {
            console.log('- Today Runtime:', energyResult.tapoEnergyUsage.today_runtime, 'minutes');
          }
          if (energyResult.tapoEnergyUsage.today_energy !== undefined) {
            console.log('- Today Energy:', energyResult.tapoEnergyUsage.today_energy, 'Wh');
          }
          if (energyResult.tapoEnergyUsage.month_runtime !== undefined) {
            console.log('- Month Runtime:', energyResult.tapoEnergyUsage.month_runtime, 'minutes');
          }
          if (energyResult.tapoEnergyUsage.month_energy !== undefined) {
            console.log('- Month Energy:', energyResult.tapoEnergyUsage.month_energy, 'Wh');
          }
        } else {
          console.log('- Energy Usage Data: Not available in result');
        }
      } else {
        console.log('ℹ️ Energy usage not available (expected for basic plugs):', energyResult.errorInf?.message);
        console.log('   Device Model:', energyResult.tapoDeviceInfo?.model);
        console.log('   Device Type:', energyResult.tapoDeviceInfo?.type);
      }
    }

    // Test rapid on/off operations like Python tapo example
    if (false) {
      for (let i = 0; i < 1; i++) {
        console.log(`\n--- Testing Rapid On/Off Operations (Python-style) - Cycle ${i + 1}/2 ---`);

        // Turn device ON with error handling
        console.log('Turning device on...');
        try {
          const turnOnResult = await wrapper.setTapoTurnOn(email, password, ipAddress);
          if (turnOnResult.result) {
            console.log('✅ Device turned ON successfully');
          } else {
            console.log('❌ Failed to turn device ON:', turnOnResult.errorInf?.message);
          }
        } catch (error: unknown) {
          console.log('❌ Exception while turning device ON:', error);
        }

        console.log('Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Turn device OFF with error handling
        console.log('Turning device off...');
        try {
          const turnOffResult = await wrapper.setTapoTurnOff(email, password, ipAddress);
          if (turnOffResult.result) {
            console.log('✅ Device turned OFF successfully');
          } else {
            console.log('❌ Failed to turn device OFF:', turnOffResult.errorInf?.message);
          }
        } catch (error: unknown) {
          console.log('❌ Exception while turning device OFF:', error);
        }

        console.log('Waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Test brightness control (should fail for plugs)
    if (false) {
      console.log('\n--- Testing Brightness Control (should fail for plugs) ---');
      try {
        const brightnessResult = await wrapper.setTapoBrightness(email, password, ipAddress, 30);
        if (brightnessResult.result) {
          console.log('Brightness set successfully (unexpected for plugs)');
        } else {
          console.log('Brightness control failed (expected for plugs):', brightnessResult.errorInf?.message);
        }
      } catch (error) {
        console.log('Brightness control error (expected):', error);
      }
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const brightnessResult = await wrapper.setTapoBrightness(email, password, ipAddress, 80);
        if (brightnessResult.result) {
          console.log('Brightness set successfully (unexpected for plugs)');
        } else {
          console.log('Brightness control failed (expected for plugs):', brightnessResult.errorInf?.message);
        }
      } catch (error) {
        console.log('Brightness control error (expected):', error);
      }
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const brightnessResult = await wrapper.setTapoBrightness(email, password, ipAddress, 100);
        if (brightnessResult.result) {
          console.log('Brightness set successfully (unexpected for plugs)');
        } else {
          console.log('Brightness control failed (expected for plugs):', brightnessResult.errorInf?.message);
        }
      } catch (error) {
        console.log('Brightness control error (expected):', error);
      }
      console.log('Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n=== Wrapper Example Completed ===');

  } catch (error) {
    console.error('Error in wrapper example:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}