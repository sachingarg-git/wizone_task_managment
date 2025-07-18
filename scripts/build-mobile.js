const fs = require('fs');
const path = require('path');

// Read the built index.html
const indexPath = path.join(__dirname, '../dist/public/index.html');
let indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('🔧 Fixing paths for mobile APK...');

// Replace absolute paths with relative paths
indexContent = indexContent
  .replace(/href="\/([^"]+)"/g, 'href="./$1"')
  .replace(/src="\/([^"]+)"/g, 'src="./$1"')
  .replace(/href='\/([^']+)'/g, "href='./$1'")
  .replace(/src='\/([^']+)'/g, "src='./$1'");

// Remove Replit banner script for mobile
indexContent = indexContent.replace(
  /<script type="text\/javascript" src="https:\/\/replit\.com\/public\/js\/replit-dev-banner\.js"><\/script>/g,
  ''
);

// Write mobile-specific index.html
const mobileIndexPath = path.join(__dirname, '../dist/public/index-mobile.html');
fs.writeFileSync(mobileIndexPath, indexContent);

console.log('✅ Mobile-specific index.html created');
console.log('📱 Fixed paths for APK compatibility');
console.log('🚀 Ready for Capacitor copy');