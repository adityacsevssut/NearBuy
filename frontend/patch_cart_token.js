const fs = require('fs');
let content = fs.readFileSync('src/app/food/cart/page.tsx', 'utf-8');

// 1. Update RestaurantOrderCard props type definition
content = content.replace(
  /userPin: string \| null;\n\}\) \{/,
  `userPin: string | null;\n  accessToken: string | null;\n}) {`
);

// 2. Destructure accessToken in RestaurantOrderCard arguments
content = content.replace(
  /  userLon,\n  userPin,\n\}: \{/,
  `  userLon,\n  userPin,\n  accessToken,\n}: {`
);

// 3. Update the fetch headers to use the accessToken prop
content = content.replace(
  /headers: \{ "Content-Type": "application\/json", "Authorization": \`Bearer \$\{localStorage\.getItem\("token"\) \|\| ""\}\` \},/,
  `headers: { "Content-Type": "application/json", "Authorization": \`Bearer \${accessToken || ""}\` },`
);

// 4. Pass accessToken when rendering RestaurantOrderCard
content = content.replace(
  /                  userLon=\{longitude\}\n                  userPin=\{pincode\}\n                \/>/,
  `                  userLon={longitude}\n                  userPin={pincode}\n                  accessToken={accessToken}\n                />`
);

fs.writeFileSync('src/app/food/cart/page.tsx', content);
console.log('Fixed access token issue in frontend');
