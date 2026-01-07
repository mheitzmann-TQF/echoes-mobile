const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function withDisableFollyCoroutines(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      const postInstallHook = `
  # Disable Folly coroutines for RN 0.81 compatibility with Reanimated 3.x
  post_install do |installer|
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        unless config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'].include?('FOLLY_HAS_COROUTINES=0')
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'FOLLY_HAS_COROUTINES=0'
        end
      end
    end
    react_native_post_install(installer)
  end`;

      // Check if there's already a post_install block
      if (podfileContent.includes('post_install do |installer|')) {
        // Replace existing post_install to add our preprocessor definition
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|[\s\S]*?react_native_post_install\(installer\)[\s\S]*?^  end/m,
          postInstallHook.trim()
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
}

module.exports = withDisableFollyCoroutines;
