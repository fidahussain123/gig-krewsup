const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo config plugin for react-native-razorpay.
 * Adds the required CheckoutActivity to AndroidManifest.xml.
 */
const withRazorpay = (config) => {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Ensure tools namespace is declared
    if (!manifest.manifest.$['xmlns:tools']) {
      manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const application = manifest.manifest.application[0];
    if (!application.activity) {
      application.activity = [];
    }

    // Avoid duplicate entries
    const alreadyAdded = application.activity.some(
      (a) => a.$['android:name'] === 'com.razorpay.CheckoutActivity'
    );

    if (!alreadyAdded) {
      application.activity.push({
        $: {
          'android:name': 'com.razorpay.CheckoutActivity',
          'android:configChanges':
            'keyboard|keyboardHidden|phoneState|screenLayout|screenSize|smallestScreenSize',
          'android:label': '@string/app_name',
          'android:launchMode': 'singleTop',
          'android:theme': '@style/Checkout.Theme',
          'tools:replace': 'android:label,android:theme',
        },
      });
    }

    return config;
  });
};

module.exports = withRazorpay;
