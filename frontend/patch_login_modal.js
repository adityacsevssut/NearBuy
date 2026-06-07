const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'LoginModal.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// Replace light background and text classes with their dark equivalents
content = content.replace(/bg-white dark:bg-\[#0D0D17\]/g, 'bg-[#0D0D17]');
content = content.replace(/bg-white dark:bg-\[#0D0D17\]\/50/g, 'bg-[#0D0D17]/50');
content = content.replace(/bg-gray-50 dark:bg-\[#151522\]\/80/g, 'bg-[#151522]/80');
content = content.replace(/bg-gray-50 dark:bg-\[#151522\]\/50/g, 'bg-[#151522]/50');
content = content.replace(/bg-gray-50 dark:bg-\[#151522\]/g, 'bg-[#151522]');
content = content.replace(/hover:bg-gray-50 dark:hover:bg-\[#151522\]/g, 'hover:bg-[#151522]');
content = content.replace(/focus:bg-white dark:bg-\[#0D0D17\]/g, 'focus:bg-[#0D0D17]');
content = content.replace(/group-hover:bg-white dark:hover:bg-\[#0D0D17\]/g, 'group-hover:bg-[#0D0D17]');
content = content.replace(/bg-gray-100 dark:bg-\[#1F1F2E\]/g, 'bg-[#1F1F2E]');
content = content.replace(/hover:bg-gray-100 dark:hover:bg-\[#1F1F2E\]/g, 'hover:bg-[#1F1F2E]');

// Replace borders
content = content.replace(/border-gray-100 dark:border-\[#2A2A3A\]/g, 'border-[#2A2A3A]');
content = content.replace(/border-gray-200 dark:border-\[#2A2A3A\]/g, 'border-[#2A2A3A]');
content = content.replace(/border-gray-200 dark:border-\[#2A2A3A\]\/50/g, 'border-[#2A2A3A]/50');

// Replace texts
content = content.replace(/text-gray-900 dark:text-gray-100/g, 'text-gray-100');
content = content.replace(/text-gray-800 dark:text-gray-200/g, 'text-gray-200');
content = content.replace(/text-gray-700 dark:text-gray-300/g, 'text-gray-300');
content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-gray-400');
content = content.replace(/text-gray-500 dark:text-gray-400/g, 'text-gray-400');

// Replace raw bg-white if any are left without dark variant (unlikely if global patch ran, but just in case)
// Wait, we probably shouldn't just replace all bg-white, only ones in classNames.
// But this is good enough.

fs.writeFileSync(filePath, content);
console.log('LoginModal.tsx updated to use dark themes consistently.');
