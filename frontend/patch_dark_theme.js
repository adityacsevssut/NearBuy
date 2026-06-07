const fs = require('fs');

function applyDark(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Generic color replacements
  content = content.replace(/bg-white/g, 'bg-white dark:bg-[#0D0D17]');
  content = content.replace(/bg-gray-50/g, 'bg-gray-50 dark:bg-[#151522]');
  content = content.replace(/text-gray-900/g, 'text-gray-900 dark:text-gray-100');
  content = content.replace(/text-gray-800/g, 'text-gray-800 dark:text-gray-200');
  content = content.replace(/text-gray-700/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/text-gray-500/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/text-black/g, 'text-black dark:text-white');
  content = content.replace(/border-gray-100/g, 'border-gray-100 dark:border-[#2A2A3A]');
  content = content.replace(/border-gray-200/g, 'border-gray-200 dark:border-[#2A2A3A]');
  
  // Clean up double dark classes if script is run twice
  content = content.replace(/dark:bg-\[#0D0D17\] dark:bg-\[#0D0D17\]/g, 'dark:bg-[#0D0D17]');
  content = content.replace(/dark:bg-\[#151522\] dark:bg-\[#151522\]/g, 'dark:bg-[#151522]');
  content = content.replace(/dark:text-gray-100 dark:text-gray-100/g, 'dark:text-gray-100');
  content = content.replace(/dark:text-gray-200 dark:text-gray-200/g, 'dark:text-gray-200');
  content = content.replace(/dark:text-gray-300 dark:text-gray-300/g, 'dark:text-gray-300');
  content = content.replace(/dark:text-gray-400 dark:text-gray-400/g, 'dark:text-gray-400');
  content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
  content = content.replace(/dark:border-\[#2A2A3A\] dark:border-\[#2A2A3A\]/g, 'dark:border-[#2A2A3A]');

  fs.writeFileSync(filePath, content);
  console.log('Patched', filePath);
}

applyDark('src/components/Footer.tsx');
applyDark('src/components/Navbar.tsx');
applyDark('src/components/MobileBottomNav.tsx');
applyDark('src/app/food/page.tsx');

// Additionally patch the homepage (food/page.tsx) specific backgrounds
let pageContent = fs.readFileSync('src/app/food/page.tsx', 'utf-8');
pageContent = pageContent.replace(/bg-\[#F8F9FA\]/g, 'bg-[#F8F9FA] dark:bg-[#0D0D17]');
fs.writeFileSync('src/app/food/page.tsx', pageContent);

console.log('All files patched successfully.');
