const fs = require('fs');
const path = require('path');

// Function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Function to copy a file
function copyFile(source, target) {
  const targetDir = path.dirname(target);
  ensureDirectoryExists(targetDir);
  fs.copyFileSync(source, target);
}

// Function to build Chrome extension
function buildChrome() {
  const chromeDir = path.join(__dirname, 'build', 'chrome');
  ensureDirectoryExists(chromeDir);
  
  // Create Chrome manifest
  const baseManifest = JSON.parse(fs.readFileSync('./manifest-base.json', 'utf8'));
  fs.writeFileSync(
    path.join(chromeDir, 'manifest.json'),
    JSON.stringify(baseManifest, null, 2)
  );

  // Copy required files
  copyFile('./content.js', path.join(chromeDir, 'content.js'));
  copyFile('./style.css', path.join(chromeDir, 'style.css'));
  
  // Copy icons
  const iconsDir = path.join(chromeDir, 'icons');
  ensureDirectoryExists(iconsDir);
  copyFile('./icons/icon16.png', path.join(iconsDir, 'icon16.png'));
  copyFile('./icons/icon48.png', path.join(iconsDir, 'icon48.png'));
  copyFile('./icons/icon128.png', path.join(iconsDir, 'icon128.png'));

  console.log('Chrome build completed successfully!');
}

// Function to build Firefox extension
function buildFirefox() {
  const firefoxDir = path.join(__dirname, 'build', 'firefox');
  ensureDirectoryExists(firefoxDir);
  
  // Create Firefox manifest
  const baseManifest = JSON.parse(fs.readFileSync('./manifest-base.json', 'utf8'));
  const firefoxManifest = {
    ...baseManifest,
    browser_specific_settings: {
      gecko: {
        id: "conventional-comments-addon@pullpo.io"
      }
    }
  };
  
  fs.writeFileSync(
    path.join(firefoxDir, 'manifest.json'),
    JSON.stringify(firefoxManifest, null, 2)
  );

  // Copy required files
  copyFile('./content.js', path.join(firefoxDir, 'content.js'));
  copyFile('./style.css', path.join(firefoxDir, 'style.css'));
  
  // Copy icons
  const iconsDir = path.join(firefoxDir, 'icons');
  ensureDirectoryExists(iconsDir);
  copyFile('./icons/icon16.png', path.join(iconsDir, 'icon16.png'));
  copyFile('./icons/icon48.png', path.join(iconsDir, 'icon48.png'));
  copyFile('./icons/icon128.png', path.join(iconsDir, 'icon128.png'));

  console.log('Firefox build completed successfully!');
}

// Get the build type from command line arguments
const buildType = process.argv[2];

if (buildType === 'chrome') {
  buildChrome();
} else if (buildType === 'firefox') {
  buildFirefox();
} else {
  console.error('Please specify either "chrome" or "firefox" as an argument');
  process.exit(1);
} 