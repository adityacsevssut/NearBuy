const fs = require('fs');
let content = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

content = content.replace(
  /const isEssentials = pathname === "\/essentials" \|\| pathname.startsWith\("\/essentials\/"\);\r?\n\s*const isMedico = pathname === "\/medico" \|\| pathname.startsWith\("\/medico\/"\);/,
  `const getDomain = () => {
    if (pathname.startsWith('/medicine')) return 'medicine';
    if (pathname.startsWith('/store')) return 'store';
    if (pathname.startsWith('/hotels')) return 'hotels';
    return 'food'; // Default fallback
  };

  const domain = getDomain();
  const isStore = domain === 'store';
  const isMedicine = domain === 'medicine';
  const isHotels = domain === 'hotels';
  const isFood = domain === 'food';
  const baseUrl = \`/\${domain}\`;
  
  const isEssentials = false; // Fallback for old code
  const isMedico = false;`
);

content = content.replace(/isEssentials/g, 'isStore');
content = content.replace(/isMedico/g, 'isMedicine');

content = content.replace(/href="\/wishlist"/g, 'href={`${baseUrl}/wishlist`}');
content = content.replace(/href="\/cart"/g, 'href={`${baseUrl}/cart`}');
content = content.replace(/router\.push\("\/orders"\)/g, 'router.push(`${baseUrl}/orders`)');

content = content.replace(/"\/essentials"/g, '"/store"');
content = content.replace(/"\/medico"/g, '"/medicine"');

// Fix the active state for the food button to check isFood
content = content.replace(/!isStore && !isMedicine/g, 'isFood');

fs.writeFileSync('src/components/Navbar.tsx', content);
