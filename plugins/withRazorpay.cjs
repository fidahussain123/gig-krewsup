/**
 * Expo config plugin: add Razorpay CheckoutActivity to Android manifest
 * with proper tools:replace to avoid manifest merger conflicts.
 */
const { withAndroidManifest } = require('expo/config-plugins');

function withRazorpay(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Ensure xmlns:tools is declared on the <manifest> tag
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] =
        'http://schemas.android.com/tools';
    }

    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    // Remove any existing Razorpay activity to avoid duplicates
    if (application.activity) {
      application.activity = application.activity.filter(
        (a) => a.$?.['android:name'] !== 'com.razorpay.CheckoutActivity'
      );
    } else {
      application.activity = [];
    }

    // Add Razorpay CheckoutActivity with tools:replace to prevent merger conflicts
    application.activity.push({
      $: {
        'android:name': 'com.razorpay.CheckoutActivity',
        'android:configChanges':
          'keyboard|keyboardHidden|phoneState|screenLayout|screenSize|smallestScreenSize',
        'android:label': '@string/app_name',
        'android:launchMode': 'singleTop',
        'android:theme': '@style/Checkout.Theme',
        'tools:replace':
          'android:label,android:theme,android:configChanges,android:launchMode',
      },
    });

    return config;
  });
}

module.exports = withRazorpay;
