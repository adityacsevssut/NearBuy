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

    // Backgrounds
    content = content.replace(/bg-white/g, 'bg-white dark:bg-[#0D0D17]');
    content = content.replace(/bg-\[#F8F9FA\]/g, 'bg-[#F8F9FA] dark:bg-[#0D0D17]');
    content = content.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-[#151522]');
    content = content.replace(/bg-gray-100/g, 'bg-gray-100 dark:bg-[#1F1F2E]');

    // Texts
    content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-gray-100');
    content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-gray-200');
    content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-300');
    content = content.replace(/text-gray-600/g, 'text-gray-600 dark:text-gray-400');
    content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');
    content = content.replace(/text-black/g, 'text-black dark:text-white');

    // Borders
    content = content.replace(/border-gray-50/g, 'border-gray-50 dark:border-[#1F1F2E]');
    content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-[#2A2A3A]');
    content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-[#2A2A3A]');

    // Clean up duplicates
    content = content.replace(/dark:bg-\[#0D0D17\] dark:bg-\[#0D0D17\]/g, 'dark:bg-[#0D0D17]');
    content = content.replace(/dark:bg-\[#151522\] dark:bg-\[#151522\]/g, 'dark:bg-[#151522]');
    content = content.replace(/dark:bg-\[#1F1F2E\] dark:bg-\[#1F1F2E\]/g, 'dark:bg-[#1F1F2E]');
    content = content.replace(/dark:text-gray-100 dark:text-gray-100/g, 'dark:text-gray-100');
    content = content.replace(/dark:text-gray-200 dark:text-gray-200/g, 'dark:text-gray-200');
    content = content.replace(/dark:text-gray-300 dark:text-gray-300/g, 'dark:text-gray-300');
    content = content.replace(/dark:text-gray-400 dark:text-gray-400/g, 'dark:text-gray-400');
    content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
    content = content.replace(/dark:border-\[#1F1F2E\] dark:border-\[#1F1F2E\]/g, 'dark:border-[#1F1F2E]');
    content = content.replace(/dark:border-\[#2A2A3A\] dark:border-\[#2A2A3A\]/g, 'dark:border-[#2A2A3A]');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log('Patched', filePath);
    }
  }
});

console.log('Global dark mode patch complete.');
