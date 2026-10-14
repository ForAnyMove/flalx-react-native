const {
  withAndroidManifest,
  withMainActivity,
  withMainApplication,
  createRunOncePlugin,
} = require('@expo/config-plugins');

function withDisableRTL(config) {
  // 1. AndroidManifest.xml: ensure android:supportsRtl="false" on <application> with tools:replace
  config = withAndroidManifest(config, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:supportsRtl'] = 'false';
      const existingToolsReplace = application.$['tools:replace'] || '';
      if (!existingToolsReplace.includes('android:supportsRtl')) {
        application.$['tools:replace'] = existingToolsReplace
          ? `${existingToolsReplace},android:supportsRtl`
          : 'android:supportsRtl';
      }
    }
    return modConfig;
  });

  // 2. MainApplication.kt: force React Native I18nUtil allowRTL(false) and forceRTL(false)
  config = withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('com.facebook.react.modules.i18nmanager.I18nUtil')) {
      contents = contents.replace(
        /(package\s+[\w.]+)/,
        '$1\n\nimport com.facebook.react.modules.i18nmanager.I18nUtil'
      );
    }
    if (!contents.includes('I18nUtil.getInstance().allowRTL')) {
      contents = contents.replace(
        /super\.onCreate\(\)/,
        'super.onCreate()\n    I18nUtil.getInstance().allowRTL(this, false)\n    I18nUtil.getInstance().forceRTL(this, false)'
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });

  // 3. MainActivity.kt: force window decorView layoutDirection to LTR even if OS locale is RTL
  config = withMainActivity(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes('import android.view.View')) {
      contents = contents.replace(
        /(package\s+[\w.]+)/,
        '$1\n\nimport android.view.View\nimport android.content.res.Configuration'
      );
    }
    if (!contents.includes('window.decorView.layoutDirection')) {
      contents = contents.replace(
        /super\.onCreate\(.*?\)/,
        '$&\n    window.decorView.layoutDirection = View.LAYOUT_DIRECTION_LTR'
      );
    }
    if (!contents.includes('onConfigurationChanged')) {
      contents = contents.replace(
        /class MainActivity\s*:\s*ReactActivity\(\)\s*\{/,
        '$&\n  override fun onConfigurationChanged(newConfig: Configuration) {\n    super.onConfigurationChanged(newConfig)\n    window.decorView.layoutDirection = View.LAYOUT_DIRECTION_LTR\n  }\n'
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(withDisableRTL, 'withDisableRTL', '1.0.0');
