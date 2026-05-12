const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'd:/NearBuy/frontend/src/components/Navbar.tsx',
  'd:/NearBuy/frontend/src/components/MobileBottomNav.tsx',
  'd:/NearBuy/frontend/src/components/Footer.tsx',
  'd:/NearBuy/frontend/src/app/page.tsx',
  'd:/NearBuy/frontend/src/app/essentials/page.tsx',
  'd:/NearBuy/frontend/src/app/globals.css',
  'd:/NearBuy/frontend/src/app/vendor/[vendorId]/page.tsx'
];

for (const filePath of filesToUpdate) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace emerald with orange
  content = content.replace(/emerald/g, 'orange');
  // Replace green with orange (some veg markers might change, but user explicitly wanted this)
  content = content.replace(/green-600/g, 'orange-600');
  
  // Specific fix for vendor page: change blue to orange
  if (filePath.includes('vendor')) {
    content = content.replace(/blue/g, 'orange');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}
