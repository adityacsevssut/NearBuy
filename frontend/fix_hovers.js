const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // Fix hover backgrounds that were improperly patched
    content = content.replace(/hover:bg-white dark:bg-\[#0D0D17\]/g, 'hover:bg-white dark:hover:bg-[#0D0D17]');
    content = content.replace(/hover:bg-gray-50 dark:bg-\[#151522\]/g, 'hover:bg-gray-50 dark:hover:bg-[#151522]');
    content = content.replace(/hover:bg-gray-100 dark:bg-\[#1F1F2E\]/g, 'hover:bg-gray-100 dark:hover:bg-[#1F1F2E]');
    
    // Some buttons had hover:bg-gray-50/50 etc.
    content = content.replace(/hover:bg-gray-50\/50/g, 'hover:bg-gray-50/50 dark:hover:bg-[#151522]/50');

    // Add orange shadow and smooth transition to hover:border-orange-500
    content = content.replace(/hover:border-orange-400 dark:hover:border-orange-500/g, 'hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]');
    
    // Let's also fix the hover effect on "cards" globally if they have `hover:border-orange...` but missing shadow
    content = content.replace(/hover:border-orange-300(?!.*?shadow)/g, 'hover:border-orange-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Fixed hover in', filePath);
    }
  }
});

console.log('Hover fixes complete.');
