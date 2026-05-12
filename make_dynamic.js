const fs = require('fs');
const path = require('path');

// 1. Fix essentials page
const essentialsPagePath = 'd:/NearBuy/frontend/src/app/essentials/page.tsx';
let essentialsContent = fs.readFileSync(essentialsPagePath, 'utf8');
essentialsContent = essentialsContent.replace(/orange/g, 'blue');
fs.writeFileSync(essentialsPagePath, essentialsContent, 'utf8');

// 2. Add btn-blue to globals.css
const globalsCssPath = 'd:/NearBuy/frontend/src/app/globals.css';
let globalsContent = fs.readFileSync(globalsCssPath, 'utf8');
if (!globalsContent.includes('.btn-blue')) {
  const btnOrangeCSS = `
/* Skeuomorphic-lite orange button */
.btn-orange {
  background: linear-gradient(160deg, #f97316 0%, #ea580c 100%);
  box-shadow:
    0 4px 14px rgba(249, 115, 22, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.btn-orange:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(249, 115, 22, 0.4), inset 0 1px 0 rgba(255,255,255,0.25);
}
.btn-orange:active { transform: translateY(0px); }
`;
  
  const btnBlueCSS = btnOrangeCSS.replace(/orange/g, 'blue')
    .replace(/#f97316/g, '#3b82f6') // blue-500
    .replace(/#ea580c/g, '#2563eb') // blue-600
    .replace(/249, 115, 22/g, '59, 130, 246'); // rgba for blue-500

  globalsContent += btnBlueCSS;
  fs.writeFileSync(globalsCssPath, globalsContent, 'utf8');
}
